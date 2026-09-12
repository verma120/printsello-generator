// Vercel Serverless Function — /api/extract
// Takes raw text extracted from an Official Notification PDF (client-side via pdf.js)
// and asks Gemini to pull out structured fields as JSON.

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
    const { text } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'PDF text missing in request body.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Server par GEMINI_API_KEY set nahi hai. Vercel Project Settings > Environment Variables me isse add karein.'
      });
    }

    const MODEL = 'gemini-2.5-flash';

    const schema = {
      type: 'OBJECT',
      properties: {
        board: { type: 'STRING' },
        postName: { type: 'STRING' },
        vacancy: { type: 'STRING' },
        eligibility: { type: 'STRING' },
        salary: { type: 'STRING' },
        lastDate: { type: 'STRING' },
        importantDates: { type: 'STRING' },
        applicationProcess: { type: 'STRING' },
        officialWebsite: { type: 'STRING' },
        applyLink: { type: 'STRING' }
      }
    };

    const prompt = `Neeche ek Official Government Job Notification se nikala gaya raw PDF text diya gaya hai. Isse ye fields nikalo aur JSON me do. Agar koi field notification me nahi mile to us field ki value khaali string "" rakho — kabhi bhi fake/guessed value mat do.

Fields:
- board: Recruitment board/department/organisation ka naam
- postName: Post/vacancy ka naam
- vacancy: Total number of vacancies (number ke saath unit, jaise "313 Posts")
- eligibility: Educational qualification + age limit summary (ek line me)
- salary: Pay scale / salary range
- lastDate: Application ki last date (jo bhi date format PDF me hai wahi rakho)
- importantDates: Baaki important dates ek line me comma se separate (start date, exam date, admit card date, etc.)
- applicationProcess: Apply kaise karna hai uska short summary (online/offline, fees, steps)
- officialWebsite: Agar koi official website URL mila ho
- applyLink: Agar koi direct apply/application link mila ho

PDF TEXT:
"""
${text}
"""`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.2,
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
      return res.status(502).json({ error: 'PDF se koi field extract nahi ho paayi. Manually bhar dein.' });
    }

    let fields;
    try {
      fields = JSON.parse(raw);
    } catch (e) {
      return res.status(502).json({ error: 'AI response valid JSON nahi tha. Dobara try karein.' });
    }

    return res.status(200).json({ fields });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error.' });
  }
}
