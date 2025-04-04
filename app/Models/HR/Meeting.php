<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $table = 'meetings';

    protected $connection = 'hr';

    protected $fillable = [
        'user_id',
        'created_by_user_id',
        'hr_id',
        'shift_id',
        'title',
        'description',
        'meeting_datetime',
        'meeting_reschedule_requested',
        'meeting_rescheduled',
        'meeting_rescheduled_datetime',
        'location',
        'online_meeting_link',
        'attended',
        'attended_datetime',
        'in_progress',
        'completed',
        'cancelled',
        'importance',
        'meeting_participant_1',
        'meeting_participant_2',
        'meeting_participant_3',
    ];

    protected $casts = [
        'created_at' => 'date',
        'updated_at' => 'date',
    ];
}
