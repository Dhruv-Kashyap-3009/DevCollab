const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const githubIntegrationSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true,
  },
  repo_owner: { type: String, required: true },
  repo_name: { type: String, required: true },
  // Legacy field: connects before the user-level token stored the token here.
  // New connects store the token on the User record instead; this stays null.
  access_token_encrypted: { type: String, default: null },
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
