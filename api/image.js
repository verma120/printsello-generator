// Vercel Serverless Function — /api/image
// Standalone tool: given a topic/title, returns a few relevant SEO-friendly
// stock photo options (via Pexels free API) for the user to pick from.

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
    const { query } = req.body || {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Topic/title missing in request body.' });
    }

    if (!process.env.PEXELS_API_KEY) {
      return res.status(500).json({
        error: 'Server par PEXELS_API_KEY set nahi hai. Free key https://www.pexels.com/api/ se lekar Vercel Environment Variables me add karein.'
      });
    }

    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );

    if (!r.ok) {
      return res.status(r.status).json({ error: 'Pexels API se image nahi mil payi.' });
    }

    const data = await r.json();
    const images = (data?.photos || []).map(p => ({
      url: p.src?.large,
      thumb: p.src?.medium,
      alt: p.alt || query,
      credit: p.photographer || ''
    })).filter(i => i.url);

    if (images.length === 0) {
      return res.status(404).json({ error: 'Is topic ke liye koi image nahi mili, dusra keyword try karein.' });
    }

    return res.status(200).json({ images });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error.' });
  }
}
