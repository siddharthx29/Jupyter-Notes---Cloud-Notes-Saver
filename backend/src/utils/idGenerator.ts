import { customAlphabet } from 'nanoid';

// Use a safe, URL-friendly 62-character alphabet (A-Z, a-z, 0-9)
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generate4 = customAlphabet(alphabet, 4);

/**
 * Generates a cryptographically secure random 4-character public ID for note URLs.
 * Example output: 'a7K9' (4 characters)
 */
export function generatePublicId(length = 4): string {
  if (length === 4) return generate4();
  return customAlphabet(alphabet, length)();
}
