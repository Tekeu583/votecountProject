<?php

namespace App\Models;

use App\Models\Election;
use App\Models\User;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class CandidateApplication extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'candidate_applications';

    protected $fillable = [
        'uuid',
        'election_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'gender',
        'photo',
        'identity_document',
        'manifesto',
        'slogan',
        'bio',
        'application_status',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    protected $attributes = [
        'application_status' => 'pending',
    ];

    // Relations
    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

     // Accessors
    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo ? Storage::url($this->photo) : null;
    }

public function getStatusLabelAttribute(): string
    {
        return match ($this->application_status) {
            'pending' => 'En attente de validation',
            'approved' => 'Approuvée',
            'rejected' => 'Rejetée',
            default => $this->application_status,
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->application_status) {
            'pending' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            default => 'gray',
        };
    }

    // Methods
    public function approve(int $userId): void
    {
        $this->application_status = 'approved';
        $this->approved_by = $userId;
        $this->approved_at = now();
        $this->save();
    }

    public function reject(int $userId, string $reason): void
    {
        $this->application_status = 'rejected';
        $this->rejected_by = $userId;
        $this->rejected_at = now();
        $this->rejection_reason = $reason;
        $this->save();
    }

    public function isPending(): bool
    {
        return $this->application_status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->application_status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->application_status === 'rejected';
    }
}
