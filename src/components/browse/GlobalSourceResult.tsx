import { useEffect, useState } from "react";
import { useFetchSourceManga } from "@/hooks/useApi";
import { MangaCard } from "@/components/library/MangaCard";
import { SourceType } from "@/lib/api/types";
import { ChevronRight, Loader2, SearchX } from "lucide-react";
import { getServerUrl } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/uiStore";

interface GlobalSourceResultProps {
  source: SourceType;
  query: string;
  onSeeAll: () => void;
}

export function GlobalSourceResult({ source, query, onSeeAll }: GlobalSourceResultProps) {
  const fetchMangaMutation = useFetchSourceManga();
  const [results, setResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { hideInLibrary } = useUIStore();

  useEffect(() => {
    if (!query) return;

    let isMounted = true;
    setErrorMsg(null);
    setResults([]);

    fetchMangaMutation.mutateAsync({
      source: source.id,
      query: query,
      page: 1,
      type: "SEARCH"
    }).then(res => {
      if (isMounted) setResults(res.mangas?.slice(0, 10) || []);
    }).catch(e => {
      let friendlyError = e.message || "Failed to fetch results";
      if (friendlyError.includes('{"response"')) {
        friendlyError = friendlyError.split('{"response"')[0].trim();
        if (friendlyError.endsWith(':')) friendlyError = friendlyError.slice(0, -1);
      }
      if (isMounted) setErrorMsg(friendlyError);
    });

    return () => { isMounted = false; };
  }, [query, source.id]);

  if (!query) return null;
  
  const filteredResults = hideInLibrary ? results.filter(m => m && !m.inLibrary) : results.filter(Boolean);

  return (
    <div className="flex flex-col mb-6 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button 
        onClick={onSeeAll}
        className="flex items-center justify-between p-4 border-b border-border bg-secondary/30 hover:bg-secondary/70 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
            {source.iconUrl ? (
               <img src={`${getServerUrl()}${source.iconUrl}`} alt="" className="w-full h-full object-cover" />
            ) : (
               <div className="w-4 h-4 bg-muted-foreground rounded-sm" />
            )}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{source.name}</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{source.lang}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
          See all
          <ChevronRight className="size-4" />
        </div>
      </button>

      {/* Results */}
      <div className="p-4 relative min-h-[220px]">
        {fetchMangaMutation.isPending ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
             <SearchX className="size-6 mb-2 text-destructive/80" />
             <p className="text-xs font-medium text-destructive">{errorMsg}</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="flex overflow-x-auto gap-4 custom-scrollbar pb-2 pt-1 px-1">
            {filteredResults.map((manga) => (
              <div key={manga.id} className="w-[120px] shrink-0">
                <MangaCard manga={manga as any} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
             <p className="text-sm">No results found</p>
          </div>
        )}
      </div>
    </div>
  );
}
