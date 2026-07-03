<?php

namespace App\Http\Controllers\Api\V1\Votes;

use App\Actions\CreateVoteAction;
use App\DTOs\VoteDTO;
use App\Events\LiveResultsUpdated;
use App\Exceptions\VoteException;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Votes\RequestOtpRequest;
use App\Http\Requests\Api\V1\Votes\SubmitPrivateVoteRequest;
use App\Http\Requests\Api\V1\Votes\SubmitPublicVoteRequest;
use App\Http\Requests\Api\V1\Votes\VerifyAccessOtpRequest;
use App\Http\Requests\Api\V1\Votes\VerifyAccessRequest;
use App\Http\Resources\Api\V1\CandidateResource;
use App\Http\Resources\Api\V1\VoteResource;
use App\Jobs\SendOtpCode;
use App\Models\Election;
use App\Models\Elector;
use App\Models\Vote;
use App\Services\VoterFingerprintService;
use App\Services\VotingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VoteController extends BaseApiController
{
    protected CreateVoteAction $createVoteAction;

    protected VotingService $votingService;
    protected VoterFingerprintService $fingerprintService;

    public function __construct(CreateVoteAction $createVoteAction, VotingService $votingService, VoterFingerprintService $fingerprintService)
    {
        $this->createVoteAction = $createVoteAction;
        $this->votingService = $votingService;
        $this->fingerprintService  = $fingerprintService;
    }

    /**
     * VOTE PUBLIC - Élection publique
     */
    public function submitPublic(SubmitPublicVoteRequest $request, Election $election): JsonResponse
    {
        // idempotency_key
        try {
            if ($election->election_mode !== 'public') {
                return $this->error('This endpoint is for public elections only', null, 400);
            }

            if (! $election->is_votable) {
                if ($election->end_at < now()) {
                    return $this->error('Election has ended', null, 400);
                }
                if ($election->start_at > now()) {
                    return $this->error('Election has not started yet', null, 400);
                }

                return $this->error('Election is not votable', null, 400);
            }

            // Fingerprint résistant (HMAC-SHA256 + cookie)
            $fingerprint = $this->fingerprintService->resolve($request);

            // Vérification anti-bourrage : cache Redis + base
            if ($this->fingerprintService->hasAlreadyVoted($fingerprint, $election->id, $election->max_votes_per_user)) {
                return $this->error('You have already voted in this election ', null, 400);
            }

            // Pour les élections publiques, on crée un électeur anonyme
            $elector = $this->getOrCreateAnonymousElector($election, $fingerprint);

            $max = $election->max_votes_per_user ?? 1;
            if ($this->fingerprintService->hasAlreadyVoted($fingerprint, $election->id, $max)) {
                return $this->error(
                    "Vous avez atteint le nombre maximum de votes autorisés ({$max}).",
                    null,
                    400
                );
            }

            $dto = VoteDTO::fromRequest($request, $request->ip());
            $vote = $this->createVoteAction->execute($elector, $election, $dto);

            // Marquer le fingerprint comme ayant voté
            $this->fingerprintService->markAsVoted($fingerprint, $election->id);

            $response = $this->created(new VoteResource($vote), 'Vote submitted successfully');

            // Attacher le cookie fingerprint à la réponse
            return $response->withCookie(
                $this->fingerprintService->buildCookie($fingerprint)
            );
        } catch (\Exception $e) {
            Log::error('Public vote submission failed: ' . $e->getMessage());

            return $this->error('Vote submission failed', null, 500);
        }
    }

    /**
     * ÉTAPE 1: Vérifier le voter_code (de l'élection) + email (de l'électeur).
     *
     * voter_code identifie l'élection privée — il est commun à tous ses
     * électeurs. L'email permet ensuite d'identifier précisément qui
     * tente d'accéder. Pour ne jamais révéler si un email appartient
     * ou non à la liste électorale (anti-énumération), la réponse est
     * IDENTIQUE dans les deux cas : un access_token est retourné, et
     * un OTP n'est réellement envoyé que si l'email correspond à un
     * électeur actif n'ayant pas encore voté.
     */
    public function verifyAccess(VerifyAccessRequest $request): JsonResponse
    {
        // Vérifier le voter_code
        $election = Election::where("voter_code", $request->voter_code)
            ->first();

        if (!$election) {
            return $this->error('Invalid voter code', null, 404);
        }

        $elector = Elector::where('election_id', $election->id)
            ->where('email', $request->email)
            ->where('status', 'active')
            ->first();
        if (!$elector) {
            return $this->error('Invalid email', null, 404);
        }

        // Vérifier que l'élection est privée
        if ($election->election_mode !== 'private') {
            return $this->error('This endpoint is for private elections only', null, 400);
        }
        // access_token créé dans tous les cas — ne révèle jamais si l'email existe.
        $accessToken = bin2hex(random_bytes(32));

        $votesUsed = $elector ? $elector->votes()
            ->where('election_id', $election->id)
            ->where('status', 'completed')
            ->count() : 0;
        $canStillVote = $elector && ($votesUsed < ($election->max_votes_per_user ?? 1));
        if ($canStillVote) {
            $otp = $this->generateOtp();

            Cache::put("voter_access_{$accessToken}", [
                'elector_id' => $elector->id,
                'election_id' => $election->id,
                'otp' => bcrypt($otp),
                'attempts' => 0,
                'ip' => $request->ip(),
            ], now()->addMinutes(30));

            dispatch(new SendOtpCode($elector, $otp, 'email'));
        } else {
            // Créer un access_token sans OTP
            Cache::put("voter_access_{$accessToken}", [
                'elector_id' => null,
                'election_id' => $election->id,
                'otp' => null,
                'attempts' => 0,
                'ip' => $request->ip(),
            ], now()->addMinutes(30));
        }

        return $this->success([
            'access_token' => $accessToken,
            'expires_in' => 1800,
            'uuid_election' => $election->uuid,
        ], 'un code vous a été envoyé par email.');
    }

    /**
     * ÉTAPE 2: Vérifier l'OTP envoyé à l'email de l'électeur.
     * Si valide, crée la session de vote (mêmes infos que createVoterSession).
     */
    public function verifyAccessOtp(VerifyAccessOtpRequest $request, Election $election): JsonResponse
    {
        $cacheKey = "voter_access_{$request->access_token}";
        $accessData = Cache::get($cacheKey);

        if (! $accessData || (int) $accessData['election_id'] !== $election->id) {
            return $this->error('Invalid or expired access token', null, 401);
        }

        if ($accessData['attempts'] >= 5) {
            Cache::forget($cacheKey);
            return $this->error('Too many attempts. Please start over.', null, 429);
        }

        if (empty($accessData['elector_id']) || empty($accessData['otp']) || ! Hash::check($request->otp, $accessData['otp'])) {
            $accessData['attempts']++;
            Cache::put($cacheKey, $accessData, now()->addMinutes(10));
            return $this->error('Invalid OTP code', null, 401);
        }

        $elector = Elector::find($accessData['elector_id']);

        if (! $elector->is_verified) {
            $elector->verify();
        }

        Cache::forget($cacheKey);
        $sessionToken = $this->createVoterSession($elector, $request);

        return $this->success([
            'access_granted' => true,
            'session_token' => $sessionToken,
            'elector_name' => $elector->full_name,
            'election_title' => $election->title,
            'election_id' => $election->id,
            'real_time_results' => $election->real_time_results,
            'live_scores' => $election->real_time_results
                ? LiveResultsUpdated::computeScores($election)
                : null,
            'election_banner' => $election->banner ? asset('storage/' . $election->banner) : null,
            'election_description' => $election->description,
            'candidates' => CandidateResource::collection(
                $election->candidates()->approved()->with('category')->get()
            ),

        ], 'Access granted. You can now choose your candidate.');
    }

    /**
     * ÉTAPE 2: Demander l'envoi d'un OTP après avoir choisi le candidat
     */
    public function requestOtp(RequestOtpRequest $request, Election $election): JsonResponse
    {
        // Vérifier que l'élection est privée
        if ($election->election_mode !== 'private') {
            return $this->error('This endpoint is for private elections only', null, 400);
        }

        // Vérifier le session_token
        $elector = $this->getElectorFromSession($request->session_token, $election->id);

        if (! $elector) {
            return $this->error('Invalid or expired session. Please verify your voter code again.', null, 401);
        }

        // Vérifier que le candidat existe
        $candidate = $election->candidates()
            ->where('uuid', $request->candidate_uuid)
            ->where('status', 'approved')
            ->first();

        if (! $candidate) {
            return $this->error('Invalid candidate', null, 404);
        }

        // Vérifier les tentatives OTP
        $attemptKey = "otp_attempts_{$elector->id}";
        $attempts = Cache::get($attemptKey, 0);

        if ($attempts >= 5) {
            return $this->error('Too many OTP requests. Please try again later.', null, 429);
        }

        // Générer OTP (6 chiffres)
        $otp = $this->generateOtp();

        // Stocker le vote temporaire et l'OTP en cache
        Cache::put("vote_temp_{$elector->id}", [
            'candidate_uuid' => $request->candidate_uuid,
            'otp' => bcrypt($otp),
            'otp_attempts' => 0,
            'created_at' => now(),
        ], now()->addMinutes(10));

        // Envoyer OTP par email
        dispatch(new SendOtpCode($elector, $otp, 'email'));

        // Incrémenter le compteur de tentatives
        Cache::increment($attemptKey, 1, now()->addMinutes(15));

        return $this->success([
            'message' => 'OTP sent to your email address',
            'expires_in' => 300, // 5 minutes
        ], 'Please check your email for the OTP code.');
    }

    /**
     * ÉTAPE 3: Vérifier l'OTP et valider le vote
     */
    public function submitPrivate(SubmitPrivateVoteRequest $request, Election $election): JsonResponse
    {
        try {
            // Vérifier que l'élection est privée
            if ($election->election_mode !== 'private') {
                return $this->error('This endpoint is for private elections only', null, 400);
            }

            if (! $election->is_votable) {
                if ($election->end_at < now()) {
                    return $this->error('Election has ended', null, 400);
                }
                if ($election->start_at > now()) {
                    return $this->error('Election has not started yet', null, 400);
                }

                return $this->error('Election is not votable', null, 400);
            }

            // Récupérer l'électeur depuis le session_token
            $elector = $this->getElectorFromSession($request->session_token);

            if (! $elector) {
                return $this->error('Invalid or expired session. Please verify your voter code again.', null, 401);
            }

            $votesUsed = $elector->votes()
                ->where('election_id', $election->id)
                ->where('status', 'completed')
                ->count();
            $max = $election->max_votes_per_user ?? 1;
            if ($votesUsed >= $max) {
                return $this->error(
                    "Vous avez atteint le nombre maximum de votes autorisés ({$max}).",
                    null,
                    400
                );
            }

            // Récupérer le vote temporaire
            $tempVote = Cache::get("vote_temp_{$elector->id}");

            if (! $tempVote) {
                return $this->error('Vote session expired. Please request a new OTP.', null, 400);
            }

            // Vérifier l'OTP
            if (! Hash::check($request->otp_code, $tempVote['otp'])) {
                // Incrémenter les tentatives
                $tempVote['otp_attempts']++;
                Cache::put("vote_temp_{$elector->id}", $tempVote, now()->addMinutes(10));

                $remainingAttempts = 3 - $tempVote['otp_attempts'];
                if ($remainingAttempts <= 0) {
                    Cache::forget("vote_temp_{$elector->id}");

                    return $this->error('Too many invalid OTP attempts. Please request a new OTP.', null, 400);
                }

                return $this->error("Invalid OTP code. {$remainingAttempts} attempts remaining.", null, 400);
            }

            // OTP valide - procéder au vote
            Cache::forget("vote_temp_{$elector->id}");
            Cache::forget("otp_attempts_{$elector->id}");

            // Créer le vote
            $vote = $this->createVote($elector, $election, $tempVote['candidate_uuid'], $request);

            $votesUsedAfter = $elector->votes()
                ->where('election_id', $election->id)
                ->where('status', 'completed')
                ->count();

            $remainingVotes = max(0, $max - $votesUsedAfter);

            if ($remainingVotes === 0) {
                Cache::forget("voter_session_{$request->session_token}");
            }
            return $this->success(
                new VoteResource($vote),
                $remainingVotes > 0
                    ? "Vote enregistré ! Il vous reste {$remainingVotes} vote(s)."
                    : 'Your vote has been successfully recorded!',
                [
                    'remaining_votes' => $remainingVotes,
                    'max_votes_per_user' => $max,
                    'live_scores' => $election->real_time_results
                        ? LiveResultsUpdated::computeScores($election)
                        : null,
                ],
                201
            );
        } catch (VoteException $e) {
            Log::error('Private vote submission failed: ' . $e->getMessage());
            return $e->render();
        } catch (\Exception $e) {
            Log::error('Private vote submission failed: ' . $e->getMessage());

            return $this->error('Vote submission failed', null, 500);
        }
    }

    /**
     * Vérifier un reçu de vote
     */
    public function verify(Request $request, Election $election): JsonResponse
    {
        $request->validate(['receipt_code' => 'required|string']);

        $vote = $this->votingService->verifyVoteReceipt($request->receipt_code);

        if (! $vote || $vote->election_id !== $election->id) {
            return $this->notFound('Vote not found');
        }

        return $this->success([
            'vote_uuid' => $vote->uuid,
            'submitted_at' => $vote->submitted_at,
            'verified' => true,
            'receipt' => [
                'code' => $vote->receipt->receipt_code,
                'qr_code' => $vote->receipt->qr_code,
            ],
        ]);
    }

    /**
     * ADMIN - Liste des votes
     */
    public function index(Request $request, Election $election): JsonResponse
    {
        if (! Auth::check()) {
            return $this->unauthorized('Authentication required');
        }

        $votes = $election->votes()
            ->with(['elector', 'items.candidate'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return $this->paginated($votes, VoteResource::class);
    }

    /**
     * ADMIN - Détail d'un vote
     */
    public function show(Election $election, Vote $vote): JsonResponse
    {
        if (! Auth::check()) {
            return $this->unauthorized('Authentication required');
        }

        $vote->load(['elector', 'items.candidate', 'receipt', 'paymentTransaction']);

        return $this->success(new VoteResource($vote));
    }

    /**
     * Créer une session de vote temporaire
     */
    /**
     * Créer une session de vote temporaire
     */
    protected function createVoterSession(Elector $elector, Request $request): string
    {
        $sessionToken = bin2hex(random_bytes(32));

        Cache::put("voter_session_{$sessionToken}", [
            'elector_id' => $elector->id,
            'election_id' => $elector->election_id,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ], now()->addMinutes(30)); // Session expire après 30 minutes

        return $sessionToken;
    }

    /**
     * Récupérer l'électeur depuis la session
     */
    protected function getElectorFromSession(?string $sessionToken, ?int $electionId = null): ?Elector
    {
        if (! $sessionToken) {
            return null;
        }

        $session = Cache::get("voter_session_{$sessionToken}");

        if (! $session) {
            return null;
        }
        // Vérification d'appartenance à l'élection
        if ($electionId !== null && (int) $session['election_id'] !== $electionId) {
            Log::channel('security')->warning('Session token used on wrong election', [
                'token_election_id'     => $session['election_id'],
                'requested_election_id' => $electionId,
                'ip'                    => request()->ip(),
            ]);

            return null;
        }
        return Elector::find($session['elector_id']);
    }

    /**
     * Créer le vote final
     */
    protected function createVote(Elector $elector, Election $election, string $candidateUuid, Request $request): Vote
    {
        $candidate = $election->candidates()->where('uuid', $candidateUuid)->firstOrFail();

        $dto = new VoteDTO(
            items: [['candidate_uuid' => $candidate->uuid]],
            idempotencyKey: $request->input('idempotency_key', (string) Str::uuid()),
            voterCode: $request->input('voter_code'),
            ipAddress: $request->ip(),
            deviceId: $request->header('X-Device-ID'),
            browser: $request->header('X-Browser'),
            operatingSystem: $request->header('X-OS'),
            country: $request->input('country'),
            city: $request->input('city'),
            voteType: $request->input('vote_type', 'standard'),
            otpCode: $request->input('otp_code'),
            deviceInfo: [
                'device'   => $request->header('User-Agent'),
                'browser'  => $request->header('X-Browser'),
                'os'       => $request->header('X-OS'),
                'location' => $request->input('location'),
            ]
        );

        return $this->createVoteAction->execute($elector, $election, $dto);
    }

    /**
     * Créer ou récupérer un électeur anonyme
     */
    protected function getOrCreateAnonymousElector(Election $election, string $fingerprint): Elector
    {

        return Elector::firstOrCreate(
            [
                'election_id' => $election->id,
                'fingerprint' => $fingerprint,
                'type' => 'anonymous',
            ],
            [
                'uuid' => Str::uuid()->toString(),
                'full_name' => 'Anonymous Voter',
                'status' => 'active',
                'verification_status' => 'verified',
            ]
        );
    }

    protected function generateOtp(): string
    {
        return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}
