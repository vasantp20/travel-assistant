const { GoogleGenAI } = require('@google/genai');
const { getGroq } = require('../../src/utils/groqHelpers');
const logger = require('../../src/utils/logger');
require('dotenv').config();


const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';


/**
 * Grades a generated travel itinerary against target logistic and semantic constraints.
 * 
 * @param {Object} itinerary - The generated JSON itinerary from your agent.
 * @param {Object} constraints - The target rules/constraints from the golden dataset.
 * @returns {Promise<{ passed: boolean, reasoning: string, score: number }>}
 */
async function gradeItinerary(itinerary, constraints) {
  const prompt = `
    You are an expert travel quality assurance system. Your job is to audit a generated travel itinerary against a set of strict logistics rules and constraints.
    
    ### Generated Itinerary:
    ${JSON.stringify(itinerary, null, 2)}
    
    ### Target Rules & Constraints:
    - Maximum Budget Allowed: $${constraints.maxBudget}
    - Forbidden Activities/Logic Errors: ${JSON.stringify(constraints.forbiddenActivities || [])}
    - Forbidden Actions on Day 1: ${JSON.stringify(constraints.forbiddenOnDay1 || [])}

    ### Evaluation Task:
    1. **Logistics Check:** Did the itinerary schedule any impossible activities? (e.g., trying to catch an afternoon ferry to Havelock Island if arrival time is late afternoon).
    2. **Geographical Guardrails:** Verify travel directions and locations (e.g. no "watching the sunset over an East Coast beach").
    3. **Rule Violations:** Scan specifically for any explicitly forbidden activities list.

    Respond with raw JSON conforming strictly to this schema:
    {
      "passed": boolean,
      "score": number, // A score from 0.0 to 1.0 representing how perfectly rules were followed
      "reasoning": "Detailed, objective reasoning explaining any failures or logical contradictions."
    }
    Do not wrap your response in markdown code blocks.
  `;
  
  try {
    
    const messages = [
      { role: 'system', content: prompt }
    ];

    const payload = {
      model: GROQ_MODEL,
      messages,
      stream: false,
      response_format: { type: 'json_object' }
    };

    const response = await getGroq().chat.completions.create(payload);

    const resultText = response.choices[0].message.content;
    logger.info("grade Itinerary execution complete", { model: GROQ_MODEL });

    return JSON.parse(resultText);
  } catch (error) {
    console.error("Failed to execute LLM Judge:", error);
    return {
      passed: false,
      score: 0,
      reasoning: `Judge Execution Error: ${error.message}`
    };
  }
}

module.exports = { gradeItinerary };