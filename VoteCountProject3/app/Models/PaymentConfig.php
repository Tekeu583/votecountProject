<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentConfig extends Model
{
    use HasFactory;

    protected $table = 'payment_configs';

    protected $fillable = [
        'organization_id',
        'provider',
        'api_key',
        'api_secret',
        'environment',
        'webhook_secret',
        'is_active',
    ];

    protected $hidden = [
        'api_key',
        'api_secret',
        'webhook_secret',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $attributes = [
        'environment' => 'sandbox',
        'is_active' => true,
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
