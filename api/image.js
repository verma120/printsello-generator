// Vercel Serverless Function — /api/image
// Standalone tool: given a topic/title, returns a few relevant SEO-friendly
// stock photo options via Openverse (api.openverse.org) — a free, open
// Creative-Commons image search that needs NO API key at all.

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

    const r = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=6&aspect_ratio=wide&license_type=commercial`,
      { headers: { 'User-Agent': 'PrintselloJobArticleGenerator/1.0' } }
    );

    if (!r.ok) {
      return res.status(r.status).json({ error: 'Openverse se image nahi mil payi.' });
    }

    const data = await r.json();
    const images = (data?.results || []).map(p => ({
      url: p.url,
      thumb: p.thumbnail || p.url,
      alt: p.title || query,
      credit: p.creator || p.source || ''
    })).filter(i => i.url);

    if (images.length === 0) {
      return res.status(404).json({ error: 'Is topic ke liye koi image nahi mili, dusra keyword try karein (jaise sirf "government office" ya "exam").' });
    }

    return res.status(200).json({ images });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error.' });
  }
}
