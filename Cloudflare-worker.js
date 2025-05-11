// Copy this code into your Cloudflare Worker script

async function handleRequest(request, env) {
  // CORS headers to allow communication with the frontend
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Ensure the request is a POST request
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Only POST requests are allowed.' }),
      { headers: corsHeaders, status: 405 }
    );
  }

  try {
    // Parse the JSON body from the frontend
    const requestBody = await request.json();

    // Prepare the request body for OpenAI's API
    const openAiRequestBody = {
      model: 'gpt-4o', // Use the gpt-4o model
      messages: requestBody.messages, // Pass the conversation history
      max_tokens: 300, // Limit the response length
    };

    // Send the request to OpenAI's API
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`, // Use the secret API key
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAiRequestBody),
    });

    // Parse the response from OpenAI
    const openAiData = await openAiResponse.json();

    // Return the response to the frontend
    return new Response(JSON.stringify(openAiData), { headers: corsHeaders });
  } catch (error) {
    // Handle errors and return a meaningful response
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request.' }),
      { headers: corsHeaders, status: 500 }
    );
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request, event));
});