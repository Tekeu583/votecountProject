<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Config;

abstract class TestCase extends BaseTestCase
{

    protected function setUp(): void
    {
        parent::setUp();

        // FORCER la configuration pour les tests
        Config::set('cache.default', 'array');
        Config::set('queue.default', 'sync');
        Config::set('session.driver', 'array');
        Config::set('mail.default', 'array');
        Config::set('broadcasting.default', 'log');

        // Forcer la base de données
        Config::set('database.default', 'pgsql');

        // Désactiver l'audit et le cache en test
        Config::set('audit.enabled', false);
    }
}
