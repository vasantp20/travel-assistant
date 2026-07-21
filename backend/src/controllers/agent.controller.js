const { Readable } = require('stream');
const { Groq } = require('groq-sdk');
const { coordinateMultiAgentPlan } = require('../orchestrator');
const mongoose = require('mongoose');

const AGENT_PROVIDER = (process.env.AGENT_PROVIDER || 'groq').toLowerCase();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

// Simple internal logger helper for consistent formatting
const logger = {
  info: (msg, meta = '') => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, meta ? JSON.stringify(meta) : ''),
  warn: (msg, meta = '') => console.warn(`[${new Date().toISOString()}] [WARN] ⚠️ ${msg}`, meta ? JSON.stringify(meta) : ''),
  error: (msg, err = '') => console.error(`[${new Date().toISOString()}] [ERROR] ❌ ${msg}`, err.stack || err || '')
};


function initSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

function writeSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

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

