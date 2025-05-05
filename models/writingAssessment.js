const mongoose = require('mongoose');

// Schema for writing assessment
const writingAssessmentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  assignment: { type: String, required: true },
  userResponse: { type: String, required: true },
  assessment: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
  counter: { type: Number, default: 1 },
  taskType: { type: String, default: 'task1' }
});

// Create model
const WritingAssessment = mongoose.model('WritingAssessment', writingAssessmentSchema);

module.exports = WritingAssessment;