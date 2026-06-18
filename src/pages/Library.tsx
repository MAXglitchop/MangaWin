import { useState, useMemo } from "react";
import { useLibrary } from "@/hooks/useApi";
import { useLibraryStore } from "@/lib/store/uiStore";
import { MangaCard } from "@/components/library/MangaCard";
import { LibraryFilterSheet } from "@/components/library/LibraryFilterSheet";
import { cn } from "@/lib/utils";
import { RefreshCw, SlidersHorizontal, BookMarked } from "lucide-react";

export function LibraryPage() {
  const { data: library, isLoading, refetch, isRefetching } = useLibrary();
  const store = useLibraryStore();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const mangas = library?.nodes || [];

  // Determine if any filters are active (for highlighting the filter button)
  const hasActiveFilters = 
    store.filterUnread !== "IGNORE" ||
    store.filterDownloaded !== "IGNORE" ||
    store.filterStarted !== "IGNORE" ||
    store.filterBookmarked !== "IGNORE" ||
    store.filterStatus.length > 0;

  // Filter and Sort Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...mangas];
    
    // Titlebar Search
    if (store.searchQuery.trim()) {
      const q = store.searchQuery.toLowerCase();
      result = result.filter(m => m.title.toLowerCase().includes(q));
    }

    // 1. FILTERS
    if (store.filterUnread === "INCLUDE") result = result.filter(m => m.unreadCount > 0);
    if (store.filterUnread === "EXCLUDE") result = result.filter(m => m.unreadCount === 0);

    if (store.filterDownloaded === "INCLUDE") result = result.filter(m => m.downloadCount > 0);
    if (store.filterDownloaded === "EXCLUDE") result = result.filter(m => m.downloadCount === 0);

    if (store.filterStarted === "INCLUDE") result = result.filter(m => m.lastReadChapter !== null && m.unreadCount > 0);
    if (store.filterStarted === "EXCLUDE") result = result.filter(m => m.lastReadChapter === null);

    if (store.filterStatus.length > 0) {
      const activeStatuses = store.filterStatus.map(s => s.toLowerCase());
      result = result.filter(m => activeStatuses.includes((m.status || "").toLowerCase()));
    }

    // 2. SORTING
    result.sort((a, b) => {
      let comparison = 0;
      switch (store.sortField) {
        case "ALPHABETICAL":
          comparison = a.title.localeCompare(b.title);
          break;
        case "UNREAD":
          comparison = a.unreadCount - b.unreadCount;
          break;
        case "LAST_READ":
          const dateA = a.lastReadChapter?.lastReadAt ? new Date(a.lastReadChapter.lastReadAt).getTime() : 0;
          const dateB = b.lastReadChapter?.lastReadAt ? new Date(b.lastReadChapter.lastReadAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case "DATE_FETCHED":
          comparison = new Date(a.lastFetchedAt).getTime() - new Date(b.lastFetchedAt).getTime();
          break;
        // Basic fallback for unsupported sorts
        default:
          comparison = a.title.localeCompare(b.title);
      }
      return store.sortDirection === "ASC" ? comparison : -comparison;
    });

    return result;
  }, [mangas, store]);

  const unreadTotal = mangas.reduce((acc, m) => acc + m.unreadCount, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Library
          </h1>
          {store.showItemCount && (
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredAndSorted.length} titles • {unreadTotal} unread chapters
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFilterSheetOpen(true)}
            className={cn(
              "flex size-9 items-center justify-center rounded-md border transition-colors",
              hasActiveFilters 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="size-4" />
          </button>
          <button 
            onClick={() => refetch()}
            className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <RefreshCw className={cn("size-4", isRefetching && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 scroll-smooth custom-scrollbar">
        {isLoading ? (
          <div className={cn(
            "grid gap-6",
            store.viewMode === "LIST" 
              ? "grid-cols-1" 
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          )}>
             {Array.from({ length: 12 }).map((_, i) => (
               <div key={i} className="w-full aspect-[2/3] animate-pulse rounded-lg bg-secondary" />
             ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card">
              <BookMarked className="size-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-base font-medium text-foreground">
              Your library is empty or no matches found
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Try adjusting your filters or adding titles from Browse.
            </p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-6",
            store.viewMode === "LIST" 
              ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-4" 
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          )}>
            {filteredAndSorted.map((manga) => (
               <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        )}
      </div>

      <LibraryFilterSheet 
        isOpen={isFilterSheetOpen} 
        onClose={() => setIsFilterSheetOpen(false)} 
      />
    </div>
  );
}
