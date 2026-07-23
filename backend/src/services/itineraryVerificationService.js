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

/**
 * Checks whether the final generated itinerary matches the requested travel duration,
 * sequential days, and ensures that the selected flight/hotel details are real and accurate.
 */
exports.verifySynthesizedItinerary = ({ travelData, finalItinerary, flightResults, hotelResults }) => {
  const issues = [];

  if (!finalItinerary) {
    issues.push({ type: 'MISSING_ITINERARY', message: 'No itinerary was generated.' });
    return { ok: false, issues };
  }

  const { selectedFlight, selectedHotel, days } = finalItinerary;

  // 1. Validate Selected Flight
  if (!selectedFlight) {
    issues.push({ type: 'MISSING_SELECTED_FLIGHT', message: 'No flight was selected in the final itinerary.' });
  } else {
    const flights = flightResults?.flights ?? [];
    const matchedFlight = flights.find(f => f.id === selectedFlight.id || 
      (f.flightNumber === selectedFlight.flightNumber && f.departureTime === selectedFlight.departureTime));

    if (!matchedFlight) {
      issues.push({
        type: 'HALLUCINATED_FLIGHT',
        message: `Selected flight (${selectedFlight.airline || 'Unknown'} ${selectedFlight.flightNumber || ''}) does not exist in the available flight options.`
      });
    } else {
      // Check if price or other critical fields were changed by the LLM
      if (Number(selectedFlight.price) !== Number(matchedFlight.price)) {
        issues.push({
          type: 'FLIGHT_PRICE_MISMATCH',
          message: `Selected flight price (${selectedFlight.price}) does not match the real offered price (${matchedFlight.price}).`
        });
      }
    }
  }

  // 2. Validate Selected Hotel
  if (!selectedHotel) {
    issues.push({ type: 'MISSING_SELECTED_HOTEL', message: 'No hotel was selected in the final itinerary.' });
  } else {
    const hotels = hotelResults ?? [];
    const matchedHotel = hotels.find(h => h.id === selectedHotel.id || h.name === selectedHotel.name);

    if (!matchedHotel) {
      issues.push({
        type: 'HALLUCINATED_HOTEL',
        message: `Selected hotel (${selectedHotel.name || 'unknown'}) does not exist in the available hotel options.`
      });
    } else {
      if (Number(selectedHotel.pricePerNight) !== Number(matchedHotel.pricePerNight)) {
        issues.push({
          type: 'HOTEL_PRICE_MISMATCH',
          message: `Selected hotel price per night (${selectedHotel.pricePerNight}) does not match the real offered price (${matchedHotel.pricePerNight}).`
        });
      }
    }
  }

  // 3. Validate Days Structure and Length
  if (!Array.isArray(days)) {
    issues.push({ type: 'INVALID_DAYS_FORMAT', message: 'Itinerary days must be a valid array.' });
  } else {
    const expectedDuration = Number(travelData.durationDays);
    if (days.length !== expectedDuration) {
      issues.push({
        type: 'DURATION_MISMATCH',
        message: `Generated itinerary duration (${days.length} days) does not match the requested duration (${expectedDuration} days).`
      });
    }

    // Verify sequential days starting from 1
    for (let i = 0; i < days.length; i++) {
      if (Number(days[i].day) !== i + 1) {
        issues.push({
          type: 'NON_SEQUENTIAL_DAYS',
          message: `Day at index ${i} is labeled as Day ${days[i].day} instead of Day ${i + 1}.`
        });
        break;
      }
    }
  }

  // 4. Validate Timeline Date Alignment
  const requestedStart = travelData.startDate ? new Date(travelData.startDate).toISOString().split('T')[0] : null;

  if (requestedStart) {
    if (selectedFlight && selectedFlight.departureTime) {
      const flightDate = new Date(selectedFlight.departureTime).toISOString().split('T')[0];
      if (flightDate !== requestedStart) {
        issues.push({
          type: 'FLIGHT_DATE_MISMATCH',
          message: `Selected flight departure date (${flightDate}) does not match the requested trip start date (${requestedStart}).`
        });
      }
    }

    if (selectedHotel && selectedHotel.checkInDate) {
      const checkInDate = new Date(selectedHotel.checkInDate).toISOString().split('T')[0];
      if (checkInDate !== requestedStart) {
        issues.push({
          type: 'HOTEL_CHECKIN_MISMATCH',
          message: `Selected hotel check-in date (${checkInDate}) does not match the requested trip start date (${requestedStart}).`
        });
      }

      if (selectedHotel.checkOutDate) {
        const expectedCheckout = new Date(requestedStart);
        expectedCheckout.setDate(expectedCheckout.getDate() + Number(travelData.durationDays));
        const expectedCheckoutStr = expectedCheckout.toISOString().split('T')[0];
        const actualCheckoutStr = new Date(selectedHotel.checkOutDate).toISOString().split('T')[0];

        if (actualCheckoutStr !== expectedCheckoutStr) {
          issues.push({
            type: 'HOTEL_CHECKOUT_MISMATCH',
            message: `Selected hotel check-out date (${actualCheckoutStr}) does not match the expected check-out date (${expectedCheckoutStr}).`
          });
        }
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
};