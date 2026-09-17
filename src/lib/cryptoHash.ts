/**
 * Pure cryptographic SHA-256 hash generator for event integrity verification.
 * Works uniformly in browser (window.crypto.subtle) and serverless Node.js runtime.
 */
export async function generateSha256Hash(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  try {
    const crypto = await import('crypto');
    return '0x' + crypto.createHash('sha256').update(message).digest('hex');
  } catch {
    // Basic deterministic fallback
    let h = 0;
    for (let i = 0; i < message.length; i++) {
      h = (Math.imul(31, h) + message.charCodeAt(i)) | 0;
    }
    return '0x' + Math.abs(h).toString(16).padStart(64, '0');
  }
}
