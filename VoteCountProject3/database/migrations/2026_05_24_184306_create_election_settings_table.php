<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('election_settings', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('election_id')->unsigned()->unique();

            // Security settings
            $table->boolean('allow_duplicate_ip')->default(false);
            $table->boolean('allow_multiple_devices')->default(false);
            $table->boolean('enable_geo_restriction')->default(false);
            $table->boolean('enable_rate_limit')->default(true);
            $table->boolean('enable_captcha')->default(false);
            $table->boolean('enable_email_verification')->default(false);
            $table->boolean('enable_sms_verification')->default(false);
            $table->boolean('enable_face_verification')->default(false);

            // Results settings
            $table->boolean('auto_publish_results')->default(true);
            $table->boolean('show_live_statistics')->default(true);
            $table->boolean('enable_anomaly_detection')->default(true);

            $table->integer('max_vote_attempts')->default(3);

            // Geo restrictions
            $table->jsonb('allowed_countries')->nullable();
            $table->jsonb('blocked_countries')->nullable();

            // Additional settings
            $table->jsonb('settings')->default('[]');

            $table->timestampsTz();

            // Foreign key
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');

            // Indexes
            $table->index(['election_id', 'enable_captcha']);
            $table->index(['election_id', 'enable_rate_limit']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('election_settings');
    }
};
