const express = require('express');
const { authenticate, requireProjectMember } = require('../middleware/auth');
const {
  connectGitHub, disconnectGitHub, getGitHubStatus, fetchCommits, fetchPullRequests, fetchBranches, handleWebhook
} = require('../controllers/githubController');

const router = express.Router({ mergeParams: true });

router.post('/webhook/:projectId', handleWebhook);

router.post('/:id/github/connect', authenticate, requireProjectMember('owner'), connectGitHub);
router.get('/:id/github/status', authenticate, requireProjectMember('viewer'), getGitHubStatus);
router.delete('/:id/github/disconnect', authenticate, requireProjectMember('owner'), disconnectGitHub);
router.get('/:id/github/commits', authenticate, requireProjectMember('viewer'), fetchCommits);
router.get('/:id/github/pulls', authenticate, requireProjectMember('viewer'), fetchPullRequests);
router.get('/:id/github/branches', authenticate, requireProjectMember('viewer'), fetchBranches);

module.exports = router;