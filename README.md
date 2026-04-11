# Big Bang Site

A Next.js web application that syncs the BBC News RSS feed into a Neon Postgres database and displays the articles on the main page.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [RSS Feed Sync](#rss-feed-sync)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

---

## Overview

The application has two responsibilities:

1. **Display** — The main page (`/`) queries `feed_entries` from Neon Postgres and renders articles in chronological order.
2. **Sync** — The API route `/api/sync-feed` fetches the BBC News RSS feed and upserts each article into the database. On Vercel this runs automatically every hour via a cron job.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | [Neon Postgres](https://neon.tech/) (serverless) |
| RSS Parsing | [rss-parser](https://www.npmjs.com/package/rss-parser) |
| Hosting | [Vercel](https://vercel.com/) |

---

## Project Structure

```
.
├── app/
│   ├── api/
│   │   └── sync-feed/
│   │       └── route.ts      # API route: fetch RSS and upsert into DB
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page: reads articles from DB
├── lib/
│   └── db.ts                  # Neon client + table initialisation
├── public/                    # Static assets
├── vercel.json                # Vercel cron job configuration
├── .env.local                 # Local environment variables (not committed)
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 24.x
- A [Neon](https://neon.tech/) Postgres database

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

Your Neon connection string can be found in the Neon dashboard under **Connection Details**.

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Seed the database

The `feed_entries` table is created automatically on the first sync. Trigger a manual sync by visiting:

```
http://localhost:3000/api/sync-feed
```

The response will confirm how many articles were inserted and how many were skipped (already existed):

```json
{ "inserted": 30, "skipped": 0, "total": 30 }
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |

---

## RSS Feed Sync

**Route:** `GET /api/sync-feed`

**Source:** `https://feeds.bbci.co.uk/news/rss.xml`

**Behaviour:**
- Fetches all current items from the BBC News RSS feed.
- Upserts each item into the `feed_entries` table using `ON CONFLICT (guid) DO NOTHING` to prevent duplicates.
- Returns a JSON summary: `{ inserted, skipped, total }`.

**Schedule:** Runs automatically every hour on Vercel (configured in `vercel.json`).

---

## Database Schema

Table: **`feed_entries`**

| Column | Type | Description |
|---|---|---|
| `id` | `SERIAL` | Primary key |
| `guid` | `TEXT UNIQUE` | Unique identifier from the RSS item |
| `title` | `TEXT` | Article headline |
| `link` | `TEXT` | URL to the full article |
| `pub_date` | `TIMESTAMPTZ` | Publication date from the feed |
| `snippet` | `TEXT` | Short description / summary |
| `synced_at` | `TIMESTAMPTZ` | Timestamp when the row was inserted |

The table is created automatically by `lib/db.ts` if it does not exist.

---

## Deployment

### Vercel

1. Import the repository in the [Vercel dashboard](https://vercel.com/new).
2. Add the `DATABASE_URL` environment variable under **Project Settings → Environment Variables**.
3. Deploy. Vercel will detect Next.js automatically.

The cron job in `vercel.json` will run `/api/sync-feed` every hour once deployed.

### Node.js version

This project requires Node.js **24.x**, specified in `package.json`:

```json
"engines": { "node": "24.x" }
```

Set the matching version in **Vercel → Project Settings → Node.js Version** if it is not picked up automatically.
