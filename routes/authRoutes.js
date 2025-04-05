const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/api/auth/google', authController.googleAuth);
router.post('/api/auth/refresh-token', authController.refreshToken);
router.post('/api/auth/logout', authController.logout);
router.get('/api/auth/callendar', authController.getAuthUrl); // Optional: If you want to handle Google OAuth flow in your app
router.get('/api/auth/google/callback', authController.handleCallback); // Optional: Handle the callback from Google after authentication


module.exports = router;