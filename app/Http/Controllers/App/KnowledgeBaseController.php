<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class KnowledgeBaseController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['log.access']);
    }

    public function index(){
        return Inertia::render('KnowledgeBase/KnowledgeBase');
    }

    public function articles(Request $request){
        $articles = DB::connection('pulse')
            ->table('knowledge_base_articles')
            ->select('id', 'title', 'category', 'description', 'tags', 'article_image', 'published_at')
            ->where('published_at', '<=', now())
            ->orderBy('title', 'asc')
            ->get();

        return response()->json([
            'articles' => $articles,
        ]);
    }

    public function article($id){
        $article = DB::connection('pulse')
            ->table('knowledge_base_articles')
            ->select('id', 'title', 'category', 'description', 'tags', 'body', 'article_image', 'published_at')
            ->where('id', $id)
            ->first();

        if (!$article) {
            abort(404);
        }

                $questions = DB::connection('pulse')
            ->table('knowledge_base_questions')
            ->where('article_id', $id)
            ->orderBy('order', 'asc')
            ->get();

        // Add full image URLs to questions
        $questions = $questions->map(function ($question) {
            if ($question->image) {
                $question->image_url = $this->getImageUrl($question->image);
            }
            return $question;
        });

        // Get all resolution IDs referenced by these questions
        $resolutionIds = [];
        foreach ($questions as $question) {
            if ($question->answers) {
                $answers = json_decode($question->answers, true);
                if (is_array($answers)) {
                    foreach ($answers as $answer) {
                        if (isset($answer['resolution_id']) && $answer['resolution_id']) {
                            $resolutionIds[] = $answer['resolution_id'];
                        }
                    }
                }
            }
        }

        // Load the referenced resolutions
        $resolutions = [];
        if (!empty($resolutionIds)) {
            $resolutions = DB::connection('pulse')
                ->table('knowledge_base_resolutions')
                ->whereIn('id', array_unique($resolutionIds))
                ->get();
            
            // Add full image URLs to resolutions
            $resolutions = $resolutions->map(function ($resolution) {
                if ($resolution->image) {
                    $resolution->image_url = $this->getImageUrl($resolution->image);
                }
                return $resolution;
            })->toArray(); // Convert to array for JSON serialization
        }

        return Inertia::render('KnowledgeBase/Post', [
            'article' => $article,
            'questions' => $questions->toArray(), // Convert to array for JSON serialization
            'resolutions' => $resolutions
        ]);
    }

    public function resolution($id){
        $resolution = DB::connection('pulse')
            ->table('knowledge_base_resolutions')
            ->where('id', $id)
            ->first();

        if (!$resolution) {
            return response()->json(['error' => 'Resolution not found'], 404);
        }

        return response()->json([
            'resolution' => $resolution
        ]);
    }

    public function saveGuide(Request $request, $articleId) {
        $questions = $request->input('questions', []);
        $resolutions = $request->input('resolutions', []);
        $deletedQuestions = $request->input('deletedQuestions', []);
        $deletedResolutions = $request->input('deletedResolutions', []);

        try {
            DB::connection('pulse')->beginTransaction();

            // Delete explicitly deleted questions first
            if (!empty($deletedQuestions)) {
                DB::connection('pulse')
                    ->table('knowledge_base_questions')
                    ->whereIn('id', $deletedQuestions)
                    ->delete();
            }

            // Delete explicitly deleted resolutions first
            if (!empty($deletedResolutions)) {
                DB::connection('pulse')
                    ->table('knowledge_base_resolutions')
                    ->whereIn('id', $deletedResolutions)
                    ->delete();
            }

            // Track ID mappings for temp IDs to real IDs
            $questionIdMap = [];
            $resolutionIdMap = [];

            // Save resolutions first (as questions may reference them)
            $resolutionsToUpdate = []; // Track resolutions that need second pass updates for next_question_id
            foreach ($resolutions as $resolutionData) {
                $originalResolutionData = $resolutionData; // Keep original for second pass
                
                // Remove image_url field as it's not a database column
                unset($resolutionData['image_url']);
                
                // Validate next_question_id references - handle temp IDs and validate existing IDs
                if (isset($resolutionData['next_question_id'])) {
                    if (strpos($resolutionData['next_question_id'], 'temp_') === 0) {
                        // Set to null for now, will be updated in later pass
                        $resolutionData['next_question_id'] = null;
                    } else {
                        // Validate that non-temp question exists
                        $questionExists = false;
                        
                        // Check if it's in the current questions being saved
                        foreach ($questions as $question) {
                            if ($question['id'] == $resolutionData['next_question_id']) {
                                $questionExists = true;
                                break;
                            }
                        }
                        
                        // If not found in current questions, check if it exists in database
                        if (!$questionExists) {
                            $questionExists = DB::connection('pulse')
                                ->table('knowledge_base_questions')
                                ->where('id', $resolutionData['next_question_id'])
                                ->exists();
                        }
                        
                        // If question doesn't exist, remove the reference
                        if (!$questionExists) {
                            $resolutionData['next_question_id'] = null;
                            $originalResolutionData['next_question_id'] = null; // Update original too
                        }
                    }
                }
                
                if (isset($resolutionData['id']) && strpos($resolutionData['id'], 'temp_') === 0) {
                    // New resolution
                    $tempId = $resolutionData['id'];
                    unset($resolutionData['id']); // Remove temp ID
                    $resolutionData['created_at'] = now();
                    $resolutionData['updated_at'] = now();
                    $realId = DB::connection('pulse')->table('knowledge_base_resolutions')->insertGetId($resolutionData);
                    $resolutionIdMap[$tempId] = $realId;
                    $resolutionsToUpdate[] = ['original' => $originalResolutionData, 'realId' => $realId];
                } else {
                    // Update existing resolution
                    $resolutionData['updated_at'] = now();
                    DB::connection('pulse')
                        ->table('knowledge_base_resolutions')
                        ->where('id', $resolutionData['id'])
                        ->update($resolutionData);
                    $resolutionsToUpdate[] = ['original' => $originalResolutionData, 'realId' => $resolutionData['id']];
                }
            }

            // Save questions and update their answer references
            $questionsToUpdate = []; // Track questions that need second pass updates
            foreach ($questions as $questionData) {
                $originalQuestionData = $questionData; // Keep original for second pass
                
                // Remove image_url field as it's not a database column
                unset($questionData['image_url']);
                
                // Update any temp ID references in answers
                if (isset($questionData['answers'])) {
                    $answers = json_decode($questionData['answers'], true);
                    if (is_array($answers)) {
                        foreach ($answers as &$answer) {
                            // Update resolution_id references
                            if (isset($answer['resolution_id']) && isset($resolutionIdMap[$answer['resolution_id']])) {
                                $answer['resolution_id'] = $resolutionIdMap[$answer['resolution_id']];
                            }
                            // Update next_question_id references (we'll handle this in a second pass)
                        }
                        $questionData['answers'] = json_encode($answers);
                    }
                }

                if (isset($questionData['id']) && strpos($questionData['id'], 'temp_') === 0) {
                    // New question
                    $tempId = $questionData['id'];
                    unset($questionData['id']); // Remove temp ID
                    $questionData['created_at'] = now();
                    $questionData['updated_at'] = now();
                    $realId = DB::connection('pulse')->table('knowledge_base_questions')->insertGetId($questionData);
                    $questionIdMap[$tempId] = $realId;
                    $questionsToUpdate[] = ['original' => $originalQuestionData, 'realId' => $realId];
                } else {
                    // Update existing question
                    $questionData['updated_at'] = now();
                    DB::connection('pulse')
                        ->table('knowledge_base_questions')
                        ->where('id', $questionData['id'])
                        ->update($questionData);
                    $questionsToUpdate[] = ['original' => $originalQuestionData, 'realId' => $questionData['id']];
                }
            }

            // Second pass: Update next_question_id and resolution_id references now that we have all IDs
            foreach ($questionsToUpdate as $questionUpdate) {
                $originalQuestionData = $questionUpdate['original'];
                $questionId = $questionUpdate['realId'];
                
                if (isset($originalQuestionData['answers'])) {
                    $answers = json_decode($originalQuestionData['answers'], true);
                    if (is_array($answers)) {
                        $needsUpdate = false;
                        
                        foreach ($answers as &$answer) {
                            // Update next_question_id references
                            if (isset($answer['next_question_id']) && isset($questionIdMap[$answer['next_question_id']])) {
                                $answer['next_question_id'] = $questionIdMap[$answer['next_question_id']];
                                $needsUpdate = true;
                            }
                            
                            // Update resolution_id references
                            if (isset($answer['resolution_id']) && isset($resolutionIdMap[$answer['resolution_id']])) {
                                $answer['resolution_id'] = $resolutionIdMap[$answer['resolution_id']];
                                $needsUpdate = true;
                            }
                        }
                        
                        if ($needsUpdate) {
                            DB::connection('pulse')
                                ->table('knowledge_base_questions')
                                ->where('id', $questionId)
                                ->update(['answers' => json_encode($answers), 'updated_at' => now()]);
                        }
                    }
                }
            }

            // Third pass: Update resolutions' next_question_id references
            foreach ($resolutionsToUpdate as $resolutionUpdate) {
                $originalResolutionData = $resolutionUpdate['original'];
                $resolutionId = $resolutionUpdate['realId'];
                
                if (isset($originalResolutionData['next_question_id'])) {
                    if (isset($questionIdMap[$originalResolutionData['next_question_id']])) {
                        // Map temp ID to real ID
                        $nextQuestionId = $questionIdMap[$originalResolutionData['next_question_id']];
                        DB::connection('pulse')
                            ->table('knowledge_base_resolutions')
                            ->where('id', $resolutionId)
                            ->update(['next_question_id' => $nextQuestionId, 'updated_at' => now()]);
                    } else {
                        // Check if it's already a real ID that exists in the questions table
                        $existingQuestion = DB::connection('pulse')
                            ->table('knowledge_base_questions')
                            ->where('id', $originalResolutionData['next_question_id'])
                            ->exists();
                        
                        if ($existingQuestion) {
                            // It's a valid real ID, keep it as is
                            DB::connection('pulse')
                                ->table('knowledge_base_resolutions')
                                ->where('id', $resolutionId)
                                ->update(['next_question_id' => $originalResolutionData['next_question_id'], 'updated_at' => now()]);
                        } else {
                            // Invalid reference - set to null to avoid constraint violation
                            DB::connection('pulse')
                                ->table('knowledge_base_resolutions')
                                ->where('id', $resolutionId)
                                ->update(['next_question_id' => null, 'updated_at' => now()]);
                        }
                    }
                }
            }
            
            DB::connection('pulse')->commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::connection('pulse')->rollback();
            return response()->json(['error' => 'Failed to save guide: ' . $e->getMessage()], 500);
        }
    }

    private function getImageUrl($filename) {
        if (!$filename) return null;
        
        try {
            // Check if file exists in R2 public bucket first
            if (Storage::disk('r2-public')->exists("articles/questions/{$filename}")) {
                return Storage::disk('r2-public')->url("articles/questions/{$filename}");
            }
        } catch (\Exception $e) {
            // Silently fall back to local storage if R2 fails
        }
        
        // Fall back to local storage URL for existing files
        return "/storage/articles/questions/{$filename}";
    }

    public function uploadImage(Request $request) {
        try {
            // Check if file exists in request
            if (!$request->hasFile('image')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No image file provided'
                ], 400);
            }

            // Validate the image
            $validator = \Validator::make($request->all(), [
                'image' => 'required|image|mimes:jpeg,jpg,png,gif|max:5120', // 5MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $image = $request->file('image');
            $extension = $image->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;
            
            // Try to store in R2 public bucket first, with fallback to local
            $path = null;
            $disk = 'r2-public';
            $url = null;
            
            try {
                $path = $image->storeAs('articles/questions', $filename, 'r2-public');
                
                if ($path === false) {
                    throw new \Exception('R2 storage returned false - likely configuration issue');
                }
                
                // Get the full URL from the R2 public bucket
                $url = Storage::disk('r2-public')->url($path);
                
            } catch (\Exception $r2Exception) {
                // Fallback to local public storage
                $disk = 'public';
                $path = $image->storeAs('articles/questions', $filename, 'public');
                
                if ($path === false) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Both R2 and local storage failed',
                        'details' => $r2Exception->getMessage()
                    ], 500);
                }
                
                // Get the full URL from local public storage
                $url = Storage::disk('public')->url($path);
            }
            
            return response()->json([
                'success' => true,
                'filename' => $filename,
                'path' => $path,
                'url' => $url,
                'disk' => $disk
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image: ' . $e->getMessage()
            ], 500);
        }
    }
}
