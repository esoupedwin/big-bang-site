# Big Bang Site

A Next.js intelligence news application that displays articles sourced from multiple RSS feeds and provides AI-powered geopolitical analysis. Articles are pre-processed and stored in a Neon Postgres database by an external ingestion pipeline. This app is read-only with respect to articles — it queries, displays, and synthesises them.

---

## Table of Contents

- [Related Repositories](#related-repositories)
- [Pages](#pages)
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [URL Parameters](#url-parameters)
- [Deployment](#deployment)

---

## Related Repositories

This app is part of a two-service system sharing a single Neon Postgres database.

| Repo | Role |
|---|---|
| `big-bang-site` (this repo) | BIGBANG — Next.js web application. Reads from DB, serves users, runs AI synthesis. |
| `interlink` | INTERLINK — Preprocessing service. Ingests RSS feeds, generates gists, tags articles, writes to DB. |
| [`bigbang-interlink-sync`](https://github.com/esoupedwin/bigbang-interlink-sync) | Shared source of truth — database schema, data contracts, tag taxonomy, architecture docs. |

Any change to the database schema, tag taxonomy, or shared data conventions must be reflected in **`bigbang-interlink-sync`** first, then coordinated across both services.

---

## Pages

### Welcome (`/` — unauthenticated)
The landing page shown to visitors who are not signed in. Features a full-screen ASCII animation — four concentric waves expanding continuously from the centre — with the app name, tagline, and a **Sign in with Google** button overlaid on top. No content is accessible without authentication.

### Explore (`/` — authenticated)
The main application view, accessible after sign-in. Displays articles from the `feed_entries` table, newest first, with the following controls:

- **Tag filters** — Geography and Topics pill selectors at the top, lazy-loaded via Suspense so articles render immediately
- **Miscellaneous toggle** — hides articles tagged only as `Misc` (hidden by default)
- **Refresh button** — re-fetches data server-side without a full navigation
- **Synthesis panel** — sends visible articles to the AI synthesis endpoint and streams back a structured intelligence brief
- **Pagination** — 50 articles per page, navigation at top and bottom
- **Collapsible text** — `summary` and `gist` fields are clamped to 4 lines with expand/collapse

Each article card shows:
- Source feed name
- **Published** date in SGT (GMT+8)
- **Fetched** date via an ⓘ icon popover (click to reveal, ✕ to close)

All filter state (geo tags, topic tags, misc toggle, page number) is encoded in the URL, making every view bookmarkable and shareable.

### Daily Brief (`/daily-brief`)
An intelligence digest page tracking a set of pre-configured geopolitical and technology **coverages**. Each coverage is a focused topic with its own geography tags, topic tags, and system prompt addendum. Currently three coverages:

| Key | Label | Geo Tags | Topic Tags |
|---|---|---|---|
| `us-iran-israel` | Latest Developments in the US–Iran–Israel Conflict in the Middle East | United States, Iran, Israel | Bilateral Relations, Military |
| `china-taiwan` | Latest Developments in China–Taiwan Cross-Strait Relations | China, Taiwan | Bilateral Relations, Military |
| `ai-developments` | AI Landscape Update: Capabilities, Initiatives, and Emerging Trends | United States, China, Transnational | AI |

For each coverage, the page:
1. Serves the most recent cached brief immediately (page is never blank)
2. Calls the trigger endpoint on mount — starts background regeneration if new articles have appeared since the last generation
3. Polls the status endpoint every 3 seconds while regeneration is in progress, showing an **Updating…** indicator
4. Animates new content in when it arrives: witty headline streams character-by-character first, then bullet bold headlines stream one-by-one
5. A **↻ force-regenerate** button per coverage bypasses cache validity and triggers fresh generation immediately

The article count shown per coverage is clickable — it opens a right-side drawer listing all source articles with feed name, published date, and linked title.

Bullets are collapsible — each shows only the bold headline by default; clicking `+` expands to full detail.

### Profile (`/profile`)
The user settings page, accessible by clicking the user's name or avatar in the top-right header. Requires authentication.

- Displays the user's Google profile picture, name, and email
- **Theme preference** — Light, Dark, or System. Saved to `user_preferences` and synced across devices via database lookup on each page load.

---

## Overview

The app has four pages: **Welcome** (unauthenticated landing), **Explore** (authenticated news feed), **Daily Brief** (AI coverage digests), and **Profile** (user settings). A persistent top navigation bar links between Explore and Daily Brief for authenticated users. Admins see an additional ⚙ gear icon in the header that opens the **Admin Panel**.

Data ingestion (RSS fetching, summarisation, tagging) is handled by a separate upstream service and is outside the scope of this repository.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | [Neon Postgres](https://neon.tech/) (serverless) |
| Auth | [NextAuth.js v5](https://authjs.dev/) (Google OAuth) |
| AI | [OpenAI GPT](https://platform.openai.com/) (streaming + non-streaming) |
| Hosting | [Vercel](https://vercel.com/) |

---

## Project Structure

```
.
├── app/
│   ├── actions/
│   │   ├── auth.ts                     # Server actions: googleSignIn, handleSignOut
│   │   └── preferences.ts              # Server action: saveTheme (writes DB + cookie)
│   ├── api/
│   │   ├── admin/
│   │   │   └── latest-fetch/
│   │   │       └── route.ts            # GET — latest fetch time, batch count, total entry count (admin only)
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts                # NextAuth.js route handler (GET + POST)
│   │   ├── daily-brief/
│   │   │   ├── trigger/
│   │   │   │   └── route.ts            # POST — checks cache, fires background generation via after(), returns status
│   │   │   └── status/
│   │   │       └── route.ts            # GET ?topic= — polls generation status and returns latest cache
│   │   └── synthesize/
│   │       └── route.ts                # POST — streams GPT synthesis to the client (Explore page)
│   ├── components/
│   │   ├── AdminDrawer.tsx             # Left-side admin panel drawer (latest fetch stats)
│   │   ├── AdminTrigger.tsx            # Gear icon button + AdminDrawer (client, rendered in header for admins)
│   │   ├── AppNav.tsx                  # Top navigation bar: Explore / Daily Brief tabs
│   │   ├── ArticlesDrawer.tsx          # Right-side drawer listing source articles for a coverage
│   │   ├── AsciiAnimation.tsx          # Full-screen ASCII big bang animation (Welcome page)
│   │   ├── AuthHeader.tsx              # Top bar: avatar+name (links to Profile) or sign-in button
│   │   ├── CollapsibleBullet.tsx       # Expandable bullet for Daily Brief (headline-only by default)
│   │   ├── CollapsibleText.tsx         # Clamps text to 4 lines with expand/collapse toggle
│   │   ├── DailyBriefPanel.tsx         # Per-coverage panel: polling, animation, articles drawer trigger
│   │   ├── FeedEntryCard.tsx           # Renders a single article list item (Explore page)
│   │   ├── FetchedAtPopover.tsx        # Info icon popover showing fetched_at date (Explore page)
│   │   ├── GoogleIcon.tsx              # Shared Google SVG icon
│   │   ├── MiscToggle.tsx              # Misc-only toggle + refresh button (Explore page)
│   │   ├── PageNav.tsx                 # Previous / Next pagination navigation (Explore page)
│   │   ├── SynthesisPanel.tsx          # Synthesize button and streamed GPT output (Explore page)
│   │   ├── TagFilter.tsx               # Geography and topic tag filter pills (client, Explore page)
│   │   ├── TagFilterAsync.tsx          # Async server wrapper for TagFilter — deferred via Suspense
│   │   └── ThemeProvider.tsx           # Client component — applies .dark class based on preference
│   ├── daily-brief/
│   │   └── page.tsx                    # Daily Brief page — renders all coverages in parallel
│   ├── profile/
│   │   └── page.tsx                    # Profile page — user info and theme preference
│   ├── layout.tsx                      # Root layout — header, AdminTrigger (admins), ThemeProvider, AppNav
│   └── page.tsx                        # Welcome (unauthenticated) + Explore (authenticated)
├── lib/
│   ├── admin.ts                        # isAdmin(email) — checks admins table via user_id join
│   ├── auth.ts                         # NextAuth config: Google provider, exports auth/signIn/signOut
│   ├── brief.ts                        # BriefTopic type, BRIEF_TOPICS, DB helpers for cache + history
│   ├── db.ts                           # Neon database client
│   ├── feed.ts                         # FeedEntry type, getAllTags, getFeedEntries, constants
│   ├── generate-brief.ts               # Background generation: calls OpenAI, saves cache + history
│   ├── preferences.ts                  # UserPreferences type, getUserPreferences, upsertUserPreferences
│   ├── prompts.ts                      # Model constants, system prompts, prompt builder functions
│   └── types.ts                        # Shared TypeScript types (EntryInput)
├── scripts/
│   ├── migrate-admins.mjs              # Creates admins table, seeds initial admin
│   ├── migrate-brief-status.mjs        # Adds status + generating_since to daily_brief_cache
│   ├── migrate-user-preferences-userid.mjs  # Migrates user_preferences from user_email to user_id FK
│   └── migrate-users-and-admins.mjs    # Creates users table, seeds from existing emails, migrates admins FK
├── .env.local                          # Local environment variables (not committed)
└── package.json
```

---

## Features

### Tag Filtering (Explore)
Two independent filter groups:

- **Geography** — filter by `geo_tags` (e.g. United States, China, Middle East)
- **Topics** — filter by `topic_tags` (e.g. AI, Economy Trade, Military)

AND logic between groups, OR logic within a group. Tag filters are lazy-loaded via Suspense (`TagFilterAsync`) so articles render immediately without waiting for the tag query.

### Miscellaneous Filter (Explore)
Toggles visibility of articles whose `topic_tags` is only `["Misc"]`. Hidden by default.

### Pagination (Explore)
50 articles per page. All filter state is URL-encoded.

### Collapsible Text (Explore)
`summary` and `gist` fields clamped to 4 lines with a Show more / Show less toggle. Re-checks overflow on resize via `ResizeObserver`.

### Article Date Display (Explore)
Each article shows its **Published** date and a **Fetched** date. Both are displayed in SGT (GMT+8, `Asia/Singapore`). The fetched date is shown via an ⓘ icon — clicking it opens a small popover inline; ✕ closes it.

### Geopolitical Synthesis (Explore)
Sends visible articles to `/api/synthesize`. Streams a structured Markdown intelligence brief: key developments, thematic analysis, notable signals, diverging narratives, gaps, and a bottom-line takeaway. Scoped to active tag filters.

### Daily Brief: Background Generation
Brief generation is decoupled from the HTTP response using Next.js `after()`:

1. The client calls `/api/daily-brief/trigger` (POST) — the server checks cache validity, then fires `generateBriefForTopic()` in the background after responding immediately
2. If the cache is still valid, the response includes the cached content directly (`status: "ready"`)
3. If generation is in progress, the client polls `/api/daily-brief/status` every 3 seconds until `status: "idle"`
4. A DB lock (`status`, `generating_since`) prevents duplicate jobs; locks older than 3 minutes are treated as stale and allow retriggering

### Daily Brief: Streaming Animation
When new content arrives (either immediately from cache or after polling completes):
- The witty headline streams character-by-character at 8ms/char
- Once the headline finishes, bullet bold headlines stream one at a time (8ms/char, 40ms pause between bullets)
- Full collapsible bullet interactivity is restored after the animation completes

### Daily Brief: Force Regenerate
A **↻** button per coverage bypasses cache validity checking and triggers fresh generation regardless of whether new articles have appeared.

### Daily Brief Coverages
Each **coverage** is defined in `lib/brief.ts` as a `BriefTopic` with a unique key, label, geo/topic tag filters, and a `systemPromptAddendum` guiding the model to focus on that coverage's specific priorities and discard irrelevant articles.

**Cache invalidation logic:** The cache is valid as long as every current article was included in the last generation. New articles trigger regeneration; articles ageing out of the 24h rolling window do not.

**Generation pipeline per coverage:**
1. Fetch matching articles from the last 24 hours
2. Check cache validity; respond immediately if valid
3. Background: generate bullet-point brief (`stream: false`)
4. In parallel: generate diff assessment + witty headline
5. Save to `daily_brief_cache` (upsert) and `daily_brief_history` (append)

### Articles Drawer (Daily Brief)
The article count shown per coverage ("Based on **xx articles**…") is a clickable button. Clicking it opens a right-side drawer listing all source articles used in the brief — feed name, published date, and a linked title that opens the original article.

### Collapsible Bullets (Daily Brief)
Each bullet shows only its **bold headline** by default. `+` expands; `−` collapses. Headline extracted from the hast AST node — no string parsing.

### Witty Headline (Daily Brief)
A punchy, witty headline summarising each coverage, generated after the brief completes. Displayed in italic above the bullets and streams in character-by-character on arrival.

### Diff Assessment (Daily Brief)
Compares the new brief against the previous cached version. Significant new developments are listed; otherwise a "no significant change" notice is shown. Displayed in a bordered box below the bullets (hidden during animation).

### Admin Panel
A ⚙ gear icon in the top-left of the header, visible only to admins. Opens a left-side drawer with operational stats:

- **Latest Fetch** — timestamp of the most recent ingestion batch (SGT)
- **Entries in Latest Fetch** — number of articles ingested in that batch
- **Total Feed Entries** — cumulative count across all time

Admin access is managed via the `admins` table in the database (keyed on `user_id`). To grant admin access, insert a row: `INSERT INTO admins (user_id) SELECT id FROM users WHERE email = '...'`.

### Theme (Profile)
Light, Dark, or System preference stored in `user_preferences`. Read from the database on each page load for logged-in users so it syncs across devices.

---

## Getting Started

### Prerequisites

- Node.js 24.x
- A [Neon](https://neon.tech/) Postgres database populated by the upstream ingestion pipeline

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
OPENAI_API_KEY=sk-...
AUTH_SECRET=<generate with: npx auth secret>
AUTH_GOOGLE_ID=<your Google OAuth client ID>
AUTH_GOOGLE_SECRET=<your Google OAuth client secret>
```

### Run the development server

```bash
npm run dev
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `AUTH_SECRET` | Random secret for signing session tokens — generate with `npx auth secret` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |

---

## Database Schema

### `users`

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary key — generated with `gen_random_uuid()` |
| `email` | `TEXT UNIQUE` | Google account email |
| `created_at` | `TIMESTAMPTZ` | Row creation timestamp |

### `admins`

| Column | Type | Description |
|---|---|---|
| `user_id` | `UUID` | Primary key — FK to `users.id` |
| `created_at` | `TIMESTAMPTZ` | Row creation timestamp |

### `feed_entries`

| Column | Type | Description |
|---|---|---|
| `id` | `BIGSERIAL` | Primary key |
| `feed_name` | `TEXT` | Display name of the source feed |
| `feed_url` | `TEXT` | URL of the source feed |
| `guid` | `TEXT UNIQUE` | Unique identifier from the feed item |
| `title` | `TEXT` | Article headline |
| `link` | `TEXT` | URL to the full article |
| `summary` | `TEXT` | Short description from the feed |
| `gist` | `TEXT` | AI-generated summary of the article content |
| `author` | `TEXT` | Article author |
| `published_at` | `TIMESTAMPTZ` | Publication date from the feed |
| `fetched_at` | `TIMESTAMPTZ` | Timestamp when the row was inserted by INTERLINK |
| `geo_tags` | `TEXT[]` | Geography tags |
| `topic_tags` | `TEXT[]` | Topic tags |

### `user_preferences`

| Column | Type | Description |
|---|---|---|
| `user_id` | `UUID` | Primary key — FK to `users.id` |
| `theme` | `TEXT` | `light`, `dark`, or `system` (default) |
| `created_at` | `TIMESTAMPTZ` | Row creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | Last update timestamp |

### `daily_brief_cache`

One row per coverage. Upserted on each generation.

| Column | Type | Description |
|---|---|---|
| `topic_key` | `TEXT` | Primary key — matches `BriefTopic.key` |
| `content` | `TEXT` | Generated bullet-point brief (Markdown) |
| `article_ids` | `TEXT[]` | IDs of articles included in this generation |
| `generated_at` | `TIMESTAMPTZ` | When this cache entry was last written |
| `diff_summary` | `TEXT` | Diff assessment vs. previous brief (nullable) |
| `headline` | `TEXT` | Witty AI-generated headline (nullable) |
| `status` | `TEXT` | `idle` or `generating` — job lock state |
| `generating_since` | `TIMESTAMPTZ` | When the current generation job started (nullable); locks older than 3 minutes are treated as stale |

### `daily_brief_history`

Append-only log of every generation.

| Column | Type | Description |
|---|---|---|
| `id` | `BIGSERIAL` | Primary key |
| `topic_key` | `TEXT` | Coverage key |
| `content` | `TEXT` | Generated brief (Markdown) |
| `article_ids` | `TEXT[]` | Article IDs included |
| `article_count` | `INT` | Number of articles |
| `diff_summary` | `TEXT` | Diff vs. previous (nullable) |
| `headline` | `TEXT` | Witty headline (nullable) |
| `generated_at` | `TIMESTAMPTZ` | Generation timestamp |

---

## URL Parameters

The Explore page is fully driven by URL search parameters.

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Current page number (default: 1) |
| `geo` | string (repeatable) | Active geography tag filters |
| `topic` | string (repeatable) | Active topic tag filters |
| `show_misc` | `1` | When present, includes Misc-only articles |

---

## Deployment

### Vercel

1. Import the repository in the [Vercel dashboard](https://vercel.com/new).
2. Add all five environment variables under **Project Settings → Environment Variables**.
3. Add `https://your-domain.com/api/auth/callback/google` as an authorised redirect URI in your Google Cloud OAuth client.
4. Deploy — Vercel detects Next.js automatically.

> **Note:** The Daily Brief generation uses `after()` with `maxDuration = 60`. This is within the Vercel Hobby plan limit. Upgrade to Pro (`maxDuration` up to 800s) if generation jobs time out under load.

### Node.js version

This project requires Node.js **24.x**:

```json
"engines": { "node": "24.x" }
```

Set the matching version in **Vercel → Project Settings → Node.js Version** if not picked up automatically.
