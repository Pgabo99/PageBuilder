<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('websites', function (Blueprint $table) {
            // Üres érték = a publikált oldal alapértelmezett megjelenése.
            $table->string('accent_color', 7)->nullable()->after('slug');
            $table->string('page_theme', 5)->nullable()->after('accent_color');
        });
    }

    public function down(): void
    {
        Schema::table('websites', function (Blueprint $table) {
            $table->dropColumn(['accent_color', 'page_theme']);
        });
    }
};
