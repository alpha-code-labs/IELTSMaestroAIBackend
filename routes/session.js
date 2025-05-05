const express = require('express');
const router = express.Router();
const SessionCounter = require('../models/session');

// Route to handle session tracking
router.post('/track-session', async (req, res) => {
  try {
    // Extract sessionId from request body
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Find the counter document or create if it doesn't exist
    let counter = await SessionCounter.findOne();
    
    if (!counter) {
      counter = new SessionCounter({ 
        counter: 1,
        trackedSessions: [sessionId]
      });
    } else {
      // Check if this session ID has been tracked before
      if (!counter.trackedSessions.includes(sessionId)) {
        // Only increment the counter for new session IDs
        counter.counter += 1;
        // Add this session ID to the tracked list
        counter.trackedSessions.push(sessionId);
      }
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
