import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSources, useFetchSourceManga } from "@/hooks/useApi";
import { MangaCard } from "@/components/library/MangaCard";
import { PageHeader, EmptyState, Badge } from "@/components/common";
import { cn } from "@/lib/utils";
import { Search, Compass, RefreshCw, Loader2, Network, Puzzle, ArrowLeft, Image as ImageIcon, ArrowRightLeft, Settings } from "lucide-react";
import { ExtensionsPage } from "./Extensions";
import { MigrateView } from "@/components/browse/MigrateView";
import { getServerUrl } from "@/lib/api/client";
import { SourceType, MangaType } from "@/lib/api/types";

import { useBrowseStore, useUIStore } from "@/lib/store/uiStore";

function InfiniteScrollTrigger({ onLoadMore, hasNextPage, isLoading }: { onLoadMore: () => void, hasNextPage: boolean, isLoading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isLoading) {
        onLoadMore();
      }
    }, { rootMargin: '400px' });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasNextPage, isLoading]);

  if (!hasNextPage) return null;

  return (
    <div ref={ref} className="flex justify-center py-8 h-20 w-full shrink-0">
      {isLoading && <Loader2 className="size-8 animate-spin text-[var(--color-accent)]" />}
    </div>
  );
}

function SourceBrowseView({ source, onBack }: { source: SourceType; onBack: () => void }) {
  const { query, setQuery, searchQuery, setSearchQuery, mangas, setMangas, page, setPage, hasNextPage, setHasNextPage } = useBrowseStore();
  const { hideInLibrary } = useUIStore();
  const fetchMangaMutation = useFetchSourceManga();
  const [hasSearched, setHasSearched] = useState(searchQuery !== "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [browseMode, setBrowseMode] = useState<"POPULAR" | "LATEST">("POPULAR");
  
  const fetchManga = async (q: string, targetPage: number = 1, mode: "POPULAR" | "LATEST" = browseMode) => {
    setErrorMsg(null);
    if (targetPage > 1) setIsLoadingMore(true);
    try {
      const res = await fetchMangaMutation.mutateAsync({
        source: source.id,
        query: q || undefined,
        page: targetPage,
        type: q ? "SEARCH" : mode
      });
      
      if (targetPage === 1) {
        setMangas(res.mangas || []);
      } else {
        setMangas([...mangas, ...(res.mangas || [])]);
      }
      setHasNextPage(res.hasNextPage);
      setPage(targetPage);
    } catch (e: any) {
      console.error(e);
      let friendlyError = e.message || "An unknown error occurred";
      if (friendlyError.includes('{"response"')) {
        friendlyError = friendlyError.split('{"response"')[0].trim();
        if (friendlyError.endsWith(':')) friendlyError = friendlyError.slice(0, -1);
      }
      setErrorMsg(friendlyError);
      if (targetPage === 1) setMangas([]);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSearch = () => {
    const q = query.trim();
    setSearchQuery(q);
    setHasSearched(true);
    fetchManga(q, 1);
  };

  const handleModeChange = (mode: "POPULAR" | "LATEST") => {
    if (mode === browseMode && !hasSearched) return;
    setBrowseMode(mode);
    setQuery("");
    setSearchQuery("");
    setHasSearched(false);
    fetchManga("", 1, mode);
  };

  const handleLoadMore = () => {
    if (!fetchMangaMutation.isPending && !isLoadingMore && hasNextPage) {
      fetchManga(searchQuery, page + 1, browseMode);
    }
  };

  useEffect(() => {
    // Only fetch if we don't already have results for this source
    if (mangas.length === 0 && !errorMsg) {
      fetchManga("");
    }
  }, [source.id]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--color-bg-primary)]">
      <div className="border-b border-[var(--color-border)] px-6 pt-4 flex flex-col gap-4 shrink-0 bg-[var(--color-bg-primary)] z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-colors active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-lg shrink-0 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] overflow-hidden flex items-center justify-center">
            {source.iconUrl ? (
               <img src={`${getServerUrl()}${source.iconUrl}`} alt="" className="w-full h-full object-cover" />
            ) : (
               <ImageIcon size={20} className="text-[var(--color-text-muted)]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg text-[var(--color-text-primary)] truncate">{source.name}</h2>
            <p className="text-xs text-[var(--color-text-tertiary)] font-medium uppercase tracking-wider">{source.lang}</p>
          </div>
          
          <div className="relative w-full max-w-sm ml-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={`Search ${source.name}...`}
              className="h-10 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] pl-10 pr-4 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>
        
        <div className="flex gap-6">
          <button
            onClick={() => handleModeChange("POPULAR")}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors",
              browseMode === "POPULAR" && !hasSearched
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]"
            )}
          >
            Popular
          </button>
          <button
            onClick={() => handleModeChange("LATEST")}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors",
              browseMode === "LATEST" && !hasSearched
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]"
            )}
          >
            Latest
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative scroll-smooth custom-scrollbar">
        {fetchMangaMutation.isPending && !isLoadingMore ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-primary)]/50 backdrop-blur-sm z-10">
            <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
          </div>
        ) : null}

        {errorMsg ? (
          <div className="h-full flex flex-col items-center justify-center pt-10">
            <EmptyState
              icon={<Search size={32} className="text-red-500" />}
              title="Error loading manga"
              description={errorMsg}
            />
          </div>
        ) : mangas.length > 0 ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
              {(hideInLibrary ? mangas.filter(m => m && !m.inLibrary) : mangas.filter(Boolean)).map((manga) => (
                <MangaCard key={manga.id} manga={manga as any} overrideViewMode="COMFORTABLE_GRID" />
              ))}
            </div>
            
            <InfiniteScrollTrigger onLoadMore={handleLoadMore} hasNextPage={hasNextPage} isLoading={isLoadingMore} />
          </div>
        ) : !fetchMangaMutation.isPending && (
          <div className="h-full flex flex-col items-center justify-center pt-10">
            <EmptyState
              icon={<Search size={32} />}
              title={hasSearched ? "No results found" : "No popular manga"}
              description={searchQuery ? `No manga found for "${searchQuery}" in ${source.name}.` : "This source did not return any popular manga."}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const { data: sources } = useSources();
  const { showNSFW } = useUIStore();
  const { selectedSourceId, setSelectedSourceId, activeTab, setActiveTab } = useBrowseStore();
  
  const filteredSources = (showNSFW ? sources : sources?.filter(s => s && !s.isNsfw))?.filter(Boolean) || [];
  const selectedSource = sources?.find((s) => s.id === selectedSourceId) || null;

  const queryClient = useQueryClient();
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["sources"] });
  };

  if (selectedSource) {
    return <SourceBrowseView source={selectedSource} onBack={() => setSelectedSourceId(null)} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-border)] px-8 pt-5 shrink-0 bg-[var(--color-bg-primary)]">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Browse
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Discover new titles from your installed sources or manage extensions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/global-search")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95 shadow-sm"
            >
              <Search className="size-4" />
              Global Search
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] active:scale-95 shadow-sm"
            >
              <RefreshCw className="size-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("sources")}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === "sources"
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]"
            )}
          >
            <Network className="size-4" /> Sources
          </button>
          <button
            onClick={() => setActiveTab("extensions")}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === "extensions"
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]"
            )}
          >
            <Puzzle className="size-4" /> Extensions
          </button>
          <button
            onClick={() => setActiveTab("migrate")}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === "migrate"
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]"
            )}
          >
            <ArrowRightLeft className="size-4" /> Migrate
          </button>
        </div>
      </div>

      {activeTab === "extensions" ? (
        <div className="flex-1 overflow-hidden bg-[var(--color-bg-primary)]">
          <ExtensionsPage hideHeader />
        </div>
      ) : activeTab === "migrate" ? (
        <div className="flex-1 overflow-hidden bg-background">
          <MigrateView />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg-primary)] scroll-smooth custom-scrollbar">
          {(!filteredSources || filteredSources.length === 0) ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon={<Network size={32} />}
                title="No Sources Installed"
                description="Switch to the Extensions tab to install some sources!"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent-light)] hover:shadow-md transition-all duration-200 group"
                >
                  <button
                    onClick={() => setSelectedSourceId(source.id)}
                    className="flex flex-1 items-center gap-4 text-left min-w-0 pr-2 outline-none"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      {source.iconUrl ? (
                        <img src={`${getServerUrl()}${source.iconUrl}`} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-[var(--color-text-muted)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">{source.name}</h3>
                      <div className="flex items-center gap-2 mt-1 min-w-0">
                        <span className="text-xs uppercase text-[var(--color-text-tertiary)] font-medium tracking-wider truncate max-w-[120px]">{source.lang}</span>
                        {source.isNsfw && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold tracking-wider shrink-0">18+</span>}
                      </div>
                    </div>
                  </button>
                  
                  <div className="shrink-0 flex items-center justify-center pl-2 border-l border-[var(--color-border)]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/extensions/${source.id}`);
                      }}
                      title="Source Settings"
                      className="p-2 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] transition-colors outline-none"
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
