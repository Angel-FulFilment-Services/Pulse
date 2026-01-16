<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::connection('pulse')->create('chat_favorites', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('favorite_id'); // team_id or user_id
            $table->enum('type', ['team', 'user']);
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->unique(['user_id', 'favorite_id', 'type']);
        });
    }
    public function down()
    {
        Schema::connection('pulse')->dropIfExists('chat_favorites');
    }
};
