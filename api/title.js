// Vercel Serverless Function — /api/title
// Standalone tool: given a rough topic, returns 5 SEO-friendly, clickable
// blog title suggestions (lightweight, fast, low token usage).

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
    const { topic, lang } = req.body || {};

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic missing in request body.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Server par GEMINI_API_KEY set nahi hai. Vercel Project Settings > Environment Variables me isse add karein.'
      });
    }

    const MODEL = 'gemini-2.5-flash';

    const schema = {
      type: 'ARRAY',
      items: { type: 'STRING' }
    };

    const prompt = `Tum ek SEO expert Sarkari Naukri blogger ho. Topic: "${topic}" ke liye 5 alag-alag SEO-friendly, clickable blog post titles suggest karo, language: ${lang || 'Hindi'}.

Rules:
- Har title 60 characters ke aas-paas ho (Google search snippet me poora dikhe)
- Keyword-rich ho (jo log Google/ChatGPT me search karte hain wahi tarah)
- Click-worthy ho (numbers, saal, "Apply Online", "Eligibility", "Last Date" jaise power words use karo jaha fit ho)
- Har title alag angle/style se ho (kuch formal, kuch curiosity-driven)
- Kabhi fake/wrong information mat daalo, sirf title style suggest karo

Sirf JSON array of 5 strings return karo, kuch aur mat likho.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.9,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json',
            responseSchema: schema
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

    const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';

    if (!raw) {
      return res.status(502).json({ error: 'Titles generate nahi ho paaye. Dobara try karein.' });
    }

    let titles;
    try {
      titles = JSON.parse(raw);
    } catch (e) {
      return res.status(502).json({ error: 'AI response valid JSON nahi tha. Dobara try karein.' });
    }

    if (!Array.isArray(titles) || titles.length === 0) {
      return res.status(502).json({ error: 'Koi title nahi mila. Dobara try karein.' });
    }

    return res.status(200).json({ titles });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error.' });
  }
}
