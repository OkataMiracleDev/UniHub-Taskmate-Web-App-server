// /server/controllers/authController.js
const User = require('../models/User');
const Team = require('../models/Team');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const generateTeamCode = () => require('crypto').randomBytes(3).toString('hex').toUpperCase();
exports.register = async (req, res) => {
  const { name, email, password, role, teamCode, profilePhotoBase64 } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: 'User already exists' });
    let team;
    if (role === 'Project Manager') {
      const code = generateTeamCode();
      team = new Team({ code, manager: null, members: [] });
      await team.save();
    } else {
      team = await Team.findOne({ code: teamCode });
      if (!team) return res.status(400).json({ msg: 'Invalid team code' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const uploadedImage = await cloudinary.uploader.upload(profilePhotoBase64, { folder: 'profile_photos' });
    const user = new User({ name, email, password: hashedPassword, role, profilePhoto: uploadedImage.secure_url, team: team._id, teamCode });
    await user.save();
    if (role === 'Project Manager') {
      team.manager = user._id;
      await team.save();
    } else {
      team.members.push(user._id);
      await team.save();
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, teamCode: team.code, profilePhoto: user.profilePhoto } });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const team = await Team.findById(user.team);
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, teamCode: team.code, profilePhoto: user.profilePhoto } });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};