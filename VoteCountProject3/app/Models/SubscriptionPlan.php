<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'subscription_plans';

    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'description',
        'price',
        'currency',
        'duration_days',
        'max_elections',
        'max_votes',
        'max_candidates',
        'max_storage_gb',
        'features',
        'status',
    ];

    protected $casts = [
        'features' => 'array',
        'price' => 'decimal:2',
    ];

    protected $attributes = [
        'currency' => 'XAF',
        'status' => 'active',
    ];

    // ========== RELATIONS ==========

    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    // ========== SCOPES ==========

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 0, ',', ' ') . ' ' . $this->currency;
    }

    public function getDurationLabelAttribute(): string
    {
        if ($this->duration_days === 30) return 'Mensuel';
        if ($this->duration_days === 90) return 'Trimestriel';
        if ($this->duration_days === 180) return 'Semestriel';
        if ($this->duration_days === 365) return 'Annuel';
        return $this->duration_days . ' jours';
    }

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'price' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
