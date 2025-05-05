// routes/readingRoutes.js
const express = require('express');
const router = express.Router();
const { ReadingUsers } = require('../models/sectionAttempt');
const ReadingAssessment = require('../models/readingAssessment');
const { handleSectionAttempt } = require('../services/utils');
const { 
  generateReadingText1,
  generateReadingText2, 
  assessReadingSubmission 
} = require('../services/claudeReading');

// Reading attempt route for Text 1
router.post('/reading-attempt', async (req, res) => {
  try {
    const { sessionId, timestamp } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Call Claude API to get the reading text
    try {
      // Get the assignment from Claude
      const responseContent = await generateReadingText1();
      
      // After getting Claude's response, track the attempt in MongoDB
      const result = await ReadingUsers.findOneAndUpdate(
        { sessionId: sessionId },
        { 
          $inc: { counter: 1 },
          lastAttempt: new Date(timestamp) 
        },
        { 
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );
      
      // Send the reading text back to the frontend
      return res.status(200).json({
        success: true,
        message: 'Reading assignment retrieved',
        assignment: responseContent,
        count: result.counter,
        isNew: result.counter === 1
      });
      
    } catch (error) {
      // If Claude API fails, use a fallback assignment
      const fallbackAssignment = "The koala is a small marsupial native to Australia. It spends most of its time in eucalyptus trees and feeds almost exclusively on eucalyptus leaves. Koalas sleep for up to 20 hours a day and are primarily nocturnal animals. Their slow metabolism helps them conserve energy. Question: According to the passage, what is the koala's primary source of food?";
      
      // Still track the attempt in MongoDB
      try {
        const result = await ReadingUsers.findOneAndUpdate(
          { sessionId: sessionId },
          { 
            $inc: { counter: 1 },
            lastAttempt: new Date(timestamp) 
          },
          { 
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
          }
        );
        
        return res.status(200).json({
          success: true,
          message: 'Using fallback assignment due to API error',
          assignment: fallbackAssignment,
          count: result.counter,
          isNew: result.counter === 1
        });
      } catch (dbError) {
        return res.status(500).json({
          success: false,
          message: 'Error retrieving reading assignment',
          error: error.message
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error handling reading attempt`,
      error: error.message
    });
  }
});

// Reading Text 2 endpoint
router.post('/reading-text2', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Get Text 2 assignment from Claude
    try {
      const assignment = await generateReadingText2();
      
      // Send the assignment back to the frontend
      return res.status(200).json({
        success: true,
        message: 'Reading Text 2 assignment retrieved',
        assignment: assignment
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving Reading Text 2 assignment',
        error: error.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error handling Reading Text 2 attempt`,
      error: error.message
    });
  }
});

// Reading assessment endpoint
router.post('/reading-assessment', async (req, res) => {
  try {
    const { sessionId, userResponse, assignment, textType = 'text1' } = req.body;
    
    if (!sessionId || !userResponse || !assignment) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, user response, and assignment are required'
      });
    }
    
    // Call Claude API to evaluate the reading response
    try {
      const assessment = await assessReadingSubmission(assignment, userResponse, textType);
      
      // Variables to track demo status
      let demoComplete = false;
      let currentCounter = 1;
      
      // Save assessment data to MongoDB
      try {
        // First check if there's an existing document for this session
        let existingAssessment = await ReadingAssessment.findOne({ sessionId });
        
        if (existingAssessment) {
          // If document exists, update it
          
          // Update the existing document with new data while incrementing counter
          existingAssessment.assignment = assignment;
          existingAssessment.userResponse = userResponse;
          existingAssessment.assessment = assessment;
          existingAssessment.timestamp = new Date();
          existingAssessment.counter += 1; // Increment the counter
          
          // Save the updated document
          await existingAssessment.save();
          
          // Check if demo is complete (counter is 2)
          currentCounter = existingAssessment.counter;
          if (currentCounter >= 2) {
            demoComplete = true;
          }
        } else {
          // If no document exists, create a new one
          const readingAssessment = new ReadingAssessment({
            sessionId,
            assignment,
            userResponse,
            assessment,
            textType,
            timestamp: new Date(),
            counter: 1 // Start with counter at 1 for new documents
          });
          
          // Save to database
          await readingAssessment.save();
          
          // For new assessments, demo is not complete
          currentCounter = 1;
          demoComplete = false;
        }
      } catch (dbError) {
        // Continue with response even if DB save fails
      }
      
      // Send the assessment back to the frontend
      return res.status(200).json({
        success: true,
        message: `Reading ${textType === 'text1' ? 'Text 1' : 'Text 2'} assessment completed`,
        assessment: assessment,
        textType: textType,
        counter: currentCounter,
        demoComplete: demoComplete // Add the demo completion flag
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error assessing reading response',
        error: error.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error handling reading assessment`,
      error: error.message
    });
  }
});

module.exports = router;