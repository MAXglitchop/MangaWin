import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Minus, Square, X, Search } from "lucide-react";
import { useLibraryStore } from "@/lib/store/uiStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

function useTauriMaximized() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    
    // Check initial state
    appWindow.isMaximized().then(setIsMaximized).catch(() => {});

    // Listen for resize events to detect maximize/unmaximize
    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setIsMaximized).catch(() => {});
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return isMaximized;
}

function TitleBar() {
  const { searchQuery, setSearchQuery } = useLibraryStore();
  const navigate = useNavigate();

  return (
    <header data-tauri-drag-region="true" className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-sidebar pl-4 pr-0 select-none">
      <div data-tauri-drag-region="true" className="w-[100px] h-full" />

      <div className="relative mx-auto hidden w-full max-w-md items-center md:flex">
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => navigate("/library")}
          placeholder="Search your library..."
          className="h-7 w-full rounded-md border border-border bg-background/60 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
        />
      </div>

      <div className="flex items-center">
        <button
          aria-label="Minimize"
          onClick={() => getCurrentWindow().minimize()}
          className="flex h-10 w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Minus className="size-4 pointer-events-none" />
        </button>
        <button
          aria-label="Maximize"
          onClick={() => getCurrentWindow().toggleMaximize()}
          className="flex h-10 w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Square className="size-3.5 pointer-events-none" />
        </button>
        <button
          aria-label="Close"
          onClick={() => getCurrentWindow().close()}
          className="flex h-10 w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
        >
          <X className="size-4 pointer-events-none" />
        </button>
      </div>
    </header>
  );
}

export function AppShell() {
  const isMaximized = useTauriMaximized();

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground"
      style={{ padding: isMaximized ? 8 : 0 }}
    >
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
