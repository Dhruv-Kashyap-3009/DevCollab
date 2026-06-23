const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireProjectMember } = require('../middleware/auth');
const { listIssues, createIssue, getIssue, updateIssue, deleteIssue, addComment } = require('../controllers/issueController');

const router = express.Router({ mergeParams: true });

router.use(authenticate, requireProjectMember('viewer'));

router.get('/', listIssues);
router.post('/', [body('title').trim().notEmpty().withMessage('Title is required')], createIssue);
router.get('/:issueId', getIssue);
router.patch('/:issueId', updateIssue);
router.delete('/:issueId', deleteIssue);
router.post('/:issueId/comments', addComment);

module.exports = router;