<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddAttendanceReportIndexes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Events table indexes for absence tracking
        DB::statement('CREATE INDEX IF NOT EXISTS idx_events_hr_category_date ON apex_data.events (hr_id, category, date)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_events_absence_lookup ON apex_data.events (hr_id, date, category, on_time, off_time)');
        
        // Shifts table indexes for schedule lookup
        DB::statement('CREATE INDEX IF NOT EXISTS idx_shifts_hr_date ON halo_rota.shifts2 (hr_id, shiftdate)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_shifts_date_range ON halo_rota.shifts2 (shiftdate, hr_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_shifts_performance ON halo_rota.shifts2 (hr_id, shiftdate, shiftstart, shiftend)');
        
        // Timesheet table indexes for worked time calculation
        DB::statement('CREATE INDEX IF NOT EXISTS idx_timesheet_master_hr_date ON apex_data.timesheet_master (hr_id, date)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_timesheet_master_performance ON apex_data.timesheet_master (hr_id, date, on_time, off_time)');
        
        DB::statement('CREATE INDEX IF NOT EXISTS idx_timesheet_today_hr_date ON apex_data.timesheet_today (hr_id, date)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_timesheet_today_performance ON apex_data.timesheet_today (hr_id, date, on_time, off_time)');
        
        // Breaksheet table index
        DB::statement('CREATE INDEX IF NOT EXISTS idx_breaksheet_master_hr_date ON apex_data.breaksheet_master (hr_id, date)');
        
        // HR details index for user lookup
        DB::statement('CREATE INDEX IF NOT EXISTS idx_hr_details_hr_id ON wings_data.hr_details (hr_id)');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Drop the indexes
        DB::statement('DROP INDEX IF EXISTS idx_events_hr_category_date ON apex_data.events');
        DB::statement('DROP INDEX IF EXISTS idx_events_absence_lookup ON apex_data.events');
        
        DB::statement('DROP INDEX IF EXISTS idx_shifts_hr_date ON halo_rota.shifts2');
        DB::statement('DROP INDEX IF EXISTS idx_shifts_date_range ON halo_rota.shifts2');
        DB::statement('DROP INDEX IF EXISTS idx_shifts_performance ON halo_rota.shifts2');
        
        DB::statement('DROP INDEX IF EXISTS idx_timesheet_master_hr_date ON apex_data.timesheet_master');
        DB::statement('DROP INDEX IF EXISTS idx_timesheet_master_performance ON apex_data.timesheet_master');
        
        DB::statement('DROP INDEX IF EXISTS idx_timesheet_today_hr_date ON apex_data.timesheet_today');
        DB::statement('DROP INDEX IF EXISTS idx_timesheet_today_performance ON apex_data.timesheet_today');
        
        DB::statement('DROP INDEX IF EXISTS idx_breaksheet_master_hr_date ON apex_data.breaksheet_master');
        
        DB::statement('DROP INDEX IF EXISTS idx_hr_details_hr_id ON wings_data.hr_details');
    }
}