const crypto = require('crypto');
const fetch = require('node-fetch');
const GithubIntegration = require('../models/GithubIntegration');
const Project = require('../models/Project');
const Issue = require('../models/Issue');
const { logActivity } = require('../services/activityService');
const { broadcastToProject } = require('../websocket/wsServer');

const GITHUB_API = 'https://api.github.com';

function githubHeaders(token) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'DevCollab',
    'Content-Type': 'application/json',
  };
}

async function githubFetch(url, token) {
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (res.status === 401) throw Object.assign(new Error('GitHub token is invalid or expired'), { status: 401 });
  if (res.status === 404) throw Object.assign(new Error('GitHub repository not found'), { status: 404 });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message || 'GitHub API error: ' + res.status), { status: res.status });
  }
  return res.json();
}

const connectGitHub = async (req, res, next) => {
  try {
    const { repo_owner, repo_name, access_token } = req.body;
    if (!repo_owner || !repo_name || !access_token) {
      return res.status(400).json({ message: 'repo_owner, repo_name, and access_token are required' });
    }
    try {
      await githubFetch(GITHUB_API + '/repos/' + repo_owner + '/' + repo_name, access_token);
    } catch (err) {
      return res.status(err.status || 400).json({ message: 'GitHub verification failed: ' + err.message });
    }
    const webhook_secret = crypto.randomBytes(24).toString('hex');
    const encrypted = GithubIntegration.encryptToken(access_token);
    const integration = await GithubIntegration.findOneAndUpdate(
      { project_id: req.params.id },
      { project_id: req.params.id, repo_owner, repo_name, access_token_encrypted: encrypted, webhook_secret, connected_at: new Date(), connected_by: req.user._id },
      { upsert: true, new: true }
    );
    await Project.findByIdAndUpdate(req.params.id, { github_repo: repo_owner + '/' + repo_name });
    await logActivity({ project_id: req.params.id, user_id: req.user._id, type: 'github_connected', payload: { repo: repo_owner + '/' + repo_name } });
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const webhookUrl = baseUrl + '/api/github/webhook/' + req.params.id;
    res.status(201).json({ message: 'GitHub connected successfully', webhookUrl, webhookSecret: webhook_secret, repo: repo_owner + '/' + repo_name, connectedAt: integration.connected_at });
  } catch (err) { next(err); }
};

const disconnectGitHub = async (req, res, next) => {
  try {
    await GithubIntegration.findOneAndDelete({ project_id: req.params.id });
    await Project.findByIdAndUpdate(req.params.id, { github_repo: null });
    await logActivity({ project_id: req.params.id, user_id: req.user._id, type: 'github_disconnected', payload: {} });
    res.json({ message: 'GitHub disconnected' });
  } catch (err) { next(err); }
};

const getGitHubStatus = async (req, res, next) => {
  try {
    const integration = await GithubIntegration.findOne({ project_id: req.params.id });
    if (!integration) return res.json({ connected: false });
    res.json({ connected: true, repo_owner: integration.repo_owner, repo_name: integration.repo_name, repo: integration.repo_owner + '/' + integration.repo_name, connected_at: integration.connected_at });
  } catch (err) { next(err); }
};

