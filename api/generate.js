// Vercel Serverless Function — /api/generate
// Uses Google Gemini's FREE API tier (no billing/card required).
// Get a free key at: https://aistudio.google.com/apikey

export default async function handler(req, res) {
  // --- CORS: Blogger / kisi bhi domain se call allow karne ke liye ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt missing in request body.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Server par GEMINI_API_KEY set nahi hai. Vercel Project Settings > Environment Variables me isse add karein.'
      });
    }

    // Free tier model. If you hit rate limits, gemini-2.0-flash-lite has an even
    // higher free RPM/RPD — swap the model name below.
    const MODEL = 'gemini-2.5-flash';

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 8000,
            temperature: 0.7
          }
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({
        error: data?.error?.message || 'Gemini API se error aaya.'
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\n') || '';

    if (!text) {
      const finishReason = data?.candidates?.[0]?.finishReason || 'unknown';
      return res.status(502).json({
        error: `Gemini se khaali response aaya (finishReason: ${finishReason}). Dobara try karein ya prompt chhota karein.`
      });
    }

    // Normalize to the same shape the frontend already expects from Anthropic:
    // { content: [ { text: "..." } ] }
    return res.status(200).json({ content: [{ text }] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error.' });
  }
}
