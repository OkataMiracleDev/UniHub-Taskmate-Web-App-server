// /server/controllers/userController.js
const User = require('../models/User');

exports.getTeamMembers = async (req, res) => {
    try {
        // Manager's teamCode is stored in req.user after authentication
        const teamMembers = await User.find({ teamCode: req.user.teamCode, role: 'Team Member' }).select('-password -__v');
        res.status(200).json(teamMembers);
    } catch (error) {
        res.status(500).json({ msg: 'Server error fetching team members', error: error.message });
    }
};
