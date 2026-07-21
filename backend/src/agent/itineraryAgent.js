// src/agents/itineraryAgent.js
const { streamGroqToSSE, fetchFromGroq } = require('../utils/groqHelpers');
const logger = require('../utils/logger');
// 1. Import your Mongoose model to run the just-in-time extraction lookup
const LocationMetadata = require('../models/LocationMetadata'); 

/**
 * Generates a foundational, day-by-day itinerary structure using Groq streaming utilities.
 * @param {Object} travelData - The verified form parameters from req.validatedTravelData
 * @param {Object} res - The Express response object already prepared for Server-Sent Events
 * @returns {Promise<Object>} - Resolves to the parsed structural JSON itinerary contract
 */
exports.generateBaseItinerary = async (travelData, res) => {
  const { destination, origin, durationDays, preferences } = travelData;

  logger.info(`Starting foundational itinerary mapping for destination: ${destination}`);

  let metadataContext = "";
  try {
    const normalizedDestination = destination.trim().toLowerCase();
    const metadata = await LocationMetadata.findOne({ destination: normalizedDestination }).lean();

    if (metadata) {
      logger.info(`Context Hydration: Loaded deterministic constraints for ${destination}`);
      
      // Destructure only the strict structural parameters needed to shape the prompt
      const { region, state, geographicalGuardrails, logisticalConstraints } = metadata;
      
      metadataContext = `
[DETERMINISTIC REGIONAL CONSTRAINTS - MUST ADHERE]
- Geography/Region: ${state || destination}, ${region}
- Logistical Infrastructure: Primary Airport is ${logisticalConstraints?.primaryAirportCode || 'N/A'}, located approximately ${logisticalConstraints?.primaryAirportToCenterKm || 'N/A'}km from the central destination. Recommended transit options are: ${logisticalConstraints?.recommendedLocalTransit?.join(', ') || 'Local transport'}.
- Mandatory Guardrails:
${geographicalGuardrails?.map(rule => `  * ${rule}`).join('\n') || '  * None specified.'}
- Operational Prompt Rule: You must construct activities, transit times, and pacing around these geographical facts. Do not allow activities that break the constraints outlined above.
`;
    } else {
      logger.info(`No specific location metadata found for: ${destination}. Proceeding with standard generation.`);
    }
  } catch (dbError) {
    // Non-blocking catch: log the error, but allow the user's generation stream to proceed without crashing
    logger.error(`Database lookup failed for location metadata metadata extraction: ${dbError.message}`);
  }

  // 3. Build strict system instructions enforcing zero-logic bleed, appending our dynamic constraints if present
  let systemInstructions = `You are the core Itinerary Mapping Agent for an enterprise travel planner.
Your sole job is to outline a structural, day-by-day itinerary sequence of points of interest and locations.
DO NOT invent exact flight numbers or specify live hotel prices—other downstream sub-agents handle that inventory.
${metadataContext}
You must reply exclusively in a valid, parseable JSON array matching this exact schema block structure:
[
  {
    "day": number,
    "theme": "string",
    "activities": ["string"],
    "targetAreas": ["neighborhood names or landmarks to assist hotel discovery"]
  }
]`;

  const messages = [
    { role: 'system', content: systemInstructions },
    { 
      role: 'user', 
      content: `Generate a comprehensive ${durationDays}-day itinerary for a trip from ${origin} to ${destination}. The traveler prefers a "${preferences.pace}" pace.` 
    }
  ];

  try {
    // 4. Leverage your native stream utility to handle tokens and SSE updates on the fly
    const result = await streamGroqToSSE(messages, res, { tools: false });
    // const result = await fetchFromGroq(messages, res, { tools: false });

    if (!result.textResponse) {
      throw new Error("Groq returned an empty response text stream.");
    }

    // 5. Extract and parse the accumulated JSON string block
    let cleanedText = result.textResponse.trim();
    
    // Safety guard: strip markdown code blocks if the LLM wraps them despite instructions
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsedItinerary = JSON.parse(cleanedText);
    
    logger.info("Foundational itinerary structured and verified successfully.");
    logger.info(parsedItinerary);
    return parsedItinerary;

  } catch (error) {
    logger.error("itineraryAgent execution failed during streaming block assembly:", error);
    throw new Error(`Failed to compile foundational itinerary maps: ${error.message}`);
  }
};