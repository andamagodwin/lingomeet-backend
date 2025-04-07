// routes/transcriptionRoutes.js
const express = require('express');
const router = express.Router();
const transcriptionController = require('../controllers/transcriptionController');


// Create a new transcription
router.post('/', transcriptionController.createTranscription);

// Get all transcriptions for the authenticated user
router.get('/', transcriptionController.getUserTranscriptions);

// Get transcriptions by language
router.get('/language/:language', transcriptionController.getTranscriptionsByLanguage);

// Get a single transcription
router.get('/:id', transcriptionController.getTranscription);

// Update a transcription
router.patch('/:id', transcriptionController.updateTranscription);

// Delete a transcription
router.delete('/:id', transcriptionController.deleteTranscription);

module.exports = router;