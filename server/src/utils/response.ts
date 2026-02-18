import { Response } from 'express';

interface SuccessResponse<T> {
  ok: true;
  data: T;
}

interface ErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

interface ErrorResponse {
  ok: false;
  error: ErrorDetail;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function success<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ ok: true, data } as SuccessResponse<T>);
}

export function created<T>(res: Response, data: T) {
  return success(res, data, 201);
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function badRequest(res: Response, message: string, details?: unknown) {
  return res.status(400).json({
    ok: false,
    error: { code: 'VALIDATION_ERROR', message, details },
  } as ErrorResponse);
}

export function unauthorized(res: Response, message = 'Authentication required') {
  return res.status(401).json({
    ok: false,
    error: { code: 'UNAUTHORIZED', message },
  } as ErrorResponse);
}

export function forbidden(res: Response, message = 'Insufficient permissions') {
  return res.status(403).json({
    ok: false,
    error: { code: 'FORBIDDEN', message },
  } as ErrorResponse);
}

export function notFound(res: Response, message = 'Resource not found') {
  return res.status(404).json({
    ok: false,
    error: { code: 'NOT_FOUND', message },
  } as ErrorResponse);
}

export function conflict(res: Response, message: string) {
  return res.status(409).json({
    ok: false,
    error: { code: 'CONFLICT', message },
  } as ErrorResponse);
}

export function internalError(res: Response, message = 'Internal server error') {
  return res.status(500).json({
    ok: false,
    error: { code: 'INTERNAL_ERROR', message },
  } as ErrorResponse);
}
