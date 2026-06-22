const express = require('express');
const { authenticate, requireProjectMember } = require('../middleware/auth');
const { listActivity } = require('../controllers/activityController');

const router = express.Router({ mergeParams: true });
router.get('/', authenticate, requireProjectMember('viewer'), listActivity);

module.exports = router;
