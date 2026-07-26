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
    }
}, {timestamps: true});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

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
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);