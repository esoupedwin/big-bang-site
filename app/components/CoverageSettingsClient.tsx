"use client";

import { useState } from "react";
import Link from "next/link";
import { addCoverageAction, updateCoverageAction, removeCoverageAction } from "@/app/actions/coverages";
import type { UserCoverage } from "@/lib/coverages";
import type { Achievement } from "@/lib/achievements";
import { AchievementToast } from "./AchievementToast";

type Props = {
  coverages: UserCoverage[];
  geoTags:   string[];
  topicTags: string[];
};

export function CoverageSettingsClient({ coverages, geoTags, topicTags }: Props) {
  const [showForm,        setShowForm]        = useState(false);
  const [expandedId,      setExpandedId]      = useState<string | null>(null);
  const [pending,         setPending]         = useState(false);
  const [labelValue,      setLabelValue]      = useState("");
  const [priorities,      setPriorities]      = useState("");
  const [hasGenerated,    setHasGenerated]    = useState(false);
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [newAchievement,  setNewAchievement]  = useState<Achievement | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState(false);

  async function handleAdd(formData: FormData) {
    setPending(true);
    const earned = await addCoverageAction(formData);
    setPending(false);
    setShowForm(false);
    setLabelValue("");
    setPriorities("");
    setHasGenerated(false);
    if (earned) setNewAchievement(earned);
  }

  async function handleLabelBlur() {
    if (hasGenerated || !labelValue.trim()) return;
    setHasGenerated(true);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/coverage/suggest-priorities", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ label: labelValue.trim() }),
      });
      if (!res.ok || !res.body) return;
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setPriorities((prev) => prev + decoder.decode(value));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          onDismiss={() => setNewAchievement(null)}
        />
      )}
      {/* Coverage list */}
      <div className="space-y-2">
        {coverages.length === 0 && (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            No coverages configured. Add one below.
          </p>
        )}
        {coverages.map((c) =>
          expandedId === c.id ? (
            <CoverageEditRow
              key={c.id}
              coverage={c}
              geoTags={geoTags}
              topicTags={topicTags}
              onCancel={() => setExpandedId(null)}
            />
          ) : (
            <div
              key={c.id}
              onClick={() => { setExpandedId(c.id); setShowForm(false); }}
              className="flex items-start justify-between gap-3 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{c.label}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {c.geo_tags.length === 0 ? (
                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 rounded-full">
                      All Countries
                    </span>
                  ) : (
                    c.geo_tags.map((t) => (
                      <span key={t} className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))
                  )}
                  {c.topic_tags.map((t) => (
                    <span key={t} className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Jump to Daily Brief */}
                <Link
                  href={`/daily-brief?coverage=${c.id}`}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="View on Daily Brief"
                  className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors mt-0.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </Link>
                {/* Edit */}
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors mt-0.5"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                {/* Delete */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                  className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors text-sm leading-none mt-0.5"
                  aria-label="Remove coverage"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Add button */}
      {!showForm && !expandedId && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
        >
          <span className="text-base leading-none">+</span> Add coverage
        </button>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (() => {
        const target = coverages.find((c) => c.id === confirmDeleteId);
        return (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setConfirmDeleteId(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Remove coverage?
                  </h3>
                  {target && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-snug">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{target.label}</span>
                      {" "}will be permanently removed. This cannot be undone.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={async () => {
                      setDeleting(true);
                      await removeCoverageAction(confirmDeleteId);
                      setDeleting(false);
                      setConfirmDeleteId(null);
                    }}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                  >
                    {deleting ? "Removing…" : "Yes, remove"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Add form */}
      {showForm && (
        <form action={handleAdd} className="space-y-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">New Coverage</p>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Coverage focus / title <span className="text-red-400">*</span>
            </label>
            <input
              name="label"
              required
              placeholder="e.g. Russia–Ukraine Conflict"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleLabelBlur}
              className="w-full text-sm px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Geography <span className="text-zinc-400 dark:text-zinc-600 font-normal">(leave empty for All Countries)</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {geoTags.map((tag) => (
                <TagCheckbox key={tag} name="geoTags" value={tag} color="blue" />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Topics <span className="text-red-400">*</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topicTags.map((tag) => (
                <TagCheckbox key={tag} name="topicTags" value={tag} color="zinc" />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Topic-specific priorities{" "}
              <span className="text-zinc-400 dark:text-zinc-600 font-normal">(optional)</span>
              {isGenerating && (
                <span className="ml-2 text-amber-500 dark:text-amber-400 font-normal">Generating…</span>
              )}
            </label>
            <textarea
              name="priorities"
              rows={4}
              placeholder={isGenerating ? "" : "- Prioritise X over Y\n- Flag any developments related to Z\n- Distinguish between A and B"}
              value={priorities}
              onChange={(e) => setPriorities(e.target.value)}
              disabled={isGenerating}
              className="w-full text-sm px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 resize-y disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
              Generated from your coverage focus. You can edit before saving.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 text-sm font-medium rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Inline edit form for an existing coverage ────────────────────────────────

type EditRowProps = {
  coverage:  UserCoverage;
  geoTags:   string[];
  topicTags: string[];
  onCancel:  () => void;
};

function CoverageEditRow({ coverage, geoTags, topicTags, onCancel }: EditRowProps) {
  const [pending,        setPending]        = useState(false);
  const [labelValue,     setLabelValue]     = useState(coverage.label);
  const [prioritiesValue, setPrioritiesValue] = useState(coverage.priorities ?? "");

  async function handleUpdate(formData: FormData) {
    setPending(true);
    await updateCoverageAction(coverage.id, formData);
    setPending(false);
    onCancel();
  }

  return (
    <form
      action={handleUpdate}
      className="space-y-4 p-4 rounded-lg border border-zinc-400 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900"
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-white">Edit Coverage</p>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
          Coverage focus / title <span className="text-red-400">*</span>
        </label>
        <input
          name="label"
          required
          value={labelValue}
          onChange={(e) => setLabelValue(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
        />
      </div>

      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          Geography <span className="text-zinc-400 dark:text-zinc-600 font-normal">(leave empty for All Countries)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {geoTags.map((tag) => (
            <TagCheckbox
              key={tag}
              name="geoTags"
              value={tag}
              color="blue"
              initialChecked={coverage.geo_tags.includes(tag)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          Topics <span className="text-red-400">*</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {topicTags.map((tag) => (
            <TagCheckbox
              key={tag}
              name="topicTags"
              value={tag}
              color="zinc"
              initialChecked={coverage.topic_tags.includes(tag)}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
          Topic-specific priorities{" "}
          <span className="text-zinc-400 dark:text-zinc-600 font-normal">(optional)</span>
        </label>
        <textarea
          name="priorities"
          rows={4}
          value={prioritiesValue}
          onChange={(e) => setPrioritiesValue(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 resize-y"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm font-medium rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Shared tag toggle checkbox ───────────────────────────────────────────────

function TagCheckbox({
  name,
  value,
  color,
  initialChecked = false,
}: {
  name:           string;
  value:          string;
  color:          "blue" | "zinc";
  initialChecked?: boolean;
}) {
  const [checked, setChecked] = useState(initialChecked);
  const activeClass = color === "blue"
    ? "bg-blue-600 border-blue-600 text-white"
    : "bg-zinc-700 border-zinc-700 text-white dark:bg-zinc-300 dark:border-zinc-300 dark:text-zinc-900";
  const inactiveClass = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400";

  return (
    <label className={`cursor-pointer text-xs px-2.5 py-1 rounded-full border transition-colors ${checked ? activeClass : inactiveClass}`}>
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="sr-only"
      />
      {value}
    </label>
  );
}
