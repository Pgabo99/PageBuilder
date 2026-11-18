<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// A tesztek nem érhetik el a fejlesztői adatbázist és Redist (phpunit.xml, force="true").
class TestEnvironmentIsolationTest extends TestCase
{
    public function test_a_tesztek_a_teszt_adatbazist_es_memoriabeli_drivereket_hasznaljak(): void
    {
        $this->assertSame('mysql_testing', config('database.default'));
        $this->assertSame(config('database.connections.mysql.database').'_testing', DB::connection()->getDatabaseName());
        $this->assertSame('array', config('cache.default'));
        $this->assertSame('array', config('session.driver'));
        $this->assertSame('sync', config('queue.default'));
    }
}
