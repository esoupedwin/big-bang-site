# Third Eye — Product Document

## Product Objective

Third Eye is a global affairs tracking application for users who need to stay informed on specific global issues without spending hours reading news. It ingests articles from curated RSS feeds, tags them by geography and topic, and uses AI to synthesise them into structured intelligence briefs. The goal is rapid situational awareness: a user should be able to open the app and understand what has happened, what has changed, and where things are heading — in under two minutes.

---

## How a User Uses the App

1. **Sign in** via Google OAuth on the Welcome page.

2. **Daily Brief** is the main screen. Each coverage the user tracks occupies a swipeable slide. On load, the app checks whether the brief for each coverage is still valid (no new articles since last generation). If stale, it silently regenerates in the background.

3. **Reading a brief**: Each slide shows a bullet-point summary of the last 24 hours for that coverage, ordered by significance. A witty headline streams in first, then bullets animate one by one.

4. **Changes Since**: Below the brief, a diff against the previous generation highlights significant new developments since the user last checked.

5. **Developments Over Time**: The user clicks Generate to produce an AI analysis of how the coverage has evolved historically. It draws on up to 5 evenly-sampled past diffs to give a longitudinal view. Output includes dated development entries, a trajectory assessment, and watchpoints.

6. **View Past Developments**: A right-side drawer lets the user browse every past brief generation for a coverage — timestamp, headline, full bullet content, and diff.

7. **Additional Info**: Scrolling further reveals two auto-loaded sections — personality profiles of people mentioned in the brief (sourced via web search), and explanations of domain-specific concepts.

8. **Explore**: The user can switch to the Explore page to browse the full article feed. They can filter by geography and topic tags, hide miscellaneous articles, and paginate through results. A Synthesize button sends the visible articles to AI for a structured intelligence brief.

9. **Managing Coverages**: From the Profile page, the user can add new coverages (defining a label, geo tags, topic tags, and optional priorities), remove existing ones, and reorder them.

10. **Achievements**: The app awards badges for engagement milestones. Toast notifications appear when a badge is earned.

---

## Features

### Daily Brief
- One brief per coverage, generated from articles published in the last 24 hours
- AI-generated bullet points ordered by significance, each with a bold headline and supporting detail
- Witty one-line headline streams in before the bullets animate
- Cache invalidation: brief regenerates only when new articles have appeared since last generation
- Force-regenerate button for manual refresh
- Article count shown; clicking opens a drawer listing all source articles

### Changes Since
- Diff between the current brief and the previous one
- Highlights new military actions, diplomatic shifts, escalations, or major statements
- Suppressed when there are no significant changes

### Developments Over Time (DOT)
- Manually triggered by the user via a Generate button
- Uses GPT to analyse the current brief alongside up to 5 historically sampled diffs (evenly spaced from first to latest)
- Output: dated bullet entries (what happened + why it matters), a trajectory assessment (drivers, constraints, direction), and concrete watchpoints
- Cached in sessionStorage keyed to the current brief generation; cleared automatically when the brief regenerates
- "View Past Developments" button opens a history drawer immediately on trigger

### Brief History Drawer
- Lists every past brief generation for a coverage, newest first
- Each entry shows the generation timestamp and witty headline
- Expandable to reveal the full brief content and the Changes Since diff for that generation

### Additional Info
- **Personalities Mentioned**: AI-generated profiles of people named in the brief, with Wikipedia avatars. Sourced via GPT with web search. Tap to enlarge photo.
- **Concepts Explained**: Plain-language explanations of domain-specific terms in the brief. Also sourced via GPT with web search.
- Both sections load on scroll, one-shot per session per coverage

### Explore
- Full article feed from the last 24 hours across all ingested sources
- Filter by geography tags and topic tags (OR within group, AND between groups)
- Toggle to hide articles tagged only as Miscellaneous
- Pagination (50 articles per page)
- Synthesize: sends visible articles to GPT for a structured brief (key developments, thematic analysis, signals, narratives, gaps, bottom line)

### Coverage Management
- Users define their own coverages: label, geography tags, topic tags, and optional tracking priorities
- Default coverages seeded on first sign-in: US–Iran–Israel, China–Taiwan, AI Landscape
- Coverages can be added, removed, and reordered

### Achievements
| Key | Title | Requirement |
|---|---|---|
| `coverage_master` | Coverage Master | Created first coverage |
| `synthesize_master` | Synthesize Master | Used Synthesize on Explore |
| `news_scanner` | News Scanner | Opened 5 article links |
| `details_matter` | Details Matter | Opened 15 article links |

- Awarded automatically; toast notification appears when the tab regains focus (handles new-tab article clicks)

### Admin Panel
- Accessible via gear icon (admins only)
- Shows ingestion stats (latest fetch time, article counts)
- Reset My Achievements button: clears achievements and article click counters for the admin user
