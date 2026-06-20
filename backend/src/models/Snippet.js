const mongoose = require('mongoose');

const snippetSchema = mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    }, 
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title too long']
    },
    description: {
        type: String,
        default:'',
        maxlength: [500, 'Description too long']
    }, 
    code: {
        type: String,
        required: [true, 'Code is required']
    },
    language: {
        type: String,
        required: [true, 'Language is required'],
        trim: true,
        default: 'javascript'
    },
    author_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    }
}, { timestamps : true });

module.exports = mongoose.model('Snippet', snippetSchema);