"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pancakeAuthMiddleware = pancakeAuthMiddleware;
const env_1 = require("../config/env");
const crypto_util_1 = require("../utils/crypto.util");
const logger_1 = require("../utils/logger");
/**
 * Middleware to verify Pancake Webhook authenticity via HMAC signature or Token
 */
function pancakeAuthMiddleware(req, res, next) {
    // If no secret configured in .env, skip verification for easy local testing
    if (!env_1.env.PANCAKE_WEBHOOK_SECRET) {
        return next();
    }
    // 1. Check Signature Headers
    const signature = req.headers['x-pancake-signature'] ||
        req.headers['x-hub-signature-256'] ||
        req.headers['x-signature'];
    if (signature && req.rawBody) {
        const isValid = (0, crypto_util_1.verifyHmacSignature)(req.rawBody, signature, env_1.env.PANCAKE_WEBHOOK_SECRET);
        if (isValid) {
            return next();
        }
        logger_1.logger.warn({ signature }, 'Invalid Pancake HMAC signature');
    }
    // 2. Check Token in Query or Authorization Header (Bearer or Secret Token)
    const queryToken = req.query.secret || req.query.token;
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (queryToken === env_1.env.PANCAKE_WEBHOOK_SECRET ||
        bearerToken === env_1.env.PANCAKE_WEBHOOK_SECRET) {
        return next();
    }
    // If secret was configured but none of the verification methods matched:
    logger_1.logger.warn({
        ip: req.ip,
        headers: req.headers,
    }, 'Unauthorized Webhook request rejected');
    return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid webhook signature or token',
    });
}
//# sourceMappingURL=auth.middleware.js.map