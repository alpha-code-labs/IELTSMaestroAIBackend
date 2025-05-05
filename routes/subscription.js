const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Create Schema for email subscriptions
const emailSubscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  sessionId: { type: String, required: true },
  section: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Create model (only if it doesn't exist already)
const EmailSubscription = mongoose.models.EmailSubscription || 
  mongoose.model('EmailSubscription', emailSubscriptionSchema);

// Route to handle subscriptions
router.post('/subscribe', async (req, res) => {
  try {
    const { email, sessionId, section } = req.body;
    
    // Validate required fields
    if (!email || !sessionId || !section) {
      return res.status(400).json({
        success: false,
        message: 'Email, session ID, and section are required'
      });
    }
    
    
    // Create new subscription document
    const subscription = new EmailSubscription({
      email,
      sessionId,
      section,
      timestamp: new Date()
    });
    
    // Save to database
    await subscription.save();
    
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Subscription completed successfully'
    });
    
  } catch (error) {
    
    // Check for duplicate key error (if email is unique and already exists)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You are already subscribed with this email'
      });
    }
    
    // General error response
    res.status(500).json({
      success: false,
      message: 'Error processing subscription request',
      error: error.message
    });
  }
});

module.exports = router;