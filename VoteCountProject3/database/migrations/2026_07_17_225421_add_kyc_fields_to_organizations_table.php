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
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('kyc_status', 20)->default('not_submitted')->after('verified_at');
            $table->string('kyc_identity_document_type', 30)->nullable()->after('kyc_status');
            $table->string('kyc_identity_document_path')->nullable()->after('kyc_identity_document_type');
            $table->string('kyc_business_document_path')->nullable()->after('kyc_identity_document_path');
            $table->string('kyc_legal_representative_name', 200)->nullable()->after('kyc_business_document_path');
            $table->timestampTz('kyc_submitted_at')->nullable()->after('kyc_legal_representative_name');
            $table->timestampTz('kyc_reviewed_at')->nullable()->after('kyc_submitted_at');
            $table->bigInteger('kyc_reviewed_by')->unsigned()->nullable()->after('kyc_reviewed_at');
            $table->text('kyc_rejection_reason')->nullable()->after('kyc_reviewed_by');

            $table->foreign('kyc_reviewed_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['kyc_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropForeign(['kyc_reviewed_by']);
            $table->dropIndex(['kyc_status']);
            $table->dropColumn([
                'kyc_status',
                'kyc_identity_document_type',
                'kyc_identity_document_path',
                'kyc_business_document_path',
                'kyc_legal_representative_name',
                'kyc_submitted_at',
                'kyc_reviewed_at',
                'kyc_reviewed_by',
                'kyc_rejection_reason',
            ]);
        });
    }
};
