<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('websites', function (Blueprint $table) {
            // queued, running, succeeded, failed (App\Enums\PublishStatus)
            $table->string('publish_status', 16)->nullable()->after('slug');
            $table->timestamp('published_at')->nullable()->after('publish_status');
            // Az a webcím, amelyen a legutóbbi sikeres publikálás él (a slug közben változhat).
            $table->string('published_slug', 63)->nullable()->after('published_at');
            $table->string('publish_error')->nullable()->after('published_slug');
        });
    }

    public function down(): void
    {
        Schema::table('websites', function (Blueprint $table) {
            $table->dropColumn(['publish_status', 'published_at', 'published_slug', 'publish_error']);
        });
    }
};
