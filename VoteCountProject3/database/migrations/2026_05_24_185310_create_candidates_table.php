<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('election_id')->unsigned();
            $table->bigInteger('category_id')->unsigned()->nullable();
            $table->bigInteger('user_id')->unsigned()->nullable();

            $table->string('full_name', 200);
            $table->string('slug', 200);
            $table->string('photo')->nullable();
            $table->string('cover_photo')->nullable();

            $table->text('bio')->nullable();
            $table->text('manifesto')->nullable();
            $table->string('slogan', 200)->nullable();

            $table->integer('position')->nullable();
            $table->integer('candidate_number')->nullable();

            // Statistics
            $table->bigInteger('vote_count')->default(0);
            $table->decimal('score_total', 10, 2)->default(0);
            $table->decimal('ranking_score', 10, 2)->default(0);
            $table->decimal('final_score', 10, 2)->default(0);

            $table->enum('status', ['pending', 'approved', 'rejected', 'withdrawn'])->default('pending');

            // Approval tracking
            $table->bigInteger('approved_by')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->bigInteger('rejected_by')->nullable();
            $table->timestampTz('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();

            // Soft deletes
            $table->softDeletesTz();
            $table->bigInteger('deleted_by')->nullable();
            $table->timestampTz('scheduled_permanent_delete_at')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('rejected_by')->references('id')->on('users')->onDelete('set null');

            // Unique constraints
            $table->unique(['election_id', 'slug']);
            $table->unique(['election_id', 'candidate_number']);

            // Indexes
            $table->index(['election_id', 'status']);
            $table->index(['election_id', 'vote_count']);
            $table->index(['category_id']);
            $table->index(['user_id']);
            $table->index(['status', 'approved_at']);
            $table->index(['deleted_at']);

            // Composite indexes
            $table->index(['election_id', 'status', 'position']);
            $table->index(['election_id', 'status', 'vote_count']);

            // Partial index for approved candidates
            $table->index(['election_id', 'final_score'])
                ->where('status', 'approved');
        });
        DB::statement("
            CREATE INDEX candidates_approved_index
            ON candidates (election_id, final_score)
            WHERE status = 'approved'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
