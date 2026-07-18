<?php

namespace App\Http\Controllers\Api\V1\Organizations;

use App\Enums\OrganizationKycStatus;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Organizations\ReviewKycRequest;
use App\Http\Requests\Api\V1\Organizations\SubmitKycRequest;
use App\Http\Resources\Api\V1\OrganizationKycResource;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class OrganizationKycController extends BaseApiController
{
    /**
     * Soumet (ou resoumet après un rejet) les documents KYC d'une
     * organisation — préalable obligatoire à toute demande de retrait
     * (cf. WithdrawalService::createRequest()).
     */
    public function submit(SubmitKycRequest $request, Organization $organization): JsonResponse
    {
        $identityPath = $request->file('identity_document')->storeAs(
            "organizations/{$organization->uuid}/kyc",
            Str::uuid().'.'.$request->file('identity_document')->getClientOriginalExtension(),
            'public'
        );

        $businessPath = $request->file('business_document')->storeAs(
            "organizations/{$organization->uuid}/kyc",
            Str::uuid().'.'.$request->file('business_document')->getClientOriginalExtension(),
            'public'
        );

        $organization->update([
            'kyc_identity_document_type' => $request->identity_document_type,
            'kyc_identity_document_path' => $identityPath,
            'kyc_business_document_path' => $businessPath,
            'kyc_legal_representative_name' => $request->legal_representative_name,
            'kyc_status' => OrganizationKycStatus::PENDING,
            'kyc_submitted_at' => now(),
            'kyc_reviewed_at' => null,
            'kyc_reviewed_by' => null,
            'kyc_rejection_reason' => null,
        ]);

        return $this->success(null, 'Documents KYC soumis, en attente de vérification.');
    }

    public function show(Organization $organization): JsonResponse
    {
        $this->authorize('view', $organization);

        return $this->success([
            'kyc_status' => $organization->kyc_status->value,
            'kyc_status_label' => $organization->kyc_status->label(),
            'kyc_identity_document_type' => $organization->kyc_identity_document_type,
            'kyc_legal_representative_name' => $organization->kyc_legal_representative_name,
            'kyc_submitted_at' => $organization->kyc_submitted_at?->toIso8601String(),
            'kyc_reviewed_at' => $organization->kyc_reviewed_at?->toIso8601String(),
            'kyc_rejection_reason' => $organization->kyc_rejection_reason,
        ]);
    }

    /**
     * File d'attente des organisations dont le KYC attend une vérification
     * — premier "inbox de review" de l'application.
     */
    public function pendingReview(Request $request): JsonResponse
    {
        $this->authorize('review organization kyc');

        $organizations = Organization::where('kyc_status', OrganizationKycStatus::PENDING->value)
            ->orderBy('kyc_submitted_at')
            ->paginate($request->integer('per_page', 15));

        return $this->paginated($organizations, OrganizationKycResource::class);
    }

    public function review(ReviewKycRequest $request, Organization $organization): JsonResponse
    {
        $this->authorize('review organization kyc');

        $organization->update([
            'kyc_status' => $request->decision,
            'kyc_reviewed_at' => now(),
            'kyc_reviewed_by' => Auth::id(),
            'kyc_rejection_reason' => $request->decision === 'rejected' ? $request->rejection_reason : null,
        ]);

        return $this->success(null, $request->decision === 'verified'
            ? 'Organisation vérifiée avec succès.'
            : 'Vérification KYC rejetée.');
    }
}
