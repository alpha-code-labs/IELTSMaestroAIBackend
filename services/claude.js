const axios = require('axios');
const { createFallbackGraph } = require('./utils');

// Claude API integration for IELTS tasks

// Task 1 writing prompts
const generateWritingTask1 = async () => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.7,
        system: `You will create a standard IELTS Writing Task 1 assignment with an accompanying data visualization.

IMPORTANT: Your response MUST follow this EXACT format:

1. First, provide the assignment text (150-200 words) as it would appear on an IELTS exam.

2. IMMEDIATELY after the assignment text, provide the JSON object exactly as shown below:

{
  "graphData": {
    "type": "line",
    "title": "Example Chart Title",
    "xAxis": {
      "label": "X-Axis Label",
      "values": ["Label1", "Label2", "Label3", "Label4", "Label5"]
    },
    "yAxis": {
      "label": "Y-Axis Label",
      "min": 0,
      "max": 100
    },
    "datasets": [
      {
        "label": "Series 1",
        "color": "#FF6384",
        "data": [25, 45, 60, 75, 80]
      },
      {
        "label": "Series 2",
        "color": "#36A2EB",
        "data": [40, 30, 50, 65, 80]
      }
    ]
  }
}

Critical requirements:
- Chart type must be one of: "line", "bar", "pie", or "doughnut" only
- Each dataset must have exactly the same number of data points as there are values in xAxis.values
- For pie charts, include only ONE dataset with data that adds up to 100
- Every field shown in the example is REQUIRED - do not omit any
- Do not wrap the JSON in code blocks, quotes, or any other formatting
- Choose a topic from: economics, demographics, environment, education, health, tourism, technology

The assignment should describe the chart and ask the student to summarize the main features and make comparisons where relevant.`,
        messages: [{ role: "user", content: "Generate an IELTS Writing Task 1 assignment with a graph." }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.content[0].text;
  } catch (error) {
    console.error('Error with Anthropic API:', error.response?.data || error.message);
    throw error;
  }
};

// Task 2 writing prompts
const generateWritingTask2 = async () => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        temperature: 0.8, // Increased for more variety
        system: `Generate a standard IELTS Writing Task 2 assignment.
        
        Randomly select one of these question formats:
        - Agree/disagree
        - Discuss both views and give your opinion
        - Advantages/disadvantages
        - Problem/solution
        - Two-part question
        
        Choose a random topic from these common IELTS themes:
        - Education (e.g., teaching methods, technology in schools, homeschooling)
        - Technology (e.g., impact on society, privacy concerns, future trends)
        - Environment (e.g., climate change, resource conservation, pollution)
        - Health (e.g., healthcare systems, diet, exercise, mental wellbeing)
        - Society and culture (e.g., traditions, urbanization, family structures)
        - Work and careers (e.g., remote work, job satisfaction, entrepreneurship)
        - Media and communication (e.g., social media, journalism, advertising)
        - Transportation (e.g., public transit, car ownership, air travel)
        
        The prompt should be challenging but accessible to non-native English speakers taking the IELTS exam.
        Include clear instructions about essay structure and word count.`,
        messages: [{ role: "user", content: "Generate an IELTS Writing Task 2 assignment." }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.content[0].text;
  } catch (error) {
    console.error('Error with Anthropic API:', error.response?.data || error.message);
    throw error;
  }
};

// Process the Claude response for Task 1 to extract graph data
const processTask1Response = (responseContent) => {
  let assignmentText = responseContent;
  let graphData = null;
  
  try {
    // Find the position of the first '{' character, which should start the JSON
    const jsonStartIndex = responseContent.indexOf('{');
    
    if (jsonStartIndex >= 0) {
      console.log("Found potential JSON starting at position:", jsonStartIndex);
      
      // Extract everything from the first '{' to the end of the response
      const jsonCandidate = responseContent.substring(jsonStartIndex);
      console.log("JSON candidate found. Length:", jsonCandidate.length);
      
      try {
        // Try to parse this as JSON
        const parsedJson = JSON.parse(jsonCandidate);
        console.log("Successfully parsed JSON with keys:", Object.keys(parsedJson));
        
        // Check if it has the graphData property
        if (parsedJson.graphData) {
          graphData = parsedJson.graphData;
          console.log("Found graphData with properties:", Object.keys(graphData));
          
          // Extract just the assignment text (everything before the JSON)
          assignmentText = responseContent.substring(0, jsonStartIndex).trim();
          console.log("Assignment text extracted. Length:", assignmentText.length);
          
          // Add default values if missing
          graphData.type = graphData.type || "line";
          graphData.title = graphData.title || "Data Visualization";
          
          // Ensure xAxis has proper structure
          graphData.xAxis = graphData.xAxis || {};
          graphData.xAxis.values = graphData.xAxis.values || [];
          graphData.xAxis.label = graphData.xAxis.label || "X Axis";
          
          // Ensure yAxis has proper structure
          graphData.yAxis = graphData.yAxis || {};
          graphData.yAxis.label = graphData.yAxis.label || "Y Axis";
          
          // Assign colors if missing
          if (Array.isArray(graphData.datasets)) {
            const defaultColors = [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ];
            
            graphData.datasets.forEach((dataset, index) => {
              if (!dataset.color) {
                dataset.color = defaultColors[index % defaultColors.length];
              }
            });
          }
          
          // Log validation info
          if (graphData.datasets && Array.isArray(graphData.datasets)) {
            console.log("Datasets found:", graphData.datasets.length);
            graphData.datasets.forEach((dataset, i) => {
              console.log(`Dataset ${i + 1} data points:`, dataset.data ? dataset.data.length : 0);
            });
          }
        } else {
          console.warn("Parsed JSON does not contain graphData property");
        }
      } catch (jsonParseError) {
        console.error("Error parsing JSON:", jsonParseError);
        
        // Try a more lenient approach with regex
        try {
          const graphDataRegex = /\{\s*"graphData"\s*:\s*\{[\s\S]*?\}\s*\}/;
          const match = responseContent.match(graphDataRegex);
          
          if (match && match[0]) {
            console.log("Found JSON match with regex. Length:", match[0].length);
            
            try {
              const parsedFromRegex = JSON.parse(match[0]);
              if (parsedFromRegex.graphData) {
                graphData = parsedFromRegex.graphData;
                console.log("Successfully extracted graphData with regex");
                
                // Extract assignment text (everything before the match)
                const matchIndex = responseContent.indexOf(match[0]);
                assignmentText = responseContent.substring(0, matchIndex).trim();
                
                // Apply the same default values as above
                graphData.type = graphData.type || "line";
                graphData.title = graphData.title || "Data Visualization";
                graphData.xAxis = graphData.xAxis || {};
                graphData.xAxis.values = graphData.xAxis.values || [];
                graphData.xAxis.label = graphData.xAxis.label || "X Axis";
                graphData.yAxis = graphData.yAxis || {};
                graphData.yAxis.label = graphData.yAxis.label || "Y Axis";
                
                if (Array.isArray(graphData.datasets)) {
                  const defaultColors = [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                  ];
                  
                  graphData.datasets.forEach((dataset, index) => {
                    if (!dataset.color) {
                      dataset.color = defaultColors[index % defaultColors.length];
                    }
                  });
                }
              }
            } catch (regexJsonError) {
              console.error("Error parsing regex JSON match:", regexJsonError);
            }
          }
        } catch (regexError) {
          console.error("Regex matching error:", regexError);
        }
      }
    } else {
      console.warn("No JSON object found in Claude's response");
    }
    
    // If still no valid graph data, use the fallback
    if (!graphData || !graphData.datasets || !Array.isArray(graphData.datasets) || 
        !graphData.xAxis || !graphData.xAxis.values || !Array.isArray(graphData.xAxis.values)) {
      console.warn("Using fallback graph data - detected invalid or missing graph data");
      graphData = createFallbackGraph();
    }
  } catch (parseError) {
    console.error('Error extracting graph data from Claude response:', parseError);
    graphData = createFallbackGraph();
  }
  
  return { assignmentText, graphData };
};

// Writing assessment
const assessWritingSubmission = async (assignment, userResponse, taskType) => {
  // Determine the correct system prompt based on task type
  let systemPrompt = '';
  if (taskType === 'task1') {
    // Task 1 system prompt
    systemPrompt = `You are an expert IELTS examiner tasked with evaluating a student's response to a Writing Task 1 assignment.
    
    You will be provided with:
    1. The original assignment
    2. The student's written response
    
    Provide a detailed assessment following the official IELTS Writing Task 1 criteria:
    - Task Achievement (Have they addressed all parts of the task? Have they accurately described all the main features/trends in the data?)
    - Coherence and Cohesion (Is the response well-organized with appropriate linking devices?)
    - Lexical Resource (Vocabulary usage and appropriateness)
    - Grammatical Range and Accuracy (Sentence structures and grammar)
    
    For each criterion, provide:
    1. A band score (0.0-9.0, using 0.5 increments)
    2. Specific examples from the student's response
    3. Constructive feedback on strengths and areas for improvement
    
    Then provide an overall band score (average of the four criteria).
    
    Finally, suggest 2-3 specific improvements the student could make to improve their score.
    
    Format your response as a JSON object with the following structure:
    {
      "assessment": {
        "taskAchievement": {
          "score": number,
          "feedback": "detailed feedback with examples",
          "strengths": ["strength1", "strength2"],
          "areasForImprovement": ["area1", "area2"]
        },
        "coherenceAndCohesion": {
          "score": number,
          "feedback": "detailed feedback with examples",
          "strengths": ["strength1", "strength2"],
          "areasForImprovement": ["area1", "area2"]
        },
        "lexicalResource": {
          "score": number,
          "feedback": "detailed feedback with examples",
          "strengths": ["strength1", "strength2"],
          "areasForImprovement": ["area1", "area2"]
        },
        "grammaticalRangeAndAccuracy": {
          "score": number,
          "feedback": "detailed feedback with examples",
          "strengths": ["strength1", "strength2"],
          "areasForImprovement": ["area1", "area2"]
        }
      },
      "overallBandScore": number,
      "specificImprovements": ["improvement1", "improvement2", "improvement3"],
      "summary": "A brief 2-3 sentence summary of the overall assessment"
    }
    
    Your assessment should be fair, constructive, and specific. Focus on helping the student improve their IELTS writing skills.`;
  } else if (taskType === 'task2') {
    // Task 2 system prompt
    systemPrompt = `You are an expert IELTS examiner tasked with evaluating a student's response to a Writing Task 2 assignment.

    You will be provided with:
    1. The original assignment
    2. The student's written response
    
    Provide a detailed assessment following the official IELTS Writing Task 2 criteria:
    - Task Response (Have they fully addressed all parts of the task? Have they presented a clear position throughout? Have they provided relevant, fully extended ideas?)
    - Coherence and Cohesion (Is the response well-organized with appropriate paragraphing and linking devices?)
    - Lexical Resource (Vocabulary usage, appropriateness, and range)
    - Grammatical Range and Accuracy (Sentence structures and grammar variety)
    
    For each criterion, provide:
    1. A band score (0.0-9.0, using 0.5 increments)
    2. Specific examples from the student's response
    3. Constructive feedback on strengths and areas for improvement
    
    Then provide an overall band score (average of the four criteria).
    
    Finally, suggest 2-3 specific improvements the student could make to improve their score.
    
    Format your response as a JSON object with the following structure:
    {
      "assessment": {
        "taskResponse": {
          "score": number,
          "feedback": "detailed feedback with examples",
          "strengths": ["strength1", "strength2"],
          "areasForImprovement": ["area1", "area2"]
        },
        "coherenceAndCohesion": {
          "score": number,
          "feedback": "detailed feedback with examples",
          "strengths": ["strength1", "strength2"],
          "areasForImprovement": ["area1", "area2"]
        },
        "lexicalResource": {
          "score": number,
          "feedback": "detailed feedback with examples",
          "strengths": ["strength1", "strength2"],
          "areasForImprovement": ["area1", "area2"]
        },
        "grammaticalRangeAndAccuracy": {
          "score": number,
          "feedback": "detailed feedback with examples",
          "strengths": ["strength1", "strength2"],
          "areasForImprovement": ["area1", "area2"]
        }
      },
      "overallBandScore": number,
      "specificImprovements": ["improvement1", "improvement2", "improvement3"],
      "summary": "A brief 2-3 sentence summary of the overall assessment"
    }
    
    Your assessment should be fair, constructive, and specific. Focus on helping the student improve their IELTS writing skills.`;
  } else {
    throw new Error('Invalid task type. Must be "task1" or "task2"');
  }
  
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          { 
            role: "user", 
            content: `Here is the IELTS Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'} assignment:
            
            ${assignment}
            
            And here is the student's response:
            
            ${userResponse}
            
            Please evaluate this writing sample according to IELTS ${taskType === 'task1' ? 'Task 1' : 'Task 2'} criteria.`
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    const responseContent = response.data.content[0].text;
    
    // Process the response to extract the assessment JSON
    let assessment = null;
    
    try {
      // Look for JSON data in the response
      const jsonMatch = responseContent.match(/\{[\s\S]*"assessment"[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        assessment = JSON.parse(jsonString);
        
        // Add task type metadata to the assessment response
        assessment.taskType = taskType;
      } else {
        // If no JSON found, return the text response as a fallback
        assessment = {
          textResponse: responseContent,
          error: "Could not extract structured assessment",
          taskType: taskType
        };
      }
    } catch (parseError) {
      console.error('Error parsing assessment data from Claude response:', parseError);
      assessment = {
        textResponse: responseContent,
        error: "Error parsing assessment data",
        taskType: taskType
      };
    }
    
    return assessment;
    
  } catch (error) {
    console.error('Error with Anthropic API:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  generateWritingTask1,
  generateWritingTask2,
  processTask1Response,
  assessWritingSubmission
};