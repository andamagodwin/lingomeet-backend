const { google } = require('googleapis');
const { SpacesServiceClient } = require('@google-apps/meet').v2beta;
const User = require('../models/user');

const createMeetSpace = async (req, res) => {
  const { userId } = req.body;

  try {
    // 1. Get user credentials
    const user = await User.findById(userId);
    if (!user?.googleRefreshToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // 2. Create proper auth client
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
      refresh_token: user.googleRefreshToken,
      access_token: user.googleAccessToken
    });

    // 3. Create auth client with universeDomain
    const authClient = {
      getClient: async () => auth,
      getProjectId: async () => process.env.GOOGLE_PROJECT_ID,
      getUniverseDomain: async () => 'googleapis.com' // THIS FIXES THE ERROR
    };

    // 4. Initialize Meet client
    const meetClient = new SpacesServiceClient({
      auth: authClient
    });

    // 5. Create space
    const [space] = await meetClient.createSpace({
      space: {
        config: {
          accessType: 'OPEN'
        }
      }
    });

    res.json({
      meetUrl: space.meetingUri,
      spaceName: space.name
    });

  } catch (error) {
    console.error('Meet API Error:', error);
    res.status(500).json({
      error: 'Failed to create Meet space',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * Gets meeting transcripts (if available)
 */
const getTranscripts = async (req, res) => {
  // Note: Transcripts API is NOT publicly available as of 2024
  res.status(501).json({ error: 'Transcripts API not yet available' });
};



exports.createMeetSpace = createMeetSpace;
exports.getTranscripts = getTranscripts;