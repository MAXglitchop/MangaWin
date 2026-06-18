import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";
export type ThemePalette = "default" | "lavender" | "dune" | "rosegold" | "forest-dew" | "mountain-sunset" | "crimson" | "minty-miracles" | "orange-juice";

interface UIState {
  sidebarCollapsed: boolean;
  themeMode: ThemeMode;
  themePalette: ThemePalette;
  pureBlack: boolean;
  thumbnailBackground: boolean;
  dynamicTheme: boolean;
  showNSFW: boolean;
  hideInLibrary: boolean;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemePalette: (palette: ThemePalette) => void;
  setPureBlack: (black: boolean) => void;
  setThumbnailBackground: (bg: boolean) => void;
  setDynamicTheme: (dynamic: boolean) => void;
  setShowNSFW: (show: boolean) => void;
  setHideInLibrary: (hide: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      themeMode: "system",
      themePalette: "default",
      pureBlack: false,
      thumbnailBackground: true,
      dynamicTheme: false,
      showNSFW: false,
      hideInLibrary: false,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setThemePalette: (palette) => set({ themePalette: palette }),
      setPureBlack: (black) => set({ pureBlack: black }),
      setThumbnailBackground: (bg) => set({ thumbnailBackground: bg }),
      setDynamicTheme: (dynamic) => set({ dynamicTheme: dynamic }),
      setShowNSFW: (show) => set({ showNSFW: show }),
      setHideInLibrary: (hide) => set({ hideInLibrary: hide }),
    }),
    {
      name: "mangawin-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        themeMode: state.themeMode,
        themePalette: state.themePalette,
        pureBlack: state.pureBlack,
        thumbnailBackground: state.thumbnailBackground,
        dynamicTheme: state.dynamicTheme,
        showNSFW: state.showNSFW,
        hideInLibrary: state.hideInLibrary,
      }),
    }
  )
);

export type TriState = "IGNORE" | "INCLUDE" | "EXCLUDE";
export type ViewMode = "COMFORTABLE_GRID" | "COMPACT_GRID" | "LIST";
export type SortField = "ALPHABETICAL" | "LAST_READ" | "LATEST_CHAPTER" | "UNREAD" | "TOTAL_CHAPTERS" | "DATE_ADDED" | "DATE_FETCHED";
export type SortDirection = "ASC" | "DESC";

interface LibraryState {
  viewMode: ViewMode;
  showUnreadBadge: boolean;
  showDownloadBadge: boolean;
  showContinueReadingButton: boolean;
  showItemCount: boolean;

  filterUnread: TriState;
  filterDownloaded: TriState;
  filterBookmarked: TriState;
  filterStarted: TriState;
  filterStatus: string[];

  sortField: SortField;
  sortDirection: SortDirection;

  activeCategory: number | null;
  searchQuery: string;

  setViewMode: (mode: ViewMode) => void;
  setShowUnreadBadge: (show: boolean) => void;
  setShowDownloadBadge: (show: boolean) => void;
  setShowContinueReadingButton: (show: boolean) => void;
  setShowItemCount: (show: boolean) => void;

  setFilterUnread: (state: TriState) => void;
  setFilterDownloaded: (state: TriState) => void;
  setFilterBookmarked: (state: TriState) => void;
  setFilterStarted: (state: TriState) => void;
  setFilterStatus: (statuses: string[]) => void;

  setSortField: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  
  setActiveCategory: (id: number | null) => void;
  setSearchQuery: (q: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      viewMode: "COMPACT_GRID",
      showUnreadBadge: true,
      showDownloadBadge: true,
      showContinueReadingButton: false,
      showItemCount: true,

      filterUnread: "IGNORE",
      filterDownloaded: "IGNORE",
      filterBookmarked: "IGNORE",
      filterStarted: "IGNORE",
      filterStatus: [],

      sortField: "ALPHABETICAL",
      sortDirection: "ASC",

      activeCategory: null,
      searchQuery: "",

      setViewMode: (mode) => set({ viewMode: mode }),
      setShowUnreadBadge: (show) => set({ showUnreadBadge: show }),
      setShowDownloadBadge: (show) => set({ showDownloadBadge: show }),
      setShowContinueReadingButton: (show) => set({ showContinueReadingButton: show }),
      setShowItemCount: (show) => set({ showItemCount: show }),

      setFilterUnread: (state) => set({ filterUnread: state }),
      setFilterDownloaded: (state) => set({ filterDownloaded: state }),
      setFilterBookmarked: (state) => set({ filterBookmarked: state }),
      setFilterStarted: (state) => set({ filterStarted: state }),
      setFilterStatus: (statuses) => set({ filterStatus: statuses }),

      setSortField: (field) => set({ sortField: field }),
      setSortDirection: (dir) => set({ sortDirection: dir }),

      setActiveCategory: (id) => set({ activeCategory: id }),
      setSearchQuery: (q) => set({ searchQuery: q }),
    }),
    {
      name: "mangawin-library",
      partialize: (state) => ({
        viewMode: state.viewMode,
        showUnreadBadge: state.showUnreadBadge,
        showDownloadBadge: state.showDownloadBadge,
        showContinueReadingButton: state.showContinueReadingButton,
        showItemCount: state.showItemCount,
        filterUnread: state.filterUnread,
        filterDownloaded: state.filterDownloaded,
        filterBookmarked: state.filterBookmarked,
        filterStarted: state.filterStarted,
        filterStatus: state.filterStatus,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
      }),
    }
  )
);

