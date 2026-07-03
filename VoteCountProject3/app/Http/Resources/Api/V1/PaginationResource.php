<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class PaginationResource extends ResourceCollection
{
    protected $resourceClass;

    public function __construct($resource, string $resourceClass)
    {
        $this->resourceClass = $resourceClass;
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->resourceClass::collection($this->collection),
            'meta' => [
                'current_page' => $this->resource->currentPage(),
                'last_page' => $this->resource->lastPage(),
                'per_page' => $this->resource->perPage(),
                'total' => $this->resource->total(),
                'from' => $this->resource->firstItem(),
                'to' => $this->resource->lastItem(),
            ],
        ];
    }
}
