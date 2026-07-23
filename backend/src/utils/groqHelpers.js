// src/utils/groqHelpers.js
const Groq = require('groq-sdk'); // Make sure to: npm install groq-sdk
const { cleanJSONResponse } = require('./jsonCleaner');

let groq;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function getGroq() {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("Missing GROQ_API_KEY environment variable.");
    }
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

/**
 * Initializes Server-Sent Events headers on the response object
 */
function initSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}

/**
 * Pushes structured SSE events down the pipeline to the UI
 */
function writeSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Master streaming engine loop that pipes text chunks to SSE on the fly 
 * and returns the final accumulated text and tool calls to the caller agent.
 */
async function streamGroqToSSE(messages, res, { tools = null, tool_choice = 'auto' } = {}) {
  // Simple fallback logger if your project's custom logger isn't global
  const logInfo = (msg, data) => console.log(`[GroqUtils] INFO: ${msg}`, data || '');

  logInfo(`Initiating streamed Groq connection loop using model: ${GROQ_MODEL}`);
  
  const payload = {
    model: GROQ_MODEL,
    messages,
    stream: true,
    max_tokens: 4096,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = tool_choice;
  }

  const stream = await getGroq().chat.completions.create(payload);

  const toolCalls = {};
  let accumulatedText = ''; 

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    console.log("Delta:", delta);
    if (!delta) continue;
    if (delta.reasoning) {
      writeSSE(res, 'reasoning', { delta: delta.reasoning });
    }
    // Stream text directly to the UI using your specified custom event name 'content'
    if (delta.content) {
      accumulatedText += delta.content; 
      // writeSSE(res, 'content', { delta: delta.content });
    }

  }
  
  try {
    // Parse the accumulated string back into an actual JSON object/array
    const cleanedText = cleanJSONResponse(accumulatedText);
    const parsedJSON = JSON.parse(cleanedText);
    
    // Send the clean, structured JSON object as the delta payload
    writeSSE(res, 'content', { delta: parsedJSON });
  } catch (error) {
    console.error("Failed to parse accumulated text to JSON:", error);
    // Fallback in case the LLM output was malformed JSON
    writeSSE(res, 'content', { delta: accumulatedText });
  }
  
  return {
    textResponse: accumulatedText || null
  };
}

async function fetchFromGroq(messages, res, { tools = null, tool_choice = 'auto' } = {}) {
  // Simple fallback logger if your project's custom logger isn't global
  const logInfo = (msg, data) => console.log(`[GroqUtils] INFO: ${msg}`, data || '');

  logInfo(`Calling: Groq connection loop using model: ${GROQ_MODEL}`);
  
  const payload = {
    model: GROQ_MODEL,
    messages,
    stream: false,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = tool_choice;
  }

  const data = await getGroq().chat.completions.create(payload);
  console.log("Data");
  console.log(data.choices[0].message);


  return {
    textResponse: data.choices[0].message || null
  };
}

module.exports = {
  getGroq,
  initSSE,
  writeSSE,
  streamGroqToSSE,
  fetchFromGroq
};