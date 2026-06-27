const crypto = require('crypto');
const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const Invite = require('../models/Invite');
const Issue = require('../models/Issue');
const Snippet = require('../models/Snippet');
const Doc = require('../models/Doc');
const { logActivity } = require('../services/activityService');
const { broadcastToProject } = require('../websocket/wsServer');
const { sendInviteEmail } = require('../utils/sendEmail');

const listProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user_id': req.user._id })
      .populate('owner_id', 'name email avatar_url')
      .lean();

    const enriched = await Promise.all(projects.map(async (p) => {
      const [openIssues, totalSnippets, totalDocs] = await Promise.all([
        Issue.countDocuments({ project_id: p._id, status: { $ne: 'closed' } }),
        Snippet.countDocuments({ project_id: p._id }),
        Doc.countDocuments({ project_id: p._id }),
      ]);
      const userMember = p.members.find(m => m.user_id.toString() === req.user._id.toString());
      return { ...p, openIssues, totalSnippets, totalDocs, myRole: userMember?.role };
    }));

    res.json({ projects: enriched });
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description: description || '',
      owner_id: req.user._id,
      members: [{ user_id: req.user._id, role: 'owner' }],
    });

    await logActivity({ project_id: project._id, user_id: req.user._id, type: 'project_updated', payload: { action: 'created', name } });
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user_id', 'name email avatar_url github_username')
      .populate('owner_id', 'name email avatar_url');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const [openIssues, totalSnippets, totalDocs] = await Promise.all([
      Issue.countDocuments({ project_id: project._id, status: { $ne: 'closed' } }),
      Snippet.countDocuments({ project_id: project._id }),
      Doc.countDocuments({ project_id: project._id }),
    ]);

    res.json({ project, stats: { openIssues, totalSnippets, totalDocs, memberCount: project.members.length } });
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const update = {};
    if (name) update.name = name;
    if (description !== undefined) update.description = description;

    const project = await Project.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    await logActivity({ project_id: project._id, user_id: req.user._id, type: 'project_updated', payload: update });
    broadcastToProject(project._id, { type: 'PROJECT_UPDATED', project: { name: project.name, description: project.description } });

    res.json({ project });
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    if (req.memberRole !== 'owner') return res.status(403).json({ message: 'Only owner can delete project' });
    await Project.findByIdAndDelete(req.params.id);
    await Promise.all([
      Issue.deleteMany({ project_id: req.params.id }),
      Snippet.deleteMany({ project_id: req.params.id }),
      Doc.deleteMany({ project_id: req.params.id }),
    ]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

const inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'viewer' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!['editor', 'viewer'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const project = req.project;
    const invitedUser = await User.findOne({ email: email.toLowerCase() });

    if (invitedUser) {
      const alreadyMember = project.members.some(m => m.user_id.toString() === invitedUser._id.toString());
      if (alreadyMember) return res.status(409).json({ message: 'User is already a member' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Invite.create({
      project_id: project._id,
      email: email.toLowerCase(),
      token,
      role,
      expires_at: expiresAt,
      invited_by: req.user._id,
    });

    const inviteUrl = `${process.env.CLIENT_URL}/invite/${token}/accept`;

    try {
      await sendInviteEmail(email, inviteUrl, project.name, req.user.name);
    } catch (emailErr) {
      console.error('Email failed:', emailErr.message);
    }

    res.status(201).json({ message: 'Invite created', inviteUrl, token });
  } catch (err) {
    next(err);
  }
};

const acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const invite = await Invite.findOne({ token, accepted: false }).populate('project_id');
    if (!invite) return res.status(404).json({ message: 'Invalid or expired invite' });
    if (new Date() > invite.expires_at) return res.status(410).json({ message: 'Invite expired' });

    const project = await Project.findById(invite.project_id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const alreadyMember = project.members.some(m => m.user_id.toString() === req.user._id.toString());
    if (!alreadyMember) {
      project.members.push({ user_id: req.user._id, role: invite.role });
      await project.save();
      await logActivity({ project_id: project._id, user_id: req.user._id, type: 'member_added', payload: { role: invite.role } });
    }

    invite.accepted = true;
    await invite.save();

    res.json({ message: 'Joined project', project_id: project._id });
  } catch (err) {
    next(err);
  }
};

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject, inviteMember, acceptInvite };