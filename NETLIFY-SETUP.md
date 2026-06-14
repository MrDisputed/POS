# TorqueWorks on Netlify — Setup

## How this works
Netlify isn't a database — it hosts the web app and runs small serverless functions.
So this build has three parts:

- **public/index.html** — the TorqueWorks app (served as a static site, automatic HTTPS).
- **netlify/functions/kv.js** — a tiny function that saves and loads data.
- **Netlify Blobs** — Netlify's built-in key-value store. This is your "database."
  No database to install; Netlify provides it automatically.

The app talks to `/api/kv/...`, which `netlify.toml` routes to the function, which reads
and writes Netlify Blobs. Everyone who opens the site shares the same live data.

## Deploy (drag-and-drop — easiest)
1. Go to **app.netlify.com** and sign in (free).
2. Click **Add new site → Deploy manually**.
3. Drag this whole **torqueworks-netlify** folder onto the upload area.
4. Netlify installs the dependency and publishes. When it finishes you get a URL like
   **your-site.netlify.app** — open it, create the first employee (the Boss), and you're live.

## Deploy (GitHub — auto-updates)
Push this folder to a GitHub repo, then in Netlify choose **Add new site → Import from Git**
and pick the repo. Every push redeploys automatically. (Build command: none. Publish dir: `public`.)

## Data store (Netlify Blobs)
Nothing to configure — Blobs is enabled automatically for the deployed function. All shop
data is stored under a Blobs store named `torqueworks`.

## Lock down the API (recommended)
By default anyone with the URL could read or write data through `/api/kv/`. To prevent that,
set a shared secret:
1. In Netlify: **Site configuration → Environment variables → Add** `TW_TOKEN` = a long random string.
2. The app must send that same token. Ask for an `index.html` with your token baked in, and drop it
   into `public/` before deploying. (Without the matching token in the app, requests get 401.)

Also: each employee logs in with their State ID + their own password; set a non-obvious default
in **Admin → Security** and have everyone change it on first login. Passwords are stored in plain
text, so don't put real personal info in the system.

## Custom domain & HTTPS
Netlify gives HTTPS automatically on the `.netlify.app` URL. To use your own domain, go to
**Domain management → Add a domain** and follow the DNS steps; HTTPS is issued for you.

## Backups
Visit **https://your-site.netlify.app/api/backup** to download a full JSON snapshot any time,
or use the in-app **Admin → Copy / paste data** export. Keep periodic copies.

## Updating the app
Drag the updated folder again (manual deploy), or push to GitHub. Your data in Blobs is untouched.

## Troubleshooting
- **Everyone sees an empty register** — they're all on the same site URL? They should be.
- **A "Blobs" or 500 error in the function** — open the site's **Functions** logs in Netlify; make sure
  the deploy succeeded and `@netlify/blobs` installed (it's in package.json).
- **401 unauthorized** — `TW_TOKEN` is set but the app doesn't have the matching token baked in.
