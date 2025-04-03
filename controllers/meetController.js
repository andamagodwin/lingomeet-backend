const { google } = require('googleapis');
const User = require('../models/user');
const { OAuth2Client } = require('google-auth-library');

class MeetController {
  static async scheduleMeeting(req, res) {
    try {
      const { userId, title, description, startTime, endTime, attendees } = req.body;
      
      // 1. Get user with refresh token
      const user = await User.findById(userId);
      if (!user || !user.refreshToken) {
        return res.status(401).json({ error: 'User not authenticated with Google' });
      }

      // 2. Create and configure OAuth client
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      // 3. Set credentials and handle token refresh
      oauth2Client.setCredentials({
        refresh_token: user.refreshToken
      });

      // 4. Create calendar service
      const calendar = google.calendar({
        version: 'v3',
        auth: oauth2Client
      });

      // 5. Create meeting event
      const event = {
        summary: title,
        description: description,
        start: { 
          dateTime: new Date(startTime).toISOString(),
          timeZone: 'UTC'
        },
        end: { 
          dateTime: new Date(endTime).toISOString(),
          timeZone: 'UTC'
        },
        conferenceData: {
          createRequest: {
            requestId: Math.random().toString(36).substring(2, 15),
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        },
        attendees: attendees.map(email => ({ email })),
      };

      const { data } = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
      });

      res.status(201).json({
        success: true,
        meetingLink: data.hangoutLink,
        event: data
      });

    } catch (error) {
      console.error('Meet scheduling error:', error);
      
      // Handle specific Google auth errors
      if (error.response && error.response.data && error.response.data.error === 'invalid_grant') {
        return res.status(401).json({
          success: false,
          error: 'Google authentication expired',
          details: 'Please re-authenticate with Google'
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Failed to schedule meeting',
        details: error.message 
      });
    }
  }
}

module.exports = MeetController;