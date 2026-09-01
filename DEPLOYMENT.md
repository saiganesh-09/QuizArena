# Deployment Guide

This guide covers deploying QuizArena to **Railway** (backend + MongoDB) and **Vercel** (frontend).

## Architecture

```
Vercel (frontend)  ──HTTPS──>  Railway (backend API)  ──>  Railway (MongoDB)
  quizarena.vercel.app         quizarena-backend.up.railway.app
```

## Prerequisites

- A GitHub account with the QuizArena repo pushed
- A [Railway](https://railway.app) account (sign in with GitHub)
- A [Vercel](https://vercel.com) account (sign in with GitHub)
- No credit card required for either free tier

---

## Step 1: Deploy Backend + MongoDB on Railway

### 1.1 Create a Railway project

1. Go to https://railway.app and click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your `QuizArena` repository
4. Set the **Root Directory** to `backend` (click Settings → Build → Root Directory)
5. Railway will auto-detect Node.js and use `railway.json`

### 1.2 Add MongoDB

1. In your Railway project dashboard, click **+ New** → **Database** → **Add MongoDB**
2. Railway creates a MongoDB instance and provides a `MONGO_URI` variable automatically
3. Click on the MongoDB service → **Variables** tab → copy the `MONGO_URI` value

### 1.3 Set backend environment variables

In your Railway backend service, go to **Variables** and add:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | *(auto-injected by Railway MongoDB add-on)* |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | *(generate with `openssl rand -base64 64`)* |
| `JWT_EXPIRES_IN` | `1d` |
| `JWT_COOKIE_NAME` | `qa_token` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` |
| `CLIENT_ORIGIN` | `https://your-frontend.vercel.app` *(fill after Step 2)* |
| `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` *(fill after Step 2)* |

> **Note on cookies:** In production, the frontend (Vercel) and backend (Railway) are on different domains. Cross-origin cookies require `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, and HTTPS on both ends. Both Vercel and Railway provide HTTPS by default.

### 1.4 Deploy

1. Railway will automatically build and deploy
2. Once deployed, go to **Settings** → **Networking** → **Generate Domain**
3. You'll get a URL like `https://quizarena-backend.up.railway.app`
4. Test it: `curl https://quizarena-backend.up.railway.app/health` should return `{"success":true,...}`

### 1.5 Seed production database (optional)

To create test users in production, run:

```bash
# From your local machine, point to the production MongoDB
MONGO_URI="your-railway-mongo-uri" node -e "
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
async function seed() {
  const client = await MongoClient.connect(process.env.MONGO_URI);
  const db = client.db('quizarena');
  const hash = bcrypt.hashSync('Password123!', 12);
  await db.collection('users').insertMany([
    { name: 'Admin User', email: 'admin@quiz.com', password: hash, role: 'admin', status: 'active', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Instructor Jane', email: 'instructor@quiz.com', password: hash, role: 'instructor', status: 'active', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Candidate John', email: 'candidate@quiz.com', password: hash, role: 'candidate', status: 'active', createdAt: new Date(), updatedAt: new Date() },
  ]);
  console.log('Users seeded');
  await client.close();
}
seed();
"
```

---

## Step 2: Deploy Frontend on Vercel

### 2.1 Import the project

1. Go to https://vercel.com and click **Add New** → **Project**
2. Import your `QuizArena` GitHub repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### 2.2 Set environment variables

In the Vercel project settings, go to **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://quizarena-backend.up.railway.app` *(your Railway backend URL)* |

> This replaces the dev proxy. In development, Vite proxies `/api` to localhost. In production, the frontend calls the Railway backend directly.

### 2.3 Deploy

1. Click **Deploy**
2. Vercel builds the frontend and deploys to a URL like `https://quizarena.vercel.app`
3. Copy this URL and go back to Railway to update the backend env vars:
   - `CLIENT_ORIGIN` = `https://quizarena.vercel.app`
   - `ALLOWED_ORIGINS` = `https://quizarena.vercel.app`
4. Railway will auto-redeploy with the updated CORS config

### 2.4 Verify

1. Visit `https://quizarena.vercel.app`
2. Log in with your test credentials
3. Check that API calls work (no CORS errors in browser console)

---

## Step 3: Custom Domain (optional)

### Vercel (frontend)
1. Go to Project Settings → **Domains**
2. Add your custom domain (e.g. `quizarena.example.com`)
3. Follow Vercel's DNS instructions

### Railway (backend)
1. Go to Service Settings → **Networking** → **Custom Domain**
2. Add your API domain (e.g. `api.quizarena.example.com`)
3. Update `CLIENT_ORIGIN` and `ALLOWED_ORIGINS` on Railway
4. Update `VITE_API_BASE_URL` on Vercel

---

## Troubleshooting

### CORS errors
- Ensure `CLIENT_ORIGIN` and `ALLOWED_ORIGINS` on Railway match your exact Vercel URL (including `https://`)
- Ensure `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true` for cross-origin cookies

### Cookie not being set
- Check that `COOKIE_SECURE=true` in production (requires HTTPS)
- Check that `COOKIE_SAMESITE=none` for cross-origin requests
- Check browser console for cookie-related warnings

### Database connection failed
- Verify `MONGO_URI` is set from the Railway MongoDB add-on
- Check Railway logs for connection errors

### Login returns 401
- Ensure users exist in the production database (run the seed script)
- Check that `JWT_SECRET` is set and consistent
