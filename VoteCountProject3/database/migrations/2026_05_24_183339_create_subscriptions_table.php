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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('organization_id')->unsigned();
            $table->bigInteger('subscription_plan_id')->unsigned();

            $table->timestampTz('start_at');
            $table->timestampTz('end_at');

            $table->boolean('auto_renew')->default(false);

            $table->enum('status', ['active', 'expired', 'cancelled', 'pending'])->default('active');

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('subscription_plan_id')->references('id')->on('subscription_plans')->onDelete('restrict');

            // Indexes
            $table->index(['organization_id', 'status']);
            $table->index(['start_at', 'end_at']);
            $table->index(['status', 'end_at']);
        });
        // Partial index for active subscriptions
        DB::statement("
            CREATE INDEX subscriptions_active_index
            ON subscriptions (organization_id, end_at)
            WHERE status = 'active'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
