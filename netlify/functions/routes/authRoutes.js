const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const router = express.Router();

// Helper function to generate a JWT token.
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Set up multer for file uploads.
// Using memory storage to get the file as a buffer.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

// @route POST /api/auth/register
// @desc Register a new user
// @access Public
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
  const { name, email, password, role, teamCode } = req.body;
  const profilePhotoFile = req.file;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Check if a file was uploaded
    if (!profilePhotoFile) {
        return res.status(400).json({ msg: 'Profile photo is required.' });
    }

    // Convert image buffer to Base64 string
    const profilePhotoBase64 = `data:${profilePhotoFile.mimetype};base64,${profilePhotoFile.buffer.toString('base64')}`;
    
    // Check team code if the role is a Team Member
    // This is the key change to fix the "invalid team code" error for Project Managers.
    let team;
    if (role === 'Team Member') {
      if (!teamCode) {
        return res.status(400).json({ msg: 'Team code is required for team members.' });
      }
      team = await User.findOne({ teamCode, role: 'Project Manager' });
      if (!team) {
        return res.status(400).json({ msg: 'Invalid team code.' });
      }
    }

    // Create a new user instance
    user = new User({
      name,
      email,
      password,
      role,
      profilePhoto: profilePhotoBase64,
      teamCode: role === 'Project Manager' ? Math.random().toString(36).substring(2, 8) : teamCode,
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save the user
    await user.save();

    // Generate token and send response
    const token = generateToken(user._id);
    res.status(201).json({
      msg: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamCode: user.teamCode,
        profilePhoto: user.profilePhoto,
      },
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route POST /api/auth/login
// @desc Authenticate user & get token
// @access Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate token and send response
    const token = generateToken(user._id);
    res.json({
      msg: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamCode: user.teamCode,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Export the router
module.exports = router;
