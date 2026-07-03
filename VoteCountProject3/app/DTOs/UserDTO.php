<?php

namespace App\DTOs;

use App\DTOs\BaseDTO;
use App\Enums\UserStatus;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;


class UserDTO extends BaseDTO
{
    public function __construct(
        public ?string $uuid = null,
        public ?string $firstName = null,
        public ?string $lastName = null,
        public ?string $email = null,
        public ?string $phone = null,
        public ?string $password = null,
        public ?string $photo = null,
        public ?string $gender = null,
        public ?string $country = null,
        public ?string $city = null,
        public ?string $locale = 'fr',
        public ?string $timezone = 'UTC',
        public ?UserStatus $status = UserStatus::PENDING_VERIFICATION
    ) {}

    public function getFullName(): string
    {
        return trim($this->firstName . ' ' . $this->lastName);
    }

    public static function fromRequest(RegisterRequest $request,?string $photoPath = null): self
    {
        return new self(
            firstName: $request->first_name,
            lastName: $request->last_name,
            email: $request->email,
            phone: $request->phone,
            password: $request->password,
            photo: $photoPath,
            gender: $request->gender,
            country: $request->country,
            city: $request->city,
            locale: $request->locale ?? 'fr',
            timezone: $request->timezone ?? 'UTC'
        );
    }
}
