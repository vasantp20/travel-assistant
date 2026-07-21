// src/services/hotelProviders/mockHotelProvider.js
const HotelModel = require('../models/HotelModel');

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const GENERIC_FALLBACK = [
  { name: 'The Grand Retreat', description: 'A comfortable stay with modern amenities.', amenities: ['WiFi', 'Pool', 'Breakfast'] },
  { name: 'Riverside Residency', description: 'Quiet rooms close to the city center.', amenities: ['WiFi', 'Parking'] },
];

exports.searchHotels = async ({ destination, checkInDate, checkOutDate, nights, minRating, budget }) => {
    const key = destination.toLowerCase();
  
    const fixture = await HotelModel.findOne({ destinationKey: key }).lean();
    const pool = fixture?.hotels?.length ? fixture.hotels : GENERIC_FALLBACK;
  
    if (!fixture) {
      console.warn(`[mockHotelProvider] No fixture found for "${destination}" — using generic fallback pool.`);
    }
  
    const seedBase = destination.length + checkInDate.length;
  
    const hotels = pool
      .map((hotel, i) => {
        // Independent random draws for rating and price — avoids coupling "good" with "expensive"
        const ratingRand = seededRandom(seedBase + i * 2);
        const priceRand = seededRandom(seedBase + i * 2 + 1);
  
        const rating = Math.min(5, Math.max(2, Math.round(3 + ratingRand * 2)));
        const basePrice = Math.round(1500 + priceRand * 4000);
  
        return {
          id: `mock-hotel-${key}-${i}`,
          name: hotel.name,
          description: hotel.description,
          amenities: hotel.amenities,
          rating,
          reviewScore: Number((6 + ratingRand * 3).toFixed(1)),
          pricePerNight: basePrice,
          totalPrice: basePrice * nights,
          currency: 'INR',
          checkInDate,
          checkOutDate,
          location: destination,
          photo: null,
          _source: 'mock',
        };
      })
      .filter((h) => (minRating ? h.rating >= minRating : true))
      .filter((h) => (budget ? h.pricePerNight <= budget : true))
      .sort((a, b) => a.pricePerNight - b.pricePerNight);
  
    return hotels;
  };