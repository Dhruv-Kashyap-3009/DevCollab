const { validationResult } = require('express-validator');
const Issue = require('../models/Issue');
const { logActivity } = require('../services/activityService');
const { broadcastToProject } = require('../websocket/wsServer');

const getNextIssueNumber = async (projectId) => {
  const last = await Issue.findOne({ project_id: projectId }).sort({ number: -1 });
  return last ? last.number + 1 : 1;
};

const listIssues = async (req, res, next) => {
  try {
    const { status, priority, assignee, label, page = 1, limit = 20 } = req.query;
    const filter = { project_id: req.params.id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee_id = assignee;
    if (label) filter.labels = label;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author_id', 'name email avatar_url')
        .populate('assignee_id', 'name email avatar_url')
        .lean(),
      Issue.countDocuments(filter),
    ]);

    res.json({ issues, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

const createIssue = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { title, body, status, priority, labels, assignee_id } = req.body;
    const number = await getNextIssueNumber(req.params.id);

    const issue = await Issue.create({
      project_id: req.params.id,
      number,
      title,
      body: body || '',
      status: status || 'open',
      priority: priority || 'medium',
      labels: labels || [],
      author_id: req.user._id,
      assignee_id: assignee_id || null,
    });

    const populated = await issue.populate([
      { path: 'author_id', select: 'name email avatar_url' },
      { path: 'assignee_id', select: 'name email avatar_url' },
    ]);

    await logActivity({
      project_id: req.params.id,
      user_id: req.user._id,
      type: 'issue_created',
      payload: { issueNumber: number, title },
    });

    broadcastToProject(req.params.id, { type: 'ISSUE_CREATED', issue: populated });
    res.status(201).json({ issue: populated });
  } catch (err) {
    next(err);
  }
};

const getIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findOne({ _id: req.params.issueId, project_id: req.params.id })
      .populate('author_id', 'name email avatar_url')
      .populate('assignee_id', 'name email avatar_url')
      .populate('comments.author_id', 'name email avatar_url');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ issue });
  } catch (err) {
    next(err);
  }
};

const updateIssue = async (req, res, next) => {
  try {
    const { title, body, status, priority, labels, assignee_id } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (body !== undefined) update.body = body;
    if (status !== undefined) update.status = status;
    if (priority !== undefined) update.priority = priority;
    if (labels !== undefined) update.labels = labels;
    if (assignee_id !== undefined) update.assignee_id = assignee_id || null;

    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.issueId, project_id: req.params.id },
      update,
      { new: true, runValidators: true }
    ).populate('author_id', 'name email avatar_url').populate('assignee_id', 'name email avatar_url');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const actType = update.status === 'closed' ? 'issue_closed' : update.status === 'open' ? 'issue_reopened' : 'issue_updated';
    await logActivity({ project_id: req.params.id, user_id: req.user._id, type: actType, payload: { issueNumber: issue.number, title: issue.title } });
    broadcastToProject(req.params.id, { type: 'ISSUE_UPDATED', issue });

    res.json({ issue });
  } catch (err) {
    next(err);
  }
};

const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findOneAndDelete({ _id: req.params.issueId, project_id: req.params.id });
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ message: 'Issue deleted' });
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ message: 'Comment body is required' });

    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.issueId, project_id: req.params.id },
      { $push: { comments: { body, author_id: req.user._id } } },
      { new: true }
    ).populate('comments.author_id', 'name email avatar_url');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const newComment = issue.comments[issue.comments.length - 1];
    await logActivity({ project_id: req.params.id, user_id: req.user._id, type: 'comment_added', payload: { issueNumber: issue.number } });
    broadcastToProject(req.params.id, { type: 'COMMENT_ADDED', issueId: req.params.issueId, comment: newComment });

    res.status(201).json({ comment: newComment });
  } catch (err) {
    next(err);
  }
};

module.exports = { listIssues, createIssue, getIssue, updateIssue, deleteIssue, addComment };
