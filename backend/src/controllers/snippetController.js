const { validationResult } = require('express-validator');
const Snippet = require('../models/Snippet');
const { logActivity } = require('../services/activityService');
const GithubIntegration = require('../models/GithubIntegration');

function sanitizePath(rawPath) {
  const cleaned = (rawPath || '').replace(/^\/+/, '').trim();
  if (!cleaned) return null;
  const segments = cleaned.split('/');
  if (segments.some(seg => seg === '' || seg === '.' || seg === '..')) return null;
  return cleaned;
}

const listSnippets = async (req, res, next) => {
  try {
    const snippets = await Snippet.find({ project_id: req.params.id })
      .sort({ createdAt: -1 })
      .populate('author_id', 'name email avatar_url')
      .lean();
    res.json({ snippets });
  } catch (err) {
    next(err);
  }
};

const createSnippet = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { title, description, code, language, visibility } = req.body;
    const snippet = await Snippet.create({
      project_id: req.params.id,
      title,
      description: description || '',
      code,
      language: language || 'javascript',
      author_id: req.user._id,
      visibility: visibility || 'public',
    });

    await logActivity({ project_id: req.params.id, user_id: req.user._id, type: 'snippet_created', payload: { title } });
    const populated = await snippet.populate('author_id', 'name email avatar_url');
    res.status(201).json({ snippet: populated });
  } catch (err) {
    next(err);
  }
};

const getSnippet = async (req, res, next) => {
  try {
    const snippet = await Snippet.findOne({ _id: req.params.snippetId, project_id: req.params.id })
      .populate('author_id', 'name email avatar_url');
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });
    res.json({ snippet });
  } catch (err) {
    next(err);
  }
};

const updateSnippet = async (req, res, next) => {
  try {
    const { title, description, code, language, visibility } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (code !== undefined) update.code = code;
    if (language !== undefined) update.language = language;
    if (visibility !== undefined) update.visibility = visibility;

    const snippet = await Snippet.findOneAndUpdate(
      { _id: req.params.snippetId, project_id: req.params.id },
      update,
      { new: true, runValidators: true }
    ).populate('author_id', 'name email avatar_url');

    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });
    await logActivity({ project_id: req.params.id, user_id: req.user._id, type: 'snippet_updated', payload: { title: snippet.title } });
    res.json({ snippet });
  } catch (err) {
    next(err);
  }
};

const deleteSnippet = async (req, res, next) => {
  try {
    const snippet = await Snippet.findOneAndDelete({ _id: req.params.snippetId, project_id: req.params.id });
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });
    await logActivity({ project_id: req.params.id, user_id: req.user._id, type: 'snippet_deleted', payload: { title: snippet.title } });
    res.json({ message: 'Snippet deleted' });
  } catch (err) {
    next(err);
  }
};

const GITHUB_API = 'https://api.github.com';
const EXT_MAP = { javascript: 'js', typescript: 'ts', python: 'py', rust: 'rs', go: 'go', css: 'css', html: 'html', bash: 'sh', java: 'java', c: 'c', cpp: 'cpp', ruby: 'rb', php: 'php', json: 'json' };

function slugify(title) {
  return (title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'snippet';
}

function githubHeaders(token) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'DevCollab',
    'Content-Type': 'application/json',
  };
}

const pushSnippetToGitHub = async (req, res, next) => {
  try {
    const snippet = await Snippet.findOne({ _id: req.params.snippetId, project_id: req.params.id });
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });

    const integration = await GithubIntegration.findOne({ project_id: req.params.id });
    if (!integration) return res.status(400).json({ message: 'GitHub is not connected for this project' });

    const token = integration.getAccessToken();
    const branch = (req.body && req.body.branch) || 'main';
    const ext = EXT_MAP[snippet.language] || 'txt';
    let path;
    if (req.body && req.body.path) {
      path = sanitizePath(req.body.path);
      if (!path) return res.status(400).json({ message: 'Invalid file path' });
    } else {
      path = `snippets/${slugify(snippet.title)}.${ext}`;
    }

    let sha;
    const getRes = await fetch(
      `${GITHUB_API}/repos/${integration.repo_owner}/${integration.repo_name}/contents/${path}?ref=${branch}`,
      { headers: githubHeaders(token) }
    );
    if (getRes.status === 200) {
      const existing = await getRes.json();
      sha = existing.sha;
    } else if (getRes.status !== 404) {
      const body = await getRes.json().catch(() => ({}));
      return res.status(getRes.status).json({ message: body.message || 'Failed to check existing file' });
    }

    const putRes = await fetch(
      `${GITHUB_API}/repos/${integration.repo_owner}/${integration.repo_name}/contents/${path}`,
      {
        method: 'PUT',
        headers: githubHeaders(token),
        body: JSON.stringify({
          message: `${sha ? 'Update' : 'Add'} snippet: ${snippet.title}`,
          content: Buffer.from(snippet.code, 'utf8').toString('base64'),
          branch,
          ...(sha ? { sha } : {}),
        }),
      }
    );

    if (!putRes.ok) {
      const body = await putRes.json().catch(() => ({}));
      return res.status(putRes.status).json({ message: body.message || 'Failed to push snippet to GitHub' });
    }

    const result = await putRes.json();
    await logActivity({
      project_id: req.params.id,
      user_id: req.user._id,
      type: 'snippet_pushed',
      payload: { title: snippet.title, path, url: result.content && result.content.html_url },
    });

    res.json({
      message: 'Snippet pushed to GitHub',
      path,
      url: result.content && result.content.html_url,
      commitUrl: result.commit && result.commit.html_url,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listSnippets, createSnippet, getSnippet, updateSnippet, deleteSnippet, pushSnippetToGitHub };
