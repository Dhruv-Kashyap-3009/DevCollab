const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireProjectMember = (minRole = 'viewer') => {
    const roleRank = { viewer: 0, editor: 1, owner: 2 };

    return async (req, res, next) => {
      try{
        const project = await Project.findById(req.params.id || req.params.projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const member = project.members.find(
          m => m.user_id.toString() === req.user._id.toString()
        );
        if (!member) return res.status(403).json({ message: 'Not a project member' });

        if (roleRank[member.role] < roleRank[minRole]) {
          return res.status(403).json({ message: `Requires ${minRole} role or higher` });
        }

        req.project = project;
        req.memberRole = member.role;
        next();
      }catch(err){
        next(err);
      }
    };
}

module.exports = { authenticate, requireProjectMember };