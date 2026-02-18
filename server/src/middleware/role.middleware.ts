import { Request, Response, NextFunction } from 'express';
import { forbidden } from '../utils/response';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return forbidden(res, 'Authentication required');
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Requires role: ${roles.join(' or ')}`);
    }

    next();
  };
}

export function requireLeader(req: Request, res: Response, next: NextFunction) {
  return requireRole('Leader')(req, res, next);
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return forbidden(res, 'Authentication required');
  }

  if (!req.user.isSuperAdmin) {
    return forbidden(res, 'Super admin access required');
  }

  next();
}
