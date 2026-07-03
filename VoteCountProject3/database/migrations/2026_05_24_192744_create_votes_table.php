<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('election_id')->unsigned();
            $table->bigInteger('elector_id')->unsigned()->nullable();
            $table->bigInteger('voter_session_id')->unsigned()->nullable();

            // Device info
            $table->string('ip_address', 45);
            $table->string('device_id', 100)->nullable();
            $table->string('browser')->nullable();
            $table->string('operating_system')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();

            // Vote metadata
            $table->enum('vote_type', ['standard', 'jury', 'test'])->default('standard');
            $table->enum('verification_method', ['none', 'otp', 'biometric', 'face'])->default('none');

            $table->boolean('is_paid')->default(false);
            $table->enum('payment_status', ['pending', 'completed', 'failed'])->nullable();
            $table->boolean('otp_verified')->default(false);

            $table->decimal('total_amount', 10, 2)->default(0);

            // Fraud detection
            $table->float('fraud_score')->default(0);
            $table->jsonb('fraud_rules')->default('[]');
            $table->jsonb('fraud_signals')->default('[]');
            $table->jsonb('fraud_scores')->default('[]');
            $table->boolean('anomaly_detected')->default(false);

            $table->enum('status', ['pending', 'completed', 'failed', 'fraud_suspected'])->default('pending');

            $table->timestampTz('submitted_at')->nullable();
            $table->timestampTz('validated_at')->nullable();

            $table->integer('vote_sequence')->nullable();
            $table->integer('attempt_number')->default(1);

            $table->string('idempotency_key', 100)->unique();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');
            $table->foreign('elector_id')->references('id')->on('electors')->onDelete('cascade');
            $table->foreign('voter_session_id')->references('id')->on('voter_sessions')->onDelete('set null');

            // Indexes
            $table->index(['election_id']);
            $table->index(['elector_id']);
            $table->index(['election_id', 'elector_id']);
            $table->index(['status']);
            $table->index(['submitted_at']);
            $table->index(['fraud_score']);
            $table->index(['idempotency_key']);
            $table->index(['ip_address']);
            $table->index(['device_id']);

            // Composite unique constraint (but not using UNIQUE(election_id, elector_id) as per requirement)
            $table->unique(['election_id', 'elector_id', 'vote_sequence']);

            // Composite indexes for queries
            $table->index(['election_id', 'status', 'submitted_at']);
            $table->index(['elector_id', 'status']);
        });
        DB::statement("
            CREATE INDEX votes_completed_index
            ON votes (election_id, submitted_at)
            WHERE status = 'completed'
        ");

        DB::statement('
            CREATE INDEX votes_high_fraud_index
            ON votes (election_id, fraud_score)
            WHERE fraud_score > 0.7
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
