<?php
namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Support\Facades\Config;
use Exception;

class EncryptedWithCustomKey implements CastsAttributes
{
    protected $encryptionKey;

    public function __construct()
    {
        // Use your custom encryption key
        $this->encryptionKey = Config::get('encryption.hr');
    }

    /**
     * Cast the given value when retrieving from the database.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  mixed  $value
     * @param  array  $attributes
     * @return mixed
     */
    public function get($model, $key, $value, $attributes)
    {
        if ($value === null) {
            return null;
        }
    
        try {
            // Extract the IV and encrypted data from the stored value
            $encryptedData = hex2bin($value);
    
            // Decrypt the data
            $decryptedData = openssl_decrypt(
                $encryptedData,
                'AES-128-ECB',
                $this->encryptionKey,
                OPENSSL_RAW_DATA,
            );
    
            if ($decryptedData === false) {
                throw new Exception('Decryption failed.');
            }
    
            return $decryptedData;
        } catch (Exception $e) {
            // Log the error for debugging
            // \Log::error('Decryption error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Prepare the given value for storage in the database.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  mixed  $value
     * @param  array  $attributes
     * @return mixed
     */
    public function set($model, $key, $value, $attributes)
    {
        if ($value === null) {
            return null;
        }

        // Encrypt using AES-128-ECB
        $encryptedData = openssl_encrypt($value, 'AES-128-ECB', $this->encryptionKey, OPENSSL_RAW_DATA);

        // Convert to a hexadecimal string
        return bin2hex($encryptedData);
    }
}