<?php

use Illuminate\Support\Facades\Route;

// API Version 1
Route::prefix('v1')->group(base_path('routes/v1/api_v1.php'));
