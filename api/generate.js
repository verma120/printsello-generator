// Vercel Serverless Function — /api/generate
// Uses Google Gemini's FREE API tier (no billing/card required).
// Get a free key at: https://aistudio.google.com/apikey

export default async function handler(req, res) {
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

    const MODEL = 'gemini-2.5-flash';

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            // Article + full HTML/CSS/JS + schema is a LOT of text, so give it
            // plenty of room. 2.5 Flash's ceiling is 65536.
            maxOutputTokens: 32000,
            temperature: 0.7,
            // Gemini 2.5 models "think" before answering, and those thinking
            // tokens are deducted from maxOutputTokens too. Turning thinking
            // off means the full budget goes to the actual visible article.
            thinkingConfig: { thinkingBudget: 0 }
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

    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text || '').join('\n') || '';

    if (!text) {
      const finishReason = candidate?.finishReason || 'unknown';
      return res.status(502).json({
        error: `Gemini se khaali response aaya (finishReason: ${finishReason}). Dobara try karein ya prompt chhota karein.`
      });
    }

    if (candidate?.finishReason === 'MAX_TOKENS') {
      return res.status(502).json({
        error: 'Response beech me hi kat gaya (token limit). Dobara try karein — usually agli baar poora ban jaata hai.'
      });
    }

    return res.status(200).json({ content: [{ text }] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error.' });
  }
}
