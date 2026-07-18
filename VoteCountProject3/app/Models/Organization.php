<?php

namespace App\Models;

use App\Enums\OrganizationKycStatus;
use App\Traits\HasAudit;
use App\Traits\HasSoftDeletesWithUser;
use App\Traits\HasUuid;
use App\Traits\IsCacheable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasAudit, HasFactory, HasSoftDeletesWithUser, HasUuid, IsCacheable;

    protected $table = 'organizations';

    protected $fillable = [
        'uuid',
        'owner_user_id',
        'subscription_plan_id',
        'name',
        'slug',
        'logo',
        'banner',
        'description',
        'email',
        'phone',
        'website',
        'country',
        'city',
        'address',
        'status',
        'verified_at',
        'created_by',
        'deleted_by',
        'scheduled_permanent_delete_at',
        'kyc_status',
        'kyc_identity_document_type',
        'kyc_identity_document_path',
        'kyc_business_document_path',
        'kyc_legal_representative_name',
        'kyc_submitted_at',
        'kyc_reviewed_at',
        'kyc_reviewed_by',
        'kyc_rejection_reason',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'deleted_at' => 'datetime',
        'scheduled_permanent_delete_at' => 'datetime',
        'kyc_status' => OrganizationKycStatus::class,
        'kyc_submitted_at' => 'datetime',
        'kyc_reviewed_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'active',
        'kyc_status' => 'not_submitted',
    ];

    // ========== RELATIONS ==========

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_user')
            ->withPivot('role_slug', 'permissions', 'invited_by', 'joined_at', 'status')
            ->withTimestamps();
    }

    public function elections(): HasMany
    {
        return $this->hasMany(Election::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function paymentConfigs(): HasMany
    {
        return $this->hasMany(PaymentConfig::class);
    }

    public function importJobs(): HasMany
    {
        return $this->hasMany(ImportJob::class);
    }

    public function withdrawalRequests(): HasMany
    {
        return $this->hasMany(WithdrawalRequest::class);
    }

    public function kycReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kyc_reviewed_by');
    }

    public function trashRecords(): HasMany
    {
        return $this->hasMany(TrashRecord::class);
    }

    // ========== SCOPES ==========

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('verified_at');
    }

    // ========== ACCESSORS ==========

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? asset('storage/'.$this->logo) : null;
    }

    public function getBannerUrlAttribute(): ?string
    {
        return $this->banner ? asset('storage/'.$this->banner) : null;
    }

    public function getKycIdentityDocumentUrlAttribute(): ?string
    {
        return $this->kyc_identity_document_path ? asset('storage/'.$this->kyc_identity_document_path) : null;
    }

    public function getKycBusinessDocumentUrlAttribute(): ?string
    {
        return $this->kyc_business_document_path ? asset('storage/'.$this->kyc_business_document_path) : null;
    }

    public function getIsVerifiedAttribute(): bool
    {
        return ! is_null($this->verified_at);
    }

    // ========== HELPERS ==========

    public function isKycVerified(): bool
    {
        return $this->kyc_status === OrganizationKycStatus::VERIFIED;
    }

    public function hasActiveSubscription(): bool
    {
        return $this->subscriptions()
            ->where('status', 'active')
            ->where('end_at', '>', now())
            ->exists();
    }

    public function getCurrentSubscription(): ?Subscription
    {
        return $this->subscriptions()
            ->where('status', 'active')
            ->where('end_at', '>', now())
            ->latest()
            ->first();
    }
}
