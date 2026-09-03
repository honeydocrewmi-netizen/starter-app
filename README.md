# Contact form + QR code — setup guide (GitHub Pages proof of concept)

This is a one-page "contact us" website. Someone scans a QR code, fills in a
short form, and — once you've added a database (step 4 below) — the message
lands in a table you can read. **Right now, with no database connected, the
form still works and looks right, but submitted messages are not saved
anywhere.** This guide walks through the two settings you need to flip and,
later, how to add the database. It should take about **5 minutes** today.

**This is a proof of concept, not the final site:**

- It's hosted at a free `github.io` address, not a real domain.
- Nothing should be printed from this URL yet. **A static QR code can't be
  repointed** — once you print it, that address is permanent. Get a real
  domain first if you plan to put this in front of customers.
- There's no database behind it yet, so submitted messages aren't stored
  until you do step 4.

## 1. Two settings the repo owner needs to flip

The code is ready; these are dashboard toggles only, in the GitHub repo's
**Settings**:

1. **Make the repository public.** GitHub Pages on the free plan only
   serves public repos. Settings → General → scroll to "Danger Zone" →
   Change visibility → Public.
2. **Turn on GitHub Pages with the "GitHub Actions" source.** Settings →
   Pages → under "Build and deployment", set **Source** to **GitHub
   Actions**. (Not "Deploy from a branch" — the workflow in this repo
   handles the build itself.)

Once both are set, push to `main` (or re-run the "Deploy to GitHub Pages"
workflow from the Actions tab) and the site publishes to:

```
https://honeydocrewmi-netizen.github.io/starter-app/
```

Give it a minute or two after the workflow finishes, then open that address
and confirm the page loads and the form validates.

## 2. Rebrand it

Open `lib/business-config.ts` in this folder. It's the only file you need to
touch to make the site say your business's name instead of "Your Business
Name". Change the name, tagline, phone, and email, then push to `main` —
the site rebuilds automatically.

## 3. Try it with no database yet

Open the live URL and submit the form. You'll see an honest **"Your message
wasn't stored"** screen — that's expected and correct. It means the form,
validation, and honeypot spam check all work; the only missing piece is
somewhere to save the message. That's step 4.

## 4. Add Supabase (the database), when you're ready

1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New project**. Give it a name, set a database password (save it
   somewhere — a password manager, not a sticky note), and pick a region
   close to you. Wait ~2 minutes for it to finish setting up.
3. In your new project, click **SQL Editor** in the left sidebar. Open the
   file `supabase/schema.sql` from this folder, select all of it, and paste
   it into the SQL editor.
4. **Before running it**, find the line near the top that says
   `-- Retention: <<DECIDE AND WRITE IT HERE>>` and replace it with a real
   answer — for example "delete after 90 days" or "keep indefinitely". This
   is a real decision about how long you keep people's contact info; don't
   skip it.
5. Click **Run**. You should see several result panels — the last few are
   verification checks. Nothing should show an error.
6. Get your keys: **Project Settings** (gear icon) → **API**. You'll need:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - The **publishable key** (starts with `sb_publishable_` — **not** the
     "secret" key; never use that one anywhere in this project)
7. In the GitHub repo, go to **Settings → Secrets and variables → Actions →
   Variables** and add two **repository variables** (not secrets — this key
   is designed to be public; see "Why a browser-direct database write is
   safe" below):
   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | the Project URL from step 6 |
   | `SUPABASE_PUBLISHABLE_KEY` | the publishable key from step 6 |
8. Re-run the "Deploy to GitHub Pages" workflow from the **Actions** tab (or
   push any small change to `main`) so the site rebuilds with the database
   connected.
9. **Handle the pausing problem:** Supabase's free database pauses itself
   after 7 days with no activity, and only a person clicking a button in the
   dashboard can wake it back up. This repo includes a daily automatic
   "keepalive" GitHub Actions workflow (`.github/workflows/keepalive.yml`)
   that pings the database once a day to prevent that — nothing for you to
   set up, it starts working as soon as the two repository variables above
   exist. It's a free workaround, not a guarantee, so check in on the site
   occasionally. (Supabase Pro at $25/month removes the pausing behavior
   completely, if you'd rather not think about it.)
10. Submit the live form again. You should see "Thanks — message received."
    Check Supabase's **Table Editor → submissions** to see it arrive.

## 5. Generate your QR code

On a computer with this project's code:

```bash
./make-qr.sh https://honeydocrewmi-netizen.github.io/starter-app/
```

This creates two files in a new `qr-output` folder:

- `qr.svg` — a vector file, best for sending to a printer for anything large
- `qr.png` — a high-resolution image, good for anywhere else

The script automatically checks that the code actually scans back to the
right address before it finishes. If it prints "OK", the code is correct.

**Do not print this code yet.** This is a `github.io` proof-of-concept
address, not a permanent one — see the warning at the top of this file.
When this is ready for real customers, buy a real domain, point it at this
site (or move to real hosting), and generate a new QR code for that
permanent address instead.

## 6. Why a browser-direct database write is safe here

The earlier version of this app posted the form through a server (a Vercel
function) that held the database key. GitHub Pages only serves static
files — there is no server — so the browser now talks to Supabase directly,
using the same **publishable** key either way.

This is safe because the publishable key is *designed* to be public — it's
already visible to anyone who opens their browser's dev tools on the live
page, with or without a server in front of it. **What actually protects the
data is the database's row-level security policy** in
`supabase/schema.sql`, which only ever allows one thing: inserting a new
row with a valid shape. It does not allow reading, updating, or deleting
any row, no matter who holds the key. The SQL `check` constraints in that
same file are a second, independent backstop — even a bug in this app's own
validation code can't write a row the database itself considers malformed.
Nothing about moving to the browser weakens either of those.

## If something breaks

- **Form always says "wasn't stored"**: the two repository variables in
  step 4.7 aren't set yet, or the workflow hasn't rebuilt since you added
  them — re-run the "Deploy to GitHub Pages" workflow from the Actions tab.
- **Page loads but looks broken / styles missing**: make sure GitHub Pages'
  **Source** is set to **GitHub Actions**, not "Deploy from a branch" (step
  1.2) — the wrong source serves the raw repo files instead of the built
  site.
- **Site is a 404**: confirm the repo is public (step 1.1) and that the
  "Deploy to GitHub Pages" workflow finished successfully in the Actions
  tab.
- **Environment variables changed**: after changing a repository variable,
  re-run the deploy workflow — it only reads them at build time, so nothing
  updates until the next build.
