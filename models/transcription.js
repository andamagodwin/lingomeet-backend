// models/Transcription.js
const mongoose = require('mongoose');

const transcriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['alur', 'luganda', 'acholi', 'english', 'luo'],
    default: 'english'
  },
  audioFileUrl: {
    type: String,
    required: false // Optional if you're handling text input directly
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
transcriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Transcription = mongoose.model('Transcription', transcriptionSchema);

module.exports = Transcription;