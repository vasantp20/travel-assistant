// scripts/seedHotelFixtures.js
// Run locally, on demand: node scripts/seedHotelFixtures.js
// Not called at runtime by the app — this is a one-off/occasional content-authoring step.

require('dotenv').config();
const mongoose = require('mongoose');
const Groq = require('groq-sdk');
const HotelModel = require('../models/HotelModel');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const DESTINATIONS = ['Goa', 'Manali', 'Jaipur', 'Udaipur', 'Rishikesh', 'Munnar', 'Pondicherry', 'Coorg'];

async function generateForDestination(destination) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Generate 6 realistic but FICTIONAL hotel listings for a travel demo app.
Return strictly valid JSON: { "hotels": [{ "name": string, "description": string (1 sentence), "amenities": string[3-5] }] }
Names and descriptions should feel plausible for the destination but must NOT reference real hotel brands or chains.
Do not include markdown fences or commentary — JSON only.`,
      },
      { role: 'user', content: `Destination: ${destination}` },
    ],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  return parsed.hotels;
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in your environment.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for seeding.');

  for (const destination of DESTINATIONS) {
    const key = destination.toLowerCase();

    try {
      console.log(`Generating fixtures for ${destination}...`);
      const hotels = await generateForDestination(destination);

      await HotelModel.findOneAndUpdate(
        { destinationKey: key },
        {
          destinationKey: key,
          destinationLabel: destination,
          hotels,
          generatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      console.log(`  -> saved ${hotels.length} hotels for ${destination}`);
    } catch (err) {
      console.error(`  Failed for ${destination}:`, err.message);
      // Continue to next destination rather than aborting the whole run
    }
  }

  await mongoose.disconnect();
  console.log('Done. Disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});