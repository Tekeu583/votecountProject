<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CsrfController extends Controller
{
    /**
     * Return a CSRF cookie for SPA authentication
     */
    public function cookie(Request $request)
    {
        // Laravel automatically sets the XSRF-TOKEN cookie
        // We just need to return a response that includes the cookie
        return response()->json(['message' => 'CSRF cookie set'])
            ->cookie(
                'XSRF-TOKEN',
                $request->session()->token(),
                120, // minutes
                '/',
                null,
                false,
                false
            );
    }
}