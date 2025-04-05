const { google } = require('google-auth-library');
const { v2: meetV2 } = require('@google-apps/meet');
const { SpacesServiceClient } = meetV2;

exports.createMeeting = async (req, res) => {
  try {
    // Extract credentials from request
    const { clientId, clientSecret, refreshToken } = req.body;

    // Initialize OAuth2 client
    const authClient = new google.auth.OAuth2(
      clientId,
      clientSecret
    );

    // Set credentials (including refresh token)
    authClient.setCredentials({
      refresh_token: refreshToken
    });

    // Initialize Meet client with proper authentication
    const meetClient = new SpacesServiceClient({
      auth: authClient  // This is the critical fix
    });

    // Create meeting
    const [response] = await meetClient.createSpace({});
    
    res.json({
      meetingUrl: response.meetingUri,
      message: 'Meeting created successfully'
    });

  } catch (error) {
    console.error('Full error:', error);
    res.status(500).json({
      error: 'Failed to create meeting',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};