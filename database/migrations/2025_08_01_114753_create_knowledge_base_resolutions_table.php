<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateKnowledgeBaseResolutionsTable extends Migration
{
    public function up()
    {
        Schema::connection('pulse')->create('knowledge_base_resolutions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title');
            $table->text('body'); // The resolution content
            $table->string('image')->nullable(); // Path or URL to image
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::connection('pulse')->dropIfExists('knowledge_base_resolutions');
    }
}