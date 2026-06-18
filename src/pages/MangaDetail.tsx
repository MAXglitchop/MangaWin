import { useParams, useNavigate } from "react-router-dom";
import { useManga, useChapters, useUpdateChapter, useUpdateManga, useFetchChapters, useEnqueueDownload } from "@/hooks/useApi";
import { getThumbnailUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Play,
  Heart,
  Download,
  Globe,
  Eye,
  EyeOff,
  CircleDot,
  Star,
  RefreshCw,
  Loader2,
  Copy,
  BookOpen,
} from "lucide-react";
import { useState, useEffect } from "react";

import { useUIStore } from "@/lib/store/uiStore";

const statusColor: Record<string, string> = {
  ONGOING: "text-emerald-400",
  COMPLETED: "text-sky-400",
  HIATUS: "text-amber-400",
  UNKNOWN: "text-muted-foreground",
};

export function MangaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mangaId = id ? parseInt(id) : undefined;

  const { thumbnailBackground, dynamicTheme } = useUIStore();

  const { data: manga, isLoading: mangaLoading } = useManga(mangaId);
  const { data: chapters, isLoading: chaptersLoading } = useChapters(mangaId);
  const updateChapter = useUpdateChapter();
  const updateManga = useUpdateManga();
  const fetchChapters = useFetchChapters();
  const enqueueDownload = useEnqueueDownload();

  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [dominantColor, setDominantColor] = useState<string | null>(null);

  const thumbnailUrl = manga ? getThumbnailUrl(manga.id) : "";

  // Extract average color for dynamic theme
  useEffect(() => {
    if (!dynamicTheme || !thumbnailUrl) {
      setDominantColor(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = thumbnailUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        // Use a subtle 25% tint of the dominant color over the background
        setDominantColor(`rgba(${r}, ${g}, ${b}, 0.25)`);
      } catch (e) {
        console.error("Failed to extract color", e);
      }
    };
  }, [thumbnailUrl, dynamicTheme]);

  // Automatically fetch chapters if the manga is loaded but has no chapters (e.g. newly added from source)
  useEffect(() => {
    if (manga && !chaptersLoading && chapters?.nodes.length === 0 && !fetchChapters.isPending) {
      fetchChapters.mutate(manga.id);
    }
  }, [manga?.id, chaptersLoading, chapters?.nodes.length]);

  if (mangaLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-8">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card">
          <BookOpen className="size-7 text-muted-foreground" />
        </div>
        <p className="mt-4 text-base font-medium text-foreground">Manga Not Found</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This manga doesn't exist or the server is unavailable.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="size-4" /> Go Back
        </button>
      </div>
    );
  }

  const chapterList = chapters?.nodes || [];
  const sortedChapters = [...chapterList].sort((a, b) =>
    order === "desc" ? b.sourceOrder - a.sourceOrder : a.sourceOrder - b.sourceOrder
  );

  const nextUnread = [...chapterList]
    .sort((a, b) => a.sourceOrder - b.sourceOrder)
    .find((c) => !c.isRead);

  const handleToggleLibrary = () => {
    updateManga.mutate({ id: manga.id, inLibrary: !manga.inLibrary });
  };

  const handleReadChapter = (chapterIndex: number) => {
    navigate(`/reader/${manga.id}/${chapterIndex}`);
  };

  return (
    <div 
      className="relative flex h-full flex-col overflow-y-auto"
      style={dynamicTheme && dominantColor ? { backgroundColor: dominantColor } : undefined}
    >
      {thumbnailBackground && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <img src={thumbnailUrl} className="w-full h-full object-cover opacity-30 blur-3xl saturate-150 transform scale-110" />
          <div className="absolute inset-0 bg-background/70 dark:bg-background/80" />
        </div>
      )}

      {/* Banner */}
      <div className="relative h-64 shrink-0 overflow-hidden z-10">
        <img
          src={thumbnailUrl}
          alt=""
          aria-hidden="true"
          className="size-full scale-110 object-cover object-center blur-2xl opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-6 top-5 flex items-center gap-2 rounded-md bg-black/40 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </div>

      <div className="relative z-10 -mt-40 flex-1 px-8 pb-10">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Cover */}
          <div className="shrink-0">
            <img
              src={thumbnailUrl}
              alt={manga.title}
              className="h-72 w-48 rounded-xl border border-border object-cover shadow-2xl shadow-black/50"
            />
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col pt-2 md:pt-24">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground">
                {manga.title}
              </h1>
              <button 
                onClick={() => navigator.clipboard.writeText(manga.title)}
                className="mt-1.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                title="Copy Title"
              >
                <Copy className="size-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
              {manga.author && (
                <>
                  <span className="text-muted-foreground">Author</span>
                  <span className="font-medium text-foreground">{manga.author}</span>
                </>
              )}
              {manga.artist && manga.artist !== manga.author && (
                <>
                  <span className="text-muted-foreground">Artist</span>
                  <span className="font-medium text-foreground">{manga.artist}</span>
                </>
              )}
              {manga.status && (
                <>
                  <span className="text-muted-foreground">Status</span>
                  <span className={cn("font-medium capitalize", statusColor[manga.status] || "text-foreground")}>
                    {manga.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                </>
              )}
              {manga.source ? (
                <>
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-medium text-foreground">
                    {manga.source.name} ({manga.source.lang.toUpperCase()})
                  </span>
                </>
              ) : manga.sourceId ? (
                <>
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-medium text-foreground">{manga.sourceId}</span>
                </>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {manga.genre?.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (nextUnread) {
                    handleReadChapter(nextUnread.sourceOrder);
                  } else if (chapterList.length > 0) {
                    handleReadChapter(chapterList[chapterList.length - 1].sourceOrder);
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Play className="size-4" />
                {nextUnread
                  ? `Read Ch. ${nextUnread.sourceOrder}`
                  : chapterList.length > 0
                  ? "Read Again"
                  : "No Chapters"}
              </button>
              <button
                onClick={handleToggleLibrary}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
                  manga.inLibrary
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-foreground hover:bg-secondary"
                )}
              >
                <Heart className={cn("size-4", manga.inLibrary && "fill-current")} />
                {manga.inLibrary ? "In Library" : "Add to Library"}
              </button>
              <button
                onClick={() => fetchChapters.mutate(manga.id)}
                disabled={fetchChapters.isPending}
                className="flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <RefreshCw className={cn("size-4", fetchChapters.isPending && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        {manga.description && (
          <p className="mt-8 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {manga.description}
          </p>
        )}

        {/* Chapters */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {chapterList.length} Chapters
            </h2>
            <button
              onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {order === "desc" ? "Newest first" : "Oldest first"}
            </button>
          </div>

          {chaptersLoading || fetchChapters.isPending ? (
            <div className="mt-4 flex flex-col items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">Fetching chapters...</p>
            </div>
          ) : chapterList.length === 0 ? (
            <div className="mt-4 text-center py-8">
              <p className="text-sm text-muted-foreground">No chapters available</p>
              <button
                onClick={() => fetchChapters.mutate(manga.id)}
                className="mt-2 flex items-center gap-2 mx-auto rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <RefreshCw className="size-3.5" /> Fetch Chapters
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              {sortedChapters.map((chapter, i) => (
                <button
                  key={chapter.id}
                  onClick={() => handleReadChapter(chapter.sourceOrder)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary",
                    i !== sortedChapters.length - 1 && "border-b border-border",
                    chapter.isRead && "bg-background"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                        chapter.isRead
                          ? "bg-secondary text-muted-foreground"
                          : "bg-accent text-accent-foreground"
                      )}
                    >
                      {chapter.sourceOrder}
                    </span>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          chapter.isRead ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {chapter.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {chapter.uploadDate && chapter.uploadDate !== "0"
                          ? new Date(parseInt(chapter.uploadDate)).toLocaleDateString()
                          : ""}
                        {chapter.pageCount > 0 && ` · ${chapter.pageCount} pages`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {chapter.isDownloaded ? (
                      <Download className="size-4 text-primary" />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          enqueueDownload.mutate(chapter.id);
                        }}
                        className="p-1 hover:bg-secondary rounded-md"
                        title="Download Chapter"
                      >
                        <Download className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateChapter.mutate({ id: chapter.id, isRead: !chapter.isRead });
                      }}
                      className="p-1"
                    >
                      {chapter.isRead ? (
                        <Eye className="size-4 text-primary" />
                      ) : (
                        <EyeOff className="size-4 text-muted-foreground/40" />
                      )}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
