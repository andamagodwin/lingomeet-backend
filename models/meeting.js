const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  // Reference to the user who created the meeting
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Google Calendar event ID
  eventId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Meeting details
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // Time details
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  timeZone: {
    type: String,
    default: 'UTC'
  },
  
  // Google Meet link
  meetLink: {
    type: String,
    required: true
  },
  
  // Calendar HTML link
  calendarLink: {
    type: String,
    required: true
  },
  
  // Attendees list
  attendees: [{
    email: String,
    responseStatus: {
      type: String,
      enum: ['needsAction', 'declined', 'tentative', 'accepted'],
      default: 'needsAction'
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Add index for faster user-based queries
meetingSchema.index({ userId: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);