// Vercel Serverless Function — /api/image
// Standalone tool: given a topic/title, returns a few relevant SEO-friendly
// stock photo options via Openverse (api.openverse.org) — a free, open
// Creative-Commons image search that needs NO API key at all.

function cleanQuery(q) {
  return q
    .replace(/[:,\-–—|/\\]/g, ' ')   // colons/commas/dashes etc confuse search
    .replace(/\b(20\d{2})\b/g, '')    // drop years like 2026
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 4)                      // keep it short — 2-4 keywords works best
    .join(' ');
}

async function searchOpenverse(q) {
  const r = await fetch(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=6&license_type=commercial`,
    { headers: { 'User-Agent': 'PrintselloJobArticleGenerator/1.0' } }
  );
  if (!r.ok) return null;
  const data = await r.json();
  return (data?.results || []).map(p => ({
    url: p.url,
    thumb: p.thumbnail || p.url,
    alt: p.title || q,
    credit: p.creator || p.source || ''
  })).filter(i => i.url);
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
    const { query } = req.body || {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Topic/title missing in request body.' });
    }

    const cleaned = cleanQuery(query) || query;

    let images = await searchOpenverse(cleaned);

    // Specific query ne kuch na diya ho to broader fallback try karo
    if (!images || images.length === 0) {
      images = await searchOpenverse('government office india');
    }

    if (!images) {
      return res.status(502).json({ error: 'Openverse se image nahi mil payi, dobara try karein.' });
    }

    if (images.length === 0) {
      return res.status(404).json({ error: 'Koi image nahi mili, dusra keyword try karein.' });
    }

    return res.status(200).json({ images });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error.' });
  }
}
