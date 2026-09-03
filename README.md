# Contact form + QR code — setup guide

This is a one-page "contact us" website. Someone scans a QR code, fills in a
short form, and the message lands in a database you can read. This guide
assumes you have never used any of these tools before. Follow the numbered
steps in order. It should take about **10–15 minutes**, plus a couple of
minutes waiting for things to finish setting up.

**Two things to know before you start, because they carry a print deadline —
read these before you order any printed material:**

1. **If this website is for a business (making money), you need Vercel's
   paid "Pro" plan ($20/month), not the free "Hobby" plan.** Vercel's free
   tier is for personal, non-commercial projects only. If you print QR codes
   and put them out for customers, that's commercial use — do it right from
   day one so your site doesn't get shut off later. See step 6.
2. **The free database (Supabase) pauses itself after 7 days with no
   activity, and only a person clicking a button in the dashboard can wake it
   back up.** If your QR code isn't scanned for a week or more, the form will
   stop working silently until someone notices and un-pauses it. Step 5
   covers your two options (a free automatic workaround, or $25/month to make
   the problem go away entirely).

---

## 1. Rebrand it

Open `lib/business-config.ts` in this folder. It's the only file you need to
touch to make the site say your business's name instead of "Your Business
Name". Change the name, tagline, phone, and email, then save.

## 2. Create a Supabase account (the database)

1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New project**. Give it a name, set a database password (save it
   somewhere — a password manager, not a sticky note), and pick a region
   close to you.
3. Wait ~2 minutes for the project to finish setting up.

## 3. Set up the database table

1. In your new Supabase project, click **SQL Editor** in the left sidebar.
2. Open the file `supabase/schema.sql` from this folder, select all of it,
   and paste it into the SQL editor.
3. **Before running it**, find the line near the top that says
   `-- Retention: <<DECIDE AND WRITE IT HERE>>` and replace it with an actual
   answer — for example "delete after 90 days" or "keep indefinitely". This
   is a real decision about how long you keep people's contact info; don't
   skip it.
4. Click **Run**. You should see several result panels — the last few are
   verification checks. Nothing should show an error.
5. Get your keys: click **Project Settings** (gear icon) → **API**. You'll
   need two values in the next step:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - The **`anon` / `publishable` key** (a long string starting with
     `sb_publishable_` — **not** the "secret" or "service_role" key; never
     use that one anywhere in this project)

## 4. Create a Vercel account (the hosting)

1. Go to [vercel.com](https://vercel.com) and sign up (free) — signing up
   with your GitHub account is easiest.
2. If you haven't already, push this folder's code to a GitHub repository
   (GitHub's website will walk you through "create a new repository" and
   "upload files" if you're not familiar with git).

## 5. Connect the project and set your keys

1. In Vercel, click **Add New → Project**, and pick the GitHub repository
   from step 4.
2. Before clicking Deploy, open **Environment Variables** and add two:
   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | the Project URL from step 3 |
   | `SUPABASE_PUBLISHABLE_KEY` | the publishable key from step 3 |
3. Click **Deploy**. Wait a minute or two.
4. **Handle the pausing problem (pick one):**
   - **Free option (already built in):** This project already includes a
     daily automatic "ping" (see `vercel.json`) that keeps Supabase from
     seeing your project as inactive. It runs on its own once deployed —
     nothing for you to set up. It's a free workaround, not a guarantee, so
     check in on the site occasionally.
   - **$25/month option (simpler, guaranteed):** In Supabase, go to your
     organization's billing page and upgrade to the **Pro** plan. This
     removes the pausing behavior completely — nothing else to think about.

## 6. Decide if you need Vercel Pro

Re-read the warning at the top of this file. If this is a business site:

1. In Vercel, go to your account/team **Settings → Billing**.
2. Upgrade to **Pro** ($20/month per person).

If you're truly unsure whether your use counts as commercial, Vercel says to
just ask their support team before you rely on the free tier.

## 7. Find your live web address

1. In your Vercel project, click the **Domains** tab (or look at the top of
   the project overview page).
2. You'll see an address like `https://your-project-name.vercel.app`. That's
   your website. Open it on your phone to make sure it loads and the form
   works — fill it in and submit it, then check Supabase's **Table Editor →
   submissions** to see it arrive.
3. **Use this exact address for your QR code — never a different-looking
   address that has extra letters/numbers after your project name** (those
   are temporary preview links that can stop working later).
4. **Never delete this Vercel project once you've printed a QR code with its
   address on it.** If you need to make changes, edit the code and Vercel
   will update the site automatically — deleting and recreating the project
   can change the address.

## 8. Generate your QR code

On a computer with this project's code:

```bash
./make-qr.sh https://your-project-name.vercel.app
```

(Replace the address with your actual one from step 7.) This creates two
files in a new `qr-output` folder:

- `qr.svg` — a vector file, best for sending to a printer for anything large
  (a poster, a sign)
- `qr.png` — a high-resolution image, good for anywhere else (a flyer, a
  screen, a quick print at home)

The script automatically checks that the code actually scans back to the
right address before it finishes. If it prints "OK", you're good to print.

**Before ordering any printed material, scan the code yourself with a phone
and confirm it opens the real site and the form actually submits** — on
cellular data, not just wifi, since that's how most people will scan it.

---

## If something breaks

- **Form says "Couldn't send your message"**: check the Vercel project logs
  (Project → Logs) for the error. The most common cause is the Supabase
  project pausing — check the Supabase dashboard for a "Restore project"
  button.
- **Environment variables changed**: after changing anything in Vercel's
  Environment Variables settings, you need to redeploy (Deployments tab →
  the "..." menu on the latest deployment → Redeploy) for the change to
  take effect.
