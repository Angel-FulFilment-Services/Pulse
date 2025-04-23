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

        // Decrypt using AES-128-CBC
        $encryptedData = hex2bin($value); // Convert the stored value from hexadecimal to binary

        return openssl_decrypt(
            $encryptedData,
            'AES-128-CBC',
            $this->encryptionKey,
            OPENSSL_RAW_DATA
        );
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

        // Encrypt using AES-128-CBC
        $iv = random_bytes(16); // Generate a random 16-byte IV
        $encryptedData = openssl_encrypt(
            $value,
            'AES-128-CBC',
            $this->encryptionKey,
            0,
            $iv
        );

        // Prepend the IV to the encrypted data and convert to a hexadecimal string
        return bin2hex($iv) . bin2hex($encryptedData);
    }
}