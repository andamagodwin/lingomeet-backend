const express = require('express');
const router = express.Router();
const callendarController = require('../controllers/callendarController');

// POST /api/meetings - Create a meeting
router.post('/create', callendarController.createMeeting);

// GET /api/meetings - Get user's scheduled meetings
// router.get('/', callendarController.getUserMeetings);
router.get('/get-meetings/:userId', callendarController.getMeetings);

module.exports = router;