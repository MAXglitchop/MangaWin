import { Clock, Play, Trash2 } from "lucide-react";
import { useHistory } from "@/hooks/useApi";
import { getServerUrl } from "@/lib/api/client";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useHistoryStore } from "@/lib/store/historyStore";

function formatTimestamp(tsStr: string) {
  const ts = parseInt(tsStr);
  if (!ts) return "";
  
  // Convert from seconds if necessary
  const ms = ts > 9999999999 ? ts : ts * 1000;
  const date = new Date(ms);
  const now = new Date();
  
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function HistoryPage() {
  const { data: historyItems, isLoading } = useHistory();
  const { clearHistory, removeChapterFromHistory } = useHistoryStore();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-8 py-5 bg-background z-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick up right where you left off.
          </p>
        </div>
        
        {historyItems && historyItems.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive shrink-0"
          >
            <Trash2 className="mr-2 size-4" />
            Clear history
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !historyItems || historyItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card">
              <Clock className="size-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-base font-medium text-foreground">
              No reading history yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Chapters you read will be listed here so you can resume anytime.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4 pb-12">
            {historyItems.map((chapter) => {
              const manga = chapter.manga;
              if (!manga) return null;
              
              const thumbUrl = manga.thumbnailUrl 
                ? `${getServerUrl()}${manga.thumbnailUrl}` 
                : "https://via.placeholder.com/400x600?text=No+Cover";

              const progressPct = chapter.pageCount > 0 
                ? Math.min(100, Math.round(((chapter.lastPageRead + 1) / chapter.pageCount) * 100))
                : 0;

              return (
                <div 
                  key={chapter.id}
                  className="group relative flex overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/50"
                >
                  <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden sm:w-28">
                    <img
                      src={thumbUrl}
                      alt={manga.title}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <Link
                      to={`/reader/${manga.id}/${chapter.sourceOrder}`}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100"
                    >
                      <div className="flex size-10 transform items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-110">
                        <Play className="size-5 ml-1" />
                      </div>
                    </Link>
                  </div>

                  <div className="flex flex-1 flex-col justify-center p-4 sm:p-5 relative">
                    <div className="absolute top-4 right-4 sm:top-5 sm:right-5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeChapterFromHistory(chapter.id);
                        }}
                        className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Remove from history"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 pr-10">
                      <Link to={`/manga/${manga.id}`} className="hover:underline">
                        <h3 className="line-clamp-1 font-semibold text-foreground sm:text-lg">
                          {manga.title}
                        </h3>
                      </Link>
                      <span className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                        {formatTimestamp(chapter.lastReadAt)}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {chapter.name}
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div 
                          className={cn("h-full rounded-full transition-all", chapter.isRead ? "bg-primary" : "bg-primary/70")}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                        {chapter.isRead ? "Read" : `${chapter.lastPageRead + 1} / ${chapter.pageCount}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
