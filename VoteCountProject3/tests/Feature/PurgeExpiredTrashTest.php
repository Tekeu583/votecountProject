<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\TrashRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurgeExpiredTrashTest extends TestCase
{
    use RefreshDatabase;

    private function makeTrashRecord(Election $election, User $deleter, \DateTimeInterface $expiresAt): TrashRecord
    {
        return TrashRecord::create([
            'entity_type' => Election::class,
            'entity_id' => $election->id,
            'entity_snapshot' => $election->toArray(),
            'deleted_by' => $deleter->id,
            'deleted_at' => now(),
            'expires_at' => $expiresAt,
        ]);
    }

    public function test_purge_les_elements_expires_et_non_restaures(): void
    {
        $user = User::factory()->create();
        $election = Election::factory()->create();
        $election->delete();
        $trashRecord = $this->makeTrashRecord($election, $user, now()->subDay());

        $this->artisan('trash:purge-expired')->assertExitCode(0);

        $this->assertNotNull($trashRecord->fresh()->force_deleted_at);
        $this->assertDatabaseMissing('elections', ['id' => $election->id]);
    }

    public function test_ne_purge_pas_les_elements_pas_encore_expires(): void
    {
        $user = User::factory()->create();
        $election = Election::factory()->create();
        $election->delete();
        $trashRecord = $this->makeTrashRecord($election, $user, now()->addDays(30));

        $this->artisan('trash:purge-expired')->assertExitCode(0);

        $this->assertNull($trashRecord->fresh()->force_deleted_at);
        $this->assertSoftDeleted('elections', ['id' => $election->id]);
    }

    public function test_ne_purge_pas_les_elements_deja_restaures(): void
    {
        $user = User::factory()->create();
        $election = Election::factory()->create();
        $election->delete();
        $trashRecord = $this->makeTrashRecord($election, $user, now()->subDay());
        $trashRecord->update(['restored_at' => now()]);

        $this->artisan('trash:purge-expired')->assertExitCode(0);

        $this->assertNull($trashRecord->fresh()->force_deleted_at);
    }

    public function test_dry_run_ne_purge_rien(): void
    {
        $user = User::factory()->create();
        $election = Election::factory()->create();
        $election->delete();
        $trashRecord = $this->makeTrashRecord($election, $user, now()->subDay());

        $this->artisan('trash:purge-expired --dry-run')->assertExitCode(0);

        $this->assertNull($trashRecord->fresh()->force_deleted_at);
        $this->assertSoftDeleted('elections', ['id' => $election->id]);
    }
}
