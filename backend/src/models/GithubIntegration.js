const mongoose = require('mongoose');
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
  const [ivHex, encHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

const githubIntegrationSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true,
  },
  repo_owner: { type: String, required: true },
  repo_name: { type: String, required: true },
  access_token_encrypted: { type: String, required: true },
  webhook_secret: { type: String, required: true },
  connected_at: { type: Date, default: Date.now },
  connected_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

githubIntegrationSchema.methods.getAccessToken = function () {
  return decrypt(this.access_token_encrypted);
};

githubIntegrationSchema.statics.encryptToken = function (token) {
  return encrypt(token);
};

module.exports = mongoose.model('GithubIntegration', githubIntegrationSchema);
