<?php

namespace App\Jobs;

use App\Jobs\CheckPaymentStatus;
use App\Models\Vote;
use App\Services\PaymentGateway;
use App\Services\PaymentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessVotePayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    protected Vote $vote;

    public function __construct(Vote $vote)
    {
        $this->vote = $vote;
    }

    public function handle(PaymentService $paymentService, PaymentGateway $gateway): void
    {
        $providers = $gateway->enabledProviders();

        if (empty($providers)) {
            $this->vote->markAsFailed();
            return;
        }
        $provider = $providers[0]; // premier provider disponible

        $transaction = $paymentService->processPayment(
            $this->vote,
            $provider,
            null
        );


        // Poll for payment status
        dispatch(new CheckPaymentStatus($transaction))->delay(now()->addSeconds(5));
    }
}
