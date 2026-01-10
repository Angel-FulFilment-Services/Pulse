<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Notifications\GenericEmailNotification;
use Notification;
use Schema;
use DB;
use Log;

class NotifyOneMonthOfEmploymentCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'command:NotifyOneMonthOfEmploymentCommand';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Notifies one month of employment to senior CC team Command';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $startDate = date('Y-m-d', strtotime('today'));
        $endDate = date('Y-m-d', strtotime("today"));

        $employees = $this->checkForEmployees($startDate, $endDate);


        if($employees->count() > 0){
            foreach($employees as $employee){
                // Send notification to senior CC team
                $seniorCCEmails = ['tms@angelfs.co.uk'];

                foreach($seniorCCEmails as $email){
                    // Send email
                    Notification::route('mail', $email)->notify(new GenericEmailNotification(
                        null,
                        'Pulse - One Month Employment Anniversary',
                        'The following employee is 5 days away from reaching their one month employment anniversary:',
                        null,
                        null,
                        null,
                        null,
                        'Employee Name: ' . $employee->name . ' | Start Date: ' . $employee->start_date
                    ));
                }
            }
        }

        return 1;
    }

    public function checkForEmployees($startDate, $endDate){
        // Check if someone is 5 days away from their one month employment anniversary
        $oneMonthEmployees = DB::table('wings_data.hr_details')
        ->select(
            'hr_details.hr_id',
            'hr_details.user_id',
            'hr_details.start_date',
            'users.name',
            'users.email'
        )
        ->leftJoin('users', 'hr_details.user_id', '=', 'users.id')
        ->where('hr_details.start_date', date('Y-m-d', strtotime('-25 days')))
        ->where('hr_details.leave_date', null)
        ->get();

        return $oneMonthEmployees;
    }    
}
