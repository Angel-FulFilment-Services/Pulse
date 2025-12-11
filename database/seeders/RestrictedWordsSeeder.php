<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RestrictedWordsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $restrictedWords = [
            // Profanity - Level 1 (star out) - with optional substitutions
            ['word' => 'damn', 'category' => 'profanity', 'level' => 1, 'substitution' => null],
            ['word' => 'ass', 'category' => 'profanity', 'level' => 1, 'substitution' => null],
            ['word' => 'piss', 'category' => 'profanity', 'level' => 1, 'substitution' => null],
            ['word' => 'bollocks', 'category' => 'profanity', 'level' => 1, 'substitution' => null],
            ['word' => 'crap', 'category' => 'profanity', 'level' => 1, 'substitution' => null],
            ['word' => 'hell', 'category' => 'profanity', 'level' => 1, 'substitution' => null],
            
            // Profanity - Level 2 (remove word) - with optional substitutions
            ['word' => 'fuck', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'shit', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'bitch', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'bastard', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'asshole', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'cunt', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'dick', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'cock', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'pussy', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'wanker', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'twat', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            
            // Multi-word phrases - Level 2 (remove or substitute)
            ['word' => 'son of a bitch', 'category' => 'profanity', 'level' => 2, 'substitution' => null],
            ['word' => 'go to hell', 'category' => 'profanity', 'level' => 1, 'substitution' => null],
            
            // Racial slurs - Level 3 (block message)
            ['word' => 'nigger', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'nigga', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'chink', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'gook', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'spic', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'wetback', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'beaner', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'kike', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'raghead', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'towelhead', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'cracker', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'honky', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'whitey', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'paki', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'coon', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'jigaboo', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            
            // Homophobic/transphobic slurs - Level 3 (block message)
            ['word' => 'faggot', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'fag', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'dyke', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            ['word' => 'tranny', 'category' => 'slur', 'level' => 3, 'substitution' => null],
            
            // Ableist slurs - Level 2 (remove word)
            ['word' => 'retard', 'category' => 'slur', 'level' => 2, 'substitution' => null],
            ['word' => 'retarded', 'category' => 'slur', 'level' => 2, 'substitution' => null],
            ['word' => 'spastic', 'category' => 'slur', 'level' => 2, 'substitution' => null],
            ['word' => 'cripple', 'category' => 'slur', 'level' => 2, 'substitution' => null],
            ['word' => 'mongoloid', 'category' => 'slur', 'level' => 2, 'substitution' => null],
            
            // Other offensive terms - Level 2 (remove word)
            ['word' => 'whore', 'category' => 'offensive', 'level' => 2, 'substitution' => null],
            ['word' => 'slut', 'category' => 'offensive', 'level' => 2, 'substitution' => null],
            ['word' => 'rape', 'category' => 'offensive', 'level' => 3, 'substitution' => null],
            ['word' => 'nazi', 'category' => 'offensive', 'level' => 2, 'substitution' => null],
            
            // Note: "queer" removed as it's been reclaimed by LGBTQ+ community
        ];

        foreach ($restrictedWords as $word) {
            DB::connection('pulse')->table('restricted_words')->insert([
                'word' => $word['word'],
                'category' => $word['category'],
                'level' => $word['level'],
                'substitution' => $word['substitution'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
