import { useState, useEffect } from "react";
import { useSources, useFetchSourceManga } from "@/hooks/useApi";
import { useMigration } from "@/hooks/useMigration";
import type { MangaType } from "@/lib/api/types";
import { X, Search, Loader2, ArrowRight } from "lucide-react";
import { getServerUrl, getThumbnailUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function MigrationTargetDialog({ 
  manga, 
  onClose,
  onSuccess
}: { 
  manga: MangaType | null; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: sources } = useSources();
  const fetchMangaMutation = useFetchSourceManga();
  const { migrate, isMigrating, progress } = useMigration();

  const [targetSourceId, setTargetSourceId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<MangaType[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (targetSourceId && manga) {
      setHasSearched(false);
      fetchMangaMutation.mutateAsync({
        source: targetSourceId,
        query: manga.title,
        page: 1,
        type: "SEARCH"
      }).then((res) => {
        setSearchResults(res.mangas || []);
        setHasSearched(true);
      }).catch(console.error);
    }
  }, [targetSourceId, manga]);

  if (!manga) return null;

  const handleMigrate = async (targetManga: MangaType) => {
    try {
      await migrate(manga, targetManga);
      onSuccess();
      onClose();
    } catch (e) {
      alert("Migration failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={!isMigrating ? onClose : undefined} />
      
      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-background shadow-2xl h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 bg-secondary/20">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Migrate <ArrowRight className="size-4 text-muted-foreground" /> {manga.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {targetSourceId ? "Select matching manga" : "Select target source"}
            </p>
          </div>
          {!isMigrating && (
            <button onClick={onClose} className="rounded-md p-2 hover:bg-secondary text-muted-foreground transition-colors outline-none">
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {isMigrating ? (
            <div className="flex h-full flex-col items-center justify-center space-y-6">
              <Loader2 className="size-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">Migrating...</h3>
                <p className="mt-2 text-sm text-muted-foreground">Copying chapters and bookmarks to new source</p>
              </div>
              <div className="w-64 h-2.5 rounded-full bg-secondary overflow-hidden border border-border">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground font-mono">{progress}%</p>
            </div>
          ) : !targetSourceId ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources?.filter(s => s.id !== manga.sourceId).map(source => (
                <button
                  key={source.id}
                  onClick={() => setTargetSourceId(source.id)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="w-10 h-10 rounded-md shrink-0 bg-secondary flex items-center justify-center overflow-hidden border border-border">
                    {source.iconUrl ? <img src={`${getServerUrl()}${source.iconUrl}`} className="w-full h-full object-cover" /> : <div className="text-muted-foreground text-xs font-bold uppercase">{source.lang}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{source.name}</p>
                    <p className="text-xs text-muted-foreground uppercase mt-0.5 tracking-wider">{source.lang}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : fetchMangaMutation.isPending && !hasSearched ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Search className="size-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No matches found</p>
              <p className="text-sm text-muted-foreground">Try a different source or edit the title.</p>
              <button onClick={() => setTargetSourceId(null)} className="mt-6 text-sm font-medium text-primary hover:underline outline-none">
                Go back to sources
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <button onClick={() => setTargetSourceId(null)} className="mb-6 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors outline-none">
                <ArrowRight className="size-3.5 rotate-180" /> Back to sources
              </button>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {searchResults.map(res => (
                  <button 
                    key={res.id} 
                    onClick={() => handleMigrate(res)}
                    className="flex flex-col text-left group outline-none"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-secondary shadow-sm group-hover:border-primary group-hover:shadow-md transition-all duration-300">
                      <img src={getThumbnailUrl(res.id)} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 bg-background/95 text-foreground px-4 py-2 rounded-full text-xs font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          Migrate
                        </div>
                      </div>
                    </div>
                    <p className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">{res.title}</p>
                    {res.author && <p className="mt-0.5 truncate text-xs text-muted-foreground">{res.author}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
