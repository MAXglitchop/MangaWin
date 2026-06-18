import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient, checkServerHealth, getServerUrl } from "../lib/api/client";
import {
  GET_LIBRARY,
  GET_MANGA,
  GET_CHAPTERS,
  GET_CATEGORIES,
  FETCH_CHAPTER_PAGES,
  FETCH_EXTENSIONS,
  GET_SOURCES,
  FETCH_SOURCE_MANGA,
  GET_EXTENSIONS,
  UPDATE_EXTENSION,
  GET_DOWNLOAD_STATUS,
  GET_SERVER_INFO,
  UPDATE_CHAPTER,
  UPDATE_MANGA,
  ENQUEUE_CHAPTER_DOWNLOAD,
  FETCH_CHAPTERS,
  GET_SETTINGS,
  SET_SETTINGS,
  GET_HISTORY,
  GET_DOWNLOADED_CHAPTERS,
  DELETE_DOWNLOADED_CHAPTER,
  CLEAR_DOWNLOADER,
  GET_SOURCE_PREFERENCES,
  UPDATE_SOURCE_PREFERENCE,
} from "../lib/api/queries";
import type {
  MangaType,
  ChapterType,
  CategoryType,
  SourceType,
  ExtensionType,
  DownloadStatus,
} from "../lib/api/types";
import { useServerStore } from "../lib/store/serverStore";
import { useHistoryStore } from "../lib/store/historyStore";
import { invoke } from "@tauri-apps/api/core";

/* ===== SERVER STATUS ===== */

export function useServerHealth() {
  const query = useQuery({
    queryKey: ["serverHealth"],
    queryFn: async () => {
      const currentStatus = useServerStore.getState().status;
      // Only set "connecting" if we are currently disconnected or error, 
      // so we don't cause UI jitter on background health checks.
      if (currentStatus !== "connected") {
        useServerStore.getState().setStatus("connecting");
      }
      const ok = await checkServerHealth();
      useServerStore.getState().setStatus(ok ? "connected" : "error", ok ? undefined : "Cannot reach server");
      return ok;
    },
    refetchInterval: 15000,
    retry: false,
  });

  return query;
}

export function useServerInfo() {
  return useQuery({
    queryKey: ["serverInfo"],
    queryFn: async () => {
      const data = await getClient().request<{
        aboutServer: {
          name: string;
          version: string;
          buildType: string;
          github: string;
          discord: string;
        };
      }>(GET_SERVER_INFO);
      return data.aboutServer;
    },
    enabled: useServerStore.getState().status === "connected",
  });
}

/* ===== LIBRARY ===== */

export function useLibrary() {
  const status = useServerStore((s) => s.status);

  return useQuery({
    queryKey: ["library"],
    queryFn: async () => {
      const data = await getClient().request<{
        mangas: { nodes: MangaType[]; totalCount: number };
      }>(GET_LIBRARY);
      return data.mangas;
    },
    enabled: status === "connected",
    staleTime: 30_000,
  });
}

export function useCategories() {
  const status = useServerStore((s) => s.status);

  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const data = await getClient().request<{
        categories: { nodes: CategoryType[]; totalCount: number };
      }>(GET_CATEGORIES);
      return data.categories;
    },
    enabled: status === "connected",
  });
}

/* ===== MANGA ===== */

export function useManga(id: number | undefined) {
  const status = useServerStore((s) => s.status);

  return useQuery({
    queryKey: ["manga", id],
    queryFn: async () => {
      const data = await getClient().request<{ manga: MangaType }>(GET_MANGA, {
        id,
      });
      return data.manga;
    },
    enabled: !!id && status === "connected",
  });
}

/* ===== CHAPTERS ===== */

export function useChapters(mangaId: number | undefined) {
  const status = useServerStore((s) => s.status);

  return useQuery({
    queryKey: ["chapters", mangaId],
    queryFn: async () => {
      const data = await getClient().request<{
        chapters: { nodes: ChapterType[]; totalCount: number };
      }>(GET_CHAPTERS, { mangaId });
      return data.chapters;
    },
    enabled: !!mangaId && status === "connected",
  });
}

