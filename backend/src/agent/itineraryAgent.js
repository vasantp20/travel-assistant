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

CRITICAL ROUTING & LOCATION RULES:
1. **Destination Focus**: The entire trip is a vacation to the destination: "${destination}". The user does NOT want to explore, sightsee, or stay in the origin city: "${origin}".
2. **Day 1 (Departure & Arrival)**: Day 1 must represent traveling from the origin ("${origin}") to the destination ("${destination}"). The activities on Day 1 must focus on: departure from "${origin}", arrival/transit at the destination "${destination}", check-in at the destination hotel, and optional light evening activities or dinner AT the destination.
3. **No Sightseeing at Origin**: Do not schedule any tours, sightseeing, or explorations in the origin city ("${origin}") on Day 1 or any other day.
4. **Intermediate Days**: Days 2 through ${durationDays - 1} must be spent entirely in or around the destination ("${destination}"). The user's overnight stays must remain at the destination.
5. **Handling Long Durations**: If the duration is long (e.g. 10-14 days) and the destination is small, do not take the user to other major cities or shift their base. Instead, distribute the destination's activities across the days with a more relaxed pace. Include rest days, local neighborhood strolls, culinary classes, or short day trips (e.g., Fatehpur Sikri for Agra) that return to the destination each evening.
6. **Last Day (Departure)**: The final day (Day ${durationDays}) must represent the departure from the destination ("${destination}") and return to the origin ("${origin}"). No major sightseeing should be scheduled.
7. **Conciseness**: Keep the text descriptions and activity lists concise to avoid JSON formatting issues or truncation.

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