<?php

namespace App\Http\Controllers\Api\V1\Results;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Jobs\CalculateElectionResults;
use App\Jobs\ExportResultsJob;
use App\Models\Election;
use App\Services\ResultService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ResultController extends BaseApiController
{
    protected ResultService $resultService;

    public function __construct(ResultService $resultService)
    {
        $this->resultService = $resultService;
    }

    /**
     * @OA\Get(
     *     path="/api/v1/elections/{election}/results/live",
     *     summary="Get live results",
     *     tags={"Results"},
     *
     *     @OA\Parameter(
     *         name="election",
     *         in="path",
     *         required=true,
     *
     *         @OA\Schema(type="string")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Live results"
     *     )
     * )
     */
    public function live(Election $election): JsonResponse
    {
        $this->authorize('viewResults', $election);

        $results = $this->resultService->getLiveResults($election);

        return $this->success($results);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/elections/{election}/results/final",
     *     summary="Get final results",
     *     tags={"Results"},
     *
     *     @OA\Parameter(
     *         name="election",
     *         in="path",
     *         required=true,
     *
     *         @OA\Schema(type="string")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Final results"
     *     )
     * )
     */
    public function final(Election $election): JsonResponse
    {
        $this->authorize('viewResults', $election);

        if ($election->status->value !== 'closed' && ! $election->public_results) {
            return $this->error('Results are not yet available', null, 403);
        }

        $latestSnapshot = $election->resultSnapshots()->latest()->first();

        if (! $latestSnapshot) {
            return $this->error('Results not calculated yet', null, 404);
        }

        return $this->success([
            'election_uuid' => $election->uuid,
            'title' => $election->title,
            'status' => $election->status->value,
            'total_votes' => $election->total_votes,
            'participation_rate' => $election->getParticipationRate(),
            'results' => $latestSnapshot->snapshot,
            'calculated_at' => $latestSnapshot->created_at->toIso8601String(),
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/elections/{election}/results/calculate",
     *     summary="Calculate election results",
     *     tags={"Results"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=202,
     *         description="Calculation started"
     *     )
     * )
     */
    public function calculate(Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        if ($election->status->value !== 'closed') {
            return $this->error('Results can only be calculated for closed elections', null, 400);
        }

        dispatch(new CalculateElectionResults($election));

        return $this->accepted(null, 'Result calculation started');
    }

    /**
     * @OA\Get(
     *     path="/api/v1/elections/{election}/results/export",
     *     summary="Export results",
     *     tags={"Results"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="format",
     *         in="query",
     *         required=false,
     *
     *         @OA\Schema(type="string", enum={"csv", "excel", "pdf"})
     *     ),
     *
     *     @OA\Response(
     *         response=202,
     *         description="Export started"
     *     )
     * )
     */
    public function export(Request $request, Election $election): JsonResponse
    {
        $this->authorize('viewResults', $election);

        $format = $request->get('format', 'excel');

        $exportJob = dispatch(new ExportResultsJob($election, Auth::user(), $format));

        return $this->accepted([
            'job_id' => $exportJob->job->getJobId(),
        ], 'Export started. You will receive a notification when ready.');
    }
}
