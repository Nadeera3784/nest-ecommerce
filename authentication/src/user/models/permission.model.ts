import { Permission } from '../interfaces';
import { Document } from 'mongoose';

export interface PermissionModel extends Permission, Document {

}
