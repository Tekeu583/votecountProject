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
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('organization_id')->unsigned();
            $table->bigInteger('requested_by')->unsigned();

            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('XAF');

            $table->string('phone_number', 20);
            $table->string('payout_provider', 30)->nullable();

            $table->string('status', 20)->default('pending');

            $table->bigInteger('reviewed_by')->unsigned()->nullable();
            $table->timestampTz('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->string('payment_reference', 200)->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->text('admin_notes')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('requested_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();

            // Indexes
            $table->index(['organization_id', 'status']);
            $table->index(['status']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('withdrawal_requests');
    }
};
