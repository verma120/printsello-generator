# Printsello Job Article Generator — Deploy Guide (FREE Gemini API)

"Failed to fetch" error isliye aa raha tha kyunki browser seedha Anthropic API ko
bina key ke call kar raha tha. Ab backend Google **Gemini API** use karta hai,
jiska ek FREE tier hai — koi card/billing zaroori nahi.

## Step 1: FREE Gemini API Key lein
1. https://aistudio.google.com/apikey par jaayein (Google account se login karein).
2. **"Create API key"** dabayein — key turant mil jaayegi, koi card nahi maangega.
3. Key copy karke safe jagah rakhein (jaise `AIzaSy...`).

> Free tier limits (2026 tak, model: gemini-2.5-flash): ~10 requests/min,
> ~500 requests/din. Ek job article generate karne me 1 request lagti hai,
> so roz 500 articles tak free me ban sakte hain. Zyada chahiye to
> `gemini-2.0-flash-lite` model try karein (generate.js me MODEL line badlein) —
> uska free quota aur bhi zyada hai.

## Step 2: GitHub par upload karein
1. https://github.com par naya repository banayein (e.g. `printsello-generator`).
2. Is folder ki teeno files (`index.html`, `api/generate.js`, `package.json`) usme upload karein.

## Step 3: Vercel par Deploy karein
1. https://vercel.com par GitHub se login karein (free plan kaafi hai).
2. **Add New Project** → apni GitHub repo select karein → **Deploy** dabayein.
3. Deploy hone ke baad Vercel ek URL dega, jaise:
   `https://printsello-generator.vercel.app`

## Step 4: API Key ko Environment Variable me set karein
1. Vercel Dashboard → apna project kholein → **Settings** → **Environment Variables**.
2. Naya variable add karein:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** apni copy ki hui `AIzaSy...` key paste karein
3. Save karein, phir **Deployments** tab me jaake latest deployment par
   **"Redeploy"** dabayein (env variable tabhi apply hota hai).

## Step 5: Frontend me apna URL daalein
1. `index.html` file kholein.
2. Ye line dhoondein:
   ```js
   const BACKEND_URL = "https://YOUR-PROJECT-NAME.vercel.app/api/generate";
   ```
3. `YOUR-PROJECT-NAME.vercel.app` ko apne actual Vercel URL se replace karein, e.g.:
   ```js
   const BACKEND_URL = "https://printsello-generator.vercel.app/api/generate";
   ```
4. File save karke GitHub par dobara push karein (Vercel automatically redeploy kar dega).

## Step 6: Test karein
- `https://your-project.vercel.app` par jaake tool kholein, Job Title daalein,
  aur "Full Article Generate करें" dabayein — ab ye kaam karega, bilkul free.

## Rate limit (429) aaye to
- Free tier ek minute me limited requests allow karta hai. Agar error aaye,
  10-15 second ruk kar dobara try karein, ya `api/generate.js` me
  `MODEL` ko `gemini-2.0-flash-lite` kar dein (higher free limits).

## Blogger par use karna
- Is tool ko Vercel URL par hi as a standalone page use karein
  (article generate → HTML Code copy karein → phir Blogger ke naye post me
  HTML view me paste karein). Poore tool ko Blogger ke andar embed karna
  zaroori nahi — generator alag rakhna aasan aur safe hai.
