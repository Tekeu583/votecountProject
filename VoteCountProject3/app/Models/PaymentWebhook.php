<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentWebhook extends Model
{
    use HasFactory;

    protected $table = 'payment_webhooks';

    protected $fillable = [
        'provider',
        'payload',
        'signature',
        'processed',
        'processed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'processed' => 'boolean',
        'processed_at' => 'datetime',
    ];

    protected $attributes = [
        'processed' => false,
    ];

    public function markAsProcessed(): void
    {
        $this->processed = true;
        $this->processed_at = now();
        $this->save();
    }
}