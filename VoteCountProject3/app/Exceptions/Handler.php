<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontReport = [
        //
    ];

    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            if (app()->bound('sentry')) {
                app('sentry')->captureException($e);
            }
        });
    }

    public function render($request, Throwable $e)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    protected function handleApiException($request, Throwable $e): JsonResponse
    {
        // Log the error
        Log::channel('audit')->error('API Exception', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'request' => [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ],
        ]);

        // Custom exceptions
        if ($e instanceof CustomException) {
            return $e->render();
        }

        // Validation exception
        if ($e instanceof ValidationException) {
            return ValidationException::fromLaravel($e)->render();
        }

        // Model not found
        if ($e instanceof ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found',
                'error_code' => 'MODEL_NOT_FOUND',
                'status_code' => 404,
            ], 404);
        }

        // Not found HTTP exception
        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Endpoint not found',
                'error_code' => 'ENDPOINT_NOT_FOUND',
                'status_code' => 404,
            ], 404);
        }

        // Method not allowed
        if ($e instanceof MethodNotAllowedHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Method not allowed',
                'error_code' => 'METHOD_NOT_ALLOWED',
                'status_code' => 405,
            ], 405);
        }

        // Authentication exception
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
                'error_code' => 'UNAUTHENTICATED',
                'status_code' => 401,
            ], 401);
        }

        // Default error for production
        if (! config('app.debug')) {
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred',
                'error_code' => 'INTERNAL_SERVER_ERROR',
                'status_code' => 500,
            ], 500);
        }

        // Development error with details
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'error_code' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTrace(),
            'status_code' => method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500,
        ], method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500);
    }
}
