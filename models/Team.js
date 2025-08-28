// /server/models/Team.js
const mongoose = require('mongoose');
const teamSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
module.exports = mongoose.model('Team', teamSchema);