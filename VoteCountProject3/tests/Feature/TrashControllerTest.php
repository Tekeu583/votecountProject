<?php

namespace Tests\Feature;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Organization;
use App\Models\TrashRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Le modèle TrashRecord existait déjà en base (avec restore()/forceDelete()
 * implémentées) mais n'était jamais instancié nulle part — supprimer une
 * élection/un candidat se contentait d'un soft delete sans laisser aucune
 * trace exploitable pour une corbeille (liste/restauration/purge).
 */
class TrashControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_supprimer_une_election_cree_un_trash_record(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
        ]);
        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/elections/{$election->uuid}")->assertNoContent();

        $this->assertSoftDeleted('elections', ['id' => $election->id]);
        $trashRecord = TrashRecord::where('entity_type', Election::class)
            ->where('entity_id', $election->id)
            ->first();
        $this->assertNotNull($trashRecord);
        $this->assertEquals($org->id, $trashRecord->organization_id);
        $this->assertEquals($election->title, $trashRecord->entity_snapshot['title']);
    }

    public function test_supprimer_un_candidat_cree_un_trash_record_scope_a_lorganisation(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
        ]);
        $candidate = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        // CandidatePolicy::delete() vérifie manageCandidates(), qui lit le
        // pivot election_user — "created_by" seul (colonne Election) ne
        // suffit pas, il faut la ligne pivot elle-même.
        $election->users()->attach($owner->id, ['role_slug' => 'creator', 'joined_at' => now(), 'status' => 'active']);
        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/elections/{$election->uuid}/candidates/{$candidate->uuid}")
            ->assertNoContent();

        $trashRecord = TrashRecord::where('entity_type', Candidate::class)
            ->where('entity_id', $candidate->id)
            ->first();
        $this->assertNotNull($trashRecord);
        $this->assertEquals($org->id, $trashRecord->organization_id);
    }

    public function test_index_liste_la_corbeille_scopee_a_lorganisation(): void
    {
        $ownerA = User::factory()->create();
        $ownerB = User::factory()->create();
        $orgA = Organization::factory()->create(['owner_user_id' => $ownerA->id]);
        $orgB = Organization::factory()->create(['owner_user_id' => $ownerB->id]);
        $electionA = Election::factory()->create(['organization_id' => $orgA->id, 'created_by' => $ownerA->id]);
        $electionB = Election::factory()->create(['organization_id' => $orgB->id, 'created_by' => $ownerB->id]);

        Sanctum::actingAs($ownerA);
        $this->deleteJson("/api/v1/elections/{$electionA->uuid}")->assertNoContent();

        Sanctum::actingAs($ownerB);
        $this->deleteJson("/api/v1/elections/{$electionB->uuid}")->assertNoContent();

        Sanctum::actingAs($ownerA);
        $response = $this->getJson("/api/v1/trash?organization_uuid={$orgA->uuid}");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($electionA->title, $response->json('data.0.name'));
    }

    public function test_restore_restaure_lelection_supprimee(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
        ]);
        Sanctum::actingAs($owner);
        $this->deleteJson("/api/v1/elections/{$election->uuid}")->assertNoContent();
        $trashRecord = TrashRecord::where('entity_id', $election->id)->first();

        $this->postJson("/api/v1/trash/{$trashRecord->uuid}/restore")->assertOk();

        $this->assertDatabaseHas('elections', ['id' => $election->id, 'deleted_at' => null]);
        $this->assertNotNull($trashRecord->fresh()->restored_at);
    }

    public function test_force_delete_supprime_definitivement(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
        ]);
        Sanctum::actingAs($owner);
        $this->deleteJson("/api/v1/elections/{$election->uuid}")->assertNoContent();
        $trashRecord = TrashRecord::where('entity_id', $election->id)->first();

        $this->deleteJson("/api/v1/trash/{$trashRecord->uuid}")->assertOk();

        $this->assertDatabaseMissing('elections', ['id' => $election->id]);
        $this->assertNotNull($trashRecord->fresh()->force_deleted_at);
    }

    public function test_un_utilisateur_etranger_a_lorganisation_ne_peut_pas_restaurer(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
        ]);
        Sanctum::actingAs($owner);
        $this->deleteJson("/api/v1/elections/{$election->uuid}")->assertNoContent();
        $trashRecord = TrashRecord::where('entity_id', $election->id)->first();

        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger);

        $this->postJson("/api/v1/trash/{$trashRecord->uuid}/restore")->assertForbidden();
    }
}