export function useHistory() {
  const status = useServerStore((s) => s.status);
  const { clearTimestamp, deletedItems } = useHistoryStore();

  return useQuery({
    queryKey: ["history", clearTimestamp, deletedItems],
    queryFn: async () => {
      const data = await getClient().request<{
        chapters: { nodes: ChapterType[] };
      }>(GET_HISTORY);
      
      const nodes = data.chapters.nodes || [];
      const historyItems: ChapterType[] = [];
      const seenMangaIds = new Set<number>();

      for (const chapter of nodes) {
        if (!chapter.lastReadAt || chapter.lastReadAt === "0") continue;
        
        // Filter out locally deleted history (with a 5s buffer to account for second-precision truncation)
        const lastReadTime = parseInt(chapter.lastReadAt) * 1000;
        if (lastReadTime < clearTimestamp - 5000) continue;
        if (deletedItems[chapter.id] && lastReadTime < deletedItems[chapter.id] - 5000) continue;

        const mangaId = chapter.manga?.id;
        if (!mangaId || seenMangaIds.has(mangaId)) continue;
        
        seenMangaIds.add(mangaId);
        historyItems.push(chapter);
      }
      
      return historyItems;
    },
    enabled: status === "connected",
  });
}

export function useFetchChapters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mangaId: number) => {
      return getClient().request(FETCH_CHAPTERS, { mangaId });
    },
    onSuccess: (_, mangaId) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", mangaId] });
    },
  });
}

export function useFetchChapterPages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapterId: number) => {
      const { fetchChapterPages } = await getClient().request<any>(FETCH_CHAPTER_PAGES, { chapterId });
      return fetchChapterPages.chapter;
    },
    onSuccess: (_, chapterId) => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      id: number;
      isRead?: boolean;
      isBookmarked?: boolean;
      lastPageRead?: number;
    }) => {
      return getClient().request(UPDATE_CHAPTER, vars);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

/* ===== SOURCES ===== */

export function useSources() {
  const status = useServerStore((s) => s.status);

  return useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const data = await getClient().request<{
        sources: { nodes: SourceType[] };
      }>(GET_SOURCES);
      return data.sources.nodes;
    },
    enabled: status === "connected",
  });
}

export function useFetchSourceManga() {
  return useMutation({
    mutationFn: async (vars: {
      source: string;
      query?: string;
      page: number;
      type: "SEARCH" | "POPULAR" | "LATEST";
    }) => {
      const data = await getClient().request<{
        fetchSourceManga: {
          mangas: MangaType[];
          hasNextPage: boolean;
        };
      }>(FETCH_SOURCE_MANGA, vars);
      return data.fetchSourceManga;
    },
  });
}

export function useSourcePreferences(sourceId: string | undefined) {
  const status = useServerStore((s) => s.status);

  return useQuery({
    queryKey: ["sourcePreferences", sourceId],
    queryFn: async () => {
      const data = await getClient().request<{
        source: import("../lib/api/types").SourceWithPreferencesType;
      }>(GET_SOURCE_PREFERENCES, { sourceId });
      
      // Map the GraphQL aliases back to currentValue and default
      if (data.source && data.source.preferences) {
        data.source.preferences = data.source.preferences.map((p: any) => {
          let currentValue = p.currentValue;
          let def = p.default;
          
          if (p.__typename === "ListPreference") {
            currentValue = p.listCurrentValue;
            def = p.listDefault;
          } else if (p.__typename === "SwitchPreference") {
            currentValue = p.switchCurrentValue;
            def = p.switchDefault;
          } else if (p.__typename === "CheckBoxPreference") {
            currentValue = p.checkCurrentValue;
            def = p.checkDefault;
          } else if (p.__typename === "EditTextPreference") {
            currentValue = p.textCurrentValue;
            def = p.textDefault;
          } else if (p.__typename === "MultiSelectListPreference") {
            currentValue = p.multiCurrentValue;
            def = p.multiDefault;
          }
          
          return {
            ...p,
            currentValue,
            default: def
          };
        });
      }
      
      return data.source;
    },
    enabled: !!sourceId && status === "connected",
  });
}

