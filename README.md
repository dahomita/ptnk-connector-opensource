# Alumni Network Connector (PTNK (Phổ Thông Năng Khiếu) fork)

A full-stack web app for alumni communities to map where members live, share updates, and stay connected. This fork is tailored for **Trường Phổ thông Năng khiếu, ĐHQG-HCM** ([ptnk.edu.vn](https://ptnk.edu.vn/)). The project remains easy to fork for any school or community.

**Original open-source project:** created by Jimmy Nguyen (CA1 20–23). This repo adapts branding, links, and deployment for PTNK.

**Deploy your own:** connect the repo to [Vercel](https://vercel.com) and set the environment variables below. (An older upstream demo lived at `lhp-network.vercel.app`; replace OG/meta URLs in `index.html` with your production domain when you ship.)

---

## What it does

- **Interactive 3D globe** — visualizes where alumni live with animated connection arcs from the home school. Supports zoom-based clustering, a density/city mode, and click-to-focus on individual profiles.
- **Gallery** — filterable grid of alumni cards (by class, graduation year, city, country) synchronized with the globe.
- **Submit form** — lets alumni add themselves with name, class, graduation year, location (via OpenStreetMap autocomplete), photo, caption, and social links.
- **Update form** — lets existing members update their location, caption, photo, or socials without re-submitting.

Public visitors only see posts where **`approved = true`** (see `supabase_setup.sql`). New submissions can be held for moderation depending on your Edge Function setting (`REQUIRE_APPROVAL` in `submit-post`).

---

## Tech stack

| Layer           | Choice                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| Frontend        | React 19 + TypeScript + Vite                                                       |
| Database        | Supabase (Postgres + Edge Functions)                                               |
| Images          | Cloudinary (server-signed upload in Edge Functions; thumbnail URLs in the browser) |
| Globe           | [react-globe.gl](https://github.com/vasturiano/react-globe.gl) + Supercluster      |
| Location search | Nominatim (OpenStreetMap) — no API key needed                                      |
| Deployment      | Vercel                                                                             |

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/ptnk-connector-opensource.git
cd ptnk-connector-opensource
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run `supabase_setup.sql` to create the `posts` table, `approved` column, and RLS policies (public read only for approved rows; public insert allowed).
3. Deploy the Edge Functions.

   Prefer **`npx`** so you do not need a global install (Homebrew may require current Xcode / Command Line Tools on macOS):

   ```bash
   npx supabase@latest login
   npx supabase@latest link --project-ref YOUR_PROJECT_REF
   npx supabase@latest functions deploy submit-post
   npx supabase@latest functions deploy submit-update
   npx supabase@latest functions deploy sheet-sync   # optional — mirrors to Google Sheets
   ```

   `YOUR_PROJECT_REF` is **Project ID** under **Project Settings → General** in the Supabase dashboard.

### 3. Edge Function secrets

In the Supabase dashboard: **Project Settings → Edge Functions** (or **Secrets**), set at least:

| Secret                      | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| `SUPABASE_URL`              | Same as project URL                                               |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only)                                    |
| `UPSTASH_REDIS_REST_URL`    | Rate limiting (`submit-post`)                                     |
| `UPSTASH_REDIS_REST_TOKEN`  | Rate limiting                                                     |
| `CLOUDINARY_CLOUD_NAME`     | Signed uploads from Edge Functions                                |
| `CLOUDINARY_API_KEY`        | Signed uploads                                                    |
| `CLOUDINARY_API_SECRET`     | Signed uploads                                                    |
| `DEFAULT_IMAGE_URL`         | Full `https://...` URL used when the user does not upload a photo |
| `SHEET_SYNC_SECRET`         | Random string — required if you deploy `sheet-sync`               |

See commented lines in `.env.example` for copy-paste reminders (those values are **not** read from your local `.env` by Edge Functions unless you use local Supabase tooling).

### 4. Cloudinary (frontend thumbnails)

The Vite app builds thumbnail URLs from:

- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET` (typically an **unsigned** preset for URL generation in the client — your Edge uploads use API signing separately)

### 5. Configure environment (local dev)

```bash
cp .env.example .env
```

Fill in at minimum:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
```

### 6. Run locally

```bash
npm run dev
```

---

## Customizing for your community

| What to change                         | Where                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| School name and header                 | `src/App.tsx`                                                                   |
| Home school coordinates / globe center | `src/components/GlobeView.tsx` — `SCHOOL` constant                              |
| Globe starting view                    | `GlobeView.tsx` — `globe.pointOfView(...)` in the init `useEffect`              |
| Nav links                              | `src/App.tsx` — `LIEN_KET` (e.g. [ptnk.edu.vn](https://ptnk.edu.vn/))           |
| Field labels / copy                    | `src/components/SubmitForm.tsx`, `UpdateForm.tsx`                               |
| Open/close submissions                 | `src/App.tsx` — `SUBMISSIONS_OPEN`                                              |
| Caption word limit                     | `src/components/SubmitForm.tsx` — `MAX_WORDS`                                   |
| Social / SEO preview                   | `index.html` — update `og:url`, `og:image`, titles when you have a live URL     |
| Default photo when no upload           | Supabase secret `DEFAULT_IMAGE_URL` + `supabase/functions/submit-post/index.ts` |

---

## Project structure

```
src/
  App.tsx                    # Root: routing, data fetching, nav
  types.ts                   # TypeScript interfaces (Post, Filters, etc.)
  supabase.ts                # Supabase client
  cloudinary.ts              # Image thumbnail URL helper (VITE_* env)
  social.ts                  # Social URL validation, word count
  components/
    Gallery.tsx              # Globe + filter bar + paginated card grid
    GlobeView.tsx            # 3D globe with arcs, clusters, density mode
    FilterBar.tsx            # Multi-select filters (class, year, city, country)
    PostCard.tsx             # Individual alumni card
    SubmitForm.tsx           # New member submission form
    UpdateForm.tsx           # Existing member update form
    LocationAutocomplete.tsx # OSM Nominatim location search
    SocialInputs.tsx         # LinkedIn / Facebook / Instagram inputs
    SocialLinks.tsx          # Social icon link renderer
supabase/
  functions/
    submit-post/             # Edge function: rate limit, upload, insert
    submit-update/           # Edge function: profile updates
    sheet-sync/              # Optional: mirror posts (e.g. Google Sheets)
supabase_setup.sql           # Run once in Supabase SQL editor
```

---

## Deployment

The frontend deploys to Vercel — connect the repo and add the same `VITE_*` variables from `.env` in the Vercel project settings. Edge Functions and secrets stay on Supabase.

---

## Contributing

Contributions are welcome! If you've adapted this for your own community and built something useful, feel free to open a PR.

- **Bug fixes and improvements** — open a PR against `master`
- **New features** — open an issue first to discuss before building
- **Questions** — use GitHub Discussions or open an issue

Please keep PRs focused — one change per PR makes review much easier.

---

## License

MIT
