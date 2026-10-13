# Printsello Job Article Generator — Full Guide

## Setup
1. **Gemini API Key (zaroori, free)**: https://aistudio.google.com/apikey se banayein.
2. **Image tool**: Ab koi extra key nahi chahiye — Openverse (free, keyless Creative-Commons image search) use ho raha hai.
3. GitHub repo me `index.html`, `api/generate.js`, `api/extract.js`, `api/image.js`, `api/title.js`, `package.json` (root me; sab `api/*.js` files lowercase naam se `api/` folder ke andar) upload karke Vercel se deploy karein.
4. Vercel → Settings → Environment Variables:
   - `GEMINI_API_KEY` = aapki key (zaroori)
   Save karke ek baar Redeploy dabayein.

(Pehle `PEXELS_API_KEY` ka zikr tha — ab zaroorat nahi, Pexels ki jagah keyless Openverse API use ho rahi hai.)

## Rate limit (429) aaye to
`api/generate.js` me `MODEL` ko `gemini-2.0-flash-lite` kar dein — uska free quota zyada hai.
