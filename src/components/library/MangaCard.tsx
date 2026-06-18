import { useNavigate } from "react-router-dom";
import type { MangaType } from "@/lib/api/types";
import { getThumbnailUrl } from "@/lib/api/client";
import React, { useState } from "react";
import { useLibraryStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils";

interface MangaCardProps {
  manga: MangaType;
  /** When set, overrides the library store's viewMode (use in Browse/Source pages) */
  overrideViewMode?: "COMFORTABLE_GRID" | "COMPACT_GRID" | "LIST";
}

export const MangaCard = React.memo(function MangaCard({ manga, overrideViewMode }: MangaCardProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const storeViewMode = useLibraryStore(s => s.viewMode);
  const viewMode = overrideViewMode ?? storeViewMode;
  const showUnreadBadge = useLibraryStore(s => s.showUnreadBadge);
  const showDownloadBadge = useLibraryStore(s => s.showDownloadBadge);

  if (!manga) return null;

  const thumbnailUrl = getThumbnailUrl(manga.id);

  if (viewMode === "LIST") {
    return (
      <button
        onClick={() => navigate(`/manga/${manga.id}`)}
        className="group flex items-center gap-4 text-left outline-none p-2 rounded-lg hover:bg-secondary/50 transition-colors w-full"
        style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 96px' }}
      >
        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-secondary shadow-sm border border-border">
          <img
            src={thumbnailUrl}
            alt={manga.title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`size-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          />
          {showUnreadBadge && manga.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-sm bg-primary px-1 py-0 text-[9px] font-bold text-primary-foreground shadow">
              {manga.unreadCount}
            </span>
          )}
          {showDownloadBadge && manga.downloadCount > 0 && (
            <span className="absolute -bottom-1 -right-1 flex min-w-4 items-center justify-center rounded-sm bg-blue-500 px-1 py-0 text-[9px] font-bold text-white shadow">
              {manga.downloadCount}
            </span>
          )}
        </div>
        <div className="flex flex-col min-w-0 py-1">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
            {manga.title}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {manga.status} {manga.source?.name ? `• ${manga.source.name}` : ''}
          </p>
        </div>
      </button>
    );
  }

  const isCompact = viewMode === "COMPACT_GRID";

  return (
    <button
      onClick={() => navigate(`/manga/${manga.id}`)}
      className="group flex flex-col text-left outline-none relative w-full"
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 250px' }}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-secondary shadow-sm transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10">
        <img
          src={thumbnailUrl}
          alt={manga.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`size-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        />
        
        {/* Gradient for compact mode text OR hover effect */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity",
          isCompact ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )} />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {showDownloadBadge && manga.downloadCount > 0 && (
            <span className="flex min-w-5 items-center justify-center rounded-sm bg-blue-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow">
              {manga.downloadCount}
            </span>
          )}
        </div>
        {showUnreadBadge && manga.unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex min-w-5 items-center justify-center rounded-sm bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow z-10">
            {manga.unreadCount}
          </span>
        )}

        {/* Compact Mode Title Overlay */}
        {isCompact && (
          <div className="absolute bottom-0 inset-x-0 p-2.5 pt-6 z-10">
            <p className="line-clamp-2 text-xs font-semibold leading-tight text-white drop-shadow-md">
              {manga.title}
            </p>
          </div>
        )}
      </div>

      {/* Comfortable Mode Title */}
      {!isCompact && (
        <div className="pt-2 px-1">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
            {manga.title}
          </p>
        </div>
      )}
    </button>
  );
});
