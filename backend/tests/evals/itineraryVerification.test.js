const { verifySynthesizedItinerary } = require('../../src/services/itineraryVerificationService');

describe('itineraryVerificationService - verifySynthesizedItinerary', () => {
  const travelData = {
    origin: 'BLR',
    destination: 'GOI',
    startDate: '2026-08-01',
    durationDays: 3
  };

  const flightResults = {
    flights: [
      {
        id: 'flight-1',
        airline: 'IndiGo',
        flightNumber: '6E-101',
        departureTime: '2026-08-01T08:00:00Z',
        price: 5000
      }
    ]
  };

  const hotelResults = [
    {
      id: 'hotel-1',
      name: 'Resort Goa',
      checkInDate: '2026-08-01',
      checkOutDate: '2026-08-04',
      pricePerNight: 4000
    }
  ];

  const validItinerary = {
    selectedFlight: {
      id: 'flight-1',
      airline: 'IndiGo',
      flightNumber: '6E-101',
      departureTime: '2026-08-01T08:00:00Z',
      price: 5000
    },
    selectedHotel: {
      id: 'hotel-1',
      name: 'Resort Goa',
      checkInDate: '2026-08-01',
      checkOutDate: '2026-08-04',
      pricePerNight: 4000
    },
    days: [
      { day: 1, title: 'Arrival', activities: ['Check-in'] },
      { day: 2, title: 'Beach Day', activities: ['Relax'] },
      { day: 3, title: 'Departure', activities: ['Flight back'] }
    ]
  };

  test('should pass a perfectly valid itinerary', () => {
    const result = verifySynthesizedItinerary({
      travelData,
      finalItinerary: validItinerary,
      flightResults,
      hotelResults
    });
    expect(result.ok).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  test('should detect missing itinerary', () => {
    const result = verifySynthesizedItinerary({
      travelData,
      finalItinerary: null,
      flightResults,
      hotelResults
    });
    expect(result.ok).toBe(false);
    expect(result.issues[0].type).toBe('MISSING_ITINERARY');
  });

  test('should detect hallucinated flight', () => {
    const badItinerary = {
      ...validItinerary,
      selectedFlight: {
        id: 'flight-fake',
        airline: 'Fake Airlines',
        flightNumber: 'FK-999',
        departureTime: '2026-08-01T08:00:00Z',
        price: 9999
      }
    };
    const result = verifySynthesizedItinerary({
      travelData,
      finalItinerary: badItinerary,
      flightResults,
      hotelResults
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.type === 'HALLUCINATED_FLIGHT')).toBe(true);
  });

  test('should detect flight price mismatch', () => {
    const badItinerary = {
      ...validItinerary,
      selectedFlight: {
        ...validItinerary.selectedFlight,
        price: 2500 // Sourced price was 5000
      }
    };
    const result = verifySynthesizedItinerary({
      travelData,
      finalItinerary: badItinerary,
      flightResults,
      hotelResults
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.type === 'FLIGHT_PRICE_MISMATCH')).toBe(true);
  });

  test('should detect hallucinated hotel', () => {
    const badItinerary = {
      ...validItinerary,
      selectedHotel: {
        id: 'hotel-fake',
        name: 'Fake Palace',
        checkInDate: '2026-08-01',
        checkOutDate: '2026-08-04',
        pricePerNight: 9000
      }
    };
    const result = verifySynthesizedItinerary({
      travelData,
      finalItinerary: badItinerary,
      flightResults,
      hotelResults
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.type === 'HALLUCINATED_HOTEL')).toBe(true);
  });

  test('should detect hotel price mismatch', () => {
    const badItinerary = {
      ...validItinerary,
      selectedHotel: {
        ...validItinerary.selectedHotel,
        pricePerNight: 1000 // Sourced was 4000
      }
    };
    const result = verifySynthesizedItinerary({
      travelData,
      finalItinerary: badItinerary,
      flightResults,
      hotelResults
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.type === 'HOTEL_PRICE_MISMATCH')).toBe(true);
  });

  test('should detect duration mismatch', () => {
    const badItinerary = {
      ...validItinerary,
      days: [
        { day: 1, title: 'Arrival', activities: ['Check-in'] },
        { day: 2, title: 'Beach Day', activities: ['Relax'] }
        // Missing day 3
      ]
    };
    const result = verifySynthesizedItinerary({
      travelData,
      finalItinerary: badItinerary,
      flightResults,
      hotelResults
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.type === 'DURATION_MISMATCH')).toBe(true);
  });

  test('should detect non-sequential days', () => {
    const badItinerary = {
      ...validItinerary,
      days: [
        { day: 1, title: 'Arrival', activities: ['Check-in'] },
        { day: 3, title: 'Beach Day', activities: ['Relax'] }, // Labelled day 3 instead of 2
        { day: 3, title: 'Departure', activities: ['Flight back'] }
      ]
    };
    const result = verifySynthesizedItinerary({
      travelData,
      finalItinerary: badItinerary,
      flightResults,
      hotelResults
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.type === 'NON_SEQUENTIAL_DAYS')).toBe(true);
  });

  test('should detect timeline flight and hotel checkout mismatch', () => {
    const badItinerary = {
      ...validItinerary,
      selectedFlight: {
        ...validItinerary.selectedFlight,
        departureTime: '2026-08-02T08:00:00Z' // Starts next day instead of trip start date
      },
      selectedHotel: {
        ...validItinerary.selectedHotel,
        checkOutDate: '2026-08-05' // Check-out date is later than expected (expected 2026-08-04)
      }
    };
    const result = verifySynthesizedItinerary({
      travelData,
      finalItinerary: badItinerary,
      flightResults,
      hotelResults
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.type === 'FLIGHT_DATE_MISMATCH')).toBe(true);
    expect(result.issues.some(i => i.type === 'HOTEL_CHECKOUT_MISMATCH')).toBe(true);
  });
});
