const { z } = require('zod');

const HotelResponseSchema = z.object({
    hotels: z.array(z.object({
        id: z.string(),
        name: z.string(),
        rating: z.number().min(1).max(5),
        pricePerNight: z.number().nonnegative(),
        totalPrice: z.number().nonnegative(),
        amenities: z.array(z.string()),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number()
        })
    }))
});


module.exports = { HotelResponseSchema }