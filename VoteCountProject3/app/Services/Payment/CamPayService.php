<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;

class CamPayService
{
    protected string $baseUrl;
    protected string $token;

    public function __construct()
    {
        $this->baseUrl = config('services.campay.base_url');
        $this->token = config('services.campay.access_token');
    }

    public function requestPayment(array $data)
    {
        return Http::withHeaders([
            'Authorization' => 'Token ' . $this->token,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/collect/', $data);
    }

    public function getTransactionStatus(string $reference)
    {
        return Http::withHeaders([
            'Authorization' => 'Token ' . $this->token,
        ])->get($this->baseUrl . '/transaction/' . $reference . '/');
    }
}