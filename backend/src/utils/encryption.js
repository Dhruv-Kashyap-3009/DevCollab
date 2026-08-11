const crypto = require('crypto');

const ALGO = 'aes-256-cbc';
const IV_LENGTH = 16;

function getKey() {
  const raw = process.env.ENCRYPTION_KEY || 'default_dev_key_32_chars_padded!!';
  return Buffer.from(raw.padEnd(32).slice(0, 32));
}

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return null;
  const [ivHex, encHex] = String(text).split(':');
  if (!ivHex || !encHex) return null;
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