export type ReadingMode = "vertical" | "webtoon" | "continuous" | "ltr" | "rtl";
export type ImageScaleType = "fit-screen" | "stretch" | "fit-width" | "fit-height";
export type ZoomStartPosition = "automatic" | "left" | "right" | "center";
export type BackgroundColor = "white" | "black" | "gray" | "automatic";
export type TapZones = "normal" | "inverted" | "none";

interface ReaderState {
  // Navigation / Control
  currentPage: number;
  totalPages: number;
  showOverlay: boolean;
  isFullscreen: boolean;
  zoomLevel: number;
  
  // Settings - Reading
  readingMode: ReadingMode;
  imageScaleType: ImageScaleType;
  zoomStartPosition: ZoomStartPosition;
  animateTransitions: boolean;

  // Settings - Display
  backgroundColor: BackgroundColor;
  fullscreen: boolean;
  keepScreenOn: boolean;
  showPageNumber: boolean;

  // Settings - Navigation
  tapZones: TapZones;
  volumeKeyNavigation: boolean;
  invertVolumeKeys: boolean;

  // Actions
  setReadingMode: (mode: ReadingMode) => void;
  setImageScaleType: (type: ImageScaleType) => void;
  setZoomStartPosition: (pos: ZoomStartPosition) => void;
  setAnimateTransitions: (animate: boolean) => void;
  
  setBackgroundColor: (color: BackgroundColor) => void;
  setFullscreen: (fs: boolean) => void;
  setKeepScreenOn: (keep: boolean) => void;
  setShowPageNumber: (show: boolean) => void;

  setTapZones: (zones: TapZones) => void;
  setVolumeKeyNavigation: (nav: boolean) => void;
  setInvertVolumeKeys: (inv: boolean) => void;

  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  toggleOverlay: () => void;
  setShowOverlay: (show: boolean) => void;
  toggleFullscreen: () => void;
  setZoomLevel: (zoom: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      currentPage: 0,
      totalPages: 0,
      showOverlay: true,
      isFullscreen: false,
      zoomLevel: 100,

      // Default Settings
      readingMode: "vertical",
      imageScaleType: "fit-screen",
      zoomStartPosition: "automatic",
      animateTransitions: true,

      backgroundColor: "automatic",
      fullscreen: true,
      keepScreenOn: true,
      showPageNumber: true,

      tapZones: "normal",
      volumeKeyNavigation: false,
      invertVolumeKeys: false,

      setReadingMode: (mode) => set({ readingMode: mode }),
      setImageScaleType: (type) => set({ imageScaleType: type }),
      setZoomStartPosition: (pos) => set({ zoomStartPosition: pos }),
      setAnimateTransitions: (animate) => set({ animateTransitions: animate }),

      setBackgroundColor: (color) => set({ backgroundColor: color }),
      setFullscreen: (fs) => set({ fullscreen: fs }),
      setKeepScreenOn: (keep) => set({ keepScreenOn: keep }),
      setShowPageNumber: (show) => set({ showPageNumber: show }),

      setTapZones: (zones) => set({ tapZones: zones }),
      setVolumeKeyNavigation: (nav) => set({ volumeKeyNavigation: nav }),
      setInvertVolumeKeys: (inv) => set({ invertVolumeKeys: inv }),

      setCurrentPage: (page) => set({ currentPage: page }),
      setTotalPages: (total) => set({ totalPages: total }),
      toggleOverlay: () => set((s) => ({ showOverlay: !s.showOverlay })),
      setShowOverlay: (show) => set({ showOverlay: show }),
      toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
      setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
      nextPage: () => {
        const { currentPage, totalPages } = get();
        if (currentPage < totalPages - 1) set({ currentPage: currentPage + 1 });
      },
      prevPage: () => {
        const { currentPage } = get();
        if (currentPage > 0) set({ currentPage: currentPage - 1 });
      },
    }),
    {
      name: "mangawin-reader",
      partialize: (state) => ({
        readingMode: state.readingMode,
        imageScaleType: state.imageScaleType,
        zoomStartPosition: state.zoomStartPosition,
        animateTransitions: state.animateTransitions,
        backgroundColor: state.backgroundColor,
        fullscreen: state.fullscreen,
        keepScreenOn: state.keepScreenOn,
        showPageNumber: state.showPageNumber,
        tapZones: state.tapZones,
        volumeKeyNavigation: state.volumeKeyNavigation,
        invertVolumeKeys: state.invertVolumeKeys,
        zoomLevel: state.zoomLevel,
      }),
    }
  )
);

interface BrowseState {
  selectedSourceId: string | null;
  query: string;
  searchQuery: string;
  mangas: any[];
  page: number;
  hasNextPage: boolean;
  activeTab: "sources" | "extensions" | "migrate";
  setSelectedSourceId: (id: string | null) => void;
  setQuery: (q: string) => void;
  setSearchQuery: (q: string) => void;
  setMangas: (mangas: any[]) => void;
  setPage: (page: number) => void;
  setHasNextPage: (has: boolean) => void;
  setActiveTab: (tab: "sources" | "extensions" | "migrate") => void;
}

export const useBrowseStore = create<BrowseState>()((set) => ({
  selectedSourceId: null,
  query: "",
  searchQuery: "",
  mangas: [],
  page: 1,
  hasNextPage: false,
  activeTab: "sources",
  setSelectedSourceId: (id) => set({ selectedSourceId: id, mangas: [], query: "", searchQuery: "", page: 1, hasNextPage: false }),
  setQuery: (q) => set({ query: q }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setMangas: (mangas) => set({ mangas }),
  setPage: (page) => set({ page }),
  setHasNextPage: (has) => set({ hasNextPage: has }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
