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
    const { prompt, imageQuery, chosenImageUrl, needsSearch } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt missing in request body.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Server par GEMINI_API_KEY set nahi hai. Vercel Project Settings > Environment Variables me isse add karein.'
      });
    }

    const MODEL = 'gemini-2.5-flash';

    // Agar user ne "Image Generate करें" tool se khud image choose ki hai,
    // usi ko priority do — warna Pexels se auto-fetch karo.
    const imageUrl = chosenImageUrl || await fetchFeaturedImage(imageQuery || 'government office india');
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
            // Search ab sirf zaroorat par chalti hai (needsSearch flag), isliye
            // normal case me ye ceiling sirf ek safety margin hai.
            maxOutputTokens: 30000,
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
    // types, AND its search results themselves consume output-token budget.
    // Isliye ise SIRF tab try karo jab form me core details khaali hon
    // (frontend se needsSearch=true aata hai). Warna seedha plain call —
    // fast, reliable, aur MAX_TOKENS ka risk nahi.
    let geminiResponse = await callGemini(!!needsSearch);
    let data = await geminiResponse.json();
    let candidate = data?.candidates?.[0];

    const needsFallback = needsSearch && (!geminiResponse.ok
      ? /search|tool|grounding/i.test(data?.error?.message || '')
      : candidate?.finishReason === 'MAX_TOKENS');

    if (needsFallback) {
      geminiResponse = await callGemini(false);
      data = await geminiResponse.json();
      candidate = data?.candidates?.[0];
    }

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({
        error: data?.error?.message || 'Gemini API se error aaya.'
      });
    }

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
