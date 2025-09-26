<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use App\Helper\CallRecordings;
use App\Helper\Auditing;

class KnowledgeBaseController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth', 'twofactor'])->except(['publicArticle']);
        $this->middleware(['log.access'])->except(['publicArticle']);
        $this->middleware(['has.permission:pulse_edit_articles'])->only(['sendSMS', 'update']);
        $this->middleware(['has.permission:pulse_create_articles'])->only(['create']);
    }

    public function index(){
        return Inertia::render('KnowledgeBase/KnowledgeBase');
    }

    public function articles(Request $request){
        $articles = DB::connection('pulse')
            ->table('knowledge_base_articles')
            ->select('id', 'title', 'category', 'description', 'tags', 'article_image', 'published_at', 'visits', 'read_time')
            ->where('published_at', '<=', now())
            ->when($request->category, function ($query, $category) {
                $category = str_replace('-', ' ', $category);
                return $query->where('category', $category);
            })
            ->orderBy('visits', 'desc')
            ->get();

        return response()->json([
            'articles' => $articles,
        ]);
    }

    public function article($id){
        $article = DB::connection('pulse')
            ->table('knowledge_base_articles')
            ->select('id', 'title', 'category', 'description', 'tags', 'body', 'soundfiles', 'article_image', 'published_at', 'visits', 'read_time')
            ->where('id', $id)
            ->first();

        if (!$article) {
            abort(404);
        }

        // Process soundfiles to add temporary URLs
        if (!is_null($article->soundfiles)) {
            $soundfiles = json_decode($article->soundfiles, true);
            $article->soundfiles = array_map(function ($soundfile) {
                return [
                    'path' => Storage::disk('r2')->temporaryUrl($soundfile['path'], now()->addMinutes(60)),
                    'original_name' => $soundfile['original_name'],
                    'mime_type' => $soundfile['mime_type'] ?? 'audio/wav',
                    'size' => $soundfile['size'] ?? 0,
                ];
            }, $soundfiles);

            // Process article body to replace audio references with temporary URLs
            $body = $article->body;
            foreach ($soundfiles as $soundfile) {
                $temporaryUrl = Storage::disk('r2')->temporaryUrl($soundfile['path'], now()->addMinutes(60));
                $audioReference = "[AUDIO:{$soundfile['path']}]";
                $body = str_replace($audioReference, $temporaryUrl, $body);
            }
            $article->body = $body;
        }

        // Increment visit counter
        DB::connection('pulse')
            ->table('knowledge_base_articles')
            ->where('id', $id)
            ->increment('visits');

        // Update the article object with the new visit count
        $article->visits = $article->visits + 1;

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

        // Final prop should be an json serialized array not a string
        Auditing::log('Knowledge Base - ' . $article->category, auth()->user()->id, 'Article Viewed', $article->title . ' (ID: ' . $article->id . ')');

        return Inertia::render('KnowledgeBase/Post', [
            'article' => $article,
            'questions' => $questions->toArray(), // Convert to array for JSON serialization
            'resolutions' => $resolutions
        ]);
    }

    public function articleForEdit($id){
        $article = DB::connection('pulse')
            ->table('knowledge_base_articles')
            ->select('id', 'title', 'category', 'description', 'tags', 'body', 'soundfiles', 'article_image', 'published_at', 'visits', 'read_time')
            ->where('id', $id)
            ->first();

        if (!$article) {
            return response()->json(['error' => 'Article not found'], 404);
        }

        // Process soundfiles to add temporary URLs (same logic as article() method but without visit increment)
        if (!is_null($article->soundfiles)) {
            $soundfiles = json_decode($article->soundfiles, true);
            $article->soundfiles = array_map(function ($soundfile) {
                return [
                    'path' => Storage::disk('r2')->temporaryUrl($soundfile['path'], now()->addMinutes(60)),
                    'original_name' => $soundfile['original_name'],
                    'mime_type' => $soundfile['mime_type'] ?? 'audio/wav',
                    'size' => $soundfile['size'] ?? 0,
                ];
            }, $soundfiles);

            // Process article body to replace audio references with temporary URLs
            // Handle both formats: [AUDIO:{path}] and [audio:filename](url)
            $body = $article->body;
            foreach ($soundfiles as $soundfile) {
                $temporaryUrl = Storage::disk('r2')->temporaryUrl($soundfile['path'], now()->addMinutes(60));
                
                // Handle backend format: [AUDIO:{path}]
                $audioReference = "[AUDIO:{$soundfile['path']}]";
                $body = str_replace($audioReference, $temporaryUrl, $body);
                
                // Handle frontend format: [audio:filename](blob:url) -> [audio:filename](temporary_url)
                $frontendPattern = '/\[audio:' . preg_quote($soundfile['original_name'], '/') . '\]\([^)]+\)/';
                $replacement = '[audio:' . $soundfile['original_name'] . '](' . $temporaryUrl . ')';
                $body = preg_replace($frontendPattern, $replacement, $body);
            }
            $article->body = $body;
        }

        // Convert tags from JSON string to array
        $article->tags = json_decode($article->tags ?? '[]', true);

        return response()->json([
            'article' => $article
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
                
                // Handle image objects from frontend - convert to filename string
                if (isset($resolutionData['image']) && is_array($resolutionData['image'])) {
                    if (isset($resolutionData['image']['filename'])) {
                        $resolutionData['image'] = $resolutionData['image']['filename'];
                    } else {
                        $resolutionData['image'] = null;
                    }
                }
                
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

                // Validate next_resolution_id references - handle temp IDs and validate existing IDs
                if (isset($resolutionData['next_resolution_id'])) {
                    if (strpos($resolutionData['next_resolution_id'], 'temp_') === 0) {
                        // Set to null for now, will be updated in later pass
                        $resolutionData['next_resolution_id'] = null;
                    } else {
                        // Validate that non-temp resolution exists
                        $resolutionExists = false;
                        
                        // Check if it's in the current resolutions being saved
                        foreach ($resolutions as $resolution) {
                            if ($resolution['id'] == $resolutionData['next_resolution_id'] && $resolution['id'] != $resolutionData['id']) {
                                $resolutionExists = true;
                                break;
                            }
                        }
                        
                        // If not found in current resolutions, check if it exists in database
                        if (!$resolutionExists) {
                            $resolutionExists = DB::connection('pulse')
                                ->table('knowledge_base_resolutions')
                                ->where('id', $resolutionData['next_resolution_id'])
                                ->where('id', '!=', $resolutionData['id']) // Prevent self-reference
                                ->exists();
                        }
                        
                        // If resolution doesn't exist, remove the reference
                        if (!$resolutionExists) {
                            $resolutionData['next_resolution_id'] = null;
                            $originalResolutionData['next_resolution_id'] = null; // Update original too
                        }
                    }
                }

                // Validate next_article_id references
                if (isset($resolutionData['next_article_id'])) {
                    // Validate that article exists
                    $articleExists = DB::connection('pulse')
                        ->table('knowledge_base_articles')
                        ->where('id', $resolutionData['next_article_id'])
                        ->exists();
                    
                    // If article doesn't exist, remove the reference
                    if (!$articleExists) {
                        $resolutionData['next_article_id'] = null;
                        $originalResolutionData['next_article_id'] = null; // Update original too
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
                
                // Handle image objects from frontend - convert to filename string
                if (isset($questionData['image']) && is_array($questionData['image'])) {
                    if (isset($questionData['image']['filename'])) {
                        $questionData['image'] = $questionData['image']['filename'];
                    } else {
                        $questionData['image'] = null;
                    }
                }
                
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

            // Third pass: Update resolutions' next_question_id and next_resolution_id references
            foreach ($resolutionsToUpdate as $resolutionUpdate) {
                $originalResolutionData = $resolutionUpdate['original'];
                $resolutionId = $resolutionUpdate['realId'];
                
                // Handle next_question_id references
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

                // Handle next_resolution_id references
                if (isset($originalResolutionData['next_resolution_id'])) {
                    if (isset($resolutionIdMap[$originalResolutionData['next_resolution_id']])) {
                        // Map temp ID to real ID
                        $nextResolutionId = $resolutionIdMap[$originalResolutionData['next_resolution_id']];
                        DB::connection('pulse')
                            ->table('knowledge_base_resolutions')
                            ->where('id', $resolutionId)
                            ->update(['next_resolution_id' => $nextResolutionId, 'updated_at' => now()]);
                    } else {
                        // Check if it's already a real ID that exists in the resolutions table
                        $existingResolution = DB::connection('pulse')
                            ->table('knowledge_base_resolutions')
                            ->where('id', $originalResolutionData['next_resolution_id'])
                            ->where('id', '!=', $resolutionId) // Prevent self-reference
                            ->exists();
                        
                        if ($existingResolution) {
                            // It's a valid real ID, keep it as is
                            DB::connection('pulse')
                                ->table('knowledge_base_resolutions')
                                ->where('id', $resolutionId)
                                ->update(['next_resolution_id' => $originalResolutionData['next_resolution_id'], 'updated_at' => now()]);
                        } else {
                            // Invalid reference - set to null to avoid constraint violation
                            DB::connection('pulse')
                                ->table('knowledge_base_resolutions')
                                ->where('id', $resolutionId)
                                ->update(['next_resolution_id' => null, 'updated_at' => now()]);
                        }
                    }
                }

                // Handle next_article_id references
                if (isset($originalResolutionData['next_article_id'])) {
                    // Check if it's a valid ID that exists in the articles table
                    $existingArticle = DB::connection('pulse')
                        ->table('knowledge_base_articles')
                        ->where('id', $originalResolutionData['next_article_id'])
                        ->exists();
                    
                    if ($existingArticle) {
                        // It's a valid article ID, keep it as is
                        DB::connection('pulse')
                            ->table('knowledge_base_resolutions')
                            ->where('id', $resolutionId)
                            ->update(['next_article_id' => $originalResolutionData['next_article_id'], 'updated_at' => now()]);
                    } else {
                        // Invalid reference - set to null to avoid constraint violation
                        DB::connection('pulse')
                            ->table('knowledge_base_resolutions')
                            ->where('id', $resolutionId)
                            ->update(['next_article_id' => null, 'updated_at' => now()]);
                    }
                }
            }

            Auditing::log('Knowledge Base - Technical Supporter', auth()->user()->id, 'Visual Guide Saved', 'Article ID: ' . $articleId);

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

    public function sendSMS(Request $request, $id)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:wings_config.users,id'
        ]);

        try {
            // Get the article
            $article = DB::connection('pulse')
                ->table('knowledge_base_articles')
                ->select('id', 'title')
                ->where('id', $id)
                ->first();

            if (!$article) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article not found.'
                ], 404);
            }

            // Get the user and their mobile phone
            $user = DB::connection('wings_config')
                ->table('users')
                ->leftJoin('wings_data.hr_details', 'users.id', '=', 'hr_details.user_id')
                ->select('users.name', 'hr_details.contact_mobile_phone')
                ->where('users.id', $request->user_id)
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            if (empty($user->contact_mobile_phone)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User does not have a mobile phone number on file.'
                ], 400);
            }

            // Generate temporary signed URL (valid for 7 days)
            $signedUrl = \URL::temporarySignedRoute(
                'knowledge_base.article.public',
                now()->addDays(7),
                ['id' => $id]
            );

            // Prepare SMS message
            $message = "Hi {$user->name}, you've been sent this article: \"{$article->title}\". View it here: {$signedUrl}";

            // Send SMS using T2SMS helper
            $response = \App\Helper\T2SMS::sendSms(
                'Angel FS', // From
                $user->contact_mobile_phone, // To
                $message // Message
            );

            // Check if SMS was sent successfully
            if ($response && $response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => "SMS sent successfully to {$user->name}."
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send SMS. Please try again.'
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('Failed to send article SMS: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending the SMS.'
            ], 500);
        }
    }

    // Public article view (no auth required)
    public function publicArticle($id)
    {
        $article = DB::connection('pulse')
            ->table('knowledge_base_articles')
            ->select('id', 'title', 'category', 'description', 'tags', 'body', 'article_image', 'published_at', 'visits')
            ->where('id', $id)
            ->first();

        if (!$article) {
            abort(404);
        }

        // Increment visit counter
        DB::connection('pulse')
            ->table('knowledge_base_articles')
            ->where('id', $id)
            ->increment('visits');

        // Update the article object with the new visit count
        $article->visits = $article->visits + 1;

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
            });
        }

        return Inertia::render('KnowledgeBase/PublicArticle', [
            'article' => $article,
            'questions' => $questions,
            'resolutions' => $resolutions,
        ]);
    }

    public function create(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'content' => 'required|string',
            'tags' => 'required|array|min:1|max:10',
            'tags.*' => 'string|max:50',
            'category' => 'required|string|max:100',
            'soundfiles.*' => 'file|mimes:wav,mp3,ogg,gsm|max:102400', // 100MB max per audio file
        ]);

        if ($validator->fails()) {            
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Handle audio file uploads (store in R2)
            $storedSoundfiles = [];
            $content = $request->content;
            if ($request->hasFile('soundfiles')) {
                foreach ($request->file('soundfiles') as $file) {
                    $path = $file->store('knowledge-base/audio', 'r2');
                    
                    $storedSoundfiles[] = [
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ];
                    // Replace blob URLs and filenames with a reference format that can be converted to temporary URLs later
                    $audioReference = "[AUDIO:{$path}]";
                    $content = str_replace($file->getClientOriginalName(), $audioReference, $content);
                    // Also handle any blob URLs that might still be in the content
                    $content = preg_replace('/\(blob:[^)]+\)/', "($audioReference)", $content);
                }
            }

            // Convert category from slug to normal string (replace hyphens with spaces and capitalize)
            $category = ucwords(str_replace('-', ' ', $request->category));

            // Calculate read time
            $readTime = $this->calculateReadTime($content, $storedSoundfiles);

            // Insert the new article
            $articleId = DB::connection('pulse')
                ->table('knowledge_base_articles')
                ->insertGetId([
                    'title' => $request->title,
                    'category' => $category,
                    'description' => $request->description,
                    'tags' => json_encode($request->tags),
                    'body' => $content,
                    'soundfiles' => json_encode($storedSoundfiles),
                    'article_image' => null, // Can be added later via image upload
                    'read_time' => $readTime,
                    'published_at' => now(),
                    'visits' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            Auditing::log('Knowledge Base - ' . $category, auth()->user()->id, 'Article Created', 'Article ID: ' . $articleId);

            return response()->json([
                'message' => 'Article created successfully',
                'article_id' => $articleId
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error creating knowledge base article: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'An error occurred while creating the article'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {   
    // Validate the request
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'content' => 'required|string',
            'tags' => 'required|array|min:1|max:10',
            'tags.*' => 'string|max:50',
            'category' => 'required|string|max:100',
            'soundfiles.*' => 'nullable|file|mimes:wav,mp3,ogg,gsm|max:102400', // 100MB max per audio file
            'existing_soundfiles' => 'nullable|array',
            'existing_soundfiles.*' => 'nullable|string', // JSON strings of existing soundfile data
        ]);

        if ($validator->fails()) {            
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Find the existing article
            $existingArticle = DB::connection('pulse')
                ->table('knowledge_base_articles')
                ->where('id', $id)
                ->first();

            if (!$existingArticle) {
                return response()->json([
                    'message' => 'Article not found'
                ], 404);
            }

            // Handle soundfile management - preserve existing and add new ones
            $storedSoundfiles = [];
            $content = $request->content;
            // First, process existing soundfiles that should be preserved

            if ($request->has('existing_soundfiles')) {
                foreach ($request->existing_soundfiles as $existingSoundfileJson) {
                    $existingSoundfile = json_decode($existingSoundfileJson, true);
                    if ($existingSoundfile && isset($existingSoundfile['file_path'])) {
                        $storedSoundfiles[] = [
                            'path' => $existingSoundfile['file_path'],
                            'original_name' => $existingSoundfile['filename'],
                            'mime_type' => 'audio/wav', // Default - could be enhanced to store actual mime type
                            'size' => 0, // Could be enhanced to store actual size
                        ];
                    }
                }
            }

            // Delete existing soundfiles that are not being preserved
            if (!empty($existingArticle->soundfiles)) {
                $existingSoundfiles = json_decode($existingArticle->soundfiles, true);
                $preservedPaths = array_column($storedSoundfiles, 'path');
                if (is_array($existingSoundfiles)) {
                    foreach ($existingSoundfiles as $soundfile) {
                        // Only delete if this soundfile is not in the preserved list
                        if (!in_array($soundfile['path'], $preservedPaths)) {
                            if (Storage::disk('r2')->exists($soundfile['path'])) {
                                Storage::disk('r2')->delete($soundfile['path']);
                            }
                        }
                    }
                }
            }

            // Handle new audio file uploads (store in R2)
            if ($request->hasFile('soundfiles')) {
                foreach ($request->file('soundfiles') as $file) {
                    $path = $file->store('knowledge-base/audio', 'r2');
                    
                    $storedSoundfiles[] = [
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ];
                    // Replace blob URLs and filenames with a reference format that can be converted to temporary URLs later
                    $audioReference = "[AUDIO:{$path}]";
                    $content = str_replace($file->getClientOriginalName(), $audioReference, $content);
                    // Also handle any blob URLs that might still be in the content
                    $content = preg_replace('/\(blob:[^)]+\)/', "($audioReference)", $content);
                }
            }

            // Convert category from slug to normal string (replace hyphens with spaces and capitalize)
            $category = ucwords(str_replace('-', ' ', $request->category));

            // Calculate read time
            $readTime = $this->calculateReadTime($content);

            // Update the article
            DB::connection('pulse')
                ->table('knowledge_base_articles')
                ->where('id', $id)
                ->update([
                    'title' => $request->title,
                    'category' => $category,
                    'description' => $request->description,
                    'tags' => json_encode($request->tags),
                    'body' => $content,
                    'soundfiles' => json_encode($storedSoundfiles),
                    'read_time' => $readTime,
                    'updated_at' => now(),
                ]);

            Auditing::log('Knowledge Base - ' . $category, auth()->user()->id, 'Article Updated', 'Article ID: ' . $id);

            return response()->json([
                'message' => 'Article updated successfully',
                'article_id' => $id
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while updating the article'
            ], 500);
        }
    }

    /**
     * Calculate estimated read time for an article
     * 
     * @param string $content The article content (markdown)
     * @return int Estimated read time in minutes
     */
    private function calculateReadTime($content)
    {
        // Average reading speed is 100-200 words per minute
        // We'll use 100 to be conservative
        $wordsPerMinute = 100;
        
        // Strip markdown and HTML to get plain text word count
        $plainText = strip_tags(preg_replace('/\[.*?\]\(.*?\)/', '', $content)); // Remove markdown links
        $plainText = preg_replace('/[#*_`>-]/', '', $plainText); // Remove markdown formatting
        $plainText = preg_replace('/\[AUDIO:.*?\]/', '', $plainText); // Remove audio references
        
        // Count words
        $wordCount = str_word_count($plainText);
        
        // Calculate base reading time
        $readingTimeMinutes = $wordCount / $wordsPerMinute;
        
        // Round up to nearest minute, minimum 1 minute
        return max(1, ceil($readingTimeMinutes));
    }

    /**
     * Create a knowledge base article from an Apex call
     * 
     * @param string $apexId The Apex call ID to convert
     * @return \Inertia\Response
     */
    public function createFromApex(Request $request)
    {
        $apexId = $request->query('apex-id');
        $tags = $request->query('tags');
        
        // Convert URL-encoded tags string to array
        $presetData = [];
        if ($tags) {
            try {
                // URL decode and parse JSON
                $decodedTags = urldecode($tags);
                $parsedTags = json_decode($decodedTags, true);
                
                // Ensure it's an array and filter out invalid entries
                if (is_array($parsedTags)) {
                    $validTags = array_filter($parsedTags, function($tag) {
                        return is_string($tag) && !empty(trim($tag));
                    });
                    
                    // Structure as preset object with form field keys
                    if (!empty($validTags)) {
                        $presetData['tags'] = $validTags;
                    }
                }
            } catch (\Exception $e) {
                // If parsing fails, default to empty array
                $presetData = [];
            }
        }

        return Inertia::render('KnowledgeBase/KnowledgeBase', [
            'apexId' => $apexId,
            'showCreateForm' => true,
            'presetData' => $presetData
        ]);
    }

    public function delete($id)
    {
        try {
            // Find the article
            $article = DB::connection('pulse')->table('knowledge_base_articles')
                ->where('id', $id)
                ->first();

            if (!$article) {
                return response()->json([
                    'message' => 'Article not found'
                ], 404);
            }

            // Delete associated audio files if they exist
            if (!empty($article->soundfiles)) {
                $soundfiles = json_decode($article->soundfiles, true);
                if (is_array($soundfiles)) {
                    foreach ($soundfiles as $soundfile) {
                        if (Storage::disk('r2')->exists($soundfile['path'])) {
                            Storage::disk('r2')->delete($soundfile['path']);
                        }
                    }
                }
            }

            // Delete the article
            DB::connection('pulse')->table('knowledge_base_articles')
                ->where('id', $id)
                ->delete();

            Auditing::log('Knowledge Base - ' . $article->category, auth()->user()->id, 'Article Deleted', 'Article ID: ' . $id);

            return response()->json([
                'message' => 'Article deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete article, please try again later.' . $e->getMessage()
            ], 500);
        }
    }

}
