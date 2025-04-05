const { google } = require('googleapis');
const User = require('../models/user');
const Meeting = require('../models/meeting'); // Assuming you have a Meeting model

const createMeeting = async (req, res) => {
  const { 
    userId,
    title,
    description,
    startTime,
    endTime,
    timeZone,
    attendees 
  } = req.body;

  if (!userId || !title || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Get user and set up OAuth client
    const user = await User.findById(userId);
    if (!user || !user.googleRefreshToken) {
      return res.status(401).json({ error: 'User not authenticated with Google' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // 2. Set credentials with automatic token refresh
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiry
    });

    // 3. Handle token refresh automatically
    oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        user.googleRefreshToken = tokens.refresh_token;
      }
      if (tokens.access_token) {
        user.googleAccessToken = tokens.access_token;
        user.googleTokenExpiry = tokens.expiry_date;
        user.save();
      }
    });

    // 4. Create the calendar event
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: title,
      description: description || 'Meeting created via API',
      start: {
        dateTime: startTime,
        timeZone: timeZone || 'UTC'
      },
      end: {
        dateTime: endTime,
        timeZone: timeZone || 'UTC'
      },
      conferenceData: {
        createRequest: {
          requestId: require('crypto').randomBytes(16).toString('hex'),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      attendees: attendees ? attendees.map(email => ({ email })) : [],
      reminders: {
        useDefault: true
      }
    };

    // 5. Insert the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    const meeting = new Meeting({
      userId,
      eventId: response.data.id,
      title,
      description,
      startTime: new Date(response.data.start.dateTime),
      endTime: new Date(response.data.end.dateTime),
      timeZone: response.data.start.timeZone,
      meetLink: response.data.hangoutLink,
      calendarLink: response.data.htmlLink,
      attendees: response.data.attendees?.map(a => ({
        email: a.email,
        responseStatus: a.responseStatus
      })) || []
    });
    await meeting.save();





    // 6. Return meeting details
    res.json({
      meetLink: response.data.hangoutLink,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      startTime: response.data.start.dateTime,
      endTime: response.data.end.dateTime
    });

  } catch (error) {
    console.error('Error creating meeting:', error.message);
    
    if (error.code === 401) {
      // Token expired or revoked
      return res.status(401).json({ error: 'Google authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ 
      error: 'Failed to create meeting',
      details: error.message 
    });
  }
};


exports.getMeetings = async (req, res) => {
  const { userId } = req.params;

  try {
    const meetings = await Meeting.find({ userId })
      .sort({ startTime: 1 })
      .lean();

    res.json(meetings.map(m => ({
      id: m._id,
      title: m.title,
      startTime: m.startTime,
      endTime: m.endTime,
      meetLink: m.meetLink,
      attendees: m.attendees
    })));
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
};



exports.createMeeting = createMeeting;


