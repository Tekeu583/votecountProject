<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElectionSetting extends Model
{
    use HasFactory;

    protected $table = 'election_settings';

    protected $fillable = [
        'election_id',
        'allow_duplicate_ip',
        'allow_multiple_devices',
        'enable_geo_restriction',
        'enable_rate_limit',
        'enable_captcha',
        'enable_email_verification',
        'enable_sms_verification',
        'enable_face_verification',
        'auto_publish_results',
        'show_live_statistics',
        'enable_anomaly_detection',
        'max_vote_attempts',
        'allowed_countries',
        'blocked_countries',
        'settings',
    ];

    protected $casts = [
        'allow_duplicate_ip' => 'boolean',
        'allow_multiple_devices' => 'boolean',
        'enable_geo_restriction' => 'boolean',
        'enable_rate_limit' => 'boolean',
        'enable_captcha' => 'boolean',
        'enable_email_verification' => 'boolean',
        'enable_sms_verification' => 'boolean',
        'enable_face_verification' => 'boolean',
        'auto_publish_results' => 'boolean',
        'show_live_statistics' => 'boolean',
        'enable_anomaly_detection' => 'boolean',
        'allowed_countries' => 'array',
        'blocked_countries' => 'array',
        'settings' => 'array',
    ];

    protected $attributes = [
        'allow_duplicate_ip' => false,
        'allow_multiple_devices' => false,
        'enable_geo_restriction' => false,
        'enable_rate_limit' => true,
        'enable_captcha' => false,
        'enable_email_verification' => false,
        'enable_sms_verification' => false,
        'enable_face_verification' => false,
        'auto_publish_results' => true,
        'show_live_statistics' => true,
        'enable_anomaly_detection' => true,
        'max_vote_attempts' => 3,
    ];

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }
}
