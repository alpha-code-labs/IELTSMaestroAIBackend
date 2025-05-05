const mongoose = require('mongoose');

// Schema for section attempts
const sectionAttemptSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  counter: { type: Number, default: 1 },
  lastAttempt: { type: Date, default: Date.now }
});

// Create section-specific models
const WritingUsers = mongoose.model('WritingUsers', sectionAttemptSchema);
const ReadingUsers = mongoose.model('ReadingUsers', sectionAttemptSchema);
const ListeningUsers = mongoose.model('ListeningUsers', sectionAttemptSchema);
const SpeakingUsers = mongoose.model('SpeakingUsers', sectionAttemptSchema);

module.exports = {
  WritingUsers,
  ReadingUsers,
  ListeningUsers,
  SpeakingUsers
};