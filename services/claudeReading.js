// services/claudeReading.js
const axios = require('axios');

// Claude API integration for IELTS Reading tasks
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Generate short reading text (Text 1)
const generateReadingText1 = async () => {
  try {
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.7,
        system: `You will create a short reading passage suitable for IELTS General Training Reading Section 1.

The passage should be approximately 150-200 words on an everyday topic such as:
- Public notices
- Advertisements
- Timetables
- Brochures
- Instruction manuals
- Letters or emails

After the passage, include ONE question about the passage. Use one of these question types:
- Multiple choice
- True/False/Not Given
- Identifying information

Format your response exactly as follows:
1. Title (if appropriate for the type of text)
2. The reading passage itself
3. A clear separator (a line of dashes)
4. The instruction for the question (e.g., "Choose the correct letter, A, B, C or D")
5. The single question with options if it's multiple choice

Keep the language level appropriate for IELTS General Training Section 1 - this means using simple and clear vocabulary and sentence structures.`,
        messages: [{ role: "user", content: "Generate an IELTS General Training Reading Section 1 passage with one question." }]
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

// Generate longer reading text (Text 2)
const generateReadingText2 = async () => {
  try {
    const response = await axios.post(
       ANTHROPIC_API_URL,
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        temperature: 0.7,
        system: `You will create a longer reading passage suitable for IELTS General Training Reading Section 3.

The passage should be approximately 400-500 words on a general interest topic with descriptive or instructive content such as:
- Scientific discoveries
- Historical events
- Social issues
- Cultural practices
- Environmental topics
- Technology developments

After the passage, include ONE question about the passage. Use one of these question types:
- Multiple choice
- True/False/Not Given
- Yes/No/Not Given (for opinions)
- Matching information
- Matching headings
- Summary completion

Format your response exactly as follows:
1. Title of the passage
2. The reading passage itself (400-500 words)
3. A clear separator (a line of dashes)
4. The instruction for the question (e.g., "Choose the correct letter, A, B, C or D")
5. The single question with options if it's multiple choice

The language level should be more complex than Section 1, using a wider range of vocabulary and more complex sentence structures as would be appropriate for IELTS General Training Section 3.`,
        messages: [{ role: "user", content: "Generate an IELTS General Training Reading Section 3 passage with one question." }]
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

// Reading assessment
const assessReadingSubmission = async (assignment, userResponse, textType) => {
  let systemPrompt = '';
  
  // Determine the appropriate system prompt based on text type
  if (textType === 'text1') {
    systemPrompt = `You are an expert IELTS examiner tasked with evaluating a student's response to a Reading question.

You will be provided with:
1. The original reading passage and question
2. The student's answer

Provide a detailed assessment following these criteria:
- Accuracy (Is the answer correct according to the passage?)
- Comprehension (Does the student understand the passage and question?)
- Reasoning (How well did the student explain their answer?)

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
    "reasoning": {
      "score": number, // 0-9 scale with 0.5 increments
      "feedback": "detailed feedback",
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"]
    }
  },
  "overallBandScore": number, // average of the three criteria scores
  "specificImprovements": ["improvement1", "improvement2", "improvement3"],
  "summary": "A brief 2-3 sentence summary of the overall assessment",
  "correctAnswer": "The correct answer according to the passage"
}

Your assessment should be fair, constructive, and specific. Focus on helping the student improve their IELTS reading skills.`;
  } else {
    systemPrompt = `You are an expert IELTS examiner tasked with evaluating a student's response to a more complex Reading question from Section 3.

You will be provided with:
1. The original reading passage and question
2. The student's answer

Provide a detailed assessment following these criteria:
- Accuracy (Is the answer correct according to the passage?)
- Comprehension (Does the student understand the passage and question?)
- Reasoning (How well did the student explain their answer?)
- Analytical Skills (How well did the student analyze the more complex information?)

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
    "reasoning": {
      "score": number, // 0-9 scale with 0.5 increments
      "feedback": "detailed feedback",
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"]
    },
    "analyticalSkills": {
      "score": number, // 0-9 scale with 0.5 increments
      "feedback": "detailed feedback",
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"]
    }
  },
  "overallBandScore": number, // average of the four criteria scores
  "specificImprovements": ["improvement1", "improvement2", "improvement3"],
  "summary": "A brief 2-3 sentence summary of the overall assessment",
  "correctAnswer": "The correct answer according to the passage"
}

Your assessment should be fair, constructive, and specific. Focus on helping the student improve their IELTS reading skills, particularly for more complex passages.`;
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
            content: `Here is the IELTS Reading ${textType === 'text1' ? 'Text 1' : 'Text 2'} passage and question:
            
            ${assignment}
            
            And here is the student's answer:
            
            ${userResponse}
            
            Please evaluate this reading response according to IELTS criteria.`
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
        
        // Add text type metadata to the assessment response
        assessment.textType = textType;
      } else {
        // If no JSON found, return the text response as a fallback
        assessment = {
          textResponse: responseContent,
          error: "Could not extract structured assessment",
          textType: textType
        };
      }
    } catch (parseError) {
      console.error('Error parsing assessment data from Claude response:', parseError);
      assessment = {
        textResponse: responseContent,
        error: "Error parsing assessment data",
        textType: textType
      };
    }
    
    return assessment;
    
  } catch (error) {
    console.error('Error with Anthropic API:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  generateReadingText1,
  generateReadingText2,
  assessReadingSubmission
};
