// controllers/transcriptionController.js
const Transcription = require('../models/transcription');


// Create a new transcription
exports.createTranscription = async (req, res) => {
  try {
    const { title, content, language } = req.body;
    const userId = req.user._id; // Assuming you have authentication middleware

    const transcription = new Transcription({
      userId,
      title,
      content,
      language
    });

    await transcription.save();
    res.status(201).json(transcription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all transcriptions for a user
exports.getUserTranscriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    const transcriptions = await Transcription.find({ userId })
      .sort({ createdAt: -1 });
    res.json(transcriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single transcription
exports.getTranscription = async (req, res) => {
  try {
    const transcription = await Transcription.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    res.json(transcription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a transcription
exports.updateTranscription = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'content', 'language', 'status'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates!' });
    }

    const transcription = await Transcription.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    updates.forEach(update => transcription[update] = req.body[update]);
    await transcription.save();

    res.json(transcription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a transcription
exports.deleteTranscription = async (req, res) => {
  try {
    const transcription = await Transcription.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    res.json({ message: 'Transcription deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get transcriptions by language
exports.getTranscriptionsByLanguage = async (req, res) => {
  try {
    const { language } = req.params;
    const userId = req.user._id;

    if (!['alur', 'luganda', 'acholi', 'english', 'luo'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language specified' });
    }

    const transcriptions = await Transcription.find({ 
      userId,
      language 
    }).sort({ createdAt: -1 });

    res.json(transcriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};