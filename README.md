# Release Method — Setup Guide

## Before you deploy

### 1. Run the database schema

Open Supabase → SQL Editor → New query. Paste the entire contents of `schema.sql` and run it. This creates all tables, indexes, RLS policies, and the auto-profile trigger.

### 2. Create your first client account

In Supabase → Authentication → Users → Add user. Enter their email and a temporary password. They'll use these to log in at your deployed URL. You can also invite users via Supabase's invite flow if you prefer.

### 3. Add your Anthropic API key to .env

Open `.env` and replace `YOUR_ANTHROPIC_KEY_HERE` with your key from console.anthropic.com. The Supabase keys are already filled in.

### 4. Add environment variables to Netlify

In Netlify → Site settings → Environment variables, add:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `SUPABASE_SERVICE_ROLE_KEY` | The sb_secret_... key |
| `VITE_SUPABASE_URL` | https://ztlrqutyvigppvzjtebp.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | The sb_publishable_... key |

The VITE_ variables are also needed at build time. In Netlify, all env vars are available at build time by default.

---

## Local development

```bash
npm install
netlify dev   # starts Vite + Netlify Functions together on port 3000
```

You need the Netlify CLI: `npm install -g netlify-cli`

---

## Deploying to Netlify

### Option A: GitHub (recommended)
1. Push this repo to GitHub
2. In Netlify → Add new site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables (see above)
6. Deploy

### Option B: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
npm run build
netlify deploy --prod
```

---

## Updating the system prompt

Open `netlify/functions/chat.mts`, edit the `SYSTEM_PROMPT` string, commit, and push. Netlify redeploys in ~60 seconds.

---

## File structure

```
release-method/
├── netlify/functions/chat.mts    ← AI proxy (system prompt lives here)
├── src/
│   ├── lib/supabase.js           ← Supabase client
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Sessions.jsx          ← Session list
│   │   └── Chat.jsx              ← Chat experience
│   ├── App.jsx                   ← Routing + auth state
│   └── main.jsx
├── schema.sql                    ← Run once in Supabase SQL editor
├── .env                          ← Local secrets (gitignored)
├── .env.example                  ← Template (safe to commit)
├── netlify.toml
├── vite.config.js
└── package.json
```

---

## Security notes

- The system prompt never reaches the client. It lives only in the serverless function.
- The service role key (`SUPABASE_SERVICE_ROLE_KEY`) is used only in the function to verify user JWTs. It never goes to the browser.
- RLS policies ensure each client can only ever see their own conversations and messages.
- Never commit `.env` to git. It's in `.gitignore`.
