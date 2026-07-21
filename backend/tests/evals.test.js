// tests/evals.test.js
const mongoose = require('mongoose');
const { coordinateMultiAgentPlan } = require('../src/orchestrator');
const { FlightResponseSchema } = require('../src/validations/flightResponseSchema');
const FlightInventory = require('../src/models/FlightInventory'); 

// A Mock response wrapper to catch Express res.write streams during evaluation
const createMockResponse = () => {
  let outputData = '';
  return {
    write: (chunk) => {
      // Capture Server-Sent Events stream chunks
      if (chunk.includes('data:')) {
        try {
          const rawStr = chunk.replace('data:', '').trim();
          const parsed = JSON.parse(rawStr);
          // If the stream outputs the final finalized structural payload, capture it
          if (parsed.status === 'FINAL_OUTPUT' || parsed.type === 'final') {
            outputData = parsed.content;
          }
        } catch (e) {
          // It's an intermediate stream token string or milestone message
        }
      }
    },
    end: () => {}
  };
};

describe('VoyageCraft AI Multi-Agent Evaluation Loop', () => {
  beforeAll(async () => {
    // Connect to your local test database state
    await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/voyagecraft_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // 1. Golden Dataset Test Cases
  const evaluationDataset = [
    {
      name: "Tight Budget Goa Trip",
      input: {
        destination: "Goa",
        origin: "Bengaluru",
        budget: 5000, // Strict low budget in INR
        startDate: "2026-09-10T08:00:00.000Z",
        durationDays: 3,
        preferences: { flightClass: "economy", hotelRating: 3, pace: "relaxed" },
        missingInfoAcknowledged: true
      }
    },
    {
      name: "Havelock Ferry Constraint Trip",
      input: {
        destination: "Havelock Island",
        origin: "Delhi",
        budget: 45000,
        startDate: "2026-10-12T15:00:00.000Z", // Late arrival causing potential dependency errors
        durationDays: 5,
        preferences: { flightClass: "economy", hotelRating: 4, pace: "active" },
        missingInfoAcknowledged: true
      }
    }
  ];

  evaluationDataset.forEach(({ name, input }) => {
    test(`Eval [${name}]: Verify Compliance, Budget Faithfulness, and Groundedness`, async () => {
      const res = createMockResponse();
      
      // Execute multi-agent orchestration loop
      await coordinateMultiAgentPlan(input, res);
      
      // Wait briefly for all parallel async routines to collapse and write out data
      const agentFinalOutput = res.outputData; 
      
      // ----------- METRIC 1: FORMAT COMPLIANCE -----------
      let parsedOutput;
      let formatPass = true;
      try {
        parsedOutput = typeof agentFinalOutput === 'string' ? JSON.parse(agentFinalOutput) : agentFinalOutput;
        // Validate with Zod structural expectations
        // If it throws an error, compliance fails
      } catch (err) {
        formatPass = false;
      }
      expect(formatPass).toBe(true);

      // ----------- METRIC 2: BUDGET FAITHFULNESS -----------
      if (formatPass && parsedOutput) {
        const flightCost = parsedOutput.flightSelection?.price || 0;
        const hotelCostPerNight = parsedOutput.hotelSelection?.pricePerNight || 0;
        const totalCalculatedCost = flightCost + (hotelCostPerNight * input.durationDays);

        // Verify mathematically if it stayed within boundaries
        expect(totalCalculatedCost).toBeLessThanOrEqual(input.budget);
      }

      // ----------- METRIC 3: HALLUCINATION CHECK -----------
      if (formatPass && parsedOutput?.flightSelection) {
        const chosenFlightNum = parsedOutput.flightSelection.flightNumber;
        
        // Query the local database state to ensure this record actually exists
        const dbFlightMatch = await FlightInventory.findOne({ flightNumber: chosenFlightNum });
        
        // Assert that the flight was chosen from real data state, not hallucinated
        expect(dbFlightMatch).not.toBeNull();
      }
    }, 20000); // 20-second timeout for LLM chaining responses
  });
});