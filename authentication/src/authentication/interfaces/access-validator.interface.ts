import { AclConfigInterface } from './acl-config.interface';
export interface AccessValidatorInterface {
    isValid(request: any, rolesReflection: string[], aclReflection?: AclConfigInterface[]): boolean | Promise<boolean>;
}
