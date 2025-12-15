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
    }

    public function index(Request $request)
    {
        return Inertia::render('Chat');
    }

    public function popout(Request $request)
    {
        return Inertia::render('ChatPopout');
    }
}
