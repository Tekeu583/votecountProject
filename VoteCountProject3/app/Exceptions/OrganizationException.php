<?php

namespace App\Exceptions;

class OrganizationException extends CustomException
{
    protected string $errorCode = 'ORGANIZATION_ERROR';
    protected int $httpStatusCode = 400;

    public static function notFound(): self
    {
        return new self('Organization not found', 404);
    }

    public static function accessDenied(): self
    {
        return new self('Access denied to this organization', 403);
    }

    public static function userAlreadyInOrganization(): self
    {
        return new self('User is already a member of this organization', 400);
    }

    public static function cannotRemoveOwner(): self
    {
        return new self('Cannot remove the organization owner', 400);
    }

    public static function cannotChangeOwnerRole(): self
    {
        return new self('Cannot change the role of the organization owner', 400);
    }

    public static function hasActiveElections(): self
    {
        return new self('Cannot delete organization with active elections', 400);
    }

    public static function invalidSlug(): self
    {
        return new self('Invalid organization slug', 400);
    }
}