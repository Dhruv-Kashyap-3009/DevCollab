const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getGitHubTokenStatus,
  saveGitHubToken,
  deleteGitHubToken,
  listGitHubRepos,
} = require('../controllers/userController');

const router = express.Router();

router.get('/github-token', authenticate, getGitHubTokenStatus);
router.put('/github-token', authenticate, saveGitHubToken);
router.delete('/github-token', authenticate, deleteGitHubToken);
router.get('/github/repos', authenticate, listGitHubRepos);

module.exports = router;
