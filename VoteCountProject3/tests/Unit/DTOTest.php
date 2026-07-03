<?php

namespace Tests\Unit;

use App\DTOs\ApiResponseDTO;
use Tests\TestCase;

class DTOTest extends TestCase
{
    public function test_api_response_success_dto()
    {
        $response = ApiResponseDTO::success(['id' => 1], 'Success message');

        $this->assertTrue($response->success);
        $this->assertEquals('Success message', $response->message);
        $this->assertEquals(['id' => 1], $response->data);
    }

    public function test_api_response_error_dto()
    {
        $response = ApiResponseDTO::error('Error message', ['field' => 'Invalid']);

        $this->assertFalse($response->success);
        $this->assertEquals('Error message', $response->message);
        $this->assertEquals(['field' => 'Invalid'], $response->errors);
    }
}
