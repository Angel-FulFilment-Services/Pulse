<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('access_logs', function (Blueprint $table) {
            $table->id();
            $table->string('method', 10);
            $table->string('url', 2048);
            $table->string('route_name')->nullable();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->string('x_forwarded_for', 255)->nullable();
            $table->string('user_agent', 1024)->nullable();
            $table->string('referrer', 2048)->nullable();
            $table->integer('status_code')->nullable();
            $table->json('request_params')->nullable();
            $table->string('session_id', 255)->nullable();
            $table->string('user_roles', 255)->nullable();
            $table->integer('duration_ms')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_logs');
    }
};
