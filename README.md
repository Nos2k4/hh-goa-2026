# HH Goa 2026 — Frame & Builder Card Generator

Both formats (PFP frame + Builder ID card), fully client-side compositing,
no login wall. Verified with a clean `npm run build` before packaging.

## Deploy to Vercel (fastest path — ~5 minutes)

1. **Push this folder to a new GitHub repo.**
   ```
   cd hh-goa-app
   git init
   git add .
   git commit -m "HH Goa 2026 generator"
   gh repo create hh-goa-2026 --public --source=. --push
   ```
   (No `gh` CLI? Create an empty repo on github.com, then
   `git remote add origin <url> && git push -u origin main`.)

2. **Import into Vercel.**
   Go to vercel.com → New Project → Import the repo. Framework preset
   auto-detects Next.js. Click Deploy — it'll build successfully with
   zero config (Share-to-X's mobile path works immediately, no env vars needed).

3. **Enable the desktop Share-to-X fallback (optional but recommended).**
   This lets the X link preview show the actual image on desktop browsers
   that don't support native file sharing.
   - In your Vercel project → Storage tab → Create Database → **Blob**.
   - Attach it to this project. Vercel auto-injects `BLOB_READ_WRITE_TOKEN`
     into your environment — no manual copying needed.
   - Redeploy (Vercel will prompt you, or just push an empty commit).

4. **Grab your live URL** (e.g. `hh-goa-2026.vercel.app`) — that's what
   goes in the submission form.

## How sharing actually works

- **On mobile** (where most users will be): tapping "Share to X" uses the
  Web Share API with the real image file attached — the person picks X from
  their native share sheet, image + caption + `#FrameInGoa` are already set.
- **On desktop** (no file-sharing support in browser share): the app uploads
  the generated PNG to Vercel Blob, builds a short `/s/[id]` link with
  dynamic Open Graph tags pointing at that image, and opens the X tweet
  composer with that link — so the timeline preview shows the real graphic,
  not a blank thumbnail.

## Local development

```
npm install
npm run dev
```

Share-to-X's desktop fallback needs `BLOB_READ_WRITE_TOKEN` locally too —
pull it with `vercel env pull .env.local` after step 3 above, or just test
that path in production.

## Project structure

```
app/page.js            — the whole tool (upload, position/zoom, compose, download, share)
app/api/upload/route.js — stores generated PNGs in Vercel Blob for the share-link fallback
app/s/[id]/page.js      — dynamic OG-image landing page used by the desktop share flow
public/frame.png        — PFP frame template (alpha-punched center)
public/card.png         — Builder ID card background
```
