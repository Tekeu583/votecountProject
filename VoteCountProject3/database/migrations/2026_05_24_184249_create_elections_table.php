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
        Schema::create('elections', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('organization_id')->unsigned();
            $table->bigInteger('created_by')->unsigned();

            $table->string('title', 200);
            $table->string('slug', 200);
            $table->string('short_description', 500)->nullable();
            $table->text('description')->nullable();

            $table->string('banner')->nullable();
            $table->string('thumbnail')->nullable();

            // Election configuration
            $table->enum('election_mode', ['public', 'private', 'restricted'])->default('public');
            $table->enum('vote_type', ['single', 'multiple', 'ranked', 'score', 'weighted'])->default('single');
            $table->enum('visibility_type', ['public', 'private', 'unlisted'])->default('public');
            $table->enum('payment_type', ['free', 'paid', 'subscription'])->default('free');
            $table->enum('verification_mode', ['none', 'email', 'sms', 'both'])->default('none');

            $table->string('result_calculation_method', 50)->default('simple_majority');

            $table->enum('status', ['draft', 'pending', 'published', 'ongoing', 'paused', 'closed', 'cancelled', 'archived'])->default('draft');

            $table->string('timezone', 50)->default('UTC');

            $table->timestampTz('start_at')->nullable();
            $table->timestampTz('end_at')->nullable();

            // Voting limits
            $table->integer('max_votes_per_user')->default(1);
            $table->integer('max_choices')->nullable();

            $table->boolean('ranking_enabled')->default(false);
            $table->boolean('otp_required')->default(false);

            $table->boolean('public_results')->default(true);
            $table->boolean('real_time_results')->default(false);

            $table->boolean('allow_guest_vote')->default(false);
            $table->boolean('fraud_detection_enabled')->default(true);

            // Payment
            $table->string('currency', 3)->default('XAF');
            $table->decimal('vote_price', 10, 2)->default(0);

            // Weights
            $table->float('public_weight')->default(1.0);
            $table->float('jury_weight')->default(0);

            // Statistics
            $table->bigInteger('total_votes')->default(0);
            $table->decimal('total_revenue', 15, 2)->default(0);

            // Publication
            $table->timestampTz('published_at')->nullable();
            $table->timestampTz('closed_at')->nullable();

            // Voter code
            $table->string('voter_code', 50)->nullable();
            $table->unique(['organization_id', 'voter_code']);

            // Soft deletes
            $table->softDeletesTz();
            $table->bigInteger('deleted_by')->nullable();
            $table->timestampTz('scheduled_permanent_delete_at')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');

            // Indexes
            $table->unique(['organization_id', 'slug']);
            $table->index(['organization_id', 'status']);
            $table->index(['status', 'start_at']);
            $table->index(['status', 'end_at']);
            $table->index(['vote_type']);
            $table->index(['payment_type']);
            $table->index(['published_at']);
            $table->index(['deleted_at']);

            // Composite indexes for queries
            $table->index(['organization_id', 'status', 'start_at']);
            $table->index(['status', 'end_at', 'start_at']);

        });
        DB::statement("
            CREATE INDEX elections_ongoing_index
            ON elections (organization_id, start_at)
            WHERE status = 'ongoing'
        ");

        DB::statement("
            CREATE INDEX elections_published_index
            ON elections (organization_id, end_at)
            WHERE status = 'published'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('elections');
    }
};
