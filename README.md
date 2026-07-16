# DevClan Dashboard

A standalone dashboard for your AI voice-calling pipeline: manage contacts, trigger calls, review AI call summaries and transcripts, and manage bookings and availability — all in your own database, no GHL or n8n required.

Login is a single admin account (email + password), already set up for you:

- Email: `sajjaddaliia01@gmail.com`
- Password: the one you gave me (`Sazzad@1`) — already hashed, your real password is never stored anywhere in plain text.

**Everything is already filled in for you in `.env.local`** — database, login, and Retell keys. You don't need to copy or edit any env file to get started locally. Just:

---

## 1. Install dependencies

```bash
npm install
```

## 2. Initialize the database schema

Your Neon Postgres database is already connected via `DATABASE_URL` in `.env.local`. Create the tables in it:

```bash
npm run db:init
```

This creates the `contacts`, `calls`, `appointments`, `availability_rules`, and `availability_exceptions` tables. (I couldn't run this myself — my sandbox has no outbound network access to reach your database — so this is the one step you need to run yourself.)

## 3. Run it locally to check everything works

```bash
npm run dev
```

Visit `http://localhost:3000`, log in, and go to **Availability** to set your working hours first — the AI agent can't book anything until at least one weekly rule exists. Then try **Contacts → Add contact → Call now** to test a real Retell call end to end.

## 4. Deploy to Vercel

```bash
npx vercel
```

Or push this folder to a GitHub repo and import it in the Vercel dashboard. Either way:

1. In your Vercel project → **Settings → Environment Variables**, add every variable from `.env.local` (same names, same values — just copy the whole file in).
2. Deploy. Vercel gives you a live URL like `https://your-app.vercel.app` — that's the clickable link to share.
3. The database is already initialized (you ran `npm run db:init` in step 2 against the same Neon database), so no need to run it again — Vercel and your local machine are both talking to the same live database.

## 5. Point Retell at your live app

In your Retell agent settings:

- **Webhook URL** (Agent settings → Webhook): 
  `https://your-app.vercel.app/api/webhooks/retell?key=65671411bbf81b5c9ae1848735c0a5a409e2c95530d63b60eaad00fc2ff2f058`
  → this is what fills in the Calls page with summaries, transcripts, and outcomes after every call.

- **Custom function `check_and_book_appointment`** URL:
  `https://your-app.vercel.app/api/functions/check-and-book-appointment?key=65671411bbf81b5c9ae1848735c0a5a409e2c95530d63b60eaad00fc2ff2f058`
  → this is what lets the agent check your live availability and book appointments during the call.

Just swap `your-app.vercel.app` for your real Vercel domain once you deploy — the `key=` value is already your real `RETELL_FUNCTION_SECRET` from `.env.local`, don't change it.

---

## What's inside

- **Overview** — live counts (contacts, calls, appointments, bookings) plus upcoming appointments and recent calls.
- **Contacts** — search, filter by stage, add contacts manually, one-click "Call now" to trigger a live Retell call.
- **Calls** — every call the agent has made, with AI-generated summary, sentiment, outcome, objections, and full transcript (chat-bubble view) per call.
- **Appointments** — everything the agent has booked, with status controls (confirmed / completed / no-show / cancelled).
- **Availability** — set your weekly working hours and slot length, and block off specific dates (holidays, etc.) — this is exactly what the agent checks against when offering times on a call.

## Notes

- This project was hand-written without a local `npm install`/build step (sandbox had no package registry access), so double-check `npm run build` succeeds locally or on Vercel before you rely on it — if anything doesn't compile, send me the error and I'll fix it.
- Changing your login password later: run `node scripts/hash-password.mjs "newpassword"` and paste the printed hash into `ADMIN_PASSWORD_HASH` (locally and in Vercel), then redeploy.
