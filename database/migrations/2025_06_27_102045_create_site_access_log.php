<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() : void
    {
        Schema::connection('wings_config')->create('site_access_log', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type'); // sign_in, sign_out
            $table->string('category'); // employee, visitor, contractor
            $table->timestamp('datetime');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('visitor_name')->nullable();
            $table->string('visitor_company')->nullable();
            $table->string('visitor_visiting')->nullable();
            $table->string('visitor_car_registration')->nullable();
            $table->string('qr_token')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('wings_config')->dropIfExists('site_access_log');
    }
};