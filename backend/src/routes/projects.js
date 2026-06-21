const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireProjectMember } = require('../middleware/auth');
const { 
  listProjects, createProject, getProject, updateProject, deleteProject, inviteMember, acceptInvite
} = require('../controllers/projectController');

const router = express.Router();

router.get('/', authenticate, listProjects);
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
], createProject);
router.get('/:id', authenticate, requireProjectMember('viewer'), getProject);
router.patch('/:id', authenticate, requireProjectMember('editor'), updateProject);
router.delete('/:id', authenticate, requireProjectMember('owner'), deleteProject);
router.post('/:id/invite', authenticate, requireProjectMember('owner'), inviteMember);

module.exports = router;