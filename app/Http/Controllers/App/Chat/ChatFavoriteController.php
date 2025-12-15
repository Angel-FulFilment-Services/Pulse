<?php
namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\ChatFavorite;

class ChatFavoriteController extends Controller
{
    // List current user's favorites
    public function index(Request $request)
    {
        $userId = auth()->user()->id;
        $favorites = ChatFavorite::where('user_id', $userId)->orderBy('order')->get();
        
        // Transform favorites to include the actual team/user data
        $transformedFavorites = $favorites->map(function($favorite) use ($userId) {
            $favoriteData = [
                'id' => $favorite->id,
                'favorite_id' => $favorite->favorite_id,
                'type' => $favorite->type,
                'order' => $favorite->order,
                'item' => null
            ];
            
            if ($favorite->type === 'team') {
                $team = \App\Models\Chat\Team::find($favorite->favorite_id);
                if ($team) {
                    // Check if user is still an active member of this team
                    $isActiveMember = $team->users()
                        ->where('user_id', $userId)
                        ->whereNull('left_at')
                        ->exists();
                    
                    if ($isActiveMember) {
                        $favoriteData['item'] = $team;
                    }
                }
            } else if ($favorite->type === 'user') {
                $user = \App\Models\User\User::find($favorite->favorite_id);
                if ($user) {
                    $favoriteData['item'] = $user;
                }
            }
            
            return $favoriteData;
        })->filter(function($favorite) {
            return $favorite['item'] !== null; // Only return favorites where the item still exists
        })->sortBy(function($favorite) {
            // Sort alphabetically by item name
            return strtolower($favorite['item']->name ?? '');
        })->values(); // Reset array keys after sorting
        
        return response()->json($transformedFavorites);
    }

    // Add a favorite (team or user)
    public function store(Request $request)
    {
        $data = $request->validate([
            'favorite_id' => 'required|integer',
            'type' => 'required|in:team,user',
        ]);
        
        $userId = auth()->user()->id;
        
        // Check if favorite already exists
        $existingFavorite = ChatFavorite::where([
            'user_id' => $userId,
            'favorite_id' => $data['favorite_id'],
            'type' => $data['type'],
        ])->first();
        
        if ($existingFavorite) {
            // If it exists, delete it (unfavorite)
            $existingFavorite->delete();
            return response()->json(['status' => 'removed'], 200);
        } else {
            // If it doesn't exist, create it (favorite)
            $favorite = ChatFavorite::create([
                'user_id' => $userId,
                'favorite_id' => $data['favorite_id'],
                'type' => $data['type'],
                'order' => 0, // You might want to calculate the next order
            ]);
            return response()->json(['status' => 'added', 'favorite' => $favorite], 201);
        }
    }

    // Remove a favorite
    public function destroy(Request $request, $id)
    {
        $userId = $request->user()->id;
        ChatFavorite::where('user_id', $userId)->where('id', $id)->delete();
        return response()->json(['status' => 'deleted']);
    }

    // Reorder favorites
    public function reorder(Request $request)
    {
        $data = $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer',
        ]);
        $userId = $request->user()->id;
        foreach ($data['order'] as $idx => $favId) {
            ChatFavorite::where('user_id', $userId)->where('id', $favId)->update(['order' => $idx]);
        }
        return response()->json(['status' => 'ok']);
    }
}
