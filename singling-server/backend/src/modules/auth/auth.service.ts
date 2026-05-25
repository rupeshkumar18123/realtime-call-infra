import jwt from 'jsonwebtoken';
import { config } from '@config/index';
import { JwtPayload, AuthTokens } from '@types/auth.types';

export class AuthService {
  /**
   * Issues a JWT for the given user identity.
   * In production, replace this with a real user lookup + password verification.
   */
  issueToken(userId: string, username: string): AuthTokens {
    const payload: JwtPayload = { sub: userId, username };
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });
    return { accessToken, expiresIn: config.jwt.expiresIn };
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  }
}

export const authService = new AuthService();
