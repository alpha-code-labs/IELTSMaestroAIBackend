const mongoose = require('mongoose');
// Schema for session counter
const sessionSchema = new mongoose.Schema({
  counter: { type: Number, default: 0 },
  trackedSessions: { type: [String], default: [] }
});
// Create model
const SessionCounter = mongoose.model('IELTSUsers', sessionSchema);
module.exports = SessionCounter;
