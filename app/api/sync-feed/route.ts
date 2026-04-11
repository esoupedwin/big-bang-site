import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { sql, initDb } from "@/lib/db";

const FEED_URL = "https://feeds.bbci.co.uk/news/rss.xml";

export async function GET() {
  await initDb();

  const parser = new Parser();
  const feed = await parser.parseURL(FEED_URL);

  let inserted = 0;
  let skipped = 0;

  for (const item of feed.items) {
    const guid = item.guid ?? item.link ?? item.title;
    if (!guid) continue;

    const result = await sql`
      INSERT INTO feed_items (guid, title, link, pub_date, snippet)
      VALUES (
        ${guid},
        ${item.title ?? null},
        ${item.link ?? null},
        ${item.pubDate ? new Date(item.pubDate) : null},
        ${item.contentSnippet ?? null}
      )
      ON CONFLICT (guid) DO NOTHING
    `;

    if (result.length === 0) {
      skipped++;
    } else {
      inserted++;
    }
  }

  return NextResponse.json({ inserted, skipped, total: feed.items.length });
}
