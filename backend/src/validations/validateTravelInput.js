const { z } = require('zod');

// Schema matching your UI form fields
const travelFormSchema = z.object({
  destination: z.string().min(2),
  origin: z.string().min(2),
  budget: z.number().positive(),
  startDate: z.string().datetime().refine((val) => {
    const selected = new Date(val);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    return selected > todayEnd;
  }, {
    message: "startDate must be a future date (greater than today)."
  }),
  durationDays: z.number().int().min(1).max(14),
  preferences: z.object({
    flightClass: z.enum(['economy', 'business']),
    hotelRating: z.number().min(1).max(5),
    pace: z.enum(['relaxed', 'packed'])
  }),
  missingInfoAcknowledged: z.boolean().default(true) 
});

const validateTravelInput = (req, res, next) => {
  const result = travelFormSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid form data", details: result.error.errors });
  }
  req.validatedTravelData = result.data;
  next();
};

module.exports = validateTravelInput;