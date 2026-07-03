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
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('owner_user_id')->unsigned();
            $table->bigInteger('subscription_plan_id')->unsigned()->nullable();

            $table->string('name', 200);
            $table->string('slug', 200)->unique();
            $table->string('logo')->nullable();
            $table->string('banner')->nullable();
            $table->text('description')->nullable();

            $table->string('email', 200);
            $table->string('phone', 20)->nullable();
            $table->string('website')->nullable();

            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('address')->nullable();

            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->timestampTz('verified_at')->nullable();

            $table->bigInteger('created_by')->nullable();

            // Soft deletes
            $table->softDeletesTz();
            $table->bigInteger('deleted_by')->nullable();
            $table->timestampTz('scheduled_permanent_delete_at')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('owner_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('subscription_plan_id')->references('id')->on('subscription_plans')->onDelete('set null');

            // Indexes
            $table->index(['slug']);
            $table->index(['owner_user_id']);
            $table->index(['status', 'created_at']);
            $table->index(['country']);
            $table->index(['deleted_at']);
            $table->index(['verified_at']);

            // Composite indexes
            $table->index(['status', 'subscription_plan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
