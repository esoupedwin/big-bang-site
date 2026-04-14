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

- **Tag filters** — Geography and Topics pill selectors at the top
- **Miscellaneous toggle** — hides articles tagged only as `Misc` (hidden by default)
- **Refresh button** — re-fetches data server-side without a full navigation
- **Synthesis panel** — sends visible articles to the AI synthesis endpoint and streams back a structured intelligence brief
- **Pagination** — 50 articles per page, navigation at top and bottom
- **Collapsible text** — `summary` and `gist` fields are clamped to 4 lines with expand/collapse

All filter state (geo tags, topic tags, misc toggle, page number) is encoded in the URL, making every view bookmarkable and shareable.

### Daily Brief (`/daily-brief`)
An intelligence digest page tracking a set of pre-configured geopolitical and technology **coverages**. Each coverage is a focused topic with its own geography tags, topic tags, and system prompt addendum. Currently three coverages:

| Key | Label | Geo Tags | Topic Tags |
|---|---|---|---|
| `us-iran-israel` | US · Iran · Israel | United States, Iran, Israel | Bilateral Relations, Military |
| `china-taiwan` | China · Taiwan | China, Taiwan | Bilateral Relations, Military |
| `ai-developments` | AI Developments | United States, China | Transnational, AI |

For each coverage, the page:
1. Queries articles from the last 24 hours matching the coverage's tags
2. Checks the cache (`daily_brief_cache`) — serves cached content if no new articles have appeared since the last generation
3. If the cache is stale, streams a fresh bullet-point brief from the AI
4. After streaming, generates a **diff assessment** (comparing new brief to previous) and a **witty headline** in parallel
5. Saves everything to `daily_brief_cache` (upsert) and `daily_brief_history` (append-only log)

Bullets are collapsible — each shows only the bold headline by default; clicking `+` expands to full detail.

### Profile (`/profile`)
The user settings page, accessible by clicking the user's name or avatar in the top-right header. Requires authentication.

- Displays the user's Google profile picture, name, and email
- **Theme preference** — Light, Dark, or System. Saved to `user_preferences` and synced across devices via database lookup on each page load.

---

## Overview

The app has four pages: **Welcome** (unauthenticated landing), **Explore** (authenticated news feed), **Daily Brief** (AI coverage digests), and **Profile** (user settings). A persistent top navigation bar links between Explore and Daily Brief for authenticated users.

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
│   │   ├── auth.ts                   # Server actions: googleSignIn, handleSignOut
│   │   └── preferences.ts            # Server action: saveTheme (writes DB + cookie)
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts              # NextAuth.js route handler (GET + POST)
│   │   ├── daily-brief/
│   │   │   └── route.ts              # GET ?topic= — streams brief, generates diff + headline, saves cache
│   │   └── synthesize/
│   │       └── route.ts              # POST — streams GPT synthesis to the client (Explore page)
│   ├── components/
│   │   ├── AppNav.tsx                # Top navigation bar: Explore / Daily Brief tabs
│   │   ├── AsciiAnimation.tsx        # Full-screen ASCII big bang animation (Welcome page)
│   │   ├── AuthHeader.tsx            # Top bar: avatar+name (links to Profile) or sign-in button
│   │   ├── CollapsibleBullet.tsx     # Expandable bullet for Daily Brief (headline-only by default)
│   │   ├── CollapsibleText.tsx       # Clamps text to 4 lines with expand/collapse toggle
│   │   ├── DailyBriefPanel.tsx       # Streams and renders a single coverage brief
│   │   ├── FeedEntryCard.tsx         # Renders a single article list item (Explore page)
│   │   ├── GoogleIcon.tsx            # Shared Google SVG icon
│   │   ├── MiscToggle.tsx            # Misc-only toggle + refresh button (Explore page)
│   │   ├── PageNav.tsx               # Previous / Next pagination navigation (Explore page)
│   │   ├── SynthesisPanel.tsx        # Synthesize button and streamed GPT output (Explore page)
│   │   ├── TagFilter.tsx             # Geography and topic tag filter pills (Explore page)
│   │   └── ThemeProvider.tsx         # Client component — applies .dark class based on preference
│   ├── daily-brief/
│   │   └── page.tsx                  # Daily Brief page — renders all coverages in parallel
│   ├── profile/
│   │   └── page.tsx                  # Profile page — user info and theme preference
│   ├── layout.tsx                    # Root layout — top bar, ThemeProvider, AppNav, SSR dark class
│   └── page.tsx                      # Welcome (unauthenticated) + Explore (authenticated)
├── lib/
│   ├── auth.ts                       # NextAuth config: Google provider, exports auth/signIn/signOut
│   ├── brief.ts                      # BriefTopic type, BRIEF_TOPICS (coverages), DB functions for cache + history
│   ├── db.ts                         # Neon database client
│   ├── feed.ts                       # FeedEntry type, getAllTags, getFeedEntries, constants
│   ├── preferences.ts                # UserPreferences type, getUserPreferences, upsertUserPreferences
│   ├── prompts.ts                    # Model constants, system prompts, prompt builder functions
│   └── types.ts                      # Shared TypeScript types (EntryInput)
├── .env.local                        # Local environment variables (not committed)
└── package.json
```

---

## Features

### Tag Filtering (Explore)
Two independent filter groups:

- **Geography** — filter by `geo_tags` (e.g. United States, China, Middle East)
- **Topics** — filter by `topic_tags` (e.g. AI, Economy Trade, Military)

AND logic between groups, OR logic within a group.

### Miscellaneous Filter (Explore)
Toggles visibility of articles whose `topic_tags` is only `["Misc"]`. Hidden by default.

### Pagination (Explore)
50 articles per page. All filter state is URL-encoded.

### Collapsible Text (Explore)
`summary` and `gist` fields clamped to 4 lines with a Show more / Show less toggle. Re-checks overflow on resize via `ResizeObserver`.

### Geopolitical Synthesis (Explore)
Sends visible articles to `/api/synthesize`. Streams a structured Markdown intelligence brief: key developments, thematic analysis, notable signals, diverging narratives, gaps, and a bottom-line takeaway. Scoped to active tag filters.

### Daily Brief Coverages
Each **coverage** is defined in `lib/brief.ts` as a `BriefTopic` with a unique key, label, geo/topic tag filters, and a `systemPromptAddendum` appended to the shared base prompt.

**Cache invalidation logic:** The cache is valid as long as every current article was included in the last generation. New articles trigger regeneration; articles ageing out of the 24h rolling window do not.

**Generation pipeline per coverage:**
1. Fetch matching articles from the last 24 hours
2. Check cache validity
3. Stream bullet-point brief (`SYNTHESIS_MODEL = gpt-5.4`)
4. In parallel: generate diff assessment + witty headline (`HEADLINE_MODEL = gpt-5.4-mini`)
5. Append headline to stream via `<!--BB_HEADLINE-->` marker
6. Save to `daily_brief_cache` (upsert) and `daily_brief_history` (append)

### Collapsible Bullets (Daily Brief)
Each bullet shows only its **bold headline** by default. `+` expands; `−` collapses. Headline extracted from the hast AST node — no string parsing.

### Witty Headline (Daily Brief)
A punchy, witty headline summarising each coverage, generated by `HEADLINE_MODEL` after the brief completes. Displayed in italic above the bullets.

### Diff Assessment (Daily Brief)
Compares the new brief against the previous cached version. Significant new developments are listed; otherwise a "no significant change" notice is shown. Displayed in a bordered box above the bullets.

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
| `fetched_at` | `TIMESTAMPTZ` | Timestamp when the row was inserted |
| `geo_tags` | `TEXT[]` | Geography tags |
| `topic_tags` | `TEXT[]` | Topic tags |

### `user_preferences`

| Column | Type | Description |
|---|---|---|
| `user_email` | `TEXT` | Primary key — Google account email |
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

### Node.js version

This project requires Node.js **24.x**:

```json
"engines": { "node": "24.x" }
```

Set the matching version in **Vercel → Project Settings → Node.js Version** if not picked up automatically.
