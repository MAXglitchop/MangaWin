import { useParams, useNavigate } from "react-router-dom";
import { useChapters, useUpdateChapter, useFetchChapterPages } from "@/hooks/useApi";
import { ReaderSettingsPanel } from "@/components/reader/ReaderSettingsPanel";
import { useReaderStore, type ReadingMode } from "@/lib/store/uiStore";
import { useHistoryStore } from "@/lib/store/historyStore";
import { getServerUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings2,
  BookOpen,
  ScrollText,
  Sun,
  Loader2,
} from "lucide-react";
import { useEffect, useCallback, useState, useRef, useMemo } from "react";

export function Reader() {
  const { mangaId, chapterIndex } = useParams<{ mangaId: string; chapterIndex: string }>();
  const navigate = useNavigate();
  const mId = mangaId ? parseInt(mangaId) : 0;
  const cIdx = chapterIndex ? parseInt(chapterIndex) : 0;

  const { data: chaptersData } = useChapters(mId);
  const updateChapter = useUpdateChapter();
  const fetchPages = useFetchChapterPages();

  const {
    readingMode,
    currentPage,
    showOverlay,
    isFullscreen,
    zoomLevel,
    setReadingMode,
    setCurrentPage,
    setTotalPages,
    toggleOverlay,
    setShowOverlay,
    toggleFullscreen,
    nextPage,
    prevPage,
    
    // New Settings
    backgroundColor,
    imageScaleType,
    showPageNumber,
    keepScreenOn,
    animateTransitions,
    tapZones,
    zoomStartPosition,
  } = useReaderStore();
  const { incognitoMode } = useHistoryStore();

  // Track maximized state for top padding (WM_NCCALCSIZE workaround)
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  useEffect(() => {
    const appWindow = getCurrentWindow();
    appWindow.isMaximized().then(setIsMaximized).catch(() => {});
    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setIsMaximized).catch(() => {});
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  // Keep screen on
  useEffect(() => {
    let wakeLock: any = null;
    if (keepScreenOn && "wakeLock" in navigator) {
      const requestWakeLock = async () => {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          console.warn(`Wake Lock error: ${err.name}, ${err.message}`);
        }
      };
      requestWakeLock();
    }
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [keepScreenOn]);

  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [fetchedChapters, setFetchedChapters] = useState<Set<number>>(new Set());
  const [smartFitPages, setSmartFitPages] = useState<Set<number>>(new Set());
  const [brightness, setBrightness] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find current chapter
  const chapters = chaptersData?.nodes || [];
  const currentChapter = chapters.find((c) => c.sourceOrder === cIdx);
  const pageCount = currentChapter?.pageCount || 0;

  // Build page URLs
  const serverUrl = getServerUrl();
  const pages = useMemo(() => {
    const result: string[] = [];
    if (!currentChapter) return result;
    for (let i = 0; i < pageCount; i++) {
      result.push(`${serverUrl}/api/v1/manga/${mId}/chapter/${currentChapter.sourceOrder}/page/${i}`);
    }
    return result;
  }, [serverUrl, mId, currentChapter?.sourceOrder, pageCount]);

  // Update total pages
  useEffect(() => {
    setTotalPages(pageCount);
    setCurrentPage(0);
    setLoadedPages(new Set());
    
    if (currentChapter && !fetchPages.isPending && !fetchedChapters.has(currentChapter.id)) {
      setFetchedChapters(prev => new Set(prev).add(currentChapter.id));
      if (!currentChapter.isDownloaded) {
        fetchPages.mutate(currentChapter.id);
      }
    }
  }, [pageCount, cIdx, currentChapter?.id]);

  // Fullscreen
  useEffect(() => {
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      getCurrentWindow().setFullscreen(isFullscreen);
    }).catch(() => {});
  }, [isFullscreen]);

  // Exit fullscreen when leaving the reader
  useEffect(() => {
    return () => {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        getCurrentWindow().setFullscreen(false);
      }).catch(() => {});
    };
  }, []);

  const mode = (readingMode === "vertical" || readingMode === "webtoon" || readingMode === "continuous") ? "webtoon" : "paged";



  // Auto-save progress
  useEffect(() => {
    if (!currentChapter || incognitoMode) return;

    // Immediate save when first opening the chapter
    if (currentPage === 0) {
      updateChapter.mutate({
        id: currentChapter.id,
        lastPageRead: 0,
        isRead: pageCount <= 1,
      });
      return;
    }

    // Debounced save for scrolling
    const timer = setTimeout(() => {
      updateChapter.mutate({
        id: currentChapter.id,
        lastPageRead: currentPage,
        isRead: currentPage >= pageCount - 1,
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [currentPage, currentChapter?.id, incognitoMode]);

  // Navigate to next/prev chapter
  const sortedChapters = [...chapters].sort((a, b) => a.sourceOrder - b.sourceOrder);
  const currentChapterIdx = sortedChapters.findIndex((c) => c.sourceOrder === cIdx);
  const prevChapter = currentChapterIdx > 0 ? sortedChapters[currentChapterIdx - 1] : null;
  const nextChapter =
    currentChapterIdx < sortedChapters.length - 1
      ? sortedChapters[currentChapterIdx + 1]
      : null;

  const goToChapter = (order: number) => {
    navigate(`/reader/${mId}/${order}`, { replace: true });
  };

  // Auto-advance to next/prev chapter in paged mode
  const goNextChapter = useCallback(() => {
    if (nextChapter) goToChapter(nextChapter.sourceOrder);
  }, [nextChapter]);

  const goPrevChapter = useCallback(() => {
    if (prevChapter) goToChapter(prevChapter.sourceOrder);
  }, [prevChapter]);

  // Keyboard controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          if (mode === "paged") {
            e.preventDefault();
            if (readingMode === "rtl") {
              if (currentPage <= 0) goPrevChapter();
              else prevPage();
            } else {
              if (currentPage >= pageCount - 1) goNextChapter();
              else nextPage();
            }
          }
          break;
        case "ArrowLeft":
          if (mode === "paged") {
            e.preventDefault();
            if (readingMode === "rtl") {
              if (currentPage >= pageCount - 1) goNextChapter();
              else nextPage();
            } else {
              if (currentPage <= 0) goPrevChapter();
              else prevPage();
            }
          }
          break;
        case "Escape":
          navigate(-1);
          break;
        case "f":
          toggleFullscreen();
          break;
      }
    },
    [mode, readingMode, nextPage, prevPage, navigate, toggleFullscreen, currentPage, pageCount, goNextChapter, goPrevChapter]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handlePageLoad = (index: number, e?: React.SyntheticEvent<HTMLImageElement>) => {
    setLoadedPages((prev) => new Set(prev).add(index));
    if (e) {
      const img = e.currentTarget;
      // Smart Fit: If image is extremely tall (e.g. webtoon slice), force fit-width
      if (img.naturalHeight > img.naturalWidth * 3) {
        setSmartFitPages((prev) => new Set(prev).add(index));
      }
    }
  };

  // Handle vertical scroll for page tracking
  const handleScroll = useCallback(() => {
    if (readingMode !== "vertical" || !containerRef.current) return;
    const container = containerRef.current;
    const containerHeight = container.clientHeight;

    for (let i = 0; i < pageRefs.current.length; i++) {
      const ref = pageRefs.current[i];
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top >= containerRect.top && rect.top < containerRect.top + containerHeight / 2) {
          setCurrentPage(i);
          break;
        }
      }
    }
  }, [mode, setCurrentPage]);

  const getBgColor = () => {
    switch (backgroundColor) {
      case "white": return "#ffffff";
      case "gray": return "#333333";
      case "black": return "#000000";
      default: return "#000000"; // automatic defaults to black
    }
  };

  const getImageScaleClass = (index: number) => {
    const isSmartFit = smartFitPages.has(index);
    const effectiveScale = (imageScaleType === "fit-screen" && isSmartFit) ? "fit-width" : imageScaleType;

    switch (effectiveScale) {
      case "stretch": return "w-full h-full object-fill";
      case "fit-width": return "w-full h-auto max-w-[1200px] mx-auto block";
      case "fit-height": return "h-full w-auto";
      case "fit-screen": default: return "max-h-[calc(100vh-2rem)] w-auto object-contain";
    }
  };

  const getObjectPositionClass = () => {
    switch (zoomStartPosition) {
      case "left": return "object-left-top";
      case "right": return "object-right-top";
      case "center": return "object-center";
      case "automatic": 
      default:
        return mode === "webtoon" ? "object-top" : "object-center";
    }
  };

  const handleLeftTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tapZones === "none") {
      toggleOverlay();
      return;
    }
    
    if (mode === "webtoon") {
      let isUp = true;
      if (tapZones === "inverted") isUp = !isUp;
      
      if (containerRef.current) {
        containerRef.current.scrollBy({ top: isUp ? -window.innerHeight * 0.8 : window.innerHeight * 0.8, behavior: 'smooth' });
      }
      return;
    }

    let isNext = readingMode === "rtl";
    if (tapZones === "inverted") isNext = !isNext;
    
    if (isNext) {
      if (currentPage >= pageCount - 1) goNextChapter();
      else nextPage();
    } else {
      if (currentPage <= 0) goPrevChapter();
      else prevPage();
    }
  };

  const handleRightTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tapZones === "none") {
      toggleOverlay();
      return;
    }
    
    if (mode === "webtoon") {
      let isDown = true;
      if (tapZones === "inverted") isDown = !isDown;
      
      if (containerRef.current) {
        containerRef.current.scrollBy({ top: isDown ? window.innerHeight * 0.8 : -window.innerHeight * 0.8, behavior: 'smooth' });
      }
      return;
    }

    let isNext = readingMode !== "rtl"; 
    if (tapZones === "inverted") isNext = !isNext;
    
    if (isNext) {
      if (currentPage >= pageCount - 1) goNextChapter();
      else nextPage();
    } else {
      if (currentPage <= 0) goPrevChapter();
      else prevPage();
    }
  };

  const handlePagedClick = (e: React.MouseEvent) => {
    const { clientX } = e;
    const { innerWidth } = window;
    
    if (clientX < innerWidth * 0.25) {
      handleLeftTap(e);
    } else if (clientX > innerWidth * 0.75) {
      handleRightTap(e);
    } else {
      e.stopPropagation();
      toggleOverlay();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col overflow-hidden" 
      style={{ padding: isMaximized && !isFullscreen ? 8 : 0, backgroundColor: getBgColor() }}
    >
      {/* Top bar */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-neutral-950/90 px-5 py-3 backdrop-blur transition-transform",
          !showOverlay && "-translate-y-full"
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <div className="h-5 w-px bg-white/15" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white max-w-[300px]">
              {currentChapter?.name || "Loading..."}
            </p>
            <p className="truncate text-xs text-neutral-400">
              Chapter {cIdx} · Page {currentPage + 1} of {pageCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setReadingMode(mode === "paged" ? "vertical" : "ltr")}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {mode === "paged" ? (
              <BookOpen className="size-4" />
            ) : (
              <ScrollText className="size-4" />
            )}
            {mode === "paged" ? "Paged" : "Webtoon"}
          </button>
          <button
            onClick={() => setShowSettingsPanel(true)}
            className="flex size-9 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Settings2 className="size-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex size-9 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* Page area */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-y-auto cursor-pointer"
        onClick={toggleOverlay}
        onScroll={handleScroll}
      >
        {pageCount <= 0 || fetchPages.isPending ? (
          <div className="flex h-full min-h-[50vh] items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 size={32} className="animate-spin mx-auto text-neutral-500" />
              <p className="text-sm text-neutral-500">Loading chapter...</p>
            </div>
          </div>
        ) : mode === "paged" ? (
          <div className="flex min-h-full w-full flex-col items-center justify-center py-16" onClick={handlePagedClick}>
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={4}
              centerOnInit
              wheel={{ step: 0.1 }}
              doubleClick={{ step: 0.5 }}
              pinch={{ disabled: false }}
              panning={{ disabled: false }}
            >
              <TransformComponent wrapperClass="w-full h-full flex items-center justify-center">
                {pages[currentPage] && (
                  <img
                    src={pages[currentPage]}
                    alt={`Page ${currentPage + 1}`}
                    style={{ filter: `brightness(${brightness}%)` }}
                    className={cn(
                      getImageScaleClass(currentPage),
                      getObjectPositionClass(),
                      "rounded-sm shadow-2xl",
                      animateTransitions && "transition-opacity duration-300"
                    )}
                    onLoad={(e) => handlePageLoad(currentPage, e)}
                    onError={() => handlePageLoad(currentPage)}
                  />
                )}
              </TransformComponent>
            </TransformWrapper>

            {/* End of chapter navigation for paged mode */}
            {currentPage >= pageCount - 1 && (
              <div className="mt-8 flex items-center gap-4 z-50" onClick={(e) => e.stopPropagation()}>
                {nextChapter && (
                  <button
                    onClick={() => goToChapter(nextChapter.sourceOrder)}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Next Chapter →
                  </button>
                )}
                {!nextChapter && (
                  <p className="text-sm text-neutral-400">You've reached the last chapter</p>
                )}
              </div>
            )}
            {currentPage <= 0 && prevChapter && (
              <div className="mt-8 flex items-center gap-4 z-50" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => goToChapter(prevChapter.sourceOrder)}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-neutral-300 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  ← Previous Chapter
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className="mx-auto flex max-w-2xl flex-col py-16"
            style={{ filter: `brightness(${brightness}%)` }}
          >
            {pages.map((url, i) => (
              <div
                key={i}
                ref={(el) => { pageRefs.current[i] = el; }}
                className={cn(
                  "relative flex items-center justify-center",
                  !loadedPages.has(i) && "min-h-[70vh]"
                )}
                style={{
                  backgroundColor: backgroundColor === "white" ? "#f5f5f5" : "rgba(0,0,0,0.2)"
                }}
              >
                {!loadedPages.has(i) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-neutral-600" />
                  </div>
                )}
                <img
                  src={url}
                  alt={`Page ${i + 1}`}
                  className={cn(
                    "block relative z-10",
                    readingMode === "webtoon" ? "w-full object-cover" : "w-auto max-w-full object-contain",
                    getObjectPositionClass(),
                    animateTransitions && "transition-opacity duration-300",
                    loadedPages.has(i) ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={(e) => handlePageLoad(i, e)}
                  onError={() => handlePageLoad(i)}
                  loading={i < 3 ? "eager" : "lazy"}
                />
              </div>
            ))}

            {/* End of chapter navigation */}
            <div className="relative z-30 py-12 flex items-center justify-center gap-4">
              {prevChapter && (
                <button
                  onClick={(e) => { e.stopPropagation(); goToChapter(prevChapter.sourceOrder); }}
                  className="relative z-30 px-4 py-2 rounded-lg text-sm font-medium text-neutral-300 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  ← Previous Chapter
                </button>
              )}
              {nextChapter && (
                <button
                  onClick={(e) => { e.stopPropagation(); goToChapter(nextChapter.sourceOrder); }}
                  className="relative z-30 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Next Chapter →
                </button>
              )}
              {!nextChapter && !prevChapter && (
                <p className="text-sm text-neutral-400">You've reached the end</p>
              )}
            </div>

            {/* Side tap zones for webtoon mode */}
            <span
              onClick={handleLeftTap}
              className="fixed inset-y-0 left-0 w-1/4 cursor-pointer z-20"
            />
            <span
              onClick={(e) => { e.stopPropagation(); toggleOverlay(); }}
              className="fixed inset-y-0 left-1/4 w-1/2 cursor-pointer z-20"
            />
            <span
              onClick={handleRightTap}
              className="fixed inset-y-0 right-0 w-1/4 cursor-pointer z-20"
            />
          </div>
        )}
      </div>

      {/* Page Number Overlay */}
      {!showOverlay && showPageNumber && (
        <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none z-30">
           <div className="bg-black/60 backdrop-blur-sm text-white/90 text-xs font-mono px-3 py-1.5 rounded-full shadow-lg border border-white/10">
             {currentPage + 1} / {pageCount}
           </div>
        </div>
      )}

      {/* Bottom bar */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-40 border-t border-white/10 bg-neutral-950/90 px-5 py-3 backdrop-blur transition-transform",
          !showOverlay && "translate-y-full"
        )}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => prevChapter && goToChapter(prevChapter.sourceOrder)}
            disabled={!prevChapter}
            className="flex size-9 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="flex flex-1 items-center gap-3">
            <span className="w-12 shrink-0 text-right font-mono text-xs text-neutral-400">
              {currentPage + 1} / {pageCount}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                style={{ width: `${pageCount > 0 ? ((currentPage + 1) / pageCount) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-neutral-400" />
              <input
                type="range"
                min={40}
                max={100}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="h-1 w-24 cursor-pointer accent-primary"
                aria-label="Brightness"
              />
            </div>
          </div>

          <button
            onClick={() => nextChapter && goToChapter(nextChapter.sourceOrder)}
            disabled={!nextChapter}
            className="flex size-9 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <ReaderSettingsPanel 
        isOpen={showSettingsPanel} 
        onClose={() => setShowSettingsPanel(false)} 
      />
    </div>
  );
}
