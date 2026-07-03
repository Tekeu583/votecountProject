<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'app_name',
                'value' => json_encode('VoteCount Project'),
                'description' => 'Application name',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'app_version',
                'value' => json_encode('1.0.0'),
                'description' => 'Application version',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'maintenance_mode',
                'value' => json_encode(false),
                'description' => 'Maintenance mode status',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'default_currency',
                'value' => json_encode('XAF'),
                'description' => 'Default currency for payments',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'max_upload_size',
                'value' => json_encode(10),
                'description' => 'Maximum file upload size in MB',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'otp_expiry_minutes',
                'value' => json_encode(5),
                'description' => 'OTP code expiry in minutes',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'max_login_attempts',
                'value' => json_encode(5),
                'description' => 'Maximum login attempts before lockout',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'fraud_detection_threshold',
                'value' => json_encode(0.7),
                'description' => 'Fraud detection sensitivity threshold',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'results_cache_ttl',
                'value' => json_encode(300),
                'description' => 'Results cache TTL in seconds',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('system_settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('✅ System settings seeded successfully!');
    }
}