export function useUpdateSourcePreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      sourceId: string;
      change: {
        position: number;
        listState?: string;
        switchState?: boolean;
        checkBoxState?: boolean;
        editTextState?: string;
        multiSelectState?: string[];
      };
    }) => {
      return getClient().request(UPDATE_SOURCE_PREFERENCE, vars);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["sourcePreferences", vars.sourceId] });
      queryClient.invalidateQueries({ queryKey: ["manga"] });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
    },
  });
}

/* ===== EXTENSIONS ===== */

export function useExtensions() {
  const status = useServerStore((s) => s.status);

  return useQuery({
    queryKey: ["extensions"],
    queryFn: async () => {
      const data = await getClient().request<{
        extensions: { nodes: ExtensionType[] };
      }>(GET_EXTENSIONS);
      return data.extensions.nodes;
    },
    enabled: status === "connected",
  });
}

export function useInstallExtension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pkgName: string) => {
      return getClient().request(UPDATE_EXTENSION, { pkgName, install: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extensions"] });
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["sources"] }), 1000);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["sources"] }), 2500);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["sources"] }), 5000);
    },
  });
}

export function useUninstallExtension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pkgName: string) => {
      const res = await getClient().request(UPDATE_EXTENSION, { pkgName, uninstall: true });
      try {
        await invoke("delete_extension_file", { pkgName });
      } catch (e) {
        console.error("Failed to physically delete extension file", e);
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extensions"] });
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["sources"] }), 1000);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["sources"] }), 2500);
    },
  });
}

/* ===== DOWNLOADS ===== */

export function useDownloadStatus() {
  const status = useServerStore((s) => s.status);

  return useQuery({
    queryKey: ["downloadStatus"],
    queryFn: async () => {
      const data = await getClient().request<{
        downloadStatus: DownloadStatus;
      }>(GET_DOWNLOAD_STATUS);
      return data.downloadStatus;
    },
    enabled: status === "connected",
    refetchInterval: 3000,
  });
}

export function useEnqueueDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapterId: number) => {
      return getClient().request(ENQUEUE_CHAPTER_DOWNLOAD, { id: chapterId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downloadStatus"] });
    },
  });
}

export function useDownloadedChapters() {
  const status = useServerStore((s) => s.status);

  return useQuery({
    queryKey: ["downloadedChapters"],
    queryFn: async () => {
      const data = await getClient().request<{
        chapters: { nodes: ChapterType[] };
      }>(GET_DOWNLOADED_CHAPTERS);
      return data.chapters.nodes || [];
    },
    enabled: status === "connected",
    refetchInterval: 3000,
  });
}

export function useDeleteDownloadedChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapterId: number) => {
      return getClient().request(DELETE_DOWNLOADED_CHAPTER, { id: chapterId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downloadedChapters"] });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      queryClient.invalidateQueries({ queryKey: ["downloadStatus"] });
    },
  });
}

export function useClearDownloader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return getClient().request(CLEAR_DOWNLOADER);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downloadStatus"] });
    },
  });
}

/* ===== LIBRARY MUTATIONS ===== */

export function useUpdateManga() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { id: number; inLibrary?: boolean }) => {
      return getClient().request(UPDATE_MANGA, vars);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["manga"] });
    },
  });
}

/* ===== CHAPTER PAGE URLS ===== */

export function useChapterPages(mangaId: number, chapterIndex: number, pageCount: number) {
  const serverUrl = getServerUrl();
  const pages: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    pages.push(`${serverUrl}/api/v1/manga/${mangaId}/chapter/${chapterIndex}/page/${i}`);
  }
  return pages;
}

/* ===== SETTINGS ===== */

export function useSettings() {
  const status = useServerStore((s) => s.status);

  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const data = await getClient().request<{
        settings: { extensionRepos: string[], globalUpdateInterval: number };
      }>(GET_SETTINGS);
      return data.settings;
    },
    enabled: status === "connected",
  });
}

export function useSetSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { settings: { extensionRepos?: string[], globalUpdateInterval?: number } }) => {
      const res = await getClient().request(SET_SETTINGS, { input });
      // Force Suwayomi to sync extensions immediately after updating repos
      await getClient().request(`
        mutation {
          fetchExtensions(input: {}) {
            clientMutationId
          }
        }
      `);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      // Clear the extensions cache completely so it doesn't flash the old list
      queryClient.removeQueries({ queryKey: ["extensions"] });
    },
  });
}
