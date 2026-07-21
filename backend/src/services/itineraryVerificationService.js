// src/services/itineraryVerificationService.js

/**
 * Checks whether the flight/hotel data we got back actually satisfies the trip request.
 * Returns a list of human-readable issues (empty = all good).
 */
exports.verifyAvailability = ({ travelData, flightResults, hotelResults }) => {
    const issues = [];
  
    const flights = flightResults?.flights ?? [];
    const hotels = hotelResults ?? [];
  
    if (!flights.length) {
      issues.push({
        type: 'NO_FLIGHTS',
        message: `No flights found from ${travelData.origin} to ${travelData.destination} on ${travelData.startDate}.`,
      });
    }
  
    if (!hotels.length) {
      issues.push({
        type: 'NO_HOTELS',
        message: `No hotels found in ${travelData.destination} matching your budget/rating preferences.`,
      });
    }
  
    // Sanity-check flight dates actually land within the requested window
    const requestedDate = new Date(travelData.startDate).toISOString().split('T')[0];
    const flightsOnWrongDate = flights.filter((f) => {
      const departureDate = new Date(f.departureTime).toISOString().split('T')[0];
      return departureDate !== requestedDate;
    });
  
    if (flights.length && flightsOnWrongDate.length === flights.length) {
      issues.push({
        type: 'FLIGHT_DATE_MISMATCH',
        message: `Available flights don't match the requested departure date (${requestedDate}).`,
      });
    }
  
    return {
      ok: issues.length === 0,
      issues,
    };
  };