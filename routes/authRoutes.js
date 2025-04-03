const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/google', authController.googleAuth);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;