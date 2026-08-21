"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyHmacSignature = verifyHmacSignature;
exports.hashString = hashString;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Verify HMAC-SHA256 signature of an incoming webhook payload
 * @param rawBody Raw buffer or string of request body
 * @param signature Received signature from Pancake headers
 * @param secret Webhook secret key
 */
function verifyHmacSignature(rawBody, signature, secret) {
    if (!signature || !secret) {
        return false;
    }
    try {
        // Format could be "sha256=hash" or just raw hash
        const cleanSignature = signature.startsWith('sha256=')
            ? signature.substring(7)
            : signature;
        const expectedHash = crypto_1.default
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');
        // Use timingSafeEqual to prevent timing attacks
        const sigBuffer = Buffer.from(cleanSignature, 'hex');
        const expectedBuffer = Buffer.from(expectedHash, 'hex');
        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }
        return crypto_1.default.timingSafeEqual(sigBuffer, expectedBuffer);
    }
    catch (error) {
        return false;
    }
}
/**
 * Generates MD5 / SHA256 hash of a string
 */
function hashString(input) {
    return crypto_1.default.createHash('sha256').update(input).digest('hex');
}
//# sourceMappingURL=crypto.util.js.map