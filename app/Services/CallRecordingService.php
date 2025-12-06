<?php

namespace App\Services;

use App\Models\AI\CallRecording;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class CallRecordingService
{
    /**
     * Upload recording to R2 and mark for processing
     * Worker will pick it up automatically
     */
    public function uploadForProcessing(
        UploadedFile $file,
        ?string $apexId = null,
        array $metadata = []
    ): CallRecording {
        // Generate unique path in R2
        $path = $this->generateR2Path($file, $apexId);
        
        // Upload to R2
        Storage::disk('r2')->put($path, file_get_contents($file->getRealPath()));
        
        // Get file metadata
        $duration = $metadata['duration'] ?? null;
        $fileSize = $file->getSize();
        
        // Create database record with 'pending' status
        // Python worker will automatically pick this up
        $recording = CallRecording::create([
            'apex_id' => $apexId,
            'r2_path' => $path,
            'r2_bucket' => config('filesystems.disks.r2.bucket'),
            'duration_seconds' => $duration,
            'file_size_bytes' => $fileSize,
            'file_format' => $file->getClientOriginalExtension(),
            'processing_status' => 'pending',
            'uploaded_at' => now(),
        ]);
        
        return $recording;
    }

    /**
     * Upload from existing file path (for migrating existing recordings)
     */
    public function uploadFromPath(
        string $filePath,
        ?string $apexId = null,
        array $metadata = []
    ): CallRecording {
        if (!file_exists($filePath)) {
            throw new \Exception("File not found: {$filePath}");
        }

        // Generate unique path in R2
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        $path = $this->generateR2PathFromString($extension, $apexId);
        
        // Upload to R2
        Storage::disk('r2')->put($path, file_get_contents($filePath));
        
        // Create database record
        $recording = CallRecording::create([
            'apex_id' => $apexId,
            'r2_path' => $path,
            'r2_bucket' => config('filesystems.disks.r2.bucket'),
            'duration_seconds' => $metadata['duration'] ?? null,
            'file_size_bytes' => filesize($filePath),
            'file_format' => $extension,
            'processing_status' => 'pending',
            'uploaded_at' => now(),
        ]);
        
        return $recording;
    }

    /**
     * Mark recording for reprocessing
     * Python worker will pick it up on next poll
     */
    public function reprocess(CallRecording $recording): void
    {
        $recording->update([
            'processing_status' => 'pending',
            'processing_error' => null,
            'processing_started_at' => null,
            'processing_completed_at' => null,
        ]);
        
        // That's it! Worker handles the rest
    }

    /**
     * Generate R2 storage path
     */
    private function generateR2Path(UploadedFile $file, ?string $apexId): string
    {
        $date = now();
        $year = $date->format('Y');
        $month = $date->format('m');
        $day = $date->format('d');
        
        $filename = ($apexId ? Str::slug($apexId) . '_' : '') 
                  . Str::random(20) 
                  . '.' . $file->getClientOriginalExtension();
        
        return "call-recordings/{$year}/{$month}/{$day}/{$filename}";
    }

    /**
     * Generate R2 storage path from string
     */
    private function generateR2PathFromString(string $extension, ?string $apexId): string
    {
        $date = now();
        $year = $date->format('Y');
        $month = $date->format('m');
        $day = $date->format('d');
        
        $filename = ($apexId ? Str::slug($apexId) . '_' : '') 
                  . Str::random(20) 
                  . '.' . $extension;
        
        return "call-recordings/{$year}/{$month}/{$day}/{$filename}";
    }

    /**
     * Get recording statistics
     */
    public function getStatistics(): array
    {
        return [
            'total' => CallRecording::count(),
            'pending' => CallRecording::where('processing_status', 'pending')->count(),
            'processing' => CallRecording::where('processing_status', 'processing')->count(),
            'completed' => CallRecording::where('processing_status', 'completed')->count(),
            'failed' => CallRecording::where('processing_status', 'failed')->count(),
        ];
    }
}
