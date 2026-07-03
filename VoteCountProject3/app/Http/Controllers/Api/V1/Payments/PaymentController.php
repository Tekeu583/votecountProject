<?php

namespace App\Http\Controllers\Api\V1\Payments;

use App\Exceptions\PaymentException;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Api\V1\PaymentTransactionResource;
use App\Models\Election;
use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\Vote;
use App\Services\PaymentGateway;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentController extends BaseApiController
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * @OA\Post(
     *     path="/api/v1/payments/initiate",
     *     summary="Initiate payment for a vote",
     *     tags={"Payments"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             required={"vote_uuid", "provider", "phone_number"},
     *
     *             @OA\Property(property="vote_uuid", type="string"),
     *             @OA\Property(property="provider", type="string", enum={"orange_money", "mtn_money", "stripe"}),
     *             @OA\Property(property="phone_number", type="string")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Payment initiated"
     *     )
     * )
     */
    public function initiate(Request $request): JsonResponse
    {
        $request->validate([
            'vote_uuid' => 'required|exists:votes,uuid',
            'provider' => 'required|in:orange_money,mtn_money,stripe',
            'phone_number' => 'required_if:provider,orange_money,mtn_money|string',
        ]);

        $vote = Vote::where('uuid', $request->vote_uuid)->firstOrFail();

        if ($vote->is_completed) {
            return $this->error('Vote already completed', null, 400);
        }

        if (! $vote->is_paid) {
            return $this->error('Vote does not require payment', null, 400);
        }

        $transaction = $this->paymentService->processPayment($vote, $request->provider, $request->phone_number);

        return $this->success([
            'transaction_uuid' => $transaction->uuid,
            'reference' => $transaction->transaction_reference,
            'status' => $transaction->status->value,
        ], 'Payment initiated');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/payments/verify",
     *     summary="Verify payment status",
     *     tags={"Payments"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             required={"transaction_uuid"},
     *
     *             @OA\Property(property="transaction_uuid", type="string")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Payment status"
     *     )
     * )
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate(['transaction_uuid' => 'required|exists:payment_transactions,uuid']);

        $transaction = PaymentTransaction::where('uuid', $request->transaction_uuid)->firstOrFail();

        $verified = $this->paymentService->verifyPayment($transaction);

        return $this->success([
            'status' => $transaction->status->value,
            'verified' => $verified,
            'vote_uuid' => $transaction->vote?->uuid,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/payments/webhook/{provider}",
     *     summary="Payment provider webhook",
     *     tags={"Payments"},
     *
     *     @OA\Parameter(
     *         name="provider",
     *         in="path",
     *         required=true,
     *
     *         @OA\Schema(type="string", enum={"orange_money", "mtn_money", "stripe"})
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Webhook processed"
     *     )
     * )
     */
    public function webhook(string $provider, Request $request): JsonResponse
    {
        $signature = $provider === 'campay'
            ? (string) $request->input('signature', '')
            : (string) $request->header('X-Signature', '');

        $this->paymentService->handleWebhook($provider, $request->all(), $signature);

        return response()->json(['status' => 'ok']);
    }


     // ──VOTE PAYMENT (public, sans auth) ─────

    /**
     * POST /api/v1/elections/{election}/vote/payment/initiate
     * Initie un paiement pour voter dans une élection payante.
     * Accessible sans authentification (l'électeur n'est pas forcément connecté).
     *
     * @param Request  $request
     * @param Election $election
     */
    public function initiateForVote(Request $request, Election $election): JsonResponse
    {
        $request->validate([
            'vote_uuid'    => 'required|exists:votes,uuid',
            'provider'     => 'required|in:orange_money,mtn_money,stripe,campay',
            'phone_number' => 'required_if:provider,orange_money,mtn_money,campay|nullable|string|max:20',
        ]);

        $vote = Vote::where('uuid', $request->vote_uuid)
            ->where('election_id', $election->id)
            ->firstOrFail();

        if ($vote->is_completed) {
            return $this->error('Ce vote est déjà complété', null, 400);
        }

        if (! $vote->is_paid) {
            return $this->error('Ce vote ne nécessite pas de paiement', null, 400);
        }

        $transaction = $this->paymentService->processPayment(
            $vote,
            $request->provider,
            $request->phone_number
        );

        return $this->success([
            'transaction_uuid' => $transaction->uuid,
            'reference'        => $transaction->transaction_reference,
            'status'           => $transaction->status->value,
            'amount'           => $transaction->amount,
            'currency'         => $transaction->currency,
        ], 'Paiement initié');
    }

    /**
     * POST /api/v1/elections/{election}/vote/payment/verify
     * Vérifie le statut d'un paiement de vote.
     *
     * @param Request  $request
     * @param Election $election
     */
    public function verifyVotePayment(Request $request, Election $election): JsonResponse
    {
        $request->validate([
            'transaction_uuid' => 'required|exists:payment_transactions,uuid',
        ]);

        $transaction = PaymentTransaction::where('uuid', $request->transaction_uuid)
            ->where('election_id', $election->id)
            ->where('type', 'vote')
            ->firstOrFail();

        $verified = $this->paymentService->verifyPayment($transaction);

        return $this->success([
            'status'    => $transaction->status->value,
            'verified'  => $verified,
            'vote_uuid' => $transaction->vote?->uuid,
        ], 'Statut du paiement');
    }

    /**
     * GET /api/v1/elections/{election}/vote/payment/status/{transaction_uuid}
     * Retourne le statut courant d'une transaction de vote sans déclencher de vérification.
     * Utile pour le polling depuis le frontend.
     *
     * @param Election $election
     * @param string   $transaction_uuid
     */
    public function getVotePaymentStatus(Election $election, string $transaction_uuid): JsonResponse
    {
        $transaction = PaymentTransaction::where('uuid', $transaction_uuid)
            ->where('election_id', $election->id)
            ->where('type', 'vote')
            ->firstOrFail();

        return $this->success(
            new PaymentTransactionResource($transaction),
            'Statut de la transaction'
        );
    }

    // ──  SUBSCRIPTION PAYMENT (auth requise) ──

    /**
     * POST /api/v1/subscriptions/initiate
     * Initie un paiement pour souscrire/renouveler un abonnement.
     * L'utilisateur doit appartenir à une organisation.
     *
     * Payload :
     * {
     *   plan_uuid:    "uuid du plan",
     *   provider:     "orange_money" | "mtn_money" | "stripe",
     *   phone_number: "string" (requis pour mobile money),
     *   organization_uuid: "uuid" (optionnel si user n'a qu'une org)
     * }
     */
     // ──  SUBSCRIPTION PAYMENT (auth requise) ──

    /**
     * POST /api/v1/subscriptions/initiate
     * Initie un paiement pour souscrire/renouveler un abonnement.
     * L'utilisateur doit appartenir à une organisation.
     *
     * Payload :
     * {
     *   plan_uuid:    "uuid du plan",
     *   provider:     "orange_money" | "mtn_money" | "stripe",
     *   phone_number: "string" (requis pour mobile money),
     *   organization_uuid: "uuid" (optionnel si user n'a qu'une org)
     * }
     */
    public function initiateSubscription(Request $request): JsonResponse
    {
        $request->validate([
            'plan_uuid'         => 'required|exists:subscription_plans,uuid',
            'provider'          => 'required|in:free,orange_money,mtn_money,stripe',
            'phone_number'      => 'required_if:provider,orange_money,mtn_money|nullable|string|max:20',
            'organization_uuid' => 'nullable|exists:organizations,uuid',
        ]);

        $organization = $this->resolveOrganization($request);
        if ($organization instanceof JsonResponse) {
            return $organization;
        }

        $plan = SubscriptionPlan::where('uuid', $request->plan_uuid)
            ->where('status', 'active')
            ->firstOrFail();

        if ($request->provider === 'free' || (int) $plan->price === 0) {
            return $this->activateFreeSubscription($organization, $plan);
        }

        return $this->initiatePaidSubscription($request, $organization, $plan);
    }

    /**
     * Résout l'organisation à partir de la requête.
     * Retourne une JsonResponse d'erreur si aucune organisation n'est trouvée.
     */
    private function resolveOrganization(Request $request): mixed
    {
        $user = Auth::user();

        if ($request->organization_uuid) {
            return $user->organizations()
                ->where('uuid', $request->organization_uuid)
                ->firstOrFail();
        }

        $organization = $user->organizations()->first()
            ?? $user->ownedOrganizations()->first();

        if (! $organization) {
            return $this->error('Aucune organisation trouvée pour cet utilisateur', null, 400);
        }

        return $organization;
    }
    /**
     * Active immédiatement un plan gratuit (price = 0).
     * Pas de passage par un prestataire de paiement.
     * Trace une transaction à 0 pour l'historique.
     */
    private function activateFreeSubscription($organization, SubscriptionPlan $plan): JsonResponse
    {
        if ((int) $plan->price !== 0) {
            return $this->error(
                'Le provider "free" ne peut être utilisé qu\'avec un plan gratuit.',
                null,
                422
            );
        }

        $alreadyFree = $organization->subscriptions()
            ->whereHas('plan', fn($q) => $q->where('price', 0))
            ->where('status', 'active')
            ->where('end_at', '>', now())
            ->exists();

        if ($alreadyFree) {
            return $this->error(
                'Vous bénéficiez déjà du plan gratuit. Passez à un plan supérieur pour continuer.',
                null,
                409
            );
        }

        DB::beginTransaction();
        try {
            $subscription = Subscription::create([
                'organization_id'      => $organization->id,
                'subscription_plan_id' => $plan->id,
                'start_at'             => now(),
                'end_at'               => now()->addDays($plan->duration_days),
                'status'               => 'active',
                'auto_renew'           => false,
            ]);

            $reference   = 'FREE_' . strtoupper(uniqid()) . '_' . random_int(1000, 9999);
            $transaction = PaymentTransaction::create([
                'subscription_id'       => $subscription->id,
                'organization_id'       => $organization->id,
                'type'                  => 'subscription',
                'provider'              => 'free',
                'phone_number'          => null,
                'currency'              => $plan->currency,
                'amount'                => 0,
                'net_amount'            => 0,
                'payment_method'        => 'free',
                'transaction_reference' => $reference,
                'provider_reference'    => 'free',
                'status'                => 'completed',
            ]);

            DB::commit();

            return $this->success([
                'subscription_uuid' => $subscription->uuid,
                'transaction_uuid'  => $transaction->uuid,
                'reference'         => $reference,
                'status'            => 'active',
                'amount'            => 0,
                'currency'          => $plan->currency,
                'plan'              => ['name' => $plan->name, 'duration_days' => $plan->duration_days],
                'activated'         => true,
            ], 'Plan gratuit activé avec succès');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Erreur lors de l\'activation du plan gratuit : ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Initie un paiement auprès d'un prestataire (Orange Money, MTN, Stripe).
     * Crée la subscription en statut pending en attendant la confirmation.
     */
    private function initiatePaidSubscription(Request $request, $organization, SubscriptionPlan $plan): JsonResponse
    {

        // Vérifier que le provider est activé (résolution depuis .env)
        if (! in_array($request->provider, $this->paymentService->getProviders())) {
            return $this->error(
                "Le fournisseur {$request->provider} n'est pas disponible",
                null,
                400
            );
        }

        DB::beginTransaction();
        try {
            $subscription = Subscription::create([
                'organization_id'      => $organization->id,
                'subscription_plan_id' => $plan->id,
                'start_at'             => now(),
                'end_at'               => now()->addDays($plan->duration_days),
                'status'               => 'pending',
                'auto_renew'           => false,
            ]);

            $reference   = 'SUB_' . strtoupper(uniqid()) . '_' . random_int(1000, 9999);
            $transaction = PaymentTransaction::create([
                'subscription_id'       => $subscription->id,
                'organization_id'       => $organization->id,
                'type'                  => 'subscription',
                'provider'              => $request->provider,
                'phone_number'          => $request->phone_number,
                'currency'              => $plan->currency,
                'amount'                => $plan->price,
                'net_amount'            => $plan->price,
                'payment_method'        => $request->provider,
                'transaction_reference' => $reference,
                'provider_reference'    => '',
                'status'                => 'processing',
            ]);

            // Initier le paiement — config résolue via PaymentGateway (.env first)
            $gateway  = app(\App\Services\PaymentGateway::class);
            $provider = $gateway->provider($request->provider, $organization);
            $response = $provider->initiatePayment($transaction, $request->phone_number);

            $transaction->update([
                'provider_reference' => $response['reference'],
                'provider_response'  => $response,
            ]);

            DB::commit();

            return $this->success([
                'transaction_uuid'  => $transaction->uuid,
                'subscription_uuid' => $subscription->uuid,
                'reference'         => $transaction->transaction_reference,
                'status'            => $transaction->status->value,
                'amount'            => $transaction->amount,
                'currency'          => $transaction->currency,
                'plan'              => ['name' => $plan->name, 'duration_days' => $plan->duration_days],
                'activated'         => false,
            ], 'Paiement d\'abonnement initié');
        } catch (\Exception $e) {
            DB::rollBack();
            throw PaymentException::providerError($request->provider, $e->getMessage());
        }
    }

    /**
     * POST /api/v1/subscriptions/verify
     * Vérifie le statut d'un paiement d'abonnement et active la subscription si payé.
     *
     * Payload : { transaction_uuid: "uuid" }
     */
    public function verifySubscription(Request $request): JsonResponse
    {
        $request->validate([
            'transaction_uuid' => 'required|exists:payment_transactions,uuid',
        ]);

        $user = Auth::user();

        $transaction = PaymentTransaction::where('uuid', $request->transaction_uuid)
            ->where('type', 'subscription')
            ->whereHas('organization', function ($q) use ($user) {
                // Sécurité : l'utilisateur doit appartenir à l'organisation
                $q->whereHas('users', fn($u) => $u->where('users.id', $user->id))
                    ->orWhereHas('owner', fn($o) => $o->where('users.id', $user->id));
            })
            ->with('subscription')
            ->firstOrFail();

        // Vérification déjà complétée
        if ($transaction->status->value === 'completed') {
            return $this->success([
                'status'            => $transaction->status->value,
                'verified'          => true,
                'subscription_uuid' => $transaction->subscription?->uuid,
            ], 'Paiement déjà vérifié');
        }

        // Vérifier auprès du prestataire — config résolue via PaymentGateway (.env first)
        $gateway  = app(\App\Services\PaymentGateway::class);
        $provider = $gateway->provider($transaction->provider, $transaction->organization);
        $status   = $provider->checkStatus($transaction->provider_reference);

        DB::beginTransaction();
        try {
            if ($status === 'completed') {
                // Marquer la transaction comme complétée
                $transaction->markAsCompleted($transaction->provider_reference);

                // Activer la subscription
                if ($transaction->subscription) {
                    $transaction->subscription->update([
                        'status'   => 'active',
                        'start_at' => now(),
                        'end_at'   => now()->addDays(
                            $transaction->subscription->plan->duration_days
                        ),
                    ]);
                }

                DB::commit();

                return $this->success([
                    'status'            => 'completed',
                    'verified'          => true,
                    'subscription_uuid' => $transaction->subscription?->uuid,
                    'subscription_ends' => $transaction->subscription?->end_at?->toIso8601String(),
                ], 'Abonnement activé');
            }

            if ($status === 'failed') {
                $transaction->markAsFailed('Paiement refusé par le prestataire');

                // Annuler la subscription pending
                if ($transaction->subscription) {
                    $transaction->subscription->update(['status' => 'cancelled']);
                }

                DB::commit();

                return $this->success([
                    'status'   => 'failed',
                    'verified' => false,
                ], 'Paiement échoué');
            }

            DB::commit();

            // Toujours en cours
            return $this->success([
                'status'   => $transaction->status->value,
                'verified' => false,
            ], 'Paiement en cours de traitement');
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    /**
     * GET /api/v1/subscriptions/status
     * Retourne le statut de l'abonnement actif de l'organisation courante.
     */
    public function getSubscriptionStatus(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Résoudre l'organisation (paramètre optionnel)
        if ($request->has('organization_uuid')) {
            $organization = $user->organizations()
                ->where('uuid', $request->organization_uuid)
                ->firstOrFail();
        } else {
            $organization = $user->organizations()->first()
                ?? $user->ownedOrganizations()->first();

            if (! $organization) {
                return $this->success([
                    'has_subscription' => false,
                    'subscription'     => null,
                ], 'Aucune organisation trouvée');
            }
        }

        $subscription = $organization->getCurrentSubscription();

        if (! $subscription) {
            return $this->success([
                'has_subscription' => false,
                'subscription'     => null,
                'organization'     => [
                    'uuid' => $organization->uuid,
                    'name' => $organization->name,
                ],
            ], 'Aucun abonnement actif');
        }

        $subscription->load('plan');

        return $this->success([
            'has_subscription' => true,
            'subscription'     => [
                'uuid'           => $subscription->uuid,
                'status'         => $subscription->status,
                'start_at'       => $subscription->start_at?->toIso8601String(),
                'end_at'         => $subscription->end_at?->toIso8601String(),
                'days_remaining' => $subscription->days_remaining,
                'auto_renew'     => $subscription->auto_renew,
                'plan'           => [
                    'uuid'          => $subscription->plan->uuid,
                    'name'          => $subscription->plan->name,
                    'price'         => $subscription->plan->price,
                    'currency'      => $subscription->plan->currency,
                    'duration_days' => $subscription->plan->duration_days,
                    'max_elections' => $subscription->plan->max_elections,
                    'max_votes'     => $subscription->plan->max_votes,
                    'features'      => $subscription->plan->features,
                ],
            ],
            'organization' => [
                'uuid' => $organization->uuid,
                'name' => $organization->name,
            ],
        ], 'Abonnement actif');
    }


    /**
     * PATCH /api/v1/subscriptions/{subscription}/auto-renew
     * Active ou désactive le renouvellement automatique d'un abonnement.
     *
     * Payload : { auto_renew: true|false }
     */
    public function toggleAutoRenew(Request $request, Subscription $subscription): JsonResponse
    {
        $request->validate([
            'auto_renew' => 'required|boolean',
        ]);

        $user = Auth::user();

        // Vérifier que l'utilisateur appartient à l'organisation de cet abonnement
        $organization = $subscription->organization;
        $isMember = $organization->users()->where('users.id', $user->id)->exists()
            || $organization->owner_user_id === $user->id;

        if (! $isMember) {
            return $this->error('Accès non autorisé à cet abonnement', null, 403);
        }

        if (! $subscription->is_active) {
            return $this->error('Impossible de modifier un abonnement inactif', null, 400);
        }

        $subscription->update(['auto_renew' => $request->boolean('auto_renew')]);

        return $this->success([
            'subscription_uuid' => $subscription->uuid,
            'auto_renew'        => $subscription->auto_renew,
            'end_at'            => $subscription->end_at?->toIso8601String(),
            'message'           => $subscription->auto_renew
                ? 'Renouvellement automatique activé. Votre abonnement sera renouvelé avant expiration.'
                : 'Renouvellement automatique désactivé. Votre abonnement expirera à la date prévue.',
        ], 'Renouvellement automatique mis à jour');
    }

    /**
     * DELETE /api/v1/subscriptions/{subscription}/cancel
     * Annule un abonnement actif (désactive auto_renew et marque comme cancelled).
     */
    public function cancelSubscription(Subscription $subscription): JsonResponse
    {
        $user = Auth::user();

        $organization = $subscription->organization;
        $isMember = $organization->users()->where('users.id', $user->id)->exists()
            || $organization->owner_user_id === $user->id;

        if (! $isMember) {
            return $this->error('Accès non autorisé à cet abonnement', null, 403);
        }

        if (! in_array($subscription->status, ['active', 'pending'])) {
            return $this->error('Cet abonnement ne peut pas être annulé', null, 400);
        }

        $subscription->update([
            'status'     => 'cancelled',
            'auto_renew' => false,
        ]);

        return $this->success([
            'subscription_uuid' => $subscription->uuid,
            'status'            => 'cancelled',
            'end_at'            => $subscription->end_at?->toIso8601String(),
            'message'           => 'Abonnement annulé. Vous gardez l\'accès jusqu\'au ' .
                $subscription->end_at?->format('d/m/Y') . '.',
        ], 'Abonnement annulé');
    }
}
