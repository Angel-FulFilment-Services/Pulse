<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::connection('pulse')->create('message_reactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('message_id');
            $table->unsignedBigInteger('user_id');
            $table->string('emoji', 32);
            $table->timestamps();

            $table->foreign('message_id')->references('id')->on('messages')->onDelete('cascade');
            // If users table is NOT on pulse connection, use ->on(config('auth.providers.users.table', 'users')) and remove connection
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['message_id', 'user_id', 'emoji']);
        });
    }
    public function down()
    {
        Schema::dropIfExists('message_reactions');
    }
};
