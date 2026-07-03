<?php

namespace Tests\Unit;

use Tests\TestCase;

class ConfigurationTest extends TestCase
{
    public function test_environment_is_correctly_configured()
    {
        $this->assertEquals('pgsql', config('database.default'));
        // En environnement de test, on accepte 'file' ou 'array'
        $cacheDriver = config('cache.default');
        $this->assertTrue(in_array($cacheDriver, ['array', 'file']),
            "Cache driver should be 'array' or 'file' in test environment, got '{$cacheDriver}'");
        $this->assertEquals('sync', config('queue.default'));
    }

    public function test_helpers_exist()
    {
        $this->assertTrue(function_exists('uuid_v4'));
        $this->assertTrue(function_exists('generate_voter_code'));
        $this->assertTrue(function_exists('generate_otp_code'));
    }
}
