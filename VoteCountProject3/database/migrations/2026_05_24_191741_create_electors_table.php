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
        Schema::create('electors', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('election_id')->unsigned();
            $table->bigInteger('user_id')->unsigned()->nullable();

            $table->string('full_name', 200);
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();

            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();

            $table->string('voter_code', 50)->nullable();
            $table->unique(['election_id', 'voter_code']);
            $table->boolean('has_voted')->default(false);
            $table->timestampTz('verified_at')->nullable();
            $table->enum('verification_status', ['pending', 'verified', 'failed'])->default('pending');

            // Import tracking
            $table->bigInteger('imported_by')->nullable();
            $table->string('import_batch_id', 100)->nullable();

            $table->enum('status', ['active', 'inactive', 'blocked'])->default('active');

            // Soft deletes
            $table->softDeletesTz();
            $table->bigInteger('deleted_by')->nullable();
            $table->timestampTz('scheduled_permanent_delete_at')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index(['election_id']);
            $table->index(['user_id']);
            $table->index(['voter_code']);
            $table->index(['email']);
            $table->index(['phone']);
            $table->index(['election_id', 'has_voted']);
            $table->index(['election_id', 'verification_status']);
            $table->index(['election_id', 'status']);
            $table->index(['deleted_at']);

            // Composite indexes
            $table->index(['election_id', 'has_voted', 'created_at']);
            $table->index(['election_id', 'verification_status', 'verified_at']);
        });
        // Partial indexes
        DB::statement("
            CREATE INDEX electors_active_index
            ON electors (election_id, voter_code)
            WHERE status = 'active'
            AND deleted_at IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('electors');
    }
};
