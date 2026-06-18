import { useDownloadStatus, useDownloadedChapters, useDeleteDownloadedChapter, useClearDownloader } from "@/hooks/useApi";
import { getThumbnailUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Download, Trash2, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

export function DownloadsPage() {
  const navigate = useNavigate();
  const { data: downloadStatus, isLoading } = useDownloadStatus();
  const { data: downloadedChapters, isLoading: isDownloadedLoading } = useDownloadedChapters();
  const deleteChapter = useDeleteDownloadedChapter();
  const clearDownloader = useClearDownloader();

  const queue = downloadStatus?.queue || [];
  const downloadedList = downloadedChapters || [];
  const isAllLoading = isLoading || isDownloadedLoading;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Downloads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage chapters saved for offline reading.
          </p>
        </div>
        <button 
          onClick={() => clearDownloader.mutate()}
          disabled={clearDownloader.isPending || queue.length === 0}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clearDownloader.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Clear queue
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isAllLoading ? (
          <div className="flex h-full flex-col items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : queue.length === 0 && downloadedList.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card">
              <Download className="size-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-base font-medium text-foreground">
              No downloads yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Chapters you download for offline reading will appear here.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-8">
            {/* ACTIVE DOWNLOADS */}
            {queue.length > 0 && (
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Downloads
                </h2>
                <div className="space-y-2">
                  {queue.map((item, i) => {
                    const stateIcon =
                      item.state === "DOWNLOADING" ? (
                        <Loader2 size={16} className="animate-spin text-primary" />
                      ) : item.state === "FINISHED" ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : item.state === "ERROR" ? (
                        <XCircle size={16} className="text-destructive" />
                      ) : (
                        <Clock size={16} className="text-muted-foreground" />
                      );

                    return (
                      <div
                        key={`queue-${item.chapter.id}-${i}`}
                        className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-secondary/40"
                      >
                        {/* Cover */}
                        <div className="w-10 h-14 rounded-md overflow-hidden shrink-0 bg-secondary">
                          <img
                            src={getThumbnailUrl(item.manga.id)}
                            alt={item.manga.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.manga.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.chapter.name}
                          </p>

                          {/* Progress bar */}
                          {item.state === "DOWNLOADING" && (
                            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${item.progress * 100}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* State */}
                        <div className="flex items-center gap-2 shrink-0">
                          {stateIcon}
                          <span className="text-xs text-muted-foreground capitalize">
                            {item.state.toLowerCase()}
                          </span>
                          {item.state === "DOWNLOADING" && (
                            <span className="text-xs font-mono text-primary">
                              {Math.round(item.progress * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DOWNLOADED CHAPTERS */}
            {downloadedList.length > 0 && (
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Downloaded Chapters
                </h2>
                <div className="space-y-2">
                  {downloadedList.map((chapter) => (
                    <button
                      key={`downloaded-${chapter.id}`}
                      onClick={() => chapter.manga && navigate(`/reader/${chapter.manga.id}/${chapter.sourceOrder}`)}
                      className="w-full flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-secondary/40 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {/* Cover */}
                      <div className="w-10 h-14 rounded-md overflow-hidden shrink-0 bg-secondary">
                        <img
                          src={getThumbnailUrl(chapter.manga?.id || 0)}
                          alt={chapter.manga?.title || "Unknown"}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {chapter.manga?.title || "Unknown Manga"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {chapter.name}
                        </p>
                      </div>

                      {/* State */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                          <CheckCircle size={14} /> Downloaded
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChapter.mutate(chapter.id);
                          }}
                          className="p-2 -mr-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                          title="Delete chapter"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
