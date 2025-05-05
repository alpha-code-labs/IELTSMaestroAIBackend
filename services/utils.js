// Utility functions for the IELTS API

// Constants
const SSE_HEADERS = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  };
  
  // Fallback graph data for when Claude API fails
  const createFallbackGraph = () => {
    return {
      type: "line",
      title: "Global Tourism Growth (2010-2020)",
      xAxis: {
        label: "Year",
        values: ["2010", "2012", "2014", "2016", "2018", "2020"]
      },
      yAxis: {
        label: "Number of Tourists (millions)",
        min: 0,
        max: 150
      },
      datasets: [
        {
          label: "Europe",
          color: "#FF6384",
          data: [63, 78, 92, 107, 126, 83]
        },
        {
          label: "Asia Pacific",
          color: "#36A2EB",
          data: [42, 55, 71, 89, 112, 56]
        },
        {
          label: "Americas",
          color: "#FFCE56",
          data: [35, 41, 48, 56, 69, 43]
        }
      ]
    };
  };
  
  // Generic function to handle section attempts
  const handleSectionAttempt = async (req, res, Model, sectionName) => {
    try {
      const { sessionId, timestamp } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }
      
      console.log(`Received ${sectionName} attempt for sessionId: ${sessionId}`);
      
      // Use findOneAndUpdate with $inc operator to atomically increment the counter
      const result = await Model.findOneAndUpdate(
        { sessionId: sessionId },  // query criteria
        { 
          $inc: { counter: 1 },    // increment counter by 1
          lastAttempt: new Date(timestamp) 
        },
        { 
          new: true,              // return the updated document
          upsert: true,           // create if doesn't exist
          setDefaultsOnInsert: true // set default values if creating new document
        }
      );
      
      console.log(`${sectionName} attempt tracked. Session ID: ${sessionId}, Count: ${result.counter}`);
      
      res.status(200).json({
        success: true,
        message: `${sectionName} attempt tracked successfully`,
        count: result.counter,
        isNew: result.counter === 1
      });
    } catch (error) {
      console.error(`Error tracking ${sectionName} attempt:`, error);
      res.status(500).json({
        success: false,
        message: `Error tracking ${sectionName} attempt`,
        error: error.message
      });
    }
  };
  
  module.exports = {
    SSE_HEADERS,
    createFallbackGraph,
    handleSectionAttempt
  };