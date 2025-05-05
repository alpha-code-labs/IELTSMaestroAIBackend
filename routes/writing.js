const express = require('express');
const router = express.Router();
const { WritingUsers } = require('../models/sectionAttempt');
const WritingAssessment = require('../models/writingAssessment');
const { handleSectionAttempt, createFallbackGraph } = require('../services/utils');
const { 
  generateWritingTask1,
  generateWritingTask2, 
  processTask1Response, 
  assessWritingSubmission 
} = require('../services/claude');

// Writing attempt route for Task 1
router.post('/writing-attempt', async (req, res) => {
  try {
    const { sessionId, timestamp } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Call Claude API first with streaming disabled to simplify
    try {
      // Get the assignment from Claude
      const responseContent = await generateWritingTask1();
      
      // Process the response to extract assignment text and graph data
      const { assignmentText, graphData } = processTask1Response(responseContent);
      
      // After getting Claude's response, track the attempt in MongoDB
      const result = await WritingUsers.findOneAndUpdate(
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
      
      // Send the assignment and graph data back to the frontend
      return res.status(200).json({
        success: true,
        message: 'Writing assignment retrieved',
        assignment: assignmentText,
        graphData: graphData,
        count: result.counter,
        isNew: result.counter === 1
      });
      
    } catch (error) {
      // If Claude API fails, use a fallback assignment and graph
      const fallbackAssignment = "The chart below shows the percentage of people living in urban areas in different regions of the world in 1950 and 2010, with projections for 2050. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
      const fallbackGraph = createFallbackGraph();
      
      // Still track the attempt in MongoDB
      try {
        const result = await WritingUsers.findOneAndUpdate(
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
          graphData: fallbackGraph,
          count: result.counter,
          isNew: result.counter === 1
        });
      } catch (dbError) {
        return res.status(500).json({
          success: false,
          message: 'Error retrieving writing assignment',
          error: error.message
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error handling writing attempt`,
      error: error.message
    });
  }
});

// Writing Task 2 endpoint
router.post('/writing-task2', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Get Task 2 assignment from Claude
    try {
      const assignment = await generateWritingTask2();
      
      // Send the assignment back to the frontend
      return res.status(200).json({
        success: true,
        message: 'Writing Task 2 assignment retrieved',
        assignment: assignment
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving Writing Task 2 assignment',
        error: error.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error handling Writing Task 2 attempt`,
      error: error.message
    });
  }
});

// Writing assessment endpoint
router.post('/writing-assessment', async (req, res) => {
  try {
    const { sessionId, userResponse, assignment, taskType = 'task1' } = req.body;
    
    if (!sessionId || !userResponse || !assignment) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, user response, and assignment are required'
      });
    }
    
    // Call Claude API to evaluate the writing
    try {
      const assessment = await assessWritingSubmission(assignment, userResponse, taskType);
      
      // Variables to track demo status
      let demoComplete = false;
      let currentCounter = 1;
      
      // Save assessment data to MongoDB
      try {
        // First check if there's an existing document for this session
        let existingAssessment = await WritingAssessment.findOne({ sessionId });
        
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
          const writingAssessment = new WritingAssessment({
            sessionId,
            assignment,
            userResponse,
            assessment,
            taskType,
            timestamp: new Date(),
            counter: 1 // Start with counter at 1 for new documents
          });
          
          // Save to database
          await writingAssessment.save();
          
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
        message: `Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'} assessment completed`,
        assessment: assessment,
        taskType: taskType,
        counter: currentCounter,
        demoComplete: demoComplete // Add the demo completion flag
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error assessing writing response',
        error: error.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error handling writing assessment`,
      error: error.message
    });
  }
});

module.exports = router;