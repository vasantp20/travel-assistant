/**
 * Strips markdown code fences and stray leading/trailing text so the
 * model's output can be safely JSON.parsed. Handles:
 *   ```json ... ```
 *   ``` ... ```
 *   plain text with leading/trailing whitespace or explanatory prose
 */
function cleanJSONResponse(rawText) {
    if (typeof rawText !== 'string') return rawText;
  
    let text = rawText.trim();
  
    // Remove ```json / ``` fences (opening and closing)
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  
    text = text.trim();
  
    // If there's still stray text before/after the JSON, extract the
    // outermost {...} or [...] block as a fallback safety net.
    const firstBrace = text.search(/[{[]/);
    const lastBrace = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.slice(firstBrace, lastBrace + 1);
    }
  
    return text;
  }

  module.exports = { cleanJSONResponse };