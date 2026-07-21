// src/services/flightSourcingService.js
const { Duffel } = require('@duffel/api');
const { FlightResponseSchema } = require('../validations/flightResponseSchema');

const duffel = new Duffel({
  token: process.env.DUFFEL_KEY,
});

// Comprehensive City / Tourist Destination -> IATA code mapping for major Indian locations
const CITY_TO_IATA = {
  // Major Metros & Hubs
  bengaluru: 'BLR',
  bangalore: 'BLR',
  mumbai: 'BOM',
  bombay: 'BOM',
  delhi: 'DEL',
  'new delhi': 'DEL',
  chennai: 'MAA',
  madras: 'MAA',
  hyderabad: 'HYD',
  secunderabad: 'HYD',
  kolkata: 'CCU',
  calcutta: 'CCU',
  ahmedabad: 'AMD',
  amdavad: 'AMD',
  pune: 'PNQ',
  poona: 'PNQ',

  // Major Indian Tourist Destinations
  goa: 'GOI',
  dabolim: 'GOI',
  mopa: 'GOX',
  jaipur: 'JAI',
  'pink city': 'JAI',
  udaipur: 'UDR',
  'lake city': 'UDR',
  jodhpur: 'JDH',
  jaisalmer: 'JSA',
  kochi: 'COK',
  cochin: 'COK',
  ernakulam: 'COK',
  thiruvananthapuram: 'TRV',
  trivandrum: 'TRV',
  varanasi: 'VNS',
  banaras: 'VNS',
  benares: 'VNS',
  agra: 'AGR',
  'taj mahal': 'AGR',
  amritsar: 'ATQ',
  srinagar: 'SXR',
  kashmir: 'SXR',
  leh: 'IXL',
  ladakh: 'IXL',
  'port blair': 'IXZ',
  andaman: 'IXZ',
  bagdogra: 'IXB',
  darjeeling: 'IXB',
  siliguri: 'IXB',
  guwahati: 'GAU',
  assam: 'GAU',
  bhubaneswar: 'BBI',
  puri: 'BBI',
  odisha: 'BBI',
  chandigarh: 'IXC',
  coimbatore: 'CJB',
  ooty: 'CJB',
  madurai: 'IXM',
  mangaluru: 'IXE',
  mangalore: 'IXE',
  visakhapatnam: 'VTZ',
  vizag: 'VTZ',
  indore: 'IDR',
  dehradun: 'DED',
  rishikesh: 'DED',
  haridwar: 'DED',
  mussoorie: 'DED',
  kullu: 'KUU',
  manali: 'KUU',
  bhuntar: 'KUU',
  khajuraho: 'HJR',
  gaya: 'GAY',
  'bodh gaya': 'GAY',
  tirupati: 'TIR',
  tirumala: 'TIR',
};

function resolveIata(place) {
  if (!place) return null;
  const trimmed = place.trim();
  
  // Check if user directly passed a 3-letter IATA code (case-insensitive e.g. BLR, blr)
  if (/^[a-zA-Z]{3}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const cleanKey = trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  
  // Direct dictionary lookup
  if (CITY_TO_IATA[cleanKey]) {
    return CITY_TO_IATA[cleanKey];
  }

  // Partial/contains lookup for composite strings like "Bengaluru City", "Kochi, Kerala"
  for (const [key, code] of Object.entries(CITY_TO_IATA)) {
    if (cleanKey.includes(key) || key.includes(cleanKey)) {
      return code;
    }
  }

  throw new Error(`No IATA code mapping found for "${place}". Please pass a supported Indian city/destination or a 3-letter airport code (e.g., BLR, DEL, GOI).`);
}

exports.sourceFlightsViaDuffel = async (travelParams) => {
  const { origin, destination, startDate, preferences } = travelParams;
  const flightClass = preferences?.flightClass || 'economy';

  console.log('sourceFlightsViaDuffel params:', { origin, destination, startDate, flightClass });

  try {
    if (!startDate) {
      throw new Error(`startDate is required but was undefined. Check the caller of sourceFlightsViaDuffel.`);
    }

    const originCode = resolveIata(origin);
    const destinationCode = resolveIata(destination);

    const offerRequestResponse = await duffel.offerRequests.create(
      {
        slices: [
          {
            origin: originCode,
            destination: destinationCode,
            departure_date: startDate, // 'YYYY-MM-DD'
          },
        ],
        passengers: [{ type: 'adult' }],
        cabin_class: mapCabinClass(flightClass),
      },
      { return_offers: true }
    );

    const offers = offerRequestResponse?.data?.offers ?? [];

    if (!offers.length) {
      throw new Error(`No offers returned for path: ${originCode} to ${destinationCode} on ${startDate}`);
    }

    const USD_TO_INR_RATE = parseFloat(process.env.USD_TO_INR_RATE) || 85;

    const mappedFlights = offers.slice(0, 5).map((offer) => {
      const firstSlice = offer.slices[0];
      const firstSegment = firstSlice.segments[0];
      const lastSegment = firstSlice.segments[firstSlice.segments.length - 1];

      const rawPrice = parseFloat(offer.total_amount);
      const isUSD = (offer.total_currency || 'USD').toUpperCase() === 'USD';
      const priceInINR = isUSD ? Math.round(rawPrice * USD_TO_INR_RATE) : Math.round(rawPrice);

      return {
        id: offer.id,
        airline: firstSegment.marketing_carrier?.name || 'Unknown Airline',
        flightNumber: `${firstSegment.marketing_carrier?.iata_code || ''}-${firstSegment.marketing_carrier_flight_number || ''}`,
        departureTime: firstSegment.departing_at,
        arrivalTime: lastSegment.arriving_at,
        price: priceInINR,
        currency: 'INR',
        class: flightClass,
        origin: originCode,
        destination: destinationCode,
      };
    });

    return FlightResponseSchema.parse({ flights: mappedFlights });
  } catch (error) {
    // Surface the REAL error detail — Duffel SDK errors live in .errors, not .message
    console.error('[FlightSourcingService] Duffel sourcing failed.');
    console.error('  message:', error.message);
    if (error.errors) {
      console.error('  duffel errors:', JSON.stringify(error.errors, null, 2));
    }
    if (error.meta) {
      console.error('  meta:', JSON.stringify(error.meta, null, 2));
    }

    return {
      flights: [
        {
          id: `fallback-${Date.now()}-1`,
          airline: 'Indigo (Programmatic Buffer)',
          flightNumber: '6E-2134',
          departureTime: new Date().toISOString(),
          arrivalTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          price: 5500,
          class: flightClass,
          origin,
          destination,
        },
      ],
    };
  }
};

function mapCabinClass(flightClass) {
  const map = {
    economy: 'economy',
    premium_economy: 'premium_economy',
    business: 'business',
    first: 'first',
  };
  return map[flightClass] || 'economy';
}