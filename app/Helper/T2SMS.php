<?php

namespace App\Helper;

use Illuminate\Support\Facades\Http;
use Livewire\Component;
use DB;
use Log;

class T2SMS
{
    public static function sendSms($from, $to, $message){

        // Clean the mobile number to ensure no spacing and correct UK format.
        $to = self::cleanMobile($to);

        // Validate the cleaned number is a genuine UK format mobile number.
        $response = self::validateMobile($to);
        if(!$response){
            Log::info($response);
            return $response;
        }

        // Check the status of T2 servers.
        $status = self::checkT2Status();
        if(!$status){
            Log::info($status);
            return $status;
        }

        // Enocode the message into URL format and strip the message of unwanted characters.
        $encodedMessage = self::encodeMessage($message);

        // Build the correctly formatted T2 URL with passed parameters.
        $url = self::buildURL($from, $to, $encodedMessage);

        // Make the HTTP GET request and send the SMS message.
        $response = Http::get($url);

        // Log the response and the message information.
        self::logSMS($from, $to, $message, $response);

        return $response;
    }

    public static function logSMS($from, $to, $message, $response){
        
        $messages = (strlen($message) <= 160) ? 1 : ceil(strlen($message) / 153);
        
        DB::connection('wings_config')
        ->table("sms_out_log")
        ->insert([
            "provider" => "T2",
            "account" => "AFS",
            "clientref" => "ANGL",
            "message_from" => $from,
            "message_to" => $to,
            "message" => $message,
            "messages" => $messages,
            "sent" => date("Y-m-d H:i:s"),
            "status" => $response,
            "user_id" => auth()->check() ? (string) auth()->user()->id : "SYS",
        ]);
    }

    public static function buildURL($from, $to, $message){
        $url = "https://smsgw.telecom2.net/smsgw/sms.do";

        $username = env('T2_USERNAME');
        $password = base64_decode(substr(env('T2_PASSWORD'), strpos(env('T2_PASSWORD'), "base64:") + 7));

        if($username && $password){
            $url = $url . 
            "?USERNAME=" . $username .
            "&PASSWORD=" . $password .
            "&DESTINATION=" . $to .
            "&SENDER=" . $from .
            "&BODY=" . $message .
            "&DLR=0";

            return $url;
        }
    }

    public static function encodeMessage($string) {
        // Replace forward and back ticks with single quotes
        $string = str_replace(['`', '´'], "'", $string);
    
        // Use the built-in urlencode function to encode the string
        return urlencode($string);
    }

    public static function cleanMobile($mobile){
        // Remove any spaces, hyphens, or parentheses
        $mobile = preg_replace('/[\s()+-]/', '', $mobile);

        // Replace the first characters with '44' if necessary
        if(substr($mobile, 0, 2) !== '44') {
            if(substr($mobile, 0, 1) === '0') {
                $mobile = '44' . substr($mobile, 1);
            } else {
                $mobile = '44' . $mobile;
            }
        }

        return $mobile;
    }

    public static function validateMobile($mobile){

        // Ensure the number starts with '44'
        if(substr($mobile, 0, 2) !== '44') {
            return "SMS Mobile Number Invalid";
        }

        // Check if the number is 11 characters long
        if(strlen($mobile) !== 11) {
            return "SMS Mobile Number Too Long - Max 11 Characters";
        }

        // Check if the number matches the pattern
        if(preg_match('/^44\d{11}$/', $mobile)) {
            return true;
        } else {
            return 'SMS Mobile Number Invalid';
        }
    }

    public static function checkT2Status(){
        for ($i=0; $i < 5; $i++) { 
            
            if(self::curl_check("http://smsgw.telecom2.net") == 200){
                return true;
                break;
            }

            sleep(1);
        }

        return "Cannot Connect To T2 Servers";
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