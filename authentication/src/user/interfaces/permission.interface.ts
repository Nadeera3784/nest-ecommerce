import { Acl } from './acl.interface';
import { PermissionInterface } from './base-permission.interface';

export interface Permission extends PermissionInterface {
  acls: Acl[];
  role: string;
  user_id: string;
  has_acls(): boolean;
}
