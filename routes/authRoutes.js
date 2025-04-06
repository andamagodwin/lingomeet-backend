const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/google', authController.googleAuth);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/callendar', authController.getAuthUrl); // Optional: If you want to handle Google OAuth flow in your app
router.get('/google/callback', authController.handleCallback); // Optional: Handle the callback from Google after authentication


module.exports = router;