# 🚀 Deploy to Vercel

Vercel is the **recommended** deployment platform for this project. It's always-on, globally distributed, and free for personal projects.

---

## Why Vercel?

| Feature | Detail |
|---------|--------|
| Free tier | Unlimited deployments, 100GB bandwidth/month |
| Always on | No sleep/spin-down like Render free tier |
| Auto-deploy | Every `git push` to `main` triggers a new deployment |
| Edge caching | Global CDN caches SVG responses — fast worldwide |
| Environment variables | Secure, encrypted, per-environment |

---

## Prerequisites

- A GitHub account with this repo pushed
- Node.js 18+ installed locally
- A GitHub Personal Access Token (PAT)

---

## Option 1: Deploy via CLI (Fastest)

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Login to Vercel
vercel login
# → Opens browser for OAuth

# 3. Deploy from the project root
vercel --prod
# → Vercel asks a few setup questions (accept defaults)
# → Deployment URL printed at the end
```

After deploying:

```bash
# Test it
curl https://your-project.vercel.app/health
curl "https://your-project.vercel.app/api/streak?username=SAPTARSHI-coder"
```

---

## Option 2: Deploy via GitHub (Easiest — auto-deploys on push)

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Authorize Vercel to access your GitHub
4. Select `github-streak-tracker`
5. Leave all defaults — Vercel auto-detects Node.js
6. Click **Deploy**

From this point, every `git push` to `main` auto-deploys.

---

## Setting GITHUB_TOKEN (Required)

**Without this, all requests will return a 500 error.**

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**:
   - **Key:** `GITHUB_TOKEN`
   - **Value:** `ghp_yourtoken...`
   - **Environment:** Production (and Preview if you want)
4. Click **Save**
5. **Redeploy** (required for env vars to take effect):
   - Go to **Deployments** tab
   - Click **⋮** → **Redeploy** on the latest deployment

---

## `vercel.json` Explained

```json
{
  "version": 2,
  "name": "github-streak-tracker",

  "rewrites": [
    { "source": "/streak", "destination": "/api/streak" },
    { "source": "/health", "destination": "/api/health"  }
  ],

  "headers": [
    {
      "source": "/api/streak",
      "headers": [
        { "key": "Cache-Control", "value": "public, s-maxage=3600, stale-while-revalidate=86400" },
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

| Setting | What it does |
|---------|--------------|
| `"version": 2` | Vercel platform version (always 2) |
| `rewrites` | Makes `/streak` work as a short alias for `/api/streak` |
| `Cache-Control` | Tells Vercel's CDN to cache each response for 1 hour |
| `Access-Control-Allow-Origin: *` | Allows any website to embed your SVG |

---

## Your Live URLs

After deployment:

```
https://your-project.vercel.app/api/streak?username=SAPTARSHI-coder
https://your-project.vercel.app/api/streak?username=SAPTARSHI-coder&theme=tokyonight
https://your-project.vercel.app/streak?username=SAPTARSHI-coder        ← short alias
https://your-project.vercel.app/health
```

For this project specifically:
```
https://github-streak-tracker-for-all.vercel.app/api/streak?username=SAPTARSHI-coder
```

---

## Custom Domain (Optional)

1. Vercel Dashboard → your project → **Settings → Domains**
2. Add your domain (e.g. `streak.yourdomain.com`)
3. Update DNS as instructed
4. Free SSL/TLS automatically

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 500 error on `/api/streak` | Check `GITHUB_TOKEN` is set and redeploy |
| 404 on `/streak` | `vercel.json` rewrites not applied — redeploy |
| SVG not updating after a code change | Redeploy; Vercel CDN cache may serve stale for up to 1hr |
| `Function invocation failed` in logs | Check Vercel function logs (Dashboard → Functions tab) |
