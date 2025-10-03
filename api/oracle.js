// This is the final, corrected code for the Oracle Engine.
// It is written in the universal CommonJS format to work perfectly on Vercel.

module.exports = async (request, response) => {
  // 1. Check if the request is a POST request.
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  // 2. Get the text from the incoming request.
  const { text } = request.body;
  if (!text) {
    return response.status(400).json({ error: 'No text provided for analysis.' });
  }

  // 3. Get the secret API key securely from Vercel's environment variables.
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'API key is not configured.' });
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  // 4. Prepare the prompt for Gemini.
  const prompt = `
    You are "The Oracle," a world-class literary analyst. Analyze the following text meticulously.
    Provide a JSON object as your response with three keys: "style", "structure", and "narrative".
    - For "style", give three specific, actionable suggestions to improve word choice, tone, or evocative language.
    - For "structure", give two suggestions on improving paragraph flow or sentence variation.
    - For "narrative", give one core insight about the potential narrative arc, theme, or character voice.
    
    Text to analyze:
    ---
    ${text}
    ---
  `;

  try {
    // 5. Securely call the Gemini API from the server.
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text();
        console.error('Gemini API Error:', errorData);
        return response.status(500).json({ error: 'Failed to get a response from the AI.' });
    }

    const geminiData = await geminiResponse.json();
    
    // 6. Extract and clean the JSON response from Gemini.
    const rawContent = geminiData.candidates[0].content.parts[0].text;
    const cleanedJsonString = rawContent.replace(/```json|```/g, '').trim();
    const analysisResult = JSON.parse(cleanedJsonString);
    
    // 7. Send the analysis back to The Observatory.
    return response.status(200).json(analysisResult);

  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'An internal error occurred.' });
  }
};
