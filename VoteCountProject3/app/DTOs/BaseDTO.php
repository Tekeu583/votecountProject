<?php

namespace App\DTOs;

use Illuminate\Support\Arr;
use JsonSerializable;

abstract class BaseDTO implements JsonSerializable
{
    public function toArray(): array
    {
        return get_object_vars($this);
    }

    public function jsonSerialize(): array
    {
        return $this->toArray();
    }

    public static function fromArray(array $data): static
    {
        $dto = new static;
        foreach ($data as $key => $value) {
            if (property_exists($dto, $key)) {
                $dto->$key = $value;
            }
        }

        return $dto;
    }

    public function only(array $keys): array
    {
        return Arr::only($this->toArray(), $keys);
    }

    public function except(array $keys): array
    {
        return Arr::except($this->toArray(), $keys);
    }
}
