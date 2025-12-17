<?php

namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChatController extends Controller
{
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['log.access']);
        $this->middleware(['permission:pulse_view_chat']);
    }

    public function index(Request $request)
    {
        return Inertia::render('Chat/Chat');
    }

    public function popout(Request $request)
    {
        return Inertia::render('Chat/ChatPopout');
    }
}
