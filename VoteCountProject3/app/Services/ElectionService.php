<?php

namespace App\Services;

use App\DTOs\ElectionDTO;
use App\Enums\ElectionStatus;
use App\Events\ElectionEnded;
use App\Events\ElectionPublished;
use App\Events\ElectionStarted;
use App\Exceptions\ElectionException;
use App\Jobs\CalculateElectionResults;
use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Repositories\Contracts\ElectionRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ElectionService
{
    protected ElectionRepositoryInterface $electionRepository;

    public function __construct(ElectionRepositoryInterface $electionRepository)
    {
        $this->electionRepository = $electionRepository;
    }

    //Délègue getPublicElections au repository.
    // Appelée par ElectionController::publicIndex() à la place de Election::query() direct.
    public function getPublicElections(Request $request): LengthAwarePaginator
    {
        return $this->electionRepository->getPublicElections($request);
    }

    //Délègue getOpenForCandidacy au repository.
    // Appelée par ElectionController::openForCandidacy() à la place de Election::query() direct.
    public function getOpenForCandidacy(Request $request): LengthAwarePaginator
    {
        return $this->electionRepository->getOpenForCandidacy($request);
    }

    //Délègue getGlobalStats au repository.
    // Appelée par ElectionController::stats() à la place des Election::count() / where() directs.
    public function getGlobalStats(): array
    {
        return $this->electionRepository->getGlobalStats();
    }

    //Délègue getFilteredElections au repository.
    // Appelée par ElectionController::index() à la place de Election::query() direct.
    public function getFilteredElections(Request $request): LengthAwarePaginator
    {
        return $this->electionRepository->getFilteredElections($request);
    }

    /**
     * Crée un brouillon d'élection depuis Step1 du wizard.
     * Sans vérification d'abonnement — ça se fait à la publication.
     */
    public function createDraft(Organization $organization, User $creator, ElectionDTO $dto): Election
    {
        $slug = Str::slug($dto->title);
        $originalSlug = $slug;
        $counter = 1;

        while ($this->electionRepository->findBySlug($organization->id, $slug)) {
            $slug = $originalSlug . '-' . $counter++;
        }

        // Une élection privée nécessite un voter_code unique pour y accéder.
        // Généré une seule fois, à la création — jamais régénéré après.
        $voterCode = $dto->electionMode === 'private' ? generate_voter_code() : null;

        return $this->electionRepository->create([
            'organization_id'        => $organization->id,
            'created_by'             => $creator->id,
            'uuid'                   => Str::uuid()->toString(),
            'title'                  => $dto->title,
            'slug'                   => $slug,
            'voter_code'             => $voterCode,
            'short_description'      => $dto->shortDescription,
            'description'            => $dto->description,
            'banner'                 => $dto->banner,
            'election_mode'          => $dto->electionMode,
            'vote_type'              => $dto->voteType,
            'visibility_type'        => $dto->visibilityType,
            'payment_type'           => $dto->paymentType,
            'verification_mode'      => $dto->verificationMode,
            'start_at'               => $dto->startAt,
            'end_at'                 => $dto->endAt,
            'max_votes_per_user'     => $dto->maxVotesPerUser,
            'vote_price'             => $dto->votePrice,
            'currency'               => $dto->currency,
            'real_time_results'      => $dto->realTimeResults,
            'public_results'         => $dto->publicResults,
            'allow_guest_vote'       => $dto->allowGuestVote,
            'otp_required'           => $dto->otpRequired,
            'fraud_detection_enabled' => $dto->fraudDetectionEnabled,
            'timezone'               => $dto->timezone,
            'has_categories'         => $dto->hasCategories,
            'accepts_candidates'     => $dto->acceptsCandidates,
            'candidacy_start_at'     => $dto->candidacyStartAt,
            'candidacy_end_at'       => $dto->candidacyEndAt,
            'max_candidates'         => $dto->maxCandidates,
            'status'                 => ElectionStatus::DRAFT->value,
            'public_weight'          => $dto->publicWeight ?? 1.0,
            'jury_weight'            => $dto->juryWeight ?? 0.0,
        ]);
    }

    public function create(Organization $organization, User $creator, ElectionDTO $dto): Election
    {
        // Vérifier que l'organisation a un abonnement actif
        if (! $organization->hasActiveSubscription()) {
            throw ElectionException::noActiveSubscription();
        }

        // Vérifier que le quota d'élections du plan n'est pas atteint.
        // max_elections = -1 signifie illimité (plan Enterprise).
        // On ne compte pas les élections annulées ou archivées.
        $currentSubscription = $organization->getCurrentSubscription();
        if ($currentSubscription) {
            $plan = $currentSubscription->plan;
            if ($plan->max_elections !== -1) {
                $activeElectionsCount = $organization->elections()
                    ->whereNotIn('status', ['cancelled', 'archived'])
                    ->count();

                if ($activeElectionsCount >= $plan->max_elections) {
                    throw ElectionException::electionLimitReached($plan->max_elections);
                }
            }
        }
        // Generation du  slug unique pour l'élection
        $slug = Str::slug($dto->title);
        $originalSlug = $slug;
        $counter = 1;

        while ($this->electionRepository->findBySlug($organization->id, $slug)) {
            $slug = $originalSlug . '-' . $counter++;
        }
        // Une élection privée nécessite un voter_code unique pour y accéder.
        $voterCode = $dto->electionMode === 'private' ? generate_voter_code() : null;

        $election = $this->electionRepository->create([
            'organization_id' => $organization->id,
            'created_by' => $creator->id,
            'title' => $dto->title,
            'slug' => $slug,
            'voter_code' => $voterCode,
            'short_description' => $dto->shortDescription,
            'description' => $dto->description,
            'banner' => $dto->banner,
            'election_mode' => $dto->electionMode,
            'vote_type' => $dto->voteType,
            'visibility_type' => $dto->visibilityType,
            'payment_type' => $dto->paymentType,
            'verification_mode' => $dto->verificationMode,
            'start_at' => $dto->startAt,
            'end_at' => $dto->endAt,
            'max_votes_per_user' => $dto->maxVotesPerUser,
            'max_choices' => $dto->maxChoices,
            'ranking_enabled' => $dto->rankingEnabled,
            'otp_required' => $dto->otpRequired,
            'public_results' => $dto->publicResults,
            'real_time_results' => $dto->realTimeResults,
            'allow_guest_vote' => $dto->allowGuestVote,
            'fraud_detection_enabled' => $dto->fraudDetectionEnabled,
            'timezone'                => $dto->timezone,
            'currency' => $dto->currency,
            'vote_price' => $dto->votePrice,

            // ── Phase de candidature ──────────────────────────────
            'accepts_candidates' => $dto->acceptsCandidates,
            'candidacy_start_at' => $dto->candidacyStartAt,
            'candidacy_end_at'   => $dto->candidacyEndAt,
            'max_candidates'     => $dto->maxCandidates,
            'has_categories'     => $dto->hasCategories,
            'public_weight'      => $dto->publicWeight ?? 1.0,
            'jury_weight'        => $dto->juryWeight ?? 0.0,
        ]);

        // Create settings
        if ($dto->settings) {
            $election->settings()->create($dto->settings);
        }

        // Assign creator as manager
        $election->users()->attach($creator->id, [
            'role_slug' => 'creator',
            'joined_at' => now(),
            'status' => 'active',
        ]);

        return $election;
    }

    public function update(Election $election, ElectionDTO $dto): Election
    {
        if (! $election->is_editable) {
            throw ElectionException::invalidStatus();
        }

        // Update slug if title changed
        if ($dto->title && $dto->title !== $election->title) {
            $slug = Str::slug($dto->title);
            $originalSlug = $slug;
            $counter = 1;

            while ($this->electionRepository->findBySlug($election->organization_id, $slug) && $slug !== $election->slug) {
                $slug = $originalSlug . '-' . $counter++;
            }

            $election->slug = $slug;
        }

        $newElectionMode = $dto->electionMode ?? $election->election_mode;
        $voterCode = $election->voter_code;

        if ($newElectionMode === 'private' && empty($voterCode)) {
            $voterCode = generate_voter_code();
        }

        $election->fill([
            'title'               => $dto->title              ?? $election->title,
            'banner'              => $dto->banner             ?? $election->banner,
            'short_description'   => $dto->shortDescription   ?? $election->short_description,
            'description'         => $dto->description        ?? $election->description,
            'election_mode'       => $dto->electionMode       ?? $election->election_mode,
            'voter_code'          => $voterCode,
            'vote_type'           => $dto->voteType           ?? $election->vote_type,
            'visibility_type'     => $dto->visibilityType     ?? $election->visibility_type,
            'payment_type'        => $dto->paymentType        ?? $election->payment_type,
            'verification_mode'   => $dto->verificationMode   ?? $election->verification_mode,
            'start_at'            => $dto->startAt            ?? $election->start_at,
            'end_at'              => $dto->endAt              ?? $election->end_at,
            'max_votes_per_user'  => $dto->maxVotesPerUser    ?? $election->max_votes_per_user,
            'vote_price'          => $dto->votePrice          ?? $election->vote_price,
            'currency'            => $dto->currency           ?? $election->currency,
            'real_time_results'   => $dto->realTimeResults    ?? $election->real_time_results,
            'public_results'      => $dto->publicResults      ?? $election->public_results,
            'allow_guest_vote'    => $dto->allowGuestVote     ?? $election->allow_guest_vote,
            'otp_required'        => $dto->otpRequired        ?? $election->otp_required,
            'has_categories'      => $dto->hasCategories      ?? $election->has_categories,

            // Phase de candidature
            'accepts_candidates'  => $dto->acceptsCandidates  ?? $election->accepts_candidates,
            'candidacy_start_at'  => $dto->candidacyStartAt   ?? $election->candidacy_start_at,
            'candidacy_end_at'    => $dto->candidacyEndAt     ?? $election->candidacy_end_at,
            'max_candidates'      => $dto->maxCandidates      ?? $election->max_candidates,
            'public_weight'       => $dto->publicWeight       ?? $election->public_weight,
            'jury_weight'         => $dto->juryWeight         ?? $election->jury_weight,
        ]);

        $election->save();

        return $election;
    }

    /**
     * Alias explicite pour la mise à jour d'un draft depuis le wizard.
     * Même logique que update() — rend l'intention claire dans le controller.
     */
    public function updateDraft(Election $election, ElectionDTO $dto): Election
    {
        return $this->update($election, $dto);
    }

    public function publish(Election $election): void
    {
        if (! in_array($election->status->value, ['draft', 'pending'])) {
            throw ElectionException::invalidStatus();
        }
        // ── Vérification abonnement (commune aux deux chemins) ────────
        $organization = $election->organization;

        if (! app()->isLocal() && ! $organization->hasActiveSubscription()) {
            throw new \Exception(
                'Un abonnement actif est requis pour publier une élection.'
            );
        }

        $subscription = $organization->getCurrentSubscription();
        $plan = $subscription->plan;

        if ($plan->max_elections !== -1) {
            $activeCount = $organization->elections()
                ->whereIn('status', ['published', 'ongoing'])
                ->count();

            if ($activeCount >= $plan->max_elections) {
                throw new \Exception(
                    "Votre abonnement ({$plan->name}) est limité à {$plan->max_elections} élection(s) active(s). "
                        . 'Passez à un abonnement supérieur pour en publier davantage.'
                );
            }
        }
        if ($election->accepts_candidates) {
            $election->publish();
            event(new ElectionPublished($election));
            return;
        }
        // Bloquer seulement si aucun candidat approuvé n'existe
        // Les candidats ajoutés par l'admin sont approuvés automatiquement
        // Les candidatures publiques passent par pending → approved manuellement
        $approvedCount = $election->candidates()->where('status', 'approved')->count();

        if ($approvedCount < 2) {
            throw new \Exception(
                'Impossible de publier une élection avec moins de 2 candidats approuvés. '
                    . 'Ajoutez des candidats, ou activez les candidatures publiques depuis les paramètres de l\'élection.'
            );
        }
        $election->publish();

        event(new ElectionPublished($election));
    }

    public function start(Election $election): void
    {
        if ($election->status->value !== 'published') {
            throw ElectionException::invalidStatus();
        }

        if ($election->start_at > now()) {
            throw new \Exception('Election start date is in the future');
        }

        $election->start();

        event(new ElectionStarted($election));
    }

    public function end(Election $election): void
    {
        if (! in_array($election->status->value, ['published', 'ongoing'])) {
            throw ElectionException::invalidStatus();
        }

        $election->close();

        // Dispatch result calculation job
        dispatch(new CalculateElectionResults($election));

        event(new ElectionEnded($election));
    }

    public function addManager(Election $election, User $user, string $role = 'manager'): void
    {
        if ($election->users()->where('user_id', $user->id)->exists()) {
            throw new \Exception('User is already a manager');
        }

        $election->users()->attach($user->id, [
            'role_slug' => $role,
            'assigned_by' => Auth::user()->id,
            'joined_at' => now(),
            'status' => 'active',
        ]);
    }

    public function removeManager(Election $election, User $user): void
    {
        if ($election->created_by === $user->id) {
            throw new \Exception('Cannot remove the election creator');
        }

        $election->users()->detach($user->id);
    }

    public function getStatistics(Election $election): array
    {
        return [
            'total_votes' => $election->total_votes,
            'total_electors' => $election->electors()->count(),
            'participation_rate' => $election->getParticipationRate(),
            'total_revenue' => $election->total_revenue,
            'remaining_time' => $election->remaining_time,
            'progress_percentage' => $election->progress_percentage,
        ];
    }
}
