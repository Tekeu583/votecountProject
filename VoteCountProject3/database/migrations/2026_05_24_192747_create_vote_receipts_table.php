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
        Schema::create('vote_receipts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('vote_id')->unsigned()->unique();

            $table->string('receipt_code', 100)->unique();
            $table->text('qr_code')->nullable();

            $table->timestampTz('issued_at')->nullable();

            $table->timestampsTz();

            // Foreign key
            $table->foreign('vote_id')->references('id')->on('votes')->onDelete('cascade');

            // Indexes
            $table->index(['receipt_code']);
            $table->index(['issued_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vote_receipts');
    }
};
