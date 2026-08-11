const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const signTokens = (userId, tokenVersion = 0) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId, v: tokenVersion }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
        }

        const { name, email, password } = req.body;
        const existing = await User.findOne({ email: email.toLowerCase() });
        if(existing) return res.status(409).json({ message: 'Email already registered' });

        const user = await User.create({ name, email, password });
        const tokens = signTokens(user._id);

        res.status(201).json({ user: user.toPublic(), ...tokens });
    }catch(err){
        next(err);
    }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    const tokens = signTokens(user._id);
    res.json({ user: user.toPublic(), ...tokens });
  } catch (err) {
    next(err);
  }
};    const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Logout bumps token_version; any refresh token issued before it is dead.
    if (decoded.v !== user.token_version) {
      return res.status(401).json({ message: 'Refresh token revoked' });
    }

    const tokens = signTokens(user._id, user.token_version);
    res.json({ user: user.toPublic(), ...tokens });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    // Invalidate every refresh token issued before now.
    await User.findByIdAndUpdate(req.user._id, { $inc: { token_version: 1 } });
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    res.json({ user: req.user.toPublic() });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, me };