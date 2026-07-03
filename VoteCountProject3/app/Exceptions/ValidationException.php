<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException as LaravelValidationException;

class ValidationException extends CustomException
{
    protected string $errorCode = 'VALIDATION_ERROR';

    protected int $httpStatusCode = 422;

    protected array $errors;

    public static function fromLaravel(LaravelValidationException $e): self
    {
        $instance = new self($e->getMessage(), $e->getCode(), $e->getPrevious());
        $instance->errors = $e->errors();

        return $instance;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error_code' => $this->getErrorCode(),
            'errors' => $this->getErrors(),
            'status_code' => $this->getHttpStatusCode(),
        ], $this->getHttpStatusCode());
    }
}
