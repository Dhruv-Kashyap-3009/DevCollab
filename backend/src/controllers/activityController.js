const { getActivity } = require('../services/activityService');

const listActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const activities = await getActivity(req.params.id, limit);
    res.json({ activities });
  } catch (err) {
    next(err);
  }
};

module.exports = { listActivity };
