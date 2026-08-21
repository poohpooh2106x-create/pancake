import crypto from 'crypto';

/**
 * Verify HMAC-SHA256 signature of an incoming webhook payload
 * @param rawBody Raw buffer or string of request body
 * @param signature Received signature from Pancake headers
 * @param secret Webhook secret key
 */
export function verifyHmacSignature(
  rawBody: string | Buffer,
  signature: string | undefined | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Format could be "sha256=hash" or just raw hash
    const cleanSignature = signature.startsWith('sha256=')
      ? signature.substring(7)
      : signature;

    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    const sigBuffer = Buffer.from(cleanSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Generates MD5 / SHA256 hash of a string
 */
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
