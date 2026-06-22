const { validationResult } = require('express-validator');
const Snippet = require('../models/Snippet');
const { logActivity } = require('../services/activityService');

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

module.exports = { listSnippets, createSnippet, getSnippet, updateSnippet, deleteSnippet };
