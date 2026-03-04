# Ambuj Engineering Docs — Setup Guide

## Ek baar karo, lifetime kaam aayega

---

## Step 1 — Node.js install karo (agar nahi hai)

```bash
node --version  # 18+ chahiye
```

Nahi hai to: https://nodejs.org → LTS version download karo

---

## Step 2 — Ye folder apne machine pe rakho

Is zip ko kisi bhi folder mein extract karo, jaise:
```
C:\Users\Ambuj\Documents\ambuj-docs\
```

---

## Step 3 — Docusaurus install karo

```bash
# Us folder mein jao
cd ambuj-docs

# Dependencies install karo (sirf ek baar)
npm install

# Local pe dekhne ke liye
npm start
```

Browser mein khul jaayega: **http://localhost:3000**

---

## Step 4 — GitHub pe daalo

```bash
git init
git add .
git commit -m "Initial docs site"
```

GitHub pe new repo banao: `ambuj-engineering-docs`

```bash
git remote add origin https://github.com/Ambuj123-lab/ambuj-engineering-docs.git
git push -u origin main
```

---

## Step 5 — Netlify pe deploy karo (Free)

1. **netlify.com** → Log in → **Add new site** → **Import from Git**
2. GitHub se `ambuj-engineering-docs` repo select karo
3. Settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
4. **Deploy site** click karo

5 minute mein live ho jaayegi:
`https://ambuj-docs.netlify.app` (ya jo bhi naam mile)

---

## Step 6 — Custom domain (Optional)

Agar `docs.ambuj-portfolio-v2.netlify.app` chahiye:
- Netlify dashboard → Domain settings → Add subdomain

---

## Baad mein content update karna

```bash
# Koi bhi .md file edit karo
# Phir:
git add .
git commit -m "Update chunking notes"
git push
# Netlify automatic deploy kar dega — 2 min mein live
```

---

## Folder Structure

```
ambuj-docs/
├── docs/
│   ├── rag-engineering/      ← RAG Master Guide (7 sections)
│   │   ├── intro.md
│   │   ├── document-loaders.md
│   │   ├── chunking-strategies.md
│   │   ├── embedding-models.md
│   │   ├── architecture-decisions.md
│   │   ├── langgraph-stategraph.md
│   │   ├── oom-prevention.md
│   │   └── adaptive-retrieval.md
│   ├── projects/             ← Project deep dives
│   │   ├── intro.md
│   │   ├── indian-legal-ai.md
│   │   ├── citizen-safety-ai.md
│   │   └── deployment-lessons.md
│   └── field-notes/          ← Specific problem deep dives
│       ├── intro.md
│       ├── sha256-sync-engine.md
│       └── 512mb-ram-rag.md
├── src/css/custom.css        ← Dark theme styling
├── docusaurus.config.js      ← Site config (update URL here)
├── sidebars.js               ← Navigation structure
├── package.json              ← Dependencies
└── netlify.toml              ← Netlify deployment config
```

---

## Ek cheez zaroor update karo

`docusaurus.config.js` mein line 6:
```js
url: 'https://ambuj-docs.netlify.app',  // ← apna actual URL daalo
```

---

## Reddit pe share karna

Doc site live hone ke baad:
```
PDF link: https://ambuj-docs.netlify.app/docs/rag-engineering/intro
```
Koi block nahi karega — yeh normal website URL hai, PDF nahi.
