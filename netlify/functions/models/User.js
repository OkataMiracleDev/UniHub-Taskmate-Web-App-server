const mongoose = require('mongoose');

// Define the User Schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Project Manager', 'Team Member'],
        default: 'Team Member'
    },
    profilePhoto: {
        type: String,
    },
    teamCode: {
        type: String,
        // The unique property has been removed to allow team members to share the same code.
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    date: {
        type: Date,
        default: Date.now
    }
});

// Create and export the User model from the schema
module.exports = mongoose.model('User', UserSchema);
