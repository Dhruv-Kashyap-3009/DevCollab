const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireProjectMember } = require('../middleware/auth');
const { listDocs, createDoc, getDoc, updateDoc, deleteDoc } = require('../controllers/docController');

const router = express.Router({ mergeParams: true });
router.use(authenticate, requireProjectMember('viewer'));

router.get('/', listDocs);
router.post('/', requireProjectMember('editor'), [body('title').trim().notEmpty().withMessage('Title is required')], createDoc);
router.get('/:docId', getDoc);
router.patch('/:docId', requireProjectMember('editor'), updateDoc);
router.delete('/:docId', requireProjectMember('editor'), deleteDoc);

module.exports = router;
