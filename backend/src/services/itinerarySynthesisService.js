// src/services/itinerarySynthesisService.js
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Combines the base itinerary draft with real flight/hotel data into a final structured itinerary.
 * This is the one step that actually needs the LLM to reason/synthesize — everything upstream is
 * already structured data, so there's no hallucination risk feeding in here, only in the writing.
 */

exports.synthesizeFinalItinerary = async ({ travelData, baseItinerary, flightResults, hotelResults, availabilityIssues = [] }) => {
  const flights = flightResults?.flights ?? [];
  const hotels = hotelResults ?? [];

  if (!flights.length || !hotels.length) {
    throw new Error(
      `Cannot synthesize itinerary with missing data: ${!flights.length ? 'no flights' : ''} ${!hotels.length ? 'no hotels' : ''}`.trim()
    );
  }

  const issuesNote = availabilityIssues.length
    ? `\nKnown data caveats to account for — you MUST surface these explicitly in the "summary" field, not hide them:\n${availabilityIssues.map((i) => `- ${i.message}`).join('\n')}`
    : '';

  const systemPrompt = `
You are a travel itinerary assistant. You will be given:
1. A draft day-by-day itinerary
2. A list of real available flights
3. A list of real available hotels

Your job: select the best-fitting flight and hotel from the given options (do not invent new ones,
do not modify their fields), and weave them into a final structured itinerary.

CRITICAL ROUTING & LOCATION RULES:
1. **Destination Focus**: The entire trip is a vacation to the destination: "${travelData.destination}". The traveler does NOT want to explore, sightsee, or stay in the origin city: "${travelData.origin}".
2. **Day 1 (Departure & Arrival)**: Day 1 must represent traveling from the origin ("${travelData.origin}") to the destination ("${travelData.destination}"). The activities on Day 1 must focus on: departure from "${travelData.origin}", arrival/transit at the destination "${travelData.destination}", check-in at the destination hotel, and optional light evening activities or dinner AT the destination.
3. **No Sightseeing at Origin**: Do not schedule any tours, sightseeing, or explorations in the origin city ("${travelData.origin}") on Day 1 or any other day.
4. **Intermediate Days**: Days 2 through the second-to-last day must be spent entirely in or around the destination ("${travelData.destination}"). The user's overnight stays must remain at the destination hotel.
5. **Handling Long Durations**: If the duration is long (e.g. 10-14 days) and the destination is small, do not take the user to other major cities or shift their base. Instead, distribute the destination's activities across the days with a more relaxed pace. Include rest days, local neighborhood strolls, culinary classes, or short day trips that return to the destination each evening.
6. **Last Day (Departure)**: The final day must represent the departure from the destination ("${travelData.destination}") and return to the origin ("${travelData.origin}"). No major sightseeing should be scheduled.

If a selected flight or hotel doesn't perfectly match what the user asked for (e.g. different date,
lower rating than requested), say so plainly in the summary — do not present a mismatch as a match.

Respond STRICTLY as valid JSON matching this shape, no markdown fences, no commentary:
{
  "summary": string,
  "selectedFlight": { ...one object copied exactly from the provided flights list },
  "selectedHotel": { ...one object copied exactly from the provided hotels list },
  "days": [ { "day": number, "title": string, "activities": string[] } ]
}
${issuesNote}
  `;

  const userPrompt = `
Trip request: ${JSON.stringify(travelData)}

Draft itinerary: ${JSON.stringify(baseItinerary ?? null)}

Available flights: ${JSON.stringify(flights)}

Available hotels: ${JSON.stringify(hotels)}
  `;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content);
};