import { ExecutionContext } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';

import { AclConfigInterface, AccessValidatorInterface } from '../interfaces';

const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;

export declare class JwtAuthGuard extends JwtAuthGuard_base {
    protected readonly reflector: Reflector;
    protected readonly discovery: DiscoveryService;
    protected validators: AccessValidatorInterface[];
    constructor(reflector: Reflector, discovery: DiscoveryService);
    getValidators(): Promise<AccessValidatorInterface[]>;
    canActivate(context: ExecutionContext): Promise<boolean>;
    protected validate(request: any, rolesReflection: string[], aclReflection: AclConfigInterface[]): Promise<boolean>;
    protected getRequest(context: ExecutionContext): any;
    private extractRequiredRolesReflection;
    private extractAclReflection;
    private extractIsOwnerReflection;
}
export {};
