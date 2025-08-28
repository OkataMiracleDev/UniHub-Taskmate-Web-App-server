// /server/models/Task.js
const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  completionProof: { type: String },
  deliverableLink: { type: String },
  notes: { type: String },
  timestamps: {
    assigned: { type: Date, default: Date.now },
    started: { type: Date },
    submitted: { type: Date }
  }
});
module.exports = mongoose.model('Task', taskSchema);