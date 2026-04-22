@AGENTS.md

## Achievements System

### Adding a new achievement — checklist

**1. Define it** in [lib/achievements.ts](lib/achievements.ts) — append to `ACHIEVEMENTS`:
```ts
{
  key:         "snake_case_key",
  title:       "Display Title",
  description: "Past-tense sentence shown on the badge page",
  icon:        "🎯", // single emoji
},
```

**2. Trigger it** — call the server action from the component that detects the event:
```ts
// client component (fire-and-forget)
awardAchievementAction("snake_case_key").then((earned) => {
  if (earned) setNewAchievement(earned);
});

// server-side (e.g. inside a server action)
await awardAchievement(userId, "snake_case_key");
```
`awardAchievementAction` is in [app/actions/achievements.ts](app/actions/achievements.ts).  
`awardAchievement` (raw DB function) is in [lib/achievements.ts](lib/achievements.ts).  
Both are idempotent — safe to call multiple times; only awards once per user.

**3. Show the toast** — in client components, add state + render:
```tsx
const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

// in JSX:
{newAchievement && (
  <AchievementToast achievement={newAchievement} onDismiss={() => setNewAchievement(null)} />
)}
```
`AchievementToast` auto-dismisses after 10 seconds and portals to `document.body`.

### Key files
| File | Role |
|------|------|
| [lib/achievements.ts](lib/achievements.ts) | Achievement list + `awardAchievement()` + DB query helpers |
| [app/actions/achievements.ts](app/actions/achievements.ts) | `awardAchievementAction()` (client-callable server action), `trackArticleClickAction()` |
| [app/components/AchievementToast.tsx](app/components/AchievementToast.tsx) | Toast UI |
| [app/profile/badges/page.tsx](app/profile/badges/page.tsx) | Badge display page (auto-updates via `revalidatePath`) |

### Existing achievements
| Key | Title | Trigger location |
|-----|-------|-----------------|
| `coverage_master` | Coverage Master | [app/actions/coverages.ts](app/actions/coverages.ts) — on first coverage created |
| `synthesize_master` | Synthesize Master | [app/components/SynthesisPanel.tsx](app/components/SynthesisPanel.tsx) — on first synthesis |
| `news_scanner` | News Scanner | [app/components/FeedEntryCard.tsx](app/components/FeedEntryCard.tsx) + [ArticlesDrawer.tsx](app/components/ArticlesDrawer.tsx) — at 5 article clicks |
| `details_matter` | Details Matter | same as above — at 15 article clicks |
| `disc_jockey` | Disc Jockey | [app/components/AudioBriefPlayer.tsx](app/components/AudioBriefPlayer.tsx) — on `audio.onended` |
