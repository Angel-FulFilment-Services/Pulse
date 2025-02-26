<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateHrDetailsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('hr_details', function (Blueprint $table) {
            $table->id();
            $table->integer('user_id')->unsigned();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->integer('hr_id')->unsigned()->nullable();

            $table->string('job_title', 50)->nullable();

            // Employee Name

            $table->text('title')->nullable();
            $table->text('firstname')->nullable();
            $table->text('surname')->nullable();

            // Employee Address

            $table->text('home_address1')->nullable();
            $table->text('home_address2')->nullable();
            $table->text('home_address3')->nullable();
            $table->text('home_town')->nullable();
            $table->text('home_county')->nullable();
            $table->text('home_postcode')->nullable();

            // Employee Contact Information

            $table->text('contact_home_phone')->nullable();
            $table->text('contact_mobile_phone')->nullable();
            $table->text('contact_email')->nullable();

            $table->text('registration')->nullable();
            $table->text('marital_status')->nullable();
            $table->text('gender')->nullable();
            $table->text('dob')->nullable();    
            $table->text('criminal_conviction')->nullable();
            $table->text('conviction_desc')->nullable();

            // Next of Kin Information

            $table->text('kin1_fullname')->nullable();
            $table->text('kin1_relation')->nullable();
            $table->text('kin1_full_address')->nullable();
            $table->text('kin1_home_phone')->nullable();
            $table->text('kin1_mobile_phone')->nullable();

            $table->text('kin2_fullname')->nullable();
            $table->text('kin2_relation')->nullable();
            $table->text('kin2_full_address')->nullable();
            $table->text('kin2_home_phone')->nullable();
            $table->text('kin2_mobile_phone')->nullable();
            
            // Banking Information

            $table->text('sortcode')->nullable();
            $table->text('acc_num')->nullable();
            $table->text('acc_name')->nullable();
            $table->text('acc_type')->nullable();
            $table->text('bank_name')->nullable();
            $table->text('bank_branch')->nullable();

            // Tax Information

            $table->text('national_insurance')->nullable();
            $table->text('ni_number')->nullable();
            $table->text('ni_category')->nullable();
            $table->text('tax_code')->nullable();
            $table->text('tax_info')->nullable();
            $table->text('week_1_month_1')->nullable();
            $table->text('only_job')->nullable();
            $table->text("student_loan_questions")->nullable();

            // Disability Information

            $table->text('disablity')->nullable();
            $table->text('disablity_desc')->nullable();

            // Status
            $table->string('status', 20)->nullable();
            $table->string('hold', 1)->nullable();
            $table->string('complete', 1)->nullable();
            $table->string('exported', 1)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('hr_details');
    }
}
