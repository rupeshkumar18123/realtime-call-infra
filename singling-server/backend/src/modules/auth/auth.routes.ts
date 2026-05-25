import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '@middleware/validate';
import { loginSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/token', validate(loginSchema), (req, res) => authController.issueToken(req, res));
