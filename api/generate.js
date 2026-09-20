// Vercel Serverless Function — /api/generate
// Uses Google Gemini's FREE API tier (no billing/card required).
// Get a free key at: https://aistudio.google.com/apikey
//
// Optional: set PEXELS_API_KEY (free at https://www.pexels.com/api/) to auto-fetch
// a relevant featured/hero image for the article.

async function fetchFeaturedImage(query) {
  if (!process.env.PEXELS_API_KEY || !query) return null;
  try {
    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );
    if (!r.ok) return null;
    const data = await r.json();
    return data?.photos?.[0]?.src?.large || null;
  } catch (e) {
    return null;
  }
}

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
    const { prompt, imageQuery } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt missing in request body.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Server par GEMINI_API_KEY set nahi hai. Vercel Project Settings > Environment Variables me isse add karein.'
      });
    }

    const MODEL = 'gemini-2.5-flash';

    // Try to fetch a relevant featured image (free, via Pexels). Silently
    // skipped if PEXELS_API_KEY isn't configured — article still works fine.
    const imageUrl = await fetchFeaturedImage(imageQuery || 'government office india');
    const finalPrompt = imageUrl
      ? `${prompt}\n\nFEATURED IMAGE URL (use this exact URL for the hero/featured image src): ${imageUrl}`
      : prompt;

    const callGemini = (useSearch) => fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
          ...(useSearch ? { tools: [{ google_search: {} }] } : {}),
          generationConfig: {
            // Content ab lean/concise instructions ke saath likha ja raha hai
            // (~800 words + trimmed CSS/JS), isliye ceiling kam kar di —
            // isse response fast aata hai aur tokens bhi kam burn hote hain.
            maxOutputTokens: 16000,
            temperature: 0.7,
            // Gemini 2.5 models "think" before answering, and those thinking
            // tokens are deducted from maxOutputTokens too. Turning thinking
            // off means the full budget goes to the actual visible article.
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      }
    );

    // Google Search grounding needs a billing-enabled key on some account
    // types. Try with it first (more accurate); if that specifically fails,
    // silently fall back to a plain (non-grounded) call so the tool never
    // breaks for pure free-tier keys.
    let geminiResponse = await callGemini(true);
    if (!geminiResponse.ok) {
      const errCheck = await geminiResponse.clone().json().catch(() => null);
      const msg = errCheck?.error?.message || '';
      if (/search|tool|grounding/i.test(msg)) {
        geminiResponse = await callGemini(false);
      }
    }

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
