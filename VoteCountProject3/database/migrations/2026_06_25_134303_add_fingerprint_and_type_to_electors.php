<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('electors', function (Blueprint $table) {
            $table->string('fingerprint')->nullable();
            $table->string('type')->default('registered');
        });
    }

    public function down(): void
    {
        Schema::table('electors', function (Blueprint $table) {
            $table->dropColumn(['fingerprint','type']);
        });
    }
};

