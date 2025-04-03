const User = require('../models/user');
const { verifyGoogleToken } = require('../config/googleAuth');
const jwt = require('jsonwebtoken');

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