<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for all database work. Of course
    | you may use many connections at once using the Database library.
    |
    */

    'default' => env('DB_CONNECTION', 'mysql'),

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Here are each of the database connections setup for your application.
    | Of course, examples of configuring each database platform that is
    | supported by Laravel is shown below to make development simple.
    |
    |
    | All database work in Laravel is done through the PHP PDO facilities
    | so make sure you have the driver for your particular database of
    | choice installed on your machine before you begin development.
    |
    */

    'connections' => [

        'sqlite' => [
            'driver' => 'sqlite',
            'url' => env('DATABASE_URL'),
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix' => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
        ],

        'wings_config' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'forge'),
            'username' => env('DB_USERNAME', 'forge'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => FALSE,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'wings_data' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL_SECOND'),
            'host' => env('DB_HOST_SECOND', '127.0.0.1'),
            'port' => env('DB_PORT_SECOND', '3306'),
            'database' => env('DB_DATABASE_SECOND', 'forge'),
            'username' => env('DB_USERNAME_SECOND', 'forge'),
            'password' => env('DB_PASSWORD_SECOND', ''),
            'unix_socket' => env('DB_SOCKET_SECOND', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => FALSE,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'halo_data' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL_THIRD'),
            'host' => env('DB_HOST_THIRD', '127.0.0.1'),
            'port' => env('DB_PORT_THIRD', '3306'),
            'database' => env('DB_DATABASE_THIRD', 'forge'),
            'username' => env('DB_USERNAME_THIRD', 'forge'),
            'password' => env('DB_PASSWORD_THIRD', ''),
            'unix_socket' => env('DB_SOCKET_THIRD', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => FALSE,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'halo_config' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL_FOURTH'),
            'host' => env('DB_HOST_FOURTH', '127.0.0.1'),
            'port' => env('DB_PORT_FOURTH', '3306'),
            'database' => env('DB_DATABASE_FOURTH', 'forge'),
            'username' => env('DB_USERNAME_FOURTH', 'forge'),
            'password' => env('DB_PASSWORD_FOURTH', ''),
            'unix_socket' => env('DB_SOCKET_FOURTH', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => FALSE,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'halo_outbound' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL_FIFTH'),
            'host' => env('DB_HOST_FIFTH', '127.0.0.1'),
            'port' => env('DB_PORT_FIFTH', '3306'),
            'database' => env('DB_DATABASE_FIFTH', 'forge'),
            'username' => env('DB_USERNAME_FIFTH', 'forge'),
            'password' => env('DB_PASSWORD_FIFTH', ''),
            'unix_socket' => env('DB_SOCKET_FIFTH', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => FALSE,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'apex_data' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL_SIXITH'),
            'host' => env('DB_HOST_SIXITH', '127.0.0.1'),
            'port' => env('DB_PORT_SIXITH', '3306'),
            'database' => env('DB_DATABASE_SIXITH', 'forge'),
            'username' => env('DB_USERNAME_SIXITH', 'forge'),
            'password' => env('DB_PASSWORD_SIXITH', ''),
            'unix_socket' => env('DB_SOCKET_SIXITH', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => FALSE,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'call_monitoring' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL_SEVENTH'),
            'host' => env('DB_HOST_SEVENTH', '127.0.0.1'),
            'port' => env('DB_PORT_SEVENTH', '3306'),
            'database' => env('DB_DATABASE_SEVENTH', 'forge'),
            'username' => env('DB_USERNAME_SEVENTH', 'forge'),
            'password' => env('DB_PASSWORD_SEVENTH', ''),
            'unix_socket' => env('DB_SOCKET_SEVENTH', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => FALSE,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'halo_rota' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL_EIGHTH'),
            'host' => env('DB_HOST_EIGHTH', '127.0.0.1'),
            'port' => env('DB_PORT_EIGHTH', '3306'),
            'database' => env('DB_DATABASE_EIGHTH', 'forge'),
            'username' => env('DB_USERNAME_EIGHTH', 'forge'),
            'password' => env('DB_PASSWORD_EIGHTH', ''),
            'unix_socket' => env('DB_SOCKET_EIGHTH', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => FALSE,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'assets' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL_NINTH'),
            'host' => env('DB_HOST_NINTH', '127.0.0.1'),
            'port' => env('DB_PORT_NINTH', '3306'),
            'database' => env('DB_DATABASE_NINTH', 'forge'),
            'username' => env('DB_USERNAME_NINTH', 'forge'),
            'password' => env('DB_PASSWORD_NINTH', ''),
            'unix_socket' => env('DB_SOCKET_NINTH', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => FALSE,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'hr' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL_TENTH'),
            'host' => env('DB_HOST_TENTH', '127.0.0.1'),
            'port' => env('DB_PORT_TENTH', '3306'),
            'database' => env('DB_DATABASE_TENTH', 'forge'),
            'username' => env('DB_USERNAME_TENTH', 'forge'),
            'password' => env('DB_PASSWORD_TENTH', ''),
            'unix_socket' => env('DB_SOCKET_TENTH', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => FALSE,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'mysql' => [
            'driver' => 'mysql',
            'url' => env('DATABASE_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'forge'),
            'username' => env('DB_USERNAME', 'forge'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'pgsql' => [
            'driver' => 'pgsql',
            'url' => env('DATABASE_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'forge'),
            'username' => env('DB_USERNAME', 'forge'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],

        'sqlsrv' => [
            'driver' => 'sqlsrv',
            'url' => env('DATABASE_URL'),
            'host' => env('DB_HOST', 'localhost'),
            'port' => env('DB_PORT', '1433'),
            'database' => env('DB_DATABASE', 'forge'),
            'username' => env('DB_USERNAME', 'forge'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            // 'encrypt' => env('DB_ENCRYPT', 'yes'),
            // 'trust_server_certificate' => env('DB_TRUST_SERVER_CERTIFICATE', 'false'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    |
    | This table keeps track of all the migrations that have already run for
    | your application. Using this information, we can determine which of
    | the migrations on disk haven't actually been run in the database.
    |
    */

    'migrations' => 'migrations',

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    |
    | Redis is an open source, fast, and advanced key-value store that also
    | provides a richer body of commands than a typical key-value system
    | such as APC or Memcached. Laravel makes it easy to dig right in.
    |
    */

    'redis' => [

        'client' => env('REDIS_CLIENT', 'phpredis'),

        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
        ],

        'default' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
        ],

        'cache' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '1'),
        ],

    ],

];
