import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY_LENGTH = 32; // Length for AES-256

export function generateCryptingSecretKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

export function encrypt(text: string, secretKey: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return `${iv.toString('base64')}:${encrypted}`;
}

export function decrypt(encryptedText: string, secretKey: string): string {
  const [iv, encrypted] = encryptedText
    .split(':')
    .map((part) => Buffer.from(part, 'base64'));
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(
    encrypted.toString('base64'),
    'base64',
    'utf8',
  );
  decrypted += decipher.final('utf8');
  return decrypted;
}
