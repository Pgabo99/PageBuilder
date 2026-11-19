<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug', 63);
            // A legkisebb position értékű oldal a webhely kezdőlapja.
            $table->unsignedInteger('position');
            // A komponensek sorrendben, JSON-ként (MVP; a relációs modell a backlogban).
            $table->json('content');
            $table->timestamps();

            $table->unique(['website_id', 'slug']);
            $table->index(['website_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
