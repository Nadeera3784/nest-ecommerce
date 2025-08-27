import { AclInterface } from "./acl-base.interface";

export interface Acl extends AclInterface {
  original?: AclInterface;
}
