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
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('vote_id')->unsigned()->nullable();
            $table->bigInteger('election_id')->unsigned();
            $table->bigInteger('elector_id')->unsigned()->nullable();

            $table->string('provider', 50);
            $table->string('provider_reference', 200);
            $table->string('transaction_reference', 100)->unique();

            $table->string('phone_number', 20)->nullable();

            $table->string('currency', 3);
            $table->decimal('amount', 15, 2);
            $table->decimal('fees', 15, 2)->default(0);
            $table->decimal('net_amount', 15, 2);

            $table->string('payment_method', 50);

            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'])->default('pending');

            $table->timestampTz('paid_at')->nullable();
            $table->text('failed_reason')->nullable();

            $table->jsonb('provider_response')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('vote_id')->references('id')->on('votes')->onDelete('set null');
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');
            $table->foreign('elector_id')->references('id')->on('electors')->onDelete('cascade');

            // Indexes
            $table->index(['vote_id']);
            $table->index(['election_id']);
            $table->index(['elector_id']);
            $table->index(['provider_reference']);
            $table->index(['transaction_reference']);
            $table->index(['status']);
            $table->index(['paid_at']);
            $table->index(['provider', 'status']);

            // Composite indexes
            $table->index(['election_id', 'status']);
            $table->index(['elector_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
