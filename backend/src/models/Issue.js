const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    body: { 
        type: String, 
        required: true 
    },
    author_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    created_at: { 
        type: Date, 
        default: Date.now
    },
});

const issueSchema = mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    number: {
        type: number,
        required: true
    },
    title: {
        type: String,
        required: [true , 'Title is required'],
        trim: true,
        maxlength: [300, 'Title too long']
    },
    body: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    labels: [
        { type: String, trim: true }
    ],
    author_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    comments: [
        commentSchema
    ],
    github_issue_number: {
        type: Number,
        default: null,
    }
}, { timestamps: true });

issueSchema.index({ project_id: 1, number: 1 }, { unique: true });
issueSchema.index({ project_id: 1, status: 1 });

module.exports = mongoose.model('Issue', issueSchema);