<?php

namespace App\Traits;

use App\DTOs\ApiResponseDTO;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

trait ApiResponseTrait
{
    protected function success(mixed $data = null, ?string $message = null, ?array $meta = null, int $statusCode = 200): JsonResponse
    {
        $response = ApiResponseDTO::success($data, $message, $meta, $statusCode);

        return response()->json($response->toArray(), $statusCode);
    }

    protected function error(string $message, ?array $errors = null, int $statusCode = 400): JsonResponse
    {
        $response = ApiResponseDTO::error($message, $errors, $statusCode);

        return response()->json($response->toArray(), $statusCode);
    }

    protected function validationError(array $errors, string $message = 'Validation failed'): JsonResponse
    {
        return $this->error($message, $errors, 422);
    }

    protected function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return $this->error($message, null, 404);
    }

    protected function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->error($message, null, 401);
    }

    protected function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return $this->error($message, null, 403);
    }

    protected function paginated(LengthAwarePaginator $paginator, ?string $resourceClass = null): JsonResponse
    {
        $data = $resourceClass ? $resourceClass::collection($paginator) : $paginator->items();

        return $this->success($data, null, [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ]);
    }

    protected function collection(Collection $collection, ?string $resourceClass = null): JsonResponse
    {
        $data = $resourceClass ? $resourceClass::collection($collection) : $collection;

        return $this->success($data);
    }

    protected function created(mixed $data = null, string $message = 'Resource created successfully'): JsonResponse
    {
        return $this->success($data, $message, null, 201);
    }

    protected function accepted(mixed $data = null, string $message = 'Request accepted for processing'): JsonResponse
    {
        return $this->success($data, $message, null, 202);
    }

    protected function noContent(string $message = 'Resource deleted successfully'): JsonResponse
    {
        return $this->success(null, $message, null, 204);
    }
}
