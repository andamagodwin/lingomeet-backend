const User = require('../models/user');
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const { verifyGoogleToken } = require('../config/googleAuth');
const jwt = require('jsonwebtoken');


const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'https://api.lingomeet.space/api/auth/google/callback', // Must match EXACTLY

});


// Disable PKCE explicitly
oauth2Client._clientIdVerifier = null;
oauth2Client._codeVerifier = null;

exports.getAuthUrl = async (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar','https://www.googleapis.com/auth/meetings.space.created','openid', 'email', 'profile'],
    prompt: 'consent' // Forces refresh_token every time (optional)
  });
  res.redirect(authUrl);
};


exports.handleCallback = async (req, res) => {
  const { code } = req.query;
  console.log('Authorization code:', code);
  console.log('Using Client ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('Using Redirect URI:', process.env.GOOGLE_REDIRECT_URI);

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-error?message=Missing+code`);
  }

  try {

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    // Disable PKCE explicitly
    oauth2Client._clientIdVerifier = null;
    oauth2Client._codeVerifier = null;



    // 1. Get tokens from the code
    const { tokens } = await oauth2Client.getToken({code, redirect_uri: process.env.GOOGLE_REDIRECT_URI});
    console.log('Tokens:', tokens);

    if (!tokens || !tokens.id_token) {
      throw new Error('Failed to get tokens from Google');
    }
    

    // 2. Verify ID token and get user payload
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Failed to get user payload from token');
    }

    const { sub: googleId, email, name, picture } = payload;

    // 3. Find or create the user
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        picture,
      });
    }

    // 4. Update token data and last activity
    user.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
    }
    user.lastActive = Date.now();
    await user.save();

    console.log('✅ Google Access Token:', tokens.access_token);
    console.log('🔄 Google Refresh Token:', tokens.refresh_token || 'No new refresh token (might be already granted)');

    // 5. Redirect back to frontend with success
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/schedule?auth=success`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('🚨 Error during Google callback:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }

    const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-error?message=${errorMessage}`;
    res.redirect(redirectUrl);
  }
};






const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

exports.googleAuth = async (req, res) => {
  try {
    if (!req.body.credential) {
      return res.status(400).json({ error: 'Credential is required' });
    }

    const { payload, error } = await verifyGoogleToken(req.body.credential);
    if (error) {
      return res.status(401).json({ error });
    }
    console.log('Google payload:', payload);

    let user = await User.findOne({ googleId: payload.sub });
    
    if (!user) {
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    user.lastActive = Date.now();
    user.tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      },
      accessToken
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// In controllers/authController.js - refreshToken function
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.sendStatus(401);
  
    try {
      const user = await User.findOne({ refreshToken }).select('+refreshToken');
      if (!user) return res.sendStatus(403);
  
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
        if (err || user._id.toString() !== decoded.userId) return res.sendStatus(403);
        
        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        
        // Update refresh token in DB
        user.refreshToken = newRefreshToken;
        user.lastActive = Date.now();
        await user.save();
  
        // Set new refresh token in cookie
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
  
        res.json({ accessToken });
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.sendStatus(500);
    }
  };

exports.logout = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.sendStatus(204);

  try {
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie('refreshToken');
    res.sendStatus(204);
  } catch (error) {
    console.error('Logout error:', error);
    res.sendStatus(500);
  }
};