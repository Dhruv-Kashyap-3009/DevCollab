const mongoose = require('mongoose');

const memberSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'editor', 'viewer'],
        default: 'viewer'
    },
    joined_at: {
        type: Date,
        default: Date.now
    }
})

const projectSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name too long']
    },
    description: {
        type: String,
        default: '',
        maxlength: [500, 'Description too long']
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    github_repo: {
        type: String,
        default: null
    },
    members: [memberSchema]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);