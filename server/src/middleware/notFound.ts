import { Request, Response } from 'express';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${_req.method} ${_req.originalUrl}`,
    },
  });
}
