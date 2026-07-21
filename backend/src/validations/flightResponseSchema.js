const { z } = require('zod');

// Schema for Flight Options
const FlightResponseSchema = z.object({
  flights: z.array(z.object({
    id: z.string(),
    airline: z.string(),
    flightNumber: z.string(),
    departureTime: z.string(), // ISO string
    arrivalTime: z.string(),   // ISO string
    price: z.number().nonnegative(),
    currency: z.string().default('INR'),
    class: z.enum(['economy', 'business', 'first']),
    origin: z.string(),
    destination: z.string()
  }))
});


module.exports = {FlightResponseSchema}