// /server/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const { assignTask, getMyTasks, getAssignedTasks, startTask, submitTask, getManagerAnalytics, getMemberAnalytics } = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// Manager routes
router.post('/assign', protect, authorize('Project Manager'), assignTask);
router.get('/analytics/manager', protect, authorize('Project Manager'), getManagerAnalytics);
router.get('/assigned', protect, authorize('Project Manager'), getAssignedTasks); // New route for the manager's assigned tasks

// Team Member routes
router.get('/my', protect, authorize('Team Member'), getMyTasks);
router.put('/start/:id', protect, authorize('Team Member'), startTask);
router.put('/submit/:id', protect, authorize('Team Member'), submitTask);
router.get('/analytics/member', protect, authorize('Team Member'), getMemberAnalytics);

module.exports = router;