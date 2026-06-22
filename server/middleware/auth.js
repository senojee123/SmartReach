import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartreach_secret_key_2026');

      // Get user from the token, exclude password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user?.role || 'Guest'}' is not authorized to access this route`
      });
    }
    next();
  };
};

import Board from '../models/Board.js';

// Protect device endpoints
export const protectDevice = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartreach_secret_key_2026');
      
      req.board = await Board.findById(decoded.boardId);

      if (!req.board) {
        return res.status(401).json({ message: 'Device not authorized, board not found' });
      }

      // Verify token matches active board mapping
      if (req.board.deviceToken !== token) {
        return res.status(401).json({ message: 'Device token mismatch or revoked' });
      }

      next();
    } catch (error) {
      console.error('Device Auth Error:', error.message);
      res.status(401).json({ message: 'Device not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Device not authorized, no token' });
  }
};
