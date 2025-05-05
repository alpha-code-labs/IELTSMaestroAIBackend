// models/listeningAssessment.js
const mongoose = require('mongoose');

// Schema for listening assessment
const listeningAssessmentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  assignment: { type: String, required: true },
  userResponse: { type: String, required: true },
  assessment: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
  counter: { type: Number, default: 1 },
  partType: { type: String, default: 'part1' }
});

// Create model
const ListeningAssessment = mongoose.model('ListeningAssessment', listeningAssessmentSchema);

module.exports = ListeningAssessment;