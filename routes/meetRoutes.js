const express = require('express');
const MeetController = require('../controllers/meetController');

const router = express.Router();

// Schedule a new Google Meet
router.post('/schedule', MeetController.scheduleMeeting);

// Get user's scheduled meetings (optional extension)
// router.get('/meetings', MeetController.getUserMeetings);

// Cancel a meeting (optional extension)
// router.delete('/meetings/:meetingId', MeetController.cancelMeeting);

module.exports = router;