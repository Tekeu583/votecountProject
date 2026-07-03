<?php

namespace App\DTOs;

use Illuminate\Http\Request;

class PaginationDTO extends BaseDTO
{
    public function __construct(
        public int $page = 1,
        public int $perPage = 15,
        public ?string $sortBy = null,
        public ?string $sortOrder = 'desc',
        public ?array $filters = null,
        public ?array $with = null
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            page: (int) $request->get('page', 1),
            perPage: min((int) $request->get('per_page', 15), 100),
            sortBy: $request->get('sort_by'),
            sortOrder: $request->get('sort_order', 'desc'),
            filters: $request->get('filters'),
            with: $request->get('with') ? explode(',', $request->get('with')) : null
        );
    }

    public function getOffset(): int
    {
        return ($this->page - 1) * $this->perPage;
    }
}
