<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\RestrictedWord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;


class AdministrationController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['has.permission:pulse_view_administration']);
        $this->middleware(['log.access']);
    }

    public function index(){
        return Inertia::render('Administration/Administration');
    }

    public function angelGiftConfigurations(){
        try {
            $angelGiftApiUrl = config('app.angel_gift_api_url', 'https://free-gifts.co.uk/api/template/list');
            $angelGiftApiToken = config('app.angel_gift_api_token');

            $apiResponse = Http::timeout(10)
                ->withToken($angelGiftApiToken)
                ->get($angelGiftApiUrl);
            
            if ($apiResponse->successful()) {
                $configurations = $apiResponse->json('data', []);
                
                // Validate and format the response to ensure it matches expected structure
                $configurations = collect($configurations)->sortBy('client_name')->values()->toArray();

                Log::debug($configurations);
            } else {
                Log::warning('Failed to fetch configurations from API', [
                    'status' => $apiResponse->status(),
                    'response' => $apiResponse->body()
                ]);

                // Fallback to empty array or default configurations
                $configurations = [];
            }
        } catch (\Exception $e) {
            Log::error('Error calling configurations API', [
                'error' => $e->getMessage(),
                'url' => $angelGiftApiUrl ?? 'not configured'
            ]);
            
            // Fallback to empty array
            $configurations = [];
        }

        return response()->json(['configurations' => $configurations]);
    }

    /**
     * Get all restricted words
     */
    public function restrictedWords()
    {
        try {
            $restrictedWords = RestrictedWord::orderBy('word', 'asc')->get();
            return response()->json(['restrictedWords' => $restrictedWords]);
        } catch (\Exception $e) {
            Log::error('Error fetching restricted words', ['error' => $e->getMessage()]);
            return response()->json(['restrictedWords' => [], 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a new restricted word
     */
    public function storeRestrictedWord(Request $request)
    {
        $validated = $request->validate([
            'word' => 'required|string|max:255',
            'category' => 'required|string|in:profanity,slur,offensive,inappropriate,sensitive,spam,custom',
            'level' => 'required|integer|min:1|max:3',
            'substitution' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        try {
            // Check for duplicate word
            $existing = RestrictedWord::where('word', strtolower($validated['word']))->first();
            if ($existing) {
                return response()->json(['message' => 'This word already exists in the restricted words list.'], 422);
            }

            $restrictedWord = RestrictedWord::create([
                'word' => strtolower($validated['word']),
                'category' => $validated['category'],
                'level' => $validated['level'],
                'substitution' => $validated['substitution'],
                'is_active' => $validated['is_active'],
            ]);

            return response()->json(['restrictedWord' => $restrictedWord, 'message' => 'Restricted word created successfully.'], 201);
        } catch (\Exception $e) {
            Log::error('Error creating restricted word', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create restricted word.'], 500);
        }
    }

    /**
     * Update a restricted word
     */
    public function updateRestrictedWord(Request $request, $id)
    {
        $validated = $request->validate([
            'word' => 'required|string|max:255',
            'category' => 'required|string|in:profanity,slur,offensive,inappropriate,sensitive,spam,custom',
            'level' => 'required|integer|min:1|max:3',
            'substitution' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        try {
            $restrictedWord = RestrictedWord::findOrFail($id);

            // Check for duplicate word (excluding current record)
            $existing = RestrictedWord::where('word', strtolower($validated['word']))
                ->where('id', '!=', $id)
                ->first();
            if ($existing) {
                return response()->json(['message' => 'This word already exists in the restricted words list.'], 422);
            }

            $restrictedWord->update([
                'word' => strtolower($validated['word']),
                'category' => $validated['category'],
                'level' => $validated['level'],
                'substitution' => $validated['substitution'] ?? null,
                'is_active' => $validated['is_active'],
            ]);

            return response()->json(['restrictedWord' => $restrictedWord, 'message' => 'Restricted word updated successfully.']);
        } catch (\Exception $e) {
            Log::error('Error updating restricted word', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['message' => 'Failed to update restricted word.'], 500);
        }
    }

    /**
     * Delete a restricted word
     */
    public function destroyRestrictedWord($id)
    {
        try {
            $restrictedWord = RestrictedWord::findOrFail($id);
            $restrictedWord->delete();

            return response()->json(['message' => 'Restricted word deleted successfully.']);
        } catch (\Exception $e) {
            Log::error('Error deleting restricted word', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['message' => 'Failed to delete restricted word.'], 500);
        }
    }
}
