import { useState, useMemo } from "react";
import { useLibrary, useSources } from "@/hooks/useApi";
import type { MangaType } from "@/lib/api/types";
import { MigrationTargetDialog } from "./MigrationTargetDialog";
import { MangaCard } from "@/components/library/MangaCard";
import { getServerUrl } from "@/lib/api/client";
import { ArrowLeft, BookMarked, Image as ImageIcon } from "lucide-react";

export function MigrateView() {
  const { data: library } = useLibrary();
  const { data: sources } = useSources();
  const mangas = library?.nodes || [];

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [migratingManga, setMigratingManga] = useState<MangaType | null>(null);

  // Group library mangas by source
  const mangasBySource = useMemo(() => {
    const map = new Map<string, MangaType[]>();
    for (const m of mangas) {
      if (!m.sourceId) continue;
      if (!map.has(m.sourceId)) map.set(m.sourceId, []);
      map.get(m.sourceId)!.push(m);
    }
    return map;
  }, [mangas]);

  // View: Source List
  if (!selectedSourceId) {
    const activeSourceIds = Array.from(mangasBySource.keys());
    if (activeSourceIds.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <BookMarked className="size-16 text-muted-foreground mb-6 opacity-50" />
          <p className="text-xl font-bold text-foreground">Your library is empty</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">Add manga to your library from the Sources tab before attempting to migrate them.</p>
        </div>
      );
    }

    return (
      <div className="p-8 overflow-y-auto h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start animate-in fade-in scroll-smooth custom-scrollbar">
        {activeSourceIds.map(id => {
          const source = sources?.find(s => s.id === id);
          const count = mangasBySource.get(id)?.length || 0;
          return (
            <button
              key={id}
              onClick={() => setSelectedSourceId(id)}
              className="flex items-center gap-5 p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-300 text-left group outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="w-14 h-14 rounded-xl bg-secondary border border-border shrink-0 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
                 {source?.iconUrl ? <img src={`${getServerUrl()}${source.iconUrl}`} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors text-base">{source?.name || "Unknown Source"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{source?.lang || "???"}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">{count} title{count !== 1 && 's'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // View: Manga List for selected source
  const sourceMangas = mangasBySource.get(selectedSourceId) || [];
  const source = sources?.find(s => s.id === selectedSourceId);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="border-b border-border p-5 bg-card shrink-0 flex items-center gap-4 z-10 shadow-sm">
        <button onClick={() => setSelectedSourceId(null)} className="p-2.5 -ml-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground leading-tight">{source?.name || "Unknown Source"}</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Select a title to migrate</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
          {sourceMangas.map(m => (
            <div key={m.id} className="relative group cursor-pointer animate-in fade-in zoom-in-95 duration-300" onClick={() => setMigratingManga(m)}>
              {/* Disable pointer events on MangaCard to let the div capture clicks */}
              <div className="pointer-events-none">
                <MangaCard manga={m} />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 rounded-lg transition-colors duration-300 flex items-center justify-center z-20 pointer-events-none">
                 <div className="opacity-0 group-hover:opacity-100 bg-background/95 text-foreground px-4 py-2 rounded-full text-xs font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                   Migrate
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {migratingManga && (
        <MigrationTargetDialog
          manga={migratingManga}
          onClose={() => setMigratingManga(null)}
          onSuccess={() => {
            // It will be removed from library, so it disappears automatically!
            setMigratingManga(null);
          }}
        />
      )}
    </div>
  );
}
