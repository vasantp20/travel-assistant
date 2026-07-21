const mongoose = require('mongoose');

const LocationMetadataSchema = new mongoose.Schema(
  {
    // Lowercase and trimmed for reliable query routing (e.g., "goa", "udaipur")
    destination: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Region and country categorization to support targeted tracking
    region: {
      type: String,
      default: 'India',
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    // Critical geographical orientation flag to prevent clickbait-induced context errors
    coastalOrientation: {
      type: String,
      enum: ['West', 'East', 'None'],
      default: 'None',
      required: true,
    },
    // Strict, bulletproof text directives to inject directly into agent system prompts
    geographicalGuardrails: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A location must have at least one geographical guardrail fact.',
      },
    },
    // Logistical hard-bounds to validate downstream itineraries programmatically
    logisticalConstraints: {
      primaryAirportCode: {
        type: String,
        uppercase: true,
        trim: true,
      },
      primaryAirportToCenterKm: {
        type: Number,
        min: 0,
      },
      recommendedLocalTransit: {
        type: [String],
        default: ['cab', 'auto-rickshaw'],
      },
    },
    // Behavioral or cultural nuances to optimize localized itinerary planning
    commonsenseRules: {
      type: [String],
      default: [],
    },
    // Metadata for tracking cache staleness and background cron worker audits
    lastHydratedAt: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically provides createdAt and updatedAt fields
    collection: 'location_metadata',
  }
);

// Compiles and exports the model
module.exports = mongoose.model('LocationMetadata', LocationMetadataSchema);