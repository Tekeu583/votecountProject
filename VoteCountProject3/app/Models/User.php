<?php

namespace App\Models;

use App\Enums\UserStatus;
use App\Traits\HasAudit;
use App\Traits\HasSoftDeletesWithUser;
use App\Traits\HasUuid;
use App\Traits\IsCacheable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable;
    use HasAudit, HasSoftDeletesWithUser, HasUuid, IsCacheable;

    protected $table = 'users';

    protected $fillable = [
        'uuid',
        'first_name',
        'last_name',
        'email',
        'phone',
        'photo',
        'password',
        'gender',
        'birth_date',
        'country',
        'city',
        'address',
        'locale',
        'timezone',
        'status',
        'email_verified_at',
        'phone_verified_at',
        'two_factor_enabled',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'last_login_at',
        'last_login_ip',
        'registration_ip',
        'remember_token',
        'deleted_by',
        'scheduled_permanent_delete_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'birth_date' => 'date',
        'two_factor_enabled' => 'boolean',
        'status' => UserStatus::class,
        'deleted_at' => 'datetime',
        'scheduled_permanent_delete_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => UserStatus::PENDING_VERIFICATION,
        'locale' => 'fr',
        'timezone' => 'UTC',
        'two_factor_enabled' => false,
    ];

    // ========== RELATIONS ==========

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_user')
            ->withPivot('role_slug', 'permissions', 'invited_by', 'joined_at', 'status')
            ->withTimestamps();
    }

    public function ownedOrganizations(): HasMany
    {
        return $this->hasMany(Organization::class, 'owner_user_id');
    }

    public function createdOrganizations(): HasMany
    {
        return $this->hasMany(Organization::class, 'created_by');
    }

    public function elections(): BelongsToMany
    {
        return $this->belongsToMany(Election::class, 'election_user')
            ->withPivot('role_slug', 'permissions', 'assigned_by', 'joined_at', 'status')
            ->withTimestamps();
    }

    public function createdElections(): HasMany
    {
        return $this->hasMany(Election::class, 'created_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function securityAlerts(): HasMany
    {
        return $this->hasMany(SecurityAlert::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function mediaFiles(): HasMany
    {
        return $this->hasMany(MediaFile::class, 'uploaded_by');
    }

    public function juryScores(): HasMany
    {
        return $this->hasMany(JuryScore::class, 'jury_user_id');
    }

    public function importJobs(): HasMany
    {
        return $this->hasMany(ImportJob::class, 'imported_by');
    }

    public function deletionRequestsRequested(): HasMany
    {
        return $this->hasMany(DeletionRequest::class, 'requested_by');
    }

    public function deletionRequestsApproved(): HasMany
    {
        return $this->hasMany(DeletionRequest::class, 'approved_by');
    }

    public function trashRecordsDeleted(): HasMany
    {
        return $this->hasMany(TrashRecord::class, 'deleted_by');
    }

    public function trashRecordsOwner(): HasMany
    {
        return $this->hasMany(TrashRecord::class, 'owner_user_id');
    }

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }

    public function approvedCandidates(): HasMany
    {
        return $this->hasMany(Candidate::class, 'approved_by');
    }

    public function rejectedCandidates(): HasMany
    {
        return $this->hasMany(Candidate::class, 'rejected_by');
    }

    public function approvedApplications(): HasMany
    {
        return $this->hasMany(CandidateApplication::class, 'approved_by');
    }

    public function rejectedApplications(): HasMany
    {
        return $this->hasMany(CandidateApplication::class, 'rejected_by');
    }

    public function resolvedSecurityAlerts(): HasMany
    {
        return $this->hasMany(SecurityAlert::class, 'resolved_by');
    }

    // ========== SCOPES ==========

    public function scopeActive($query)
    {
        return $query->where('status', UserStatus::ACTIVE);
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('email_verified_at');
    }

    public function scopeByOrganization($query, int $organizationId)
    {
        return $query->whereHas('organizations', function ($q) use ($organizationId) {
            $q->where('organization_id', $organizationId);
        });
    }

    public function scopeByRole($query, string $role)
    {
        return $query->role($role);
    }

    // ========== ACCESSORS ==========

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    public function getInitialsAttribute(): string
    {
        return strtoupper(substr($this->first_name, 0, 1).substr($this->last_name, 0, 1));
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->photo) {
            // Certains comptes de démo/seed stockent une URL externe complète
            // (UserFactory) plutôt qu'un chemin relatif de stockage local.
            return str_starts_with($this->photo, 'http')
                ? $this->photo
                : asset('storage/'.$this->photo);
        }

        return 'https://ui-avatars.com/api/?name='.urlencode($this->full_name).'&background=random';
    }

    public function getIsEmailVerifiedAttribute(): bool
    {
        return ! is_null($this->email_verified_at);
    }

    public function getIsPhoneVerifiedAttribute(): bool
    {
        return ! is_null($this->phone_verified_at);
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === UserStatus::ACTIVE;
    }

    // ========== HELPERS ==========

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin') || $this->isSuperAdmin();
    }

    public function canAccessOrganization(Organization $organization): bool
    {
        return $this->organizations()->where('organization_id', $organization->id)->exists()
            || $this->isAdmin();
    }

    public function canAccessElection(Election $election): bool
    {
        return $this->elections()->where('election_id', $election->id)->exists()
            || $this->canAccessOrganization($election->organization)
            || $this->isAdmin();
    }

    public function markEmailAsVerified(): void
    {
        $this->email_verified_at = now();
        $this->status = UserStatus::ACTIVE;
        $this->save();
    }

    public function markPhoneAsVerified(): void
    {
        $this->phone_verified_at = now();
        $this->save();
    }

    public function updateLastLogin(string $ip): void
    {
        $this->last_login_at = now();
        $this->last_login_ip = $ip;
        $this->save();
    }

    public function setRegistrationIp(string $ip): void
    {
        $this->registration_ip = $ip;
        $this->save();
    }
}
