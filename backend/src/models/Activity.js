const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'issue_created', 'issue_updated', 'issue_closed', 'issue_reopened',
      'comment_added', 'snippet_created', 'snippet_updated', 'snippet_deleted',
      'doc_created', 'doc_updated', 'doc_deleted',
      'member_added', 'member_removed',
      'github_connected', 'github_disconnected', 'github_push', 'github_pr',
      'project_updated',
    ],
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

activitySchema.index({ project_id: 1, created_at: -1 });

module.exports = mongoose.model('Activity', activitySchema);