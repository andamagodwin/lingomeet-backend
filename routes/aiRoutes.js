const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /api/ai - Get AI response
router.post('/generate', aiController.getAiResponse);

module.exports = router;