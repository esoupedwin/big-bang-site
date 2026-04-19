# Big Bang Site

A Next.js geopolitical intelligence application. Articles are ingested and tagged by an external pipeline (INTERLINK) and stored in a shared Neon Postgres database. This app is read-only with respect to articles — it queries, analyses, and synthesises them using OpenAI.

---

## Related Repositories

| Repo | Role |
|---|---|
| `big-bang-site` (this repo) | BIGBANG — Next.js web app |
| `interlink` | INTERLINK — RSS ingestion and tagging service |
| [`bigbang-interlink-sync`](https://github.com/esoupedwin/bigbang-interlink-sync) | Shared schema, data contracts, tag taxonomy |

Schema changes must be coordinated via `bigbang-interlink-sync` first.

---

## Pages

| Route | Description |
|---|---|
| `/` | Welcome — unauthenticated landing with Google sign-in |
| `/daily-brief` | Intelligence digests per coverage topic |
| `/explore` | Full article feed with filters and AI synthesis |
| `/profile` | Theme preference, coverages, and badges |
| `/profile/coverages` | Add/remove coverage topics |
| `/profile/badges` | Earned and available achievements |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Neon Postgres (serverless) |
| Auth | NextAuth.js v5 (Google OAuth) |
| AI | OpenAI GPT (streaming + non-streaming) |
| Hosting | Vercel |

---

## Project Structure

```
app/
  actions/
    auth.ts                       # googleSignIn, handleSignOut
    achievements.ts               # awardAchievementAction, trackArticleClickAction
    coverages.ts                  # addCoverageAction, removeCoverageAction
    preferences.ts                # saveTheme
  api/
    admin/
      latest-fetch/route.ts       # GET — ingestion stats (admin only)
      reset-achievements/route.ts # DELETE — clears achievements + stats for admin user
    auth/[...nextauth]/route.ts   # NextAuth route handler
    daily-brief/
      trigger/route.ts            # POST — checks cache, fires background generation
      status/route.ts             # GET — polls generation status
    coverage/
      additional-info/route.ts    # POST — streams personality profiles (GPT + web search)
      concepts/route.ts           # POST — streams concept explanations (GPT + web search)
      analytical-take/route.ts    # POST — streams Developments Over Time analysis
      suggest-priorities/route.ts # POST — streams coverage priority suggestions
    synthesize/route.ts           # POST — streams intelligence synthesis (Explore)
  components/                     # All client components
  daily-brief/
    page.tsx                      # Daily Brief page
    loading.tsx                   # Welcome screen (first session load only)
  explore/page.tsx                # Explore page
  profile/
    page.tsx                      # Profile page
    coverages/page.tsx            # Coverage management
    badges/page.tsx               # Achievements/badges
  hooks/
    useTabFocusAchievement.ts     # Delays achievement toast until tab is focused
  layout.tsx                      # Root layout
  page.tsx                        # Welcome (unauthenticated) / redirect (authenticated)
lib/
  achievements.ts                 # Achievement registry + DB helpers
  admin.ts                        # isAdmin() check
  auth.ts                         # NextAuth config
  brief.ts                        # BriefTopic type, cache/history DB helpers, sampleEvenly
  coverages.ts                    # User coverage DB helpers
  db.ts                           # Neon client
  feed.ts                         # FeedEntry type, getFeedEntries, getAllTags
  generate-brief.ts               # Background brief generation pipeline
  migrate.ts                      # Idempotent schema migrations (run on page load)
  openai.ts                       # Singleton OpenAI client
  preferences.ts                  # User preference DB helpers
  prompts.ts                      # Model constants + all prompt builder functions
  streaming-response.ts           # Shared streaming response helper
  types.ts                        # Shared types
scripts/                          # One-off migration scripts
```

---

## Features

### Daily Brief

Each user coverage generates a focused intelligence brief:

1. **Brief** — bullet-point summary of the last 24 hours, ordered by significance. Witty headline streams in first, then bullet headlines animate one by one.
2. **Changes Since** — diff against the previous brief. Highlights significant new developments.
3. **Developments Over Time** — auto-generated once animation finishes. Uses GPT-5.4-mini with 5 historically sampled diffs (evenly spaced from oldest to newest) to summarise how the situation has evolved and where it's heading.
4. **Additional Info** — scroll-triggered, one-shot per session:
   - *Personalities Mentioned* — profiles sourced via GPT + web search. Wikipedia avatar for each person; tap to enlarge.
   - *Concepts Explained* — domain-specific terms explained via GPT + web search.

**Generation pipeline:**
1. Fetch articles from last 24 hours matching coverage tags
2. Return cached brief immediately if still valid (no new articles)
3. Otherwise: generate brief → diff + headline in parallel → save to cache and history
4. A DB lock (`status`, `generating_since`) prevents duplicate jobs; stale locks expire after 3 minutes

**Cache invalidation:** valid as long as every current article was included in the last generation. Articles ageing out of the 24h window do not trigger regeneration.

### Explore

Article feed with:
- **Tag filters** — Geography and Topics, OR within group, AND between groups. URL-encoded.
- **Miscellaneous toggle** — hides articles tagged only as `Misc`
- **Synthesis** — sends visible articles to GPT for a structured intelligence brief (key developments, thematic analysis, signals, narratives, gaps, bottom line)
- **Pagination** — 50 articles per page

### Achievements

Awarded automatically; toast appears when the tab regains focus.

| Key | Title | Requirement |
|---|---|---|
| `coverage_master` | Coverage Master | Created first coverage |
| `synthesize_master` | Synthesize Master | Used Synthesize on Explore |
| `news_scanner` | News Scanner | Opened 5 article links |
| `details_matter` | Details Matter | Opened 15 article links |

### Admin Panel

Gear icon (top-left, admins only). Shows ingestion stats and a **Reset My Achievements** button (clears achievements + click counters for the admin user).

### Loading & Welcome

- **InitialLoader** — pure CSS spinner injected before React hydrates, eliminates blank white screen on cold load.
- **WelcomeScreen** — shown on first Daily Brief load per session (checked via `sessionStorage`). Skipped on subsequent navigations.

---

## Getting Started

```bash
npm install
npm run dev
```

Create `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
OPENAI_API_KEY=sk-...
AUTH_SECRET=<npx auth secret>
AUTH_GOOGLE_ID=<Google OAuth client ID>
AUTH_GOOGLE_SECRET=<Google OAuth client secret>
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `email` | `TEXT UNIQUE` | |
| `created_at` | `TIMESTAMPTZ` | |

### `admins`
| Column | Type | Notes |
|---|---|---|
| `user_id` | `UUID` | PK, FK → `users.id` |

### `feed_entries`
| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `feed_name`, `feed_url` | `TEXT` | Source |
| `guid` | `TEXT UNIQUE` | |
| `title`, `link`, `summary`, `gist`, `author` | `TEXT` | |
| `published_at`, `fetched_at` | `TIMESTAMPTZ` | |
| `geo_tags`, `topic_tags` | `TEXT[]` | |

### `user_preferences`
| Column | Type | Notes |
|---|---|---|
| `user_id` | `UUID` | PK, FK → `users.id` |
| `theme` | `TEXT` | `light` \| `dark` \| `system` |

### `user_coverages`
| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `users.id` |
| `label`, `geo_tags`, `topic_tags`, `priorities` | | Coverage definition |
| `sort_order` | `INT` | Display order |

### `user_achievements`
| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL` | PK |
| `user_id` | `TEXT` | |
| `achievement_key` | `TEXT` | Unique with `user_id` |
| `earned_at` | `TIMESTAMPTZ` | |

### `user_stats`
| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL` | PK |
| `user_id` | `TEXT` | |
| `stat_key` | `TEXT` | Unique with `user_id` |
| `value` | `INT` | |

### `daily_brief_cache`
One row per coverage. Upserted on each generation.

| Column | Type | Notes |
|---|---|---|
| `topic_key` | `TEXT` | PK |
| `content`, `diff_summary`, `headline` | `TEXT` | |
| `article_ids` | `TEXT[]` | |
| `generated_at` | `TIMESTAMPTZ` | |
| `status` | `TEXT` | `idle` \| `generating` |
| `generating_since` | `TIMESTAMPTZ` | Lock timestamp; stale after 3 min |

### `daily_brief_history`
Append-only log of every generation.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `topic_key` | `TEXT` | |
| `content`, `diff_summary`, `headline` | `TEXT` | |
| `article_ids` | `TEXT[]` | |
| `article_count` | `INT` | |
| `generated_at` | `TIMESTAMPTZ` | |

---

## Deployment

1. Import repo in Vercel, add the five environment variables.
2. Add `https://your-domain.com/api/auth/callback/google` as an authorised redirect URI in Google Cloud.
3. Set Node.js version to **24.x** in Vercel project settings.

> Daily Brief generation uses `after()` with `maxDuration = 60` — within the Vercel Hobby plan limit.
