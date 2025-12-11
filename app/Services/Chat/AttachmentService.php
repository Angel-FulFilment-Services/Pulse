<?php

namespace App\Services\Chat;

use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Intervention\Image\Facades\Image;
use Illuminate\Support\Str;

class AttachmentService
{
    // File upload limits
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total per message
    const MAX_FILES_PER_MESSAGE = 10;
    
    // Image settings
    const IMAGE_MAX_WIDTH = 1920;
    const IMAGE_MAX_HEIGHT = 1080;
    const THUMBNAIL_WIDTH = 300;
    const THUMBNAIL_HEIGHT = 300;
    
    /**
     * Determine file type from mime type
     */
    public function determineFileType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif ($mimeType === 'application/pdf') {
            return 'pdf';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        } elseif (in_array($mimeType, [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ])) {
            return 'document';
        }
        
        return 'file';
    }
    
    /**
     * Upload attachment with image processing
     */
    public function uploadAttachment(UploadedFile $file, int $userId): array
    {
        $mimeType = $file->getMimeType();
        $fileType = $this->determineFileType($mimeType);
        $isImage = $fileType === 'image';
        
        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;
        
        // Determine storage path
        $basePath = 'chat/attachments';
        if ($isImage) {
            $storagePath = "{$basePath}/images/{$filename}";
        } else {
            $storagePath = "{$basePath}/files/{$filename}";
        }
        
        $thumbnailPath = null;
        $processedFile = $file;
        
        // Process images
        if ($isImage) {
            try {
                // Load image and strip EXIF data
                $image = Image::make($file->getRealPath());
                
                // Remove EXIF data for privacy
                $image->orientate(); // Auto-rotate based on EXIF
                
                // Resize if too large
                $image->resize(self::IMAGE_MAX_WIDTH, self::IMAGE_MAX_HEIGHT, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
                
                // Convert to WebP for better compression
                $webpFilename = Str::uuid() . '.webp';
                $storagePath = "{$basePath}/images/{$webpFilename}";
                $tempPath = sys_get_temp_dir() . '/' . $webpFilename;
                
                $image->encode('webp', 85)->save($tempPath);
                
                // Create thumbnail
                $thumbnailImage = Image::make($tempPath);
                $thumbnailImage->fit(self::THUMBNAIL_WIDTH, self::THUMBNAIL_HEIGHT);
                $thumbnailFilename = 'thumb_' . $webpFilename;
                $thumbnailPath = "{$basePath}/thumbnails/{$thumbnailFilename}";
                $thumbnailTempPath = sys_get_temp_dir() . '/' . $thumbnailFilename;
                $thumbnailImage->encode('webp', 80)->save($thumbnailTempPath);
                
                // Upload to R2 or local storage
                $storageDriver = $this->uploadToStorage($tempPath, $storagePath);
                $this->uploadToStorage($thumbnailTempPath, $thumbnailPath, $storageDriver);
                
                // Clean up temp files
                @unlink($tempPath);
                @unlink($thumbnailTempPath);
                
                return [
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $fileType,
                    'file_size' => filesize(sys_get_temp_dir() . '/' . $webpFilename) ?: $file->getSize(),
                    'mime_type' => 'image/webp',
                    'storage_path' => $storagePath,
                    'thumbnail_path' => $thumbnailPath,
                    'is_image' => true,
                    'storage_driver' => $storageDriver,
                ];
                
            } catch (\Exception $e) {
                \Log::error('Image processing failed: ' . $e->getMessage());
                // Fall back to regular upload
            }
        }
        
        // Regular file upload (non-images or failed image processing)
        $storageDriver = $this->uploadToStorage($file->getRealPath(), $storagePath);
        
        return [
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $fileType,
            'file_size' => $file->getSize(),
            'mime_type' => $mimeType,
            'storage_path' => $storagePath,
            'thumbnail_path' => $thumbnailPath,
            'is_image' => $isImage,
            'storage_driver' => $storageDriver,
        ];
    }
    
    /**
     * Upload file to storage with R2 fallback to local
     */
    protected function uploadToStorage(string $filePath, string $storagePath, ?string $preferredDriver = null): string
    {
        $driver = $preferredDriver;
        
        if (!$driver) {
            // Try R2 first
            try {
                if ($this->isR2Available()) {
                    Storage::disk('r2')->put($storagePath, file_get_contents($filePath));
                    $driver = 'r2';
                } else {
                    throw new \Exception('R2 not available');
                }
            } catch (\Exception $e) {
                \Log::warning('R2 upload failed, falling back to local: ' . $e->getMessage());
                // Fallback to local storage
                Storage::disk('local')->put($storagePath, file_get_contents($filePath));
                $driver = 'local';
            }
        } else {
            // Use specified driver
            Storage::disk($driver)->put($storagePath, file_get_contents($filePath));
        }
        
        return $driver;
    }
    
    /**
     * Check if R2 is available and configured
     */
    protected function isR2Available(): bool
    {
        return !empty(config('filesystems.disks.r2.key')) && 
               !empty(config('filesystems.disks.r2.secret')) &&
               !empty(config('filesystems.disks.r2.bucket'));
    }
    
    /**
     * Get file from storage
     */
    public function getFile(string $storagePath, string $driver = 'r2'): ?string
    {
        try {
            return Storage::disk($driver)->get($storagePath);
        } catch (\Exception $e) {
            \Log::error('Failed to get file from storage: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Delete attachment from storage
     */
    public function deleteAttachment(string $storagePath, ?string $thumbnailPath, string $driver = 'r2'): void
    {
        try {
            Storage::disk($driver)->delete($storagePath);
            if ($thumbnailPath) {
                Storage::disk($driver)->delete($thumbnailPath);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to delete attachment: ' . $e->getMessage());
        }
    }
    
    /**
     * Validate file upload
     */
    public function validateFile(UploadedFile $file): array
    {
        $errors = [];
        
        // Check file size
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            $errors[] = 'File size exceeds 10MB limit';
        }
        
        // Check mime type (basic validation)
        $mimeType = $file->getMimeType();
        if (!$mimeType) {
            $errors[] = 'Invalid file type';
        }
        
        return $errors;
    }
    
    /**
     * Validate total upload size
     */
    public function validateTotalSize(array $files): array
    {
        $errors = [];
        $totalSize = 0;
        
        foreach ($files as $file) {
            $totalSize += $file->getSize();
        }
        
        if ($totalSize > self::MAX_TOTAL_SIZE) {
            $errors[] = 'Total upload size exceeds 50MB limit';
        }
        
        if (count($files) > self::MAX_FILES_PER_MESSAGE) {
            $errors[] = 'Maximum 10 files per message';
        }
        
        return $errors;
    }
}
