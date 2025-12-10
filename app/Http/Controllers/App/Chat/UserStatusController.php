<?php

namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\UserStatus;

class UserStatusController extends Controller
{
    // Get status for a user or all users
    public function index(Request $request)
    {
        if ($request->has('user_id')) {
            $status = UserStatus::where('user_id', $request->input('user_id'))->first();
            return response()->json($status);
        }
        $statuses = UserStatus::all();
        return response()->json($statuses);
    }

    // Update the current user's status
    public function update(Request $request)
    {
        $data = $request->validate([
            'status' => 'required|in:online,offline,away,dnd',
        ]);
        $status = UserStatus::updateOrCreate(
            ['user_id' => $request->user()->id],
            ['status' => $data['status'], 'last_active_at' => now()]
        );
        return response()->json($status);
    }
}
