import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

interface TokenPayload {
  sub: string;
  role: string;
  isSuperAdmin: boolean;
}

export function signAccessToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function signRefreshToken(payload: TokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.verify(token, secret) as TokenPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
