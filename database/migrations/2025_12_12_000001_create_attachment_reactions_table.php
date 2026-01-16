<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::connection('pulse')->create('attachment_reactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attachment_id');
            $table->unsignedBigInteger('user_id');
            $table->string('emoji', 32);
            $table->string('name', 100)->nullable();
            $table->timestamps();

            $table->foreign('attachment_id')->references('id')->on('message_attachments')->onDelete('cascade');
            // Don't add foreign key for user_id since users table is on different connection
            $table->unique(['attachment_id', 'user_id', 'emoji']);
        });
    }
    
    public function down()
    {
        Schema::connection('pulse')->dropIfExists('attachment_reactions');
    }
};
