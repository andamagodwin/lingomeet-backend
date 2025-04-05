const express = require('express');
const router = express.Router();
const { createMeetSpace, getTranscripts } = require('../controllers/meetController');

// POST /api/meet/create
router.post('/create', createMeetSpace);

// GET /api/meet/transcripts/:meetingId
router.get('/transcripts/:meetingId', getTranscripts);

module.exports = router;