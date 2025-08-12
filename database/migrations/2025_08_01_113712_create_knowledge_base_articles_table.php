<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateKnowledgeBaseArticlesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::connection('pulse')->create('knowledge_base_articles', function (Blueprint $table) {
            $table->bigIncrements('id'); // article id
            $table->string('title');
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->json('tags')->nullable(); // store tags as JSON array
            $table->longText('body'); // main article content
            $table->string('article_image')->nullable(); // path or URL to image
            $table->string('extra')->nullable(); // for any extra info
            $table->unsignedBigInteger('author_id')->nullable(); // optional: link to users table
            $table->timestamp('published_at')->nullable();
            $table->timestamps(); // created_at, updated_at

            // Optional: index for searching/filtering
            $table->index('category');
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::connection('pulse')->dropIfExists('knowledge_base_articles');
    }
}
