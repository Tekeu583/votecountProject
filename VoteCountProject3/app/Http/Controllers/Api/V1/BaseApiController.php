<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

abstract class BaseApiController extends Controller
{
    use AuthorizesRequests, ApiResponseTrait;
    protected function logInfo(string $message, array $context = []): void
    {
        Log::channel('audit')->info($message, array_merge($context, [
            'user_id' => Auth::user()->id,
            'ip' => request()->ip(),
        ]));
    }

    protected function logError(string $message, array $context = []): void
    {
        Log::channel('audit')->error($message, array_merge($context, [
            'user_id' => Auth::user()->id,
            'ip' => request()->ip(),
        ]));
    }

    protected function getRequestId(): ?string
    {
        return request()->header('X-Request-Id');
    }

    protected function getTraceId(): ?string
    {
        return request()->header('X-Trace-Id');
    }
}