const fetchCommits = async (req, res, next) => {
  try {
    const integration = await GithubIntegration.findOne({ project_id: req.params.id });
    if (!integration) return res.status(404).json({ message: 'GitHub not connected' });
    const token = integration.getAccessToken();
    const data = await githubFetch(GITHUB_API + '/repos/' + integration.repo_owner + '/' + integration.repo_name + '/commits?per_page=20', token);
    const commits = data.map(c => ({ sha: c.sha.slice(0, 7), fullSha: c.sha, message: c.commit.message.split('\n')[0], author: c.commit.author.name, date: c.commit.author.date, url: c.html_url }));
    res.json({ commits });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

const fetchPullRequests = async (req, res, next) => {
  try {
    const integration = await GithubIntegration.findOne({ project_id: req.params.id });
    if (!integration) return res.status(404).json({ message: 'GitHub not connected' });
    const token = integration.getAccessToken();
    const data = await githubFetch(GITHUB_API + '/repos/' + integration.repo_owner + '/' + integration.repo_name + '/pulls?state=all&per_page=20', token);
    const pulls = data.map(pr => ({ number: pr.number, title: pr.title, state: pr.merged_at ? 'merged' : pr.state, author: pr.user && pr.user.login, created_at: pr.created_at, updated_at: pr.updated_at, url: pr.html_url, mergeable_state: pr.mergeable_state }));
    res.json({ pulls });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

const fetchBranches = async (req, res, next) => {
  try {
    const integration = await GithubIntegration.findOne({ project_id: req.params.id });
    if (!integration) return res.status(404).json({ message: 'GitHub not connected' });
    const token = integration.getAccessToken();
    const data = await githubFetch(GITHUB_API + '/repos/' + integration.repo_owner + '/' + integration.repo_name + '/branches', token);
    const branches = data.map(b => ({ name: b.name, sha: b.commit && b.commit.sha && b.commit.sha.slice(0, 7), protected: b.protected }));
    res.json({ branches });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const integration = await GithubIntegration.findOne({ project_id: projectId });
    if (!integration) return res.status(404).json({ message: 'Integration not found' });
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return res.status(400).json({ message: 'Missing signature' });
    const rawBody = JSON.stringify(req.body);
    const expected = 'sha256=' + crypto.createHmac('sha256', integration.webhook_secret).update(rawBody).digest('hex');
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return res.status(401).json({ message: 'Invalid signature' });
    }
    const event = req.headers['x-github-event'];
    const payload = req.body;
    if (event === 'ping') return res.json({ ok: true });
    if (event === 'push') {
      const branch = payload.ref && payload.ref.replace('refs/heads/', '');
      const commits = (payload.commits || []).slice(0, 5).map(c => ({ sha: c.id.slice(0, 7), message: c.message.split('\n')[0], author: c.author && c.author.name, url: c.url }));
      const pusher = payload.pusher && payload.pusher.name || 'Someone';
      await logActivity({ project_id: projectId, type: 'github_push', payload: { branch, commits, pusher } });
      broadcastToProject(projectId, { type: 'GITHUB_PUSH', branch, commits, pusher, timestamp: new Date().toISOString() });
    }
    if (event === 'pull_request') {
      const pr = payload.pull_request;
      const action = payload.action;
      broadcastToProject(projectId, { type: 'GITHUB_PR', action, number: pr.number, title: pr.title, url: pr.html_url, state: pr.merged_at ? 'merged' : pr.state, author: pr.user && pr.user.login, timestamp: new Date().toISOString() });
      await logActivity({ project_id: projectId, type: 'github_pr', payload: { action, number: pr.number, title: pr.title } });
    }
    if (event === 'issues') {
      const ghIssue = payload.issue;
      const action = payload.action;
      if (action === 'opened') {
        const existing = await Issue.findOne({ project_id: projectId, github_issue_number: ghIssue.number });
        if (!existing) {
          const lastIssue = await Issue.findOne({ project_id: projectId }).sort({ number: -1 });
          const number = lastIssue ? lastIssue.number + 1 : 1;
          await Issue.create({ project_id: projectId, number, title: '[GH#' + ghIssue.number + '] ' + ghIssue.title, body: ghIssue.body || '', status: 'open', priority: 'medium', labels: (ghIssue.labels || []).map(function(l) { return l.name; }), author_id: null, github_issue_number: ghIssue.number });
        }
      }
      if (action === 'closed') {
        await Issue.findOneAndUpdate({ project_id: projectId, github_issue_number: ghIssue.number }, { status: 'closed' });
      }
    }
    res.json({ received: true });
  } catch (err) { next(err); }
};

module.exports = { connectGitHub, disconnectGitHub, getGitHubStatus, fetchCommits, fetchPullRequests, fetchBranches, handleWebhook };
