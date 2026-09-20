# Printsello Job Article Generator — Full Guide

## Setup (agar pehli baar kar rahe hain)
1. **Gemini API Key (zaroori, free)**: https://aistudio.google.com/apikey se banayein.
2. **Pexels API Key (optional, free)**: https://www.pexels.com/api/ se banayein — auto featured-image ke liye.
3. GitHub repo me `index.html`, `api/generate.js`, `api/extract.js`, `package.json` (root me; `generate.js`/`extract.js` lowercase naam se `api/` folder ke andar) upload karke Vercel se deploy karein.
4. Vercel → Settings → Environment Variables:
   - `GEMINI_API_KEY` = aapki key (zaroori)
   - `PEXELS_API_KEY` = aapki key (optional)
   Save karke ek baar Redeploy dabayein.

## Sabhi Features (latest update)

**Form / Input:**
- Post Type dropdown (Recruitment / Result / Admit Card / Answer Key) — har type ka alag, sahi-length template
- Batch Mode — ek saath multiple Job Titles (ek line me ek) daalkar sabke articles queue me generate ho jaate hain
- PDF Upload — Official Notification PDF se sab fields + SEO-friendly Job Title auto-fill
- Author Name + Photo upload (article ke bottom author box me use hoti hai)
- Structured date fields: Advertisement, Application Start/Last, Form Correction Start/Last, aur baaki dates
- Social links (Facebook/Instagram/YouTube/Telegram/WhatsApp) + apni Website link — article ke footer/author box me dikhte hain
- Sirf Job Title bharkar bhi generate kar sakte hain — backend Google Search se khud missing details dhoondhta hai (agar aapki free key par grounding available na ho to automatically bina-search mode me safely fall back ho jaata hai)

**Article Design:**
- Fast, concise generation (700-900 words Recruitment ke liye, 500-600 Result/Admit Card/Answer Key ke liye) — kam tokens, tez response
- Hero image (auto-fetched via Pexels agar key di ho) + curiosity-driven title overlay
- "Quick Answer" TL;DR box — turant hook karta hai, AI answer engines (ChatGPT/Perplexity) ke liye bhi best
- Important Dates timeline widget
- FAQ Google/ChatGPT-style natural questions ke format me, seedha 1-2 line ka direct answer pehle — AI Overviews me quote hone ke chances badhata hai
- "Last Updated" badge + "Sources" box (E-E-A-T trust signal — Google ranking ke liye important)
- SEO-optimized image alt text har jagah
- JSON-LD Schema (JobPosting/FAQPage/BreadcrumbList)

**Output / Actions:**
- Live Preview, HTML Code, Social Posts, aur History — 4 tabs
- 🔄 FAQ Regenerate / 🔄 Dates Regenerate — sirf ek specific section dobara banayein, pura article nahi (tokens/time bachate hain)
- 📤 Blogger पर Publish करें — HTML copy karke seedha Blogger ka naya post editor khol deta hai (ek click me paste-ready). Ye FULL auto-publish nahi hai (uske liye Google OAuth + Blogger API setup chahiye hota, jo ek alag bada setup hai) — abhi ye "copy + Blogger kholo" tak simplified hai, jisse manual paste sirf ek Ctrl+V reh jaata hai.
- Draft History — is browser me last 15 generated articles save rehte hain (localStorage me), bina regenerate kiye dobara khol sakte hain

## Rate limit (429) aaye to
`api/generate.js` me `MODEL` ko `gemini-2.0-flash-lite` kar dein — uska free quota zyada hai.

## Agar chahiye: Full Blogger Auto-Publish (ek click me seedha live post)
Ye ek bada alag setup hai (Google Cloud Console me OAuth Client banana, Blogger API v3 enable karna, consent screen verify karna). Agar ye chahiye to bata dein — alag se step-by-step guide bana denge.
