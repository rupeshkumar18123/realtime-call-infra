import { Request, Response } from 'express';
import { authService } from './auth.service';

export class AuthController {
  /**
   * POST /api/v1/auth/token
   * Demo endpoint — issues a JWT for any userId/username pair.
   * Replace with real auth (DB lookup, password hash) in production.
   */
  issueToken(req: Request, res: Response): void {
    const { userId, username } = req.body as { userId: string; username: string };
    const tokens = authService.issueToken(userId, username);
    res.status(200).json({ success: true, data: tokens });
  }
}

export const authController = new AuthController();
