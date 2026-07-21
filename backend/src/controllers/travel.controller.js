// const RouteCache = require('../models/RouteCache');
const { coordinateMultiAgentPlan } = require('../agents/orchestrator');

const handleItineraryRequest = async (req, res) => {
  const { destination, budget, startDate, durationDays, preferences } = req.validatedTravelData;

  try {


    // 2. Cache Miss: Send the structured payload directly to your agent orchestrator
    // We stream the response back using Server-Sent Events (SSE) for great UX
    res.setHeader('Content-Type', 'text/event-stream');
    await coordinateMultiAgentPlan(req.validatedTravelData, res);
    
  } catch (error) {
    // Fallback logic handled gracefully here
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
};

module.exports = {
  handleItineraryRequest
};