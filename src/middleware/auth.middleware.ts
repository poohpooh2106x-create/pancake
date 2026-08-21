import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { verifyHmacSignature } from '../utils/crypto.util';
import { logger } from '../utils/logger';

export interface AuthenticatedWebhookRequest extends Request {
  rawBody?: Buffer;
}

/**
 * Middleware to verify Pancake Webhook authenticity via HMAC signature or Token
 */
export function pancakeAuthMiddleware(
  req: AuthenticatedWebhookRequest,
  res: Response,
  next: NextFunction
) {
  // If no secret configured in .env, skip verification for easy local testing
  if (!env.PANCAKE_WEBHOOK_SECRET) {
    return next();
  }

  // 1. Check Signature Headers
  const signature =
    (req.headers['x-pancake-signature'] as string) ||
    (req.headers['x-hub-signature-256'] as string) ||
    (req.headers['x-signature'] as string);

  if (signature && req.rawBody) {
    const isValid = verifyHmacSignature(req.rawBody, signature, env.PANCAKE_WEBHOOK_SECRET);
    if (isValid) {
      return next();
    }
    logger.warn({ signature }, 'Invalid Pancake HMAC signature');
  }

  // 2. Check Token in Query or Authorization Header (Bearer or Secret Token)
  const queryToken = req.query.secret || req.query.token;
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (
    queryToken === env.PANCAKE_WEBHOOK_SECRET ||
    bearerToken === env.PANCAKE_WEBHOOK_SECRET
  ) {
    return next();
  }

  // If secret was configured but none of the verification methods matched:
  logger.warn(
    {
      ip: req.ip,
      headers: req.headers,
    },
    'Unauthorized Webhook request rejected'
  );

  return res.status(401).json({
    success: false,
    error: 'Unauthorized: Invalid webhook signature or token',
  });
}
