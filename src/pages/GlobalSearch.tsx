import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSources } from "@/hooks/useApi";
import { useBrowseStore, useUIStore } from "@/lib/store/uiStore";
import { GlobalSourceResult } from "@/components/browse/GlobalSourceResult";
import { ArrowLeft, Search, Loader2 } from "lucide-react";

export function GlobalSearch() {
  const navigate = useNavigate();
  const { data: sources, isLoading } = useSources();
  const { showNSFW } = useUIStore();
  const { setSelectedSourceId, setQuery, setSearchQuery, setActiveTab } = useBrowseStore();
  
  const filteredSources = showNSFW ? sources : sources?.filter(s => !s.isNsfw);
  
  const [localQuery, setLocalQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofocus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = () => {
    const q = localQuery.trim();
    if (q) {
      setActiveQuery(q);
    }
  };

  const handleSeeAll = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    setQuery(activeQuery);
    setSearchQuery(activeQuery);
    setActiveTab("sources");
    navigate("/browse");
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header with Search */}
      <div className="border-b border-border bg-card px-4 py-3 shrink-0 flex items-center gap-3 z-10 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 relative flex items-center">
          <Search className="absolute left-3 text-muted-foreground size-5" />
          <input
            ref={inputRef}
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search globally..."
            className="w-full h-12 bg-secondary border border-border rounded-xl pl-11 pr-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto p-6 bg-background scroll-smooth custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : !activeQuery ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
             <Search className="size-12 mb-4 opacity-50" />
             <p className="font-medium text-lg text-foreground">Global Search</p>
             <p className="text-sm mt-1 max-w-sm text-center">Search across all installed sources simultaneously. Type a query and press enter.</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col gap-2 pb-10">
             {filteredSources?.map(source => (
                <GlobalSourceResult 
                  key={source.id} 
                  source={source} 
                  query={activeQuery} 
                  onSeeAll={() => handleSeeAll(source.id)} 
                />
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
