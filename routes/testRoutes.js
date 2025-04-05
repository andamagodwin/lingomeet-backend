const express = require('express');
const router = express.Router();
const meetController = require('../controllers/testController');

// POST /api/meetings - Create a meeting
router.post('/meetings', meetController.createMeeting);

module.exports = router;