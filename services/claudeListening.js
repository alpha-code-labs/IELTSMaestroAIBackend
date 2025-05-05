// services/claudeListening.js
const axios = require('axios');

// Claude API integration for IELTS Listening tasks
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Generate Listening Part 1 (conversation in a social context)
const generateListeningPart1 = async () => {
  try {
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.7,
        system: `You will create a short listening exercise suitable for IELTS Listening Part 1 (conversation in a social context).

The exercise should consist of:
1. A brief conversation between two people (approximately 150-200 words)
2. One question about the conversation

Format your response as follows:
1. A clear title describing the context
2. The conversation transcript (indicate speakers clearly)
3. A clear separator (a line of dashes)
4. The question about the conversation

The conversation should be about everyday social situations like:
- Making arrangements 
- Booking tickets
- Inquiring about services
- Social plans
- Travel arrangements
- Accommodation inquiries

Keep the language natural but clear, as it would be spoken by native English speakers. Use British English vocabulary and expressions since the primary accent used in IELTS is British.`,
        messages: [{ role: "user", content: "Generate an IELTS Listening Part 1 exercise." }]
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

// Generate Listening Part 2 (monologue in a social context)
const generateListeningPart2 = async () => {
  try {
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.7,
        system: `You will create a short listening exercise suitable for IELTS Listening Part 2 (monologue in a social context).

The exercise should consist of:
1. A brief monologue by one speaker (approximately 200-250 words)
2. One question about the monologue

Format your response as follows:
1. A clear title describing the context
2. The monologue transcript (with clear paragraph breaks)
3. A clear separator (a line of dashes)
4. The question about the monologue

The monologue should be about everyday situations like:
- A speech about local facilities
- An announcement about an event
- A tour guide's description
- Instructions on how to use a service
- Information about a course or program
- A radio broadcast about a community event

Keep the language natural but clear, as it would be spoken by a native English speaker. Use British English vocabulary and expressions since the primary accent used in IELTS is British.`,
        messages: [{ role: "user", content: "Generate an IELTS Listening Part 2 exercise." }]
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

// Listening assessment
const assessListeningSubmission = async (assignment, userResponse, partType) => {
  let systemPrompt = '';
  
  // Determine the appropriate system prompt based on part type
  if (partType === 'part1') {
    systemPrompt = `You are an expert IELTS examiner tasked with evaluating a student's response to a Listening Part 1 question.

You will be provided with:
1. The original listening transcript and question
2. The student's answer

Provide a detailed assessment following these criteria:
- Accuracy (Is the answer correct based on the transcript?)
- Comprehension (Does the student understand what they heard?)
- Detail (Did the student capture the specific details correctly?)

Format your response as a JSON object with the following structure:
{
  "assessment": {
    "accuracy": {
      "score": number, // 0-9 scale with 0.5 increments
      "feedback": "detailed feedback",
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"]
    },
    "comprehension": {
      "score": number, // 0-9 scale with 0.5 increments
      "feedback": "detailed feedback",
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"]
    },
    "detail": {
      "score": number, // 0-9 scale with 0.5 increments
      "feedback": "detailed feedback",
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"]
    }
  },
  "overallBandScore": number, // average of the three criteria scores
  "specificImprovements": ["improvement1", "improvement2", "improvement3"],
  "summary": "A brief 2-3 sentence summary of the overall assessment",
  "correctAnswer": "The correct answer according to the transcript"
}

Your assessment should be fair, constructive, and specific. Focus on helping the student improve their IELTS listening skills.`;
  } else {
    systemPrompt = `You are an expert IELTS examiner tasked with evaluating a student's response to a Listening Part 2 question.

You will be provided with:
1. The original listening transcript and question
2. The student's answer

Provide a detailed assessment following these criteria:
- Accuracy (Is the answer correct based on the transcript?)
- Comprehension (Does the student understand what they heard?)
- Detail (Did the student capture the specific details correctly?)
- Main Idea Recognition (Did they understand the main point/purpose?)

Format your response as a JSON object with the following structure:
{
  "assessment": {
    "accuracy": {
      "score": number, // 0-9 scale with 0.5 increments
      "feedback": "detailed feedback",
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"]
    },
    "comprehension": {
      "score": number, // 0-9 scale with 0.5 increments
      "feedback": "detailed feedback",
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"]
    },
    "detail": {
      "score": number, // 0-9 scale with 0.5 increments
      "feedback": "detailed feedback",
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"]
    },
    "mainIdeaRecognition": {
      "score": number, // 0-9 scale with 0.5 increments
      "feedback": "detailed feedback",
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"]
    }
  },
  "overallBandScore": number, // average of the four criteria scores
  "specificImprovements": ["improvement1", "improvement2", "improvement3"],
  "summary": "A brief 2-3 sentence summary of the overall assessment",
  "correctAnswer": "The correct answer according to the transcript"
}

Your assessment should be fair, constructive, and specific. Focus on helping the student improve their IELTS listening skills.`;
  }
  
  try {
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          { 
            role: "user", 
            content: `Here is the IELTS Listening ${partType === 'part1' ? 'Part 1' : 'Part 2'} transcript and question:
            
            ${assignment}
            
            And here is the student's answer:
            
            ${userResponse}
            
            Please evaluate this listening response according to IELTS criteria.`
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
        
        // Add part type metadata to the assessment response
        assessment.partType = partType;
      } else {
        // If no JSON found, return the text response as a fallback
        assessment = {
          textResponse: responseContent,
          error: "Could not extract structured assessment",
          partType: partType
        };
      }
    } catch (parseError) {
      console.error('Error parsing assessment data from Claude response:', parseError);
      assessment = {
        textResponse: responseContent,
        error: "Error parsing assessment data",
        partType: partType
      };
    }
    
    return assessment;
    
  } catch (error) {
    console.error('Error with Anthropic API:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  generateListeningPart1,
  generateListeningPart2,
  assessListeningSubmission
};
