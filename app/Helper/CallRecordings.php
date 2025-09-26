<?php

namespace App\Helper;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Event;
use Livewire\Component;
use Illuminate\Support\Facades\DB;

class CallRecordings
{
    public static function downloadConvertedRecording($apex_id, $year, $month, $file){
        // Set varaibles.
        $folder = storage_path('app/soundfiles/');
        $filename = str_replace('.','_',$apex_id) . $year . '_' . $month . '_' . str()->random(20);
        
        $url = self::find_recording($apex_id, $year, $month);
        if(!$url){
            return false;
        }

        $response = Http::get($url);

        // Store the file locally under a random filename.
        if($response->successful()){
            Storage::disk('soundfiles')->put($filename . '.gsm', $response->body());
        }

        // Tell SoX to convert the file from .gsm to .mp3 / .wav
        // Once converted delete the .gsm file.
        if(Storage::disk('soundfiles')->exists($filename . '.gsm')){
            self::convert_gsm_to_wav($folder, $filename);
            Storage::disk('soundfiles')->delete($filename . '.gsm');
        }

        // Stream the newly coverted file to the user.
        if(Storage::disk('soundfiles')->exists($filename . '.wav')){
            $response = response()->streamDownload(function () use ($filename) {
                echo Storage::disk('soundfiles')->get($filename . '.wav');
            }, $file . '.wav');

            // Once the download is streamed delete the .wav file.
            app()->terminating(function () use ($filename) {
                Storage::disk('soundfiles')->delete($filename . '.wav');
            });
        }

        return $response;
    }

    public static function getConvertedRecording($apex_id){
        $apex_data = DB::connection('apex_data')
        ->table('apex_data')
        ->where('apex_data.uniqueid', $apex_id)
        ->select(DB::raw('
            month(apex_data.date) as month,
            year(apex_data.date) as year
        '))
        ->first();
        
        // Extract year and month from apex_data
        $year = $apex_data->year;
        $month = str_pad($apex_data->month, 2, '0', STR_PAD_LEFT);       

        // Set variables
        $folder = storage_path('app/soundfiles/');
        $filename = str_replace('.','_',$apex_id) . $year . '_' . $month . '_' . str()->random(20);
        
        $url = self::find_recording($apex_id, $year, $month);
        if(!$url){
            return [
                'success' => false,
                'message' => 'Recording not found',
                'data' => null
            ];
        }

        $response = Http::get($url);

        // Store the file locally under a random filename.
        if($response->successful()){
            Storage::disk('soundfiles')->put($filename . '.gsm', $response->body());
        } else {
            return [
                'success' => false,
                'message' => 'Failed to download recording',
                'data' => null
            ];
        }

        // Tell SoX to convert the file from .gsm to .wav
        // Once converted delete the .gsm file.
        if(Storage::disk('soundfiles')->exists($filename . '.gsm')){
            self::convert_gsm_to_wav($folder, $filename);
            Storage::disk('soundfiles')->delete($filename . '.gsm');
        } else {
            return [
                'success' => false,
                'message' => 'GSM file not found for conversion',
                'data' => null
            ];
        }

        // Get the converted file data
        if(Storage::disk('soundfiles')->exists($filename . '.wav')){
            $fileData = Storage::disk('soundfiles')->get($filename . '.wav');
            $fileSize = Storage::disk('soundfiles')->size($filename . '.wav');
            
            // Clean up the temporary file
            Storage::disk('soundfiles')->delete($filename . '.wav');
            
            return [
                'success' => true,
                'message' => 'Recording converted successfully',
                'data' => [
                    'content' => base64_encode($fileData),
                    'filename' => $apex_id . '.wav',
                    'size' => $fileSize,
                    'mime_type' => 'audio/wav',
                    'apex_id' => $apex_id,
                    'original_url' => $url
                ]
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Conversion failed - WAV file not created',
                'data' => null
            ];
        }
    }

    public static function ConvertRecording($apex_id, $year, $month, $file){
        // Set varaibles.
        $folder = storage_path('app/soundfiles/');
        $filename = str_replace('.','_',$apex_id) . $year . '_' . $month . '_' . str()->random(20);
        
        $url = self::find_recording($apex_id, $year, $month);
        if(!$url){
            return false;
        }

        $response = Http::get($url);

        // Store the file locally under a random filename.
        if($response->successful()){
            Storage::disk('soundfiles')->put($filename . '.gsm', $response->body());
        }

        // Tell SoX to convert the file from .gsm to .mp3 / .wav
        // Once converted delete the .gsm file.
        if(Storage::disk('soundfiles')->exists($filename . '.gsm')){
            self::convert_gsm_to_wav($folder, $filename);
            Storage::disk('soundfiles')->delete($filename . '.gsm');
        }

        return $filename . '.wav';
    }

    public static function transcodeRecording($apex_id, $year, $month){
        // Set varaibles.
        $folder = storage_path('app/soundfiles/');
        $filename = str_replace('.','_',$apex_id) . $year . '_' . $month . '_' . str()->random(20);
        
        $url = self::find_recording($apex_id, $year, $month);
        if(!$url){
            return false;
        }

        $response = Http::get($url);

        // Store the file locally under a random filename.
        if($response->successful()){
            Storage::disk('soundfiles')->put($filename . '.gsm', $response->body());
        }

        // Tell SoX to convert the file from .gsm to .mp3 / .wav
        // Once converted delete the .gsm file.
        if(Storage::disk('soundfiles')->exists($filename . '.gsm')){
            self::convert_gsm_to_wav($folder, $filename);
            Storage::disk('soundfiles')->delete($filename . '.gsm');
        }

        if(Storage::disk('soundfiles')->exists($filename . '.wav')){
            Storage::move('soundfiles/' . $filename . '.wav', 'public/' . $filename . '.wav');
            return $filename;
        }else{
            return false;
        }
    }

    public static function clearRecording($filename){
        if(Storage::disk('public')->exists($filename . '.mp3')){
            Storage::disk('public')->delete($filename . '.mp3');
        }
        if(Storage::disk('public')->exists($filename . '.wav')){
            Storage::disk('public')->delete($filename . '.wav');
        }
    }

    public static function find_recording($apex_id, $year, $month){
        $url = 'https://pbx.angelfs.co.uk/callrec/' . $apex_id . '.gsm';
        if(self::curl_check($url) == 200){   
            return $url;
        }

        $url = 'https://afs-pbx-callarchive.angelfs.co.uk/monitor-' . $year . '/' . $month . '/' . $apex_id . '.gsm';
        if(self::curl_check($url) == 200){   
            return $url;
        }

        $url = 'https://afs-pbx-callarchive.angelfs.co.uk/monitor-' . $year . '/' . $month . '/' . 'monitor/' . $apex_id . '.gsm';
        if(self::curl_check($url) == 200){   
            return $url;
        }
    }

    public static function convert_gsm_to_mp3($folder, $filename){
        echo exec('sox ' . $folder . $filename  . '.gsm -r 8000 -b 32 -c 1 ' . $folder . $filename  . '.mp3');
    }

    public static function convert_gsm_to_wav($folder, $filename){
        echo exec('sox ' . $folder . $filename  . '.gsm -r 8000 -b 32 -c 1 ' . $folder . $filename  . '.wav');
    }

    public static function curl_check($url){
        // returns int responsecode, or false (if url does not exist or connection timeout occurs)
        $ch = @curl_init($url);
        if($ch === false){
            return false;
        }
        @curl_setopt($ch, CURLOPT_HEADER         ,true);    // we want headers
        @curl_setopt($ch, CURLOPT_NOBODY         ,true);    // dont need body
        @curl_setopt($ch, CURLOPT_RETURNTRANSFER ,true);    // catch output (do NOT print!)
        // @curl_setopt($ch, CURL_IPRESOLVE_V4      ,true);    // Resolve IP using IPv4
        @curl_setopt($ch, CURLOPT_FOLLOWLOCATION ,false);
        @curl_setopt($ch, CURLOPT_CONNECTTIMEOUT , 30);   // fairly random number (seconds)... but could prevent waiting forever to get a result
        @curl_setopt($ch, CURLOPT_TIMEOUT        , 30);   // fairly random number (seconds)... but could prevent waiting forever to get a result
        // @curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        
        @curl_exec($ch);
        if(@curl_errno($ch)){   // should be 0
            @curl_close($ch);
            // Link is not valid / Curl error
            return false;
        }
        $code = @curl_getinfo($ch, CURLINFO_HTTP_CODE); // note: php.net documentation shows this returns a string, but really it returns an int
        @curl_close($ch);

        return $code;
    }
}