const express = require('express');
const router = express.Router();
const SessionCounter = require('../models/session');

// Route to handle session tracking
router.post('/track-session', async (req, res) => {
  try {
    // Find the counter document or create if it doesn't exist
    let counter = await SessionCounter.findOne();
    
    if (!counter) {
      counter = new SessionCounter({ counter: 1 });
    } else {
      // Increment the counter
      counter.counter += 1;
    }
    
    // Save the updated counter
    await counter.save();
    
    
    res.status(200).json({ 
      success: true, 
      message: 'Session tracked successfully',
      count: counter.counter
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error tracking session'
    });
  }
});

module.exports = router;