<?php

namespace App\DTOs;

class ApiResponseDTO extends BaseDTO
{
    public function __construct(
        public bool $success,
        public mixed $data = null,
        public ?string $message = null,
        public ?array $errors = null,
        public ?array $meta = null,
        public int $statusCode = 200
    ) {}

    public static function success(mixed $data = null, ?string $message = null, ?array $meta = null, int $statusCode = 200): self
    {
        return new self(true, $data, $message, null, $meta, $statusCode);
    }

    public static function error(string $message, ?array $errors = null, int $statusCode = 400): self
    {
        return new self(false, null, $message, $errors, null, $statusCode);
    }

    public static function validationError(array $errors, string $message = 'Validation failed'): self
    {
        return self::error($message, $errors, 422);
    }

    public static function notFound(string $message = 'Resource not found'): self
    {
        return self::error($message, null, 404);
    }

    public static function unauthorized(string $message = 'Unauthorized'): self
    {
        return self::error($message, null, 401);
    }

    public static function forbidden(string $message = 'Forbidden'): self
    {
        return self::error($message, null, 403);
    }
}
