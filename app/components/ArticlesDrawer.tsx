"use client";

export type ArticleRef = {
  title:       string | null;
  link:        string | null;
  feedName:    string | null;
  publishedAt: string | null;
};

type Props = {
  isOpen:   boolean;
  onClose:  () => void;
  articles: ArticleRef[];
};

export function ArticlesDrawer({ isOpen, onClose, articles }: Props) {
  return (
    <>
      {/* Backdrop — click outside to close */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 sm:w-96 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {articles.length} source article{articles.length !== 1 ? "s" : ""}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable article list */}
        <div className="flex-1 overflow-y-auto">
          {articles.map((article, i) => (
            <div
              key={i}
              className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
            >
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">
                {article.feedName ?? "Unknown source"}
                {article.publishedAt && (
                  <span>
                    {" · "}
                    {new Date(article.publishedAt).toLocaleString("en-GB", {
                      day: "2-digit", month: "short",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                )}
              </p>
              {article.link ? (
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug"
                >
                  {article.title ?? "Untitled"}
                </a>
              ) : (
                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-snug">
                  {article.title ?? "Untitled"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
