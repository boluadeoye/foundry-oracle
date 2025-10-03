// This is the final, corrected code for the Oracle Engine.
// It includes critical CORS headers to grant permission for the browser to access it.

module.exports = async (request, response) => {
  // --- START: Critical CORS Permissions ---
  // This allows your website to securely communicate with the Oracle.
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*'); // Allows any website to access it. For production, you might restrict this.
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle the browser's pre-flight request.
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  // --- END: Critical CORS Permissions ---

  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { text } = request.body;
  if (!text) {
    return response.status(400).json({ error: 'No text provided for analysis.' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'API key is not configured on Vercel.' });
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

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
    
    const rawContent = geminiData.candidates[0].content.parts[0].text;
    const cleanedJsonString = rawContent.replace(/```json|```/g, '').trim();
    const analysisResult = JSON.parse(cleanedJsonString);
    
    return response.status(200).json(analysisResult);

  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'An internal error occurred.' });
  }
};
