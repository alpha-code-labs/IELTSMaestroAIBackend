// routes/listeningRoutes.js
const express = require('express');
const router = express.Router();
const { ListeningUsers } = require('../models/sectionAttempt');
const ListeningAssessment = require('../models/listeningAssessment');
const { handleSectionAttempt } = require('../services/utils');
const { 
  generateListeningPart1,
  generateListeningPart2, 
  assessListeningSubmission 
} = require('../services/claudeListening');

// Listening attempt route for Part 1
router.post('/listening-attempt', async (req, res) => {
  try {
    const { sessionId, timestamp } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Call Claude API to get the listening transcript
    try {
      // Get the assignment from Claude
      const responseContent = await generateListeningPart1();
      
      // After getting Claude's response, track the attempt in MongoDB
      const result = await ListeningUsers.findOneAndUpdate(
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
      
      // Send the listening transcript back to the frontend
      return res.status(200).json({
        success: true,
        message: 'Listening assignment retrieved',
        assignment: responseContent,
        count: result.counter,
        isNew: result.counter === 1
      });
      
    } catch (error) {
      // If Claude API fails, use a fallback assignment
      const fallbackAssignment = "Conversation between two friends discussing weekend plans:\n\nWoman: So, what are you planning to do this weekend?\nMan: I'm thinking of going to that new exhibition at the city museum. I heard it's really good.\nWoman: Oh, which one?\nMan: It's the Ancient Egypt one. They've got some artifacts that have never been shown here before.\nWoman: That sounds interesting! What day were you thinking of going?\nMan: I was planning to go on Saturday morning, around 10.\n\nQuestion: What is the man planning to see at the museum?";
      
      // Still track the attempt in MongoDB
      try {
        const result = await ListeningUsers.findOneAndUpdate(
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
          message: 'Error retrieving listening assignment',
          error: error.message
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error handling listening attempt`,
      error: error.message
    });
  }
});

// Listening Part 2 endpoint
router.post('/listening-part2', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Get Part 2 assignment from Claude
    try {
      const assignment = await generateListeningPart2();
      
      // Send the assignment back to the frontend
      return res.status(200).json({
        success: true,
        message: 'Listening Part 2 assignment retrieved',
        assignment: assignment
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving Listening Part 2 assignment',
        error: error.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error handling Listening Part 2 attempt`,
      error: error.message
    });
  }
});

// Listening assessment endpoint
router.post('/listening-assessment', async (req, res) => {
  try {
    const { sessionId, userResponse, assignment, partType = 'part1' } = req.body;
    
    if (!sessionId || !userResponse || !assignment) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, user response, and assignment are required'
      });
    }
    
    // Call Claude API to evaluate the listening response
    try {
      const assessment = await assessListeningSubmission(assignment, userResponse, partType);
      
      // Variables to track demo status
      let demoComplete = false;
      let currentCounter = 1;
      
      // Save assessment data to MongoDB
      try {
        // First check if there's an existing document for this session
        let existingAssessment = await ListeningAssessment.findOne({ sessionId });
        
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
          const listeningAssessment = new ListeningAssessment({
            sessionId,
            assignment,
            userResponse,
            assessment,
            partType,
            timestamp: new Date(),
            counter: 1 // Start with counter at 1 for new documents
          });
          
          // Save to database
          await listeningAssessment.save();
          
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
        message: `Listening ${partType === 'part1' ? 'Part 1' : 'Part 2'} assessment completed`,
        assessment: assessment,
        partType: partType,
        counter: currentCounter,
        demoComplete: demoComplete // Add the demo completion flag
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error assessing listening response',
        error: error.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error handling listening assessment`,
      error: error.message
    });
  }
});

module.exports = router;