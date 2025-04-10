const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');


// POST /api/translate - Translate text
router.post('/translate', translationController.translateText);

module.exports = router;