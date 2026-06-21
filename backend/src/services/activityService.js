const Activity = require('../models/Activity');

const logActivity = async ({ project_id, user_id = null, type, payload = {} }) => {
  try {
    const activity = new Activity({ project_id, user_id, type, payload });
    await activity.save();
    return activity;
  } catch (err) {
    console.error('Failed to log activity:', err.message);
    return null;
  }
};

const getActivity = async (project_id, limit = 30) => {
  return Activity.find({ project_id })
    .sort({ created_at: -1 })
    .limit(limit)
    .populate('user_id', 'name email avatar_url')
    .lean();
};

module.exports = { logActivity, getActivity };
