const { coordinateMultiAgentPlan } = require('../orchestrator');

const AGENT_PROVIDER = (process.env.AGENT_PROVIDER || 'groq').toLowerCase();

exports.agentHealth = async (req, res, next) => {
  res.json({ status: 'ok', provider: AGENT_PROVIDER, timestamp: new Date().toISOString() });
};

exports.handleItineraryRequest = async (req, res) => {
  const travelData = req.validatedTravelData; // Guaranteed clean data via Zod

  try {
      // 1. Establish SSE Connection for live streaming updates to frontend
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 2. Hand off control to the multi-agent orchestration manager
      await coordinateMultiAgentPlan(travelData, res);
      

  } catch (error) {
      console.error("Orchestration failed:", error);
      // If SSE hasn't started sending data yet, we can send a standard 500
      if (!res.headersSent) {
          return res.status(500).json({ error: "Failed to generate resilient itinerary" });
      }
      res.write(`data: ${JSON.stringify({ error: "Critical error during multi-agent planning." })}\n\n`);
      res.end();
  }
};

