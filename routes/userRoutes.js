// /server/routes/userRoutes.js
const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// @route GET /api/users/profile
// @desc Get current user's profile
// @access Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // req.user is populated by authMiddleware
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route GET /api/users/team
// @desc Get team members for a Project Manager
// @access Private
router.get('/team', authMiddleware, async (req, res) => {
    try {
        // Find the project manager by ID from the token
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        if (user.role !== 'Project Manager') {
            return res.status(403).json({ msg: 'Access denied.' });
        }
        
        // Find all team members that have the same teamCode as the Project Manager
        const teamMembers = await User.find({ teamCode: user.teamCode, role: 'Team Member' }).select('-password');
        res.json(teamMembers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
