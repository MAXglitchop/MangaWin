import { useState } from "react";
import { getClient } from "@/lib/api/client";
import { GET_CHAPTERS, UPDATE_MANGA, UPDATE_CHAPTER, FETCH_CHAPTERS } from "@/lib/api/queries";
import { useQueryClient } from "@tanstack/react-query";
import type { MangaType, ChapterType } from "@/lib/api/types";

export function useMigration() {
  const queryClient = useQueryClient();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);

  const migrate = async (oldManga: MangaType, newManga: MangaType) => {
    setIsMigrating(true);
    setProgress(0);

    try {
      // 1. Add new manga to library
      await getClient().request(UPDATE_MANGA, { id: newManga.id, inLibrary: true });
      setProgress(10);

      // 2. Fetch/force-update chapters for the new manga so we have them locally
      try {
        await getClient().request(FETCH_CHAPTERS, { mangaId: newManga.id });
      } catch (e) {
        // Might fail if already fetching or source is slow, but we can proceed with what we have
      }
      setProgress(30);

      // 3. Get chapters for both mangas
      const oldChData = await getClient().request<{ chapters: { nodes: ChapterType[] } }>(GET_CHAPTERS, { mangaId: oldManga.id });
      const newChData = await getClient().request<{ chapters: { nodes: ChapterType[] } }>(GET_CHAPTERS, { mangaId: newManga.id });
      
      const oldChapters = oldChData.chapters.nodes || [];
      const newChapters = newChData.chapters.nodes || [];

      // 4. Match chapters and find ones that need updating
      const toUpdate: { id: number; isRead: boolean; isBookmarked: boolean; lastPageRead?: number }[] = [];

      const newChapMap = new Map<number, ChapterType>();
      for (const nc of newChapters) {
        if (nc.chapterNumber >= 0) {
          newChapMap.set(nc.chapterNumber, nc);
        }
      }

      for (const oc of oldChapters) {
        if (!oc.isRead && !oc.isBookmarked && (!oc.lastPageRead || oc.lastPageRead === 0)) {
          continue; 
        }

        let match = newChapMap.get(oc.chapterNumber);
        
        if (!match) {
          match = newChapters.find(nc => nc.name === oc.name);
        }

        if (match) {
          toUpdate.push({
            id: match.id,
            isRead: oc.isRead,
            isBookmarked: oc.isBookmarked,
            lastPageRead: oc.lastPageRead
          });
        }
      }

      // 5. Update the matched chapters
      setProgress(50);
      let completed = 0;
      
      if (toUpdate.length > 0) {
        for (let i = 0; i < toUpdate.length; i += 5) {
          const chunk = toUpdate.slice(i, i + 5);
          await Promise.all(
            chunk.map((update) => 
              getClient().request(UPDATE_CHAPTER, {
                id: update.id,
                isRead: update.isRead,
                isBookmarked: update.isBookmarked,
                lastPageRead: update.lastPageRead
              })
            )
          );
          completed += chunk.length;
          setProgress(50 + Math.floor((completed / toUpdate.length) * 40));
        }
      } else {
        setProgress(90);
      }

      // 6. Remove old manga from library
      await getClient().request(UPDATE_MANGA, { id: oldManga.id, inLibrary: false });
      setProgress(100);

      // 7. Invalidate caches
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["manga"] });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });

      return true;
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    } finally {
      setIsMigrating(false);
    }
  };

  return { migrate, isMigrating, progress };
}
