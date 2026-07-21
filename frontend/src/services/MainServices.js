import AppConfig from "../AppConfig"

export const MainServices = {
    getRequest: getRequest,
    postRequest: postRequest,
    postStreamRequest: postStreamRequest // <--- Our new streaming engine
}

function getRequest(url) {
    const requestHeader = {
        method: 'GET',
        headers: headers()
    }
    console.log("Get request", requestHeader)
    console.log(AppConfig.baseUrl+url)
    return fetch(AppConfig.baseUrl + url, requestHeader).then(handleResponse)
}

function postRequest(url, bodyObj) {
    const requestHeader = {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(bodyObj)
    }
    return fetch(AppConfig.baseUrl + url, requestHeader).then(handleResponse)
}


/**
 * Executes an authenticated POST request and processes a real-time Server-Sent Event stream.
 * @param {string} url - The target API endpoint
 * @param {object} bodyObj - The payload (e.g., { prompt: "..." })
 * @param {function} onMessage - Callback triggered whenever a complete SSE event is processed.
 * Receives an object: { event: string, data: any }
 */
async function postStreamRequest(url, bodyObj, onMessage) {
    const requestHeader = {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(bodyObj)
    };

    const response = await fetch(AppConfig.baseUrl + url, requestHeader);
    console.log(response)
    if (!response.ok) {
        // If the initial connection fails, fall back to your classic error tracking block
        return handleResponse(response);
    }

    // Grab the reader from the body stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
        let currentEvent = 'message'; // Default SSE standard event type

        while (true) {
            const { value, done } = await reader.read();
            if (done) break; // Stream ended naturally

            // Decode binary chunks back to plain text strings
            buffer += decoder.decode(value, { stream: true });

            // SSE streams separate messages by double newlines (\n\n)
            const parts = buffer.split('\n');
            
            // The last item might be a partial message chunk, store it back in the buffer
            buffer = parts.pop();

            for (const line of parts) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                // Track the active SSE event line modifier
                if (trimmed.startsWith('event:')) {
                    currentEvent = trimmed.replace('event:', '').trim();
                } 
                // Track the active SSE payload block
                else if (trimmed.startsWith('data:')) {
                    const rawData = trimmed.replace('data:', '').trim();
                    
                    let parsedData = rawData;
                    try {
                        // Automatically deserialize structural JSON state targets if possible
                        parsedData = JSON.parse(rawData);
                    } catch (e) {
                        // Fall back to raw string string if it's basic text tokens
                    }

                    // Flush decoded values up to the frontend consumer layer
                    onMessage({ event: currentEvent, data: parsedData });
                    
                    // Reset tracking channel variant for subsequent messages
                    if (currentEvent !== 'message') currentEvent = 'message';
                }
            }
        }
    } catch (streamError) {
        console.error("In-flight network stream processing broken:", streamError);
        throw streamError;
    } finally {
        reader.releaseLock();
    }
}


function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        return data;
    });
}

function headers() {
    return {
        'Content-Type': 'application/json'
    }
}