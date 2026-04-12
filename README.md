# Big Bang Site

A Next.js web application that displays news articles sourced from multiple RSS feeds. Articles are pre-processed and stored in a Neon Postgres database by an external ingestion pipeline. This app is read-only — it queries and displays the data.

---

## Table of Contents

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

## Overview

The main page (`/`) queries the `feed_entries` table from Neon Postgres and renders articles newest first. Users can filter by geography and topic, toggle visibility of miscellaneous-only articles, paginate through results 50 at a time, and request a streamed AI synthesis of the visible articles.

Data ingestion (RSS fetching, summarisation, tagging) is handled by a separate upstream service and is outside the scope of this repository.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | [Neon Postgres](https://neon.tech/) (serverless) |
| AI | [OpenAI GPT](https://platform.openai.com/) (streaming synthesis) |
| Hosting | [Vercel](https://vercel.com/) |

---

## Project Structure

```
.
├── app/
│   ├── api/
│   │   └── synthesize/
│   │       └── route.ts          # POST endpoint — streams GPT synthesis to the client
│   ├── components/
│   │   ├── CollapsibleText.tsx   # Clamps text to 4 lines with expand/collapse toggle
│   │   ├── FeedEntryCard.tsx     # Renders a single article list item
│   │   ├── MiscToggle.tsx        # Switch to show/hide miscellaneous-only articles + refresh button
│   │   ├── PageNav.tsx           # Previous / Next pagination navigation
│   │   ├── SynthesisPanel.tsx    # Synthesize button and streamed GPT output panel
│   │   └── TagFilter.tsx         # Geography and topic tag filter pills
│   ├── layout.tsx                # Root layout and metadata
│   └── page.tsx                  # Main page — fetches and renders feed entries
├── lib/
│   ├── db.ts                     # Neon database client
│   ├── feed.ts                   # FeedEntry type, getAllTags, getFeedEntries, constants
│   ├── prompts.ts                # Synthesis system prompt, model name, buildFocusParts helper
│   └── types.ts                  # Shared TypeScript types (EntryInput)
├── .env.local                    # Local environment variables (not committed)
└── package.json
```

---

## Features

### Tag Filtering
Two independent filter groups are displayed at the top of the page:

- **Geography** — filter by the `geo_tags` array column (e.g. United States, China, Middle East)
- **Topics** — filter by the `topic_tags` array column (e.g. AI, Economy Trade, Military)

Multiple tags can be selected within each group. Selecting tags from both groups applies both filters simultaneously (AND logic between groups, OR logic within a group). Active filters are preserved across page navigation.

### Miscellaneous Filter
A toggle switch below the tag filters controls visibility of articles whose `topic_tags` contains only `["Misc"]`. These are hidden by default. Articles that have `Misc` alongside other topic tags are always shown regardless of the toggle.

### Pagination
Results are paginated at 50 articles per page. Navigation buttons appear at both the top and bottom of the article list. The current page, all active tag filters, and the misc toggle state are all preserved in the URL.

### Collapsible Text
Both the `summary` and `gist` fields are rendered with a 4-line clamp. A **Show more / Show less** button appears only when the text actually overflows — short text is left unchanged.

### Refresh
A refresh button sits next to the miscellaneous toggle. It re-fetches server data in place without changing the URL or navigation state, useful after the upstream pipeline has ingested new articles.

### Geopolitical Synthesis
A **Synthesize** button below the filters sends the currently visible articles to the `/api/synthesize` endpoint. The server calls the OpenAI API and streams the response back as plain text. Output is rendered as Markdown using `react-markdown` and `@tailwindcss/typography`.

The synthesis is scoped to the active tag filters — the selected geography and topic tags are included in the prompt as an analytical focus directive so the model orients its analysis accordingly.

The system prompt is defined in `lib/prompts.ts` and instructs the model to produce a structured intelligence brief: key developments, thematic analysis, notable signals, diverging narratives, gaps, and a bottom-line takeaway. Output is capped at 350 words.

---

## Getting Started

### Prerequisites

- Node.js 24.x
- A [Neon](https://neon.tech/) Postgres database with the `feed_entries` table populated by the upstream ingestion pipeline

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
OPENAI_API_KEY=sk-...
```

Your Neon connection string can be found in the Neon dashboard under **Connection Details**. Your OpenAI API key can be found at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `OPENAI_API_KEY` | OpenAI API key for the synthesis feature |

---

## Database Schema

Table: **`feed_entries`**

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
| `geo_tags` | `TEXT[]` | Geography tags assigned by the preprocessing pipeline |
| `topic_tags` | `TEXT[]` | Topic tags assigned by the preprocessing pipeline |

---

## URL Parameters

The page is fully driven by URL search parameters, making every view bookmarkable and shareable.

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Current page number (default: 1) |
| `geo` | string (repeatable) | Active geography tag filters, e.g. `?geo=China&geo=Taiwan` |
| `topic` | string (repeatable) | Active topic tag filters, e.g. `?topic=AI&topic=Military` |
| `show_misc` | `1` | When present, includes articles tagged only with `Misc` |

---

## Deployment

### Vercel

1. Import the repository in the [Vercel dashboard](https://vercel.com/new).
2. Add both `DATABASE_URL` and `OPENAI_API_KEY` under **Project Settings → Environment Variables**.
3. Deploy. Vercel will detect Next.js automatically.

### Node.js version

This project requires Node.js **24.x**, specified in `package.json`:

```json
"engines": { "node": "24.x" }
```

Set the matching version in **Vercel → Project Settings → Node.js Version** if it is not picked up automatically.
