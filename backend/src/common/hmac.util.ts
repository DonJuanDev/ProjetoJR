import * as crypto from 'crypto';

/**
 * Compara dois hex tokens em tempo constante (evita timing attacks).
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(String(a).trim(), 'hex');
    const bb = Buffer.from(String(b).trim(), 'hex');
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function qrComandaPayloadMac(secret: string, comandaId: string, qrCodeHash: string): string {
  return crypto.createHmac('sha256', secret).update(`${comandaId}|${qrCodeHash}`).digest('hex');
}
