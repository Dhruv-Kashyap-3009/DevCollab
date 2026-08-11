const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');

const GITHUB_API = 'https://api.github.com';

function githubHeaders(token) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'DevCollab',
    'Content-Type': 'application/json',
  };
}

// Load a user's stored GitHub token (decrypted). Returns null when absent.
async function getUserGitHubToken(userId) {
  const user = await User.findById(userId).select('+github_token');
  if (!user || !user.github_token) return null;
  return decrypt(user.github_token);
}

// GET /api/user/github-token — presence flag only, never the token itself.
const getGitHubTokenStatus = async (req, res, next) => {
  try {
    res.json({
      hasToken: !!req.user.has_github_token,
      updatedAt: req.user.github_token_updated_at || null,
    });
  } catch (err) { next(err); }
};

// PUT /api/user/github-token — validate against GitHub before saving, so a
// typo or a dead token is rejected the moment it's pasted.
const saveGitHubToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token || !String(token).trim()) {
      return res.status(400).json({ message: 'GitHub token is required' });
    }

    const ghRes = await fetch(GITHUB_API + '/user', { headers: githubHeaders(String(token).trim()) });
    if (!ghRes.ok) {
      if (ghRes.status === 401) {
        return res.status(400).json({ message: 'GitHub token is invalid or expired' });
      }
      return res.status(400).json({ message: 'GitHub rejected the token: ' + ghRes.status });
    }

    // Classic PATs report their scopes here; fine-grained tokens leave it empty.
    const scopes = (ghRes.headers.get('x-oauth-scopes') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    req.user.github_token = encrypt(String(token).trim());
    req.user.has_github_token = true;
    req.user.github_token_updated_at = new Date();
    await req.user.save();

    res.json({ hasToken: true, updatedAt: req.user.github_token_updated_at, scopes });
  } catch (err) { next(err); }
};

// DELETE /api/user/github-token — clear the credential. Repo links on projects
// stay intact; connects/fetches simply start asking for a token again.
const deleteGitHubToken = async (req, res, next) => {
  try {
    req.user.github_token = null;
    req.user.has_github_token = false;
    req.user.github_token_updated_at = null;
    await req.user.save();
    res.json({ hasToken: false });
  } catch (err) { next(err); }
};

// GET /api/user/github/repos — the user's repos, used by the repo picker.
const listGitHubRepos = async (req, res, next) => {
  try {
    const token = await getUserGitHubToken(req.user._id);
    if (!token) {
      return res.status(400).json({ code: 'NO_TOKEN', message: 'Add your GitHub token in Settings first' });
    }
    const ghRes = await fetch(GITHUB_API + '/user/repos?per_page=100&sort=updated', { headers: githubHeaders(token) });
    if (ghRes.status === 401) {
      return res.status(401).json({ code: 'TOKEN_INVALID', message: 'Your GitHub token is invalid or expired — update it in Settings' });
    }
    if (!ghRes.ok) {
      return res.status(ghRes.status).json({ message: 'GitHub API error: ' + ghRes.status });
    }
    const data = await ghRes.json();
    res.json({ repos: data.map(r => ({ full_name: r.full_name, name: r.name, private: !!r.private })) });
  } catch (err) { next(err); }
};

module.exports = { getGitHubTokenStatus, saveGitHubToken, deleteGitHubToken, listGitHubRepos, getUserGitHubToken };
