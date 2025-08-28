// /server/controllers/taskController.js
const Task = require('../models/Task');
const User = require('../models/User');
const Team = require('../models/Team'); // This line was missing, I've added it.
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.assignTask = async (req, res) => {
  const { assignedToId, title, description } = req.body;
  try {
    const assignedBy = req.user.id;
    const task = new Task({ title, description, assignedTo: assignedToId, assignedBy });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id }).sort({ 'timestamps.assigned': -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedBy: req.user.id }).populate('assignedTo', 'name'); // Populate to get team member name
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};


exports.startTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.assignedTo.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Task not found or unauthorized' });
    }
    task.status = 'In Progress';
    task.timestamps.started = new Date();
    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.submitTask = async (req, res) => {
  const { deliverableLink, proofBase64 } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.assignedTo.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Task not found or unauthorized' });
    }

    let uploadedProof = null;
    if (proofBase64) {
      const result = await cloudinary.uploader.upload(proofBase64, { folder: 'task_proofs' });
      uploadedProof = result.secure_url;
    }

    task.status = 'Completed';
    task.timestamps.submitted = new Date();
    task.deliverableLink = deliverableLink;
    task.completionProof = uploadedProof;
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// Analytics for managers and members
exports.getManagerAnalytics = async (req, res) => {
  try {
    const team = await Team.findOne({ manager: req.user.id }).populate('members');
    
    // Check if the team exists before trying to access its properties.
    if (!team) {
      // If no team is found, return an empty analytics object.
      // This prevents the server from crashing.
      return res.status(200).json({});
    }

    const memberIds = team.members.map(member => member._id);
    const tasks = await Task.find({ assignedTo: { $in: memberIds }, status: 'Completed' });

    const analytics = {};
    team.members.forEach(member => {
      const memberTasks = tasks.filter(task => task.assignedTo.equals(member._id));
      const totalCompleted = memberTasks.length;
      const totalCompletionTime = memberTasks.reduce((acc, task) => {
        if (task.timestamps.started && task.timestamps.submitted) {
          const duration = task.timestamps.submitted.getTime() - task.timestamps.started.getTime();
          return acc + duration;
        }
        return acc;
      }, 0);
      const averageCompletionTime = totalCompleted > 0 ? totalCompletionTime / totalCompleted : 0;

      analytics[member._id] = {
        name: member.name,
        profilePhoto: member.profilePhoto,
        completedTasks: totalCompleted,
        averageCompletionTime: Math.round(averageCompletionTime / 1000 / 60) // in minutes
      };
    });

    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

exports.getMemberAnalytics = async (req, res) => {
  try {
    const completedTasks = await Task.find({ assignedTo: req.user.id, status: 'Completed' });
    const totalTasks = await Task.countDocuments({ assignedTo: req.user.id });

    const totalCompletionTime = completedTasks.reduce((acc, task) => {
      if (task.timestamps.started && task.timestamps.submitted) {
        const duration = task.timestamps.submitted.getTime() - task.timestamps.started.getTime();
        return acc + duration;
      }
      return acc;
    }, 0);

    const averageCompletionTime = completedTasks.length > 0 ? totalCompletionTime / completedTasks.length : 0;

    res.status(200).json({
      totalCompleted: completedTasks.length,
      totalTasks,
      averageCompletionTime: Math.round(averageCompletionTime / 1000 / 60) // in minutes
    });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};