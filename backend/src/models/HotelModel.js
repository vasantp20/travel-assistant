// src/models/HotelFixture.js
const mongoose = require('mongoose');

const hotelItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    amenities: { type: [String], default: [] },
  },
  { _id: false }
);

const hotelSchema = new mongoose.Schema({
  destinationKey: { type: String, required: true, unique: true, lowercase: true, trim: true },
  destinationLabel: { type: String, required: true }, // original casing, e.g. "Goa"
  hotels: { type: [hotelItemSchema], required: true },
  generatedAt: { type: Date, default: Date.now },
  model: { type: String, default: 'llama-3.3-70b-versatile' },
});

module.exports = mongoose.model('HotelModel', hotelSchema);