const { generateBaseItinerary } = require("./agent/itineraryAgent");
const { sourceFlightsViaDuffel } = require("./services/flightSearch");
const { searchHotels } = require("./services/hotelServices");


const { verifyAvailability, verifySynthesizedItinerary } = require('./services/itineraryVerificationService');
const { synthesizeFinalItinerary } = require('./services/itinerarySynthesisService');

exports.coordinateMultiAgentPlan = async (travelData, res) => {
  const sendEvent = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

  try {
    // STEP A: Generate the foundational day-by-day itinerary path
    sendEvent({ status: 'PLANNING_ITINERARY', message: 'Drafting baseline itinerary...' });

    const baseItinerary = await generateBaseItinerary(travelData, res);
    // const baseItinerary = null; // placeholder until re-enabled

    // STEP B: Source flights and hotels in parallel
    sendEvent({ status: 'SOURCING_TRAVEL_DATA', message: 'Searching flights and hotels...' });

    const hotelParams = buildHotelParamsFromTravelData(travelData);

    const [flightSettled, hotelSettled] = await Promise.allSettled([
      sourceFlightsViaDuffel(travelData),
      searchHotels(hotelParams),
    ]);

    const flightResults = flightSettled.status === 'fulfilled' ? flightSettled.value : { flights: [] };
    const hotelResults = hotelSettled.status === 'fulfilled' ? hotelSettled.value : [];

    console.log('Flight Results:', flightResults);
    console.log('Hotel data:', hotelResults);

    // STEP C: Verify the data actually satisfies the trip before generating a final plan around it
    sendEvent({ status: 'VERIFYING_AVAILABILITY', message: 'Checking flight and hotel availability...' });

    const verification = verifyAvailability({ travelData, flightResults, hotelResults });

    if (!verification.ok && !travelData.missingInfoAcknowledged) {
      // Pause here — don't guess or silently fill gaps. Ask the frontend/user to confirm how to proceed.
      sendEvent({
        status: 'MISSING_INFO',
        message: 'Some parts of your trip could not be fully matched.',
        issues: verification.issues,
        partial: {
          flights: flightResults.flights,
          hotels: hotelResults,
        },
      });
      return res.end();
    }

    // STEP D: Synthesize the final itinerary combining draft + real flight/hotel data
    sendEvent({ status: 'SYNTHESIZING_PLAN', message: 'Putting together your final itinerary...' });

    const finalItinerary = await synthesizeFinalItinerary({
      travelData,
      baseItinerary,
      flightResults,
      hotelResults,
      availabilityIssues: verification.issues,
    });

    // STEP E: Validate the synthesized plan timeline and objects to verify correctness/accuracy
    sendEvent({ status: 'VALIDATING_SYNTHESIS', message: 'Validating final itinerary details...' });

    const synthesisVerification = verifySynthesizedItinerary({
      travelData,
      finalItinerary,
      flightResults,
      hotelResults,
    });

    if (!synthesisVerification.ok) {
      console.warn('[coordinateMultiAgentPlan] Synthesis validation failed. Applying self-healing...', synthesisVerification.issues);
      
      // Proactive patching (self-healing): Overwrite LLM's selectedFlight/selectedHotel details with real ones if matched
      if (finalItinerary.selectedFlight) {
        const flights = flightResults?.flights ?? [];
        const realFlight = flights.find(f => f.id === finalItinerary.selectedFlight.id || 
          (f.flightNumber === finalItinerary.selectedFlight.flightNumber && f.departureTime === finalItinerary.selectedFlight.departureTime));
        if (realFlight) {
          finalItinerary.selectedFlight = realFlight; // Self-heal: use the exact real flight data
        }
      }

      if (finalItinerary.selectedHotel) {
        const hotels = hotelResults ?? [];
        const realHotel = hotels.find(h => h.id === finalItinerary.selectedHotel.id || h.name === finalItinerary.selectedHotel.name);
        if (realHotel) {
          finalItinerary.selectedHotel = realHotel; // Self-heal: use the exact real hotel data
        }
      }

      // Re-run validation after self-healing to see if it fixed the critical issues
      const finalCheck = verifySynthesizedItinerary({
        travelData,
        finalItinerary,
        flightResults,
        hotelResults,
      });
      synthesisVerification.issues = finalCheck.issues;
      synthesisVerification.ok = finalCheck.ok;
    }

    sendEvent({
      status: 'COMPLETE',
      message: 'Itinerary ready.',
      data: {
        itinerary: finalItinerary,
        flights: flightResults.flights,
        hotels: hotelResults,
        availabilityIssues: verification.issues, // empty array if all good, non-empty if user acknowledged and proceeded anyway
        synthesisIssues: synthesisVerification.issues, // empty array if all good or successfully self-healed, non-empty if persistent issues
      },
    });
  } catch (error) {
    console.error('[coordinateMultiAgentPlan] Fatal error:', error.message);
    sendEvent({ status: 'ERROR', message: 'Something went wrong while building your itinerary.' });
  } finally {
    res.end();
  }
};

function buildHotelParamsFromTravelData(travelData) {
  const { destination, startDate, durationDays, budget, preferences } = travelData;

  const checkIn = new Date(startDate);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + Number(durationDays));

  return {
    destination,
    checkInDate: checkIn.toISOString().split('T')[0],
    checkOutDate: checkOut.toISOString().split('T')[0],
    nights: Number(durationDays),
    minRating: preferences?.hotelRating || 0,
    budget,
  };
}
