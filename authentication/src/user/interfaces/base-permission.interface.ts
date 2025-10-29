import { AclInterface } from './acl-base.interface';

export interface PermissionInterface {
  shop_id: string;
  acls: AclInterface[];
}
