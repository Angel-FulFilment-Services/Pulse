<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestrictedWord extends Model
{
    protected $connection = 'pulse';
    
    protected $fillable = [
        'word',
        'category',
        'level',
        'substitution',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'level' => 'integer',
    ];

    /**
     * Get only active restricted words with their levels and substitutions
     */
    public static function getActiveWords()
    {
        return self::where('is_active', true)
            ->get(['word', 'level', 'category', 'substitution'])
            ->toArray();
    }
}
