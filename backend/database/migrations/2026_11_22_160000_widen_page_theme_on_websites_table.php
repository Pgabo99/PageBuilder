<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('websites', function (Blueprint $table) {
            // A `purple` érték nem fér a korábbi 5 karakterbe.
            $table->string('page_theme', 16)->nullable()->change();
        });
    }

    public function down(): void
    {
        // A szűkítés előtt a 6+ karakteres téma alaphelyzetre áll, különben a szűkítés hibára futna.
        DB::table('websites')->whereRaw('CHAR_LENGTH(page_theme) > 5')->update(['page_theme' => null]);

        Schema::table('websites', function (Blueprint $table) {
            $table->string('page_theme', 5)->nullable()->change();
        });
    }
};
