<?php

namespace Tests\Feature;

use App\DTOs\ElectionDTO;
use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Services\ElectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Régression : public_weight/jury_weight (vote_type = weighted) étaient
 * validés par CreateElectionRequest/UpdateElectionRequest mais jamais
 * transmis à la base — ElectionDTO n'avait pas ces champs, donc
 * ElectionService::create()/createDraft()/update() les ignoraient
 * silencieusement et l'élection gardait les défauts DB (1.0 / 0), rendant
 * la notation du jury sans aucun effet sur le score final.
 */
class ElectionWeightPersistenceTest extends TestCase
{
    use RefreshDatabase;

    protected ElectionService $electionService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->electionService = app(ElectionService::class);
    }

    private function weightedDto(array $overrides = []): ElectionDTO
    {
        return new ElectionDTO(
            title: 'Élection pondérée',
            voteType: 'weighted',
            startAt: now()->addDay(),
            endAt: now()->addDays(2),
            publicWeight: $overrides['publicWeight'] ?? 0.6,
            juryWeight: $overrides['juryWeight'] ?? 0.4,
        );
    }

    public function test_createDraft_persiste_les_poids_public_et_jury(): void
    {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create();

        $election = $this->electionService->createDraft($organization, $creator, $this->weightedDto());

        $this->assertEquals(0.6, (float) $election->fresh()->public_weight);
        $this->assertEquals(0.4, (float) $election->fresh()->jury_weight);
    }

    public function test_createDraft_sans_poids_fournis_retombe_sur_les_defauts(): void
    {
        $organization = Organization::factory()->create();
        $creator = User::factory()->create();

        $dto = new ElectionDTO(
            title: 'Élection simple',
            voteType: 'single',
            startAt: now()->addDay(),
            endAt: now()->addDays(2),
        );

        $election = $this->electionService->createDraft($organization, $creator, $dto);

        $this->assertEquals(1.0, (float) $election->fresh()->public_weight);
        $this->assertEquals(0.0, (float) $election->fresh()->jury_weight);
    }

    public function test_update_persiste_les_nouveaux_poids(): void
    {
        $election = Election::factory()->create([
            'vote_type' => 'weighted',
            'status' => 'draft',
            'public_weight' => 1.0,
            'jury_weight' => 0.0,
        ]);

        $dto = new ElectionDTO(
            title: $election->title,
            publicWeight: 0.7,
            juryWeight: 0.3,
        );

        $this->electionService->update($election, $dto);

        $this->assertEquals(0.7, (float) $election->fresh()->public_weight);
        $this->assertEquals(0.3, (float) $election->fresh()->jury_weight);
    }

    public function test_update_sans_poids_fournis_conserve_les_valeurs_existantes(): void
    {
        $election = Election::factory()->create([
            'vote_type' => 'weighted',
            'status' => 'draft',
            'public_weight' => 0.6,
            'jury_weight' => 0.4,
        ]);

        $dto = new ElectionDTO(title: 'Nouveau titre');

        $this->electionService->update($election, $dto);

        $this->assertEquals(0.6, (float) $election->fresh()->public_weight);
        $this->assertEquals(0.4, (float) $election->fresh()->jury_weight);
    }
}
