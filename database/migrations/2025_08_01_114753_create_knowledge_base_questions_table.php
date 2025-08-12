<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateKnowledgeBaseQuestionsTable extends Migration
{
    public function up()
    {
        Schema::connection('pulse')->create('knowledge_base_questions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('article_id')->nullable(); // FK to articles
            $table->string('question');
            $table->json('answers'); // [{ "label": "...", "next_question_id": 2, "resolution_id": 1 }, ...]
            $table->string('image')->nullable(); // Path or URL to image
            $table->unsignedBigInteger('parent_question_id')->nullable(); // For tree structure (optional)
            $table->integer('order')->default(0); // For ordering questions
            $table->timestamps();

            $table->foreign('article_id')->references('id')->on('knowledge_base_articles')->onDelete('cascade');
            $table->foreign('parent_question_id')->references('id')->on('knowledge_base_questions')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::connection('pulse')->dropIfExists('knowledge_base_questions');
    }
}