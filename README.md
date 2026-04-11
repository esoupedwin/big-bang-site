# Big Bang Site

A Next.js web application that displays news articles from a Neon Postgres database.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

---

## Overview

The main page (`/`) queries `feed_entries` from Neon Postgres and renders articles newest first, grouped by source feed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | [Neon Postgres](https://neon.tech/) (serverless) |
| Hosting | [Vercel](https://vercel.com/) |

---

## Project Structure

```
.
├── app/
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page: reads articles from DB
├── lib/
│   └── db.ts                  # Neon client
├── .env.local                 # Local environment variables (not committed)
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 24.x
- A [Neon](https://neon.tech/) Postgres database with the `feed_entries` table

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

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |

---

## Database Schema

Table: **`feed_entries`**

| Column | Type | Description |
|---|---|---|
| `id` | `BIGSERIAL` | Primary key |
| `feed_name` | `TEXT` | Name of the source feed |
| `feed_url` | `TEXT` | URL of the source feed |
| `guid` | `TEXT UNIQUE` | Unique identifier from the feed item |
| `title` | `TEXT` | Article headline |
| `link` | `TEXT` | URL to the full article |
| `summary` | `TEXT` | Short description |
| `author` | `TEXT` | Article author |
| `published_at` | `TIMESTAMPTZ` | Publication date |
| `fetched_at` | `TIMESTAMPTZ` | Timestamp when the row was inserted |

---

## Deployment

### Vercel

1. Import the repository in the [Vercel dashboard](https://vercel.com/new).
2. Add the `DATABASE_URL` environment variable under **Project Settings → Environment Variables**.
3. Deploy. Vercel will detect Next.js automatically.

### Node.js version

This project requires Node.js **24.x**, specified in `package.json`:

```json
"engines": { "node": "24.x" }
```

Set the matching version in **Vercel → Project Settings → Node.js Version** if it is not picked up automatically.
