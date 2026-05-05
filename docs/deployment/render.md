# 🟣 Deploy to Render.com

Render is a cloud platform with a **free web service tier** — a good alternative to Vercel if you prefer a traditional server model.

---

## ⚠️ Important Limitation

Render's **free tier sleeps** after 15 minutes of inactivity. The first request after sleep takes **30–60 seconds** to wake up. This means:

- ✅ Fine for development/testing
- ❌ Not ideal for a README profile card (slow cold wake-up shows broken image)
- ✅ Fine if you also use the **GitHub Actions static SVG** approach for the actual README

For always-on, use Vercel instead. See [vercel.md](./vercel.md).

---

## `render.yaml` Explained

This project includes a `render.yaml` file that Render reads automatically:

```yaml
services:
  - type: web
    name: github-streak-tracker
    runtime: node
    plan: free
    region: oregon
    branch: main
    buildCommand: npm ci --omit=dev
    startCommand: node src/server.js    # ← runs the Express server, not serverless
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: GITHUB_TOKEN
        sync: false        # ← you enter this manually in the dashboard
      - key: CACHE_TTL_SECONDS
        value: "3600"
    healthCheckPath: /health
    autoDeploy: true
```

Note: Render uses **`src/server.js`** (the Express server), not the Vercel serverless functions. Both use the same `src/` business logic.

---

## Deploy Steps

1. Push this repo to GitHub (already done ✅)

2. Go to **https://dashboard.render.com/new/web**

3. Click **"Connect a repository"** → authorize GitHub → select `github-streak-tracker`

4. Render detects `render.yaml` automatically. Review the settings and click **Apply**.

5. In the **Environment** section, click **Add Environment Variable**:
   - `GITHUB_TOKEN` = your GitHub PAT

6. Click **Create Web Service** → wait for build (~2 minutes)

7. Your URL: `https://github-streak-tracker.onrender.com`

---

## Endpoints on Render

```
https://github-streak-tracker.onrender.com/streak?username=SAPTARSHI-coder
https://github-streak-tracker.onrender.com/health
```

(Note: Render uses `/streak`, not `/api/streak` — the Express server handles routing directly.)

---

## Keeping It Awake (Optional)

If you want to prevent sleep, use a free uptime monitor to ping `/health` every 14 minutes:

- **UptimeRobot** — https://uptimerobot.com (free, 5-minute checks)
- **Better Uptime** — https://betteruptime.com

Set the monitor URL to: `https://your-service.onrender.com/health`

> Note: Render may change their policy on uptime pinging. Check their current terms.
