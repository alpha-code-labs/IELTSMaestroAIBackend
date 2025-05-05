const mongoose = require('mongoose');

// Schema for session counter
const sessionSchema = new mongoose.Schema({
  counter: { type: Number, default: 0 }
});

// Create model
const SessionCounter = mongoose.model('IELTSUsers', sessionSchema);

module.exports = SessionCounter;