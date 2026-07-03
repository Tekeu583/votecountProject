<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $settings = SystemSetting::all();

        $formattedSettings = [];
        foreach ($settings as $setting) {
            $formattedSettings[$setting->key] = json_decode($setting->value, true);
        }

        return $this->success($formattedSettings);
    }

    public function update(Request $request): JsonResponse
    {
        $this->authorize('manage system');

        $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($request->settings as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => json_encode($value)]
            );
        }

        return $this->success(null, 'Settings updated successfully');
    }
}
