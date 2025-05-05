// models/readingAssessment.js
const mongoose = require('mongoose');

// Schema for reading assessment
const readingAssessmentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  assignment: { type: String, required: true },
  userResponse: { type: String, required: true },
  assessment: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
  counter: { type: Number, default: 1 },
  textType: { type: String, default: 'text1' }
});

// Create model
const ReadingAssessment = mongoose.model('ReadingAssessment', readingAssessmentSchema);

module.exports = ReadingAssessment;