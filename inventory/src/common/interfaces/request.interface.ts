import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
  };
}
