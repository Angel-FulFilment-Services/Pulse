<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Fix message_reactions emoji column collation to use binary comparison
        DB::connection('pulse')->statement('ALTER TABLE message_reactions MODIFY emoji VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
        
        // Fix attachment_reactions emoji column collation to use binary comparison
        DB::connection('pulse')->statement('ALTER TABLE attachment_reactions MODIFY emoji VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    }

    public function down()
    {
        // Revert to default utf8mb4_unicode_ci collation
        DB::connection('pulse')->statement('ALTER TABLE message_reactions MODIFY emoji VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
        DB::connection('pulse')->statement('ALTER TABLE attachment_reactions MODIFY emoji VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    }
};
