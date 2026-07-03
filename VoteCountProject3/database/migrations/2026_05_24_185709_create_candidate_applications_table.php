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
        Schema::create('candidate_applications', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('election_id')->unsigned();

            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email');
            $table->string('phone', 20);
            $table->enum('gender', ['male', 'female', 'other'])->nullable();

            $table->string('photo')->nullable();
            $table->text('manifesto')->nullable();
            $table->string('slogan', 200)->nullable();
            $table->text('bio')->nullable();

            $table->enum('application_status', ['pending', 'approved', 'rejected'])->default('pending');

            $table->bigInteger('approved_by')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->bigInteger('rejected_by')->nullable();
            $table->timestampTz('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('rejected_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index(['election_id', 'application_status']);
            $table->index(['email']);
            $table->index(['phone']);
            $table->index(['application_status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidate_applications');
    }
};
