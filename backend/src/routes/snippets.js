const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireProjectMember } = require('../middleware/auth');
const { listSnippets, createSnippet, getSnippet, updateSnippet, deleteSnippet } = require('../controllers/snippetController');

const router = express.Router({ mergeParams: true });
router.use(authenticate, requireProjectMember('viewer'));

router.get('/', listSnippets);
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('code').notEmpty().withMessage('Code is required'),
  body('language').notEmpty().withMessage('Language is required'),
], createSnippet);
router.get('/:snippetId', getSnippet);
router.patch('/:snippetId', updateSnippet);
router.delete('/:snippetId', deleteSnippet);

module.exports = router;
