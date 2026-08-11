const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: [true, 'Name is required'],
        trim: true, 
        maxlength: [100, 'Name too long']
    }, 
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true, 
        trim: true
    }, 
    password: {
        type: String, 
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be atleast 8 characters'],
        select: false
    }, 
    avatar_url: {
        type: String,
        default: null
    },
    github_username: {
        type: String,
        default: null,
        trim: true
    },
    // Bumped on logout to invalidate every outstanding refresh token.
    token_version: {
        type: Number,
        default: 0
    },
    // GitHub personal access token, encrypted at rest. select:false so it is
    // never returned by queries unless explicitly requested, and toPublic()
    // below never exposes it — clients only ever see has_github_token.
    github_token: {
        type: String,
        default: null,
        select: false
    },
    has_github_token: {
        type: Boolean,
        default: false
    },
    github_token_updated_at: {
        type: Date,
        default: null
    }
}, {timestamps: true});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});``

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublic = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar_url: this.avatar_url,
    github_username: this.github_username,
    // Presence flag only — the token itself never leaves the server.
    has_github_token: !!this.has_github_token,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);