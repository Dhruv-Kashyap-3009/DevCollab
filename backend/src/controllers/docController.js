const { validationResult } = require('express-validator');
const Doc = require('../models/Doc');
const { logActivity } = require('../services/activityService');
const { broadcastToProject } = require('../websocket/wsServer');

const listDocs = async (req, res, next) => {
  try {
    const docs = await Doc.find({ project_id: req.params.id })
      .sort({ updatedAt: -1 })
      .populate('author_id', 'name email avatar_url')
      .populate('last_edited_by', 'name email avatar_url')
      .lean();
    res.json({ docs });
  } catch (err) {
    next(err);
  }
};

const createDoc = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { title, content } = req.body;
    const doc = await Doc.create({
      project_id: req.params.id,
      title,
      content: content || '',
      author_id: req.user._id,
    });

    await logActivity({ project_id: req.params.id, user_id: req.user._id, type: 'doc_created', payload: { title } });
    const populated = await doc.populate('author_id', 'name email avatar_url');
    res.status(201).json({ doc: populated });
  } catch (err) {
    next(err);
  }
};

const getDoc = async (req, res, next) => {
  try {
    const doc = await Doc.findOne({ _id: req.params.docId, project_id: req.params.id })
      .populate('author_id', 'name email avatar_url')
      .populate('last_edited_by', 'name email avatar_url');
    if (!doc) return res.status(404).json({ message: 'Doc not found' });
    res.json({ doc });
  } catch (err) {
    next(err);
  }
};

const updateDoc = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const update = { last_edited_by: req.user._id };
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;

    const doc = await Doc.findOneAndUpdate(
      { _id: req.params.docId, project_id: req.params.id },
      update,
      { new: true, runValidators: true }
    ).populate('author_id', 'name email avatar_url').populate('last_edited_by', 'name email avatar_url');

    if (!doc) return res.status(404).json({ message: 'Doc not found' });

    await logActivity({ project_id: req.params.id, user_id: req.user._id, type: 'doc_updated', payload: { title: doc.title } });
    broadcastToProject(req.params.id, { type: 'DOC_UPDATED', docId: doc._id, title: doc.title, editorName: req.user.name });

    res.json({ doc });
  } catch (err) {
    next(err);
  }
};

const deleteDoc = async (req, res, next) => {
  try {
    const doc = await Doc.findOneAndDelete({ _id: req.params.docId, project_id: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Doc not found' });
    await logActivity({ project_id: req.params.id, user_id: req.user._id, type: 'doc_deleted', payload: { title: doc.title } });
    res.json({ message: 'Doc deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listDocs, createDoc, getDoc, updateDoc, deleteDoc };