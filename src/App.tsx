import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { LibraryPage } from "@/pages/Library";
import { MangaDetail } from "@/pages/MangaDetail";
import { Reader } from "@/pages/Reader";
import { SearchPage } from "@/pages/Search";
import { DownloadsPage } from "@/pages/Downloads";
import { ExtensionsPage } from "@/pages/Extensions";
import { UpdatesPage } from "@/pages/Updates";
import { HistoryPage } from "@/pages/History";
import { SettingsPage } from "@/pages/Settings";
import { AboutPage } from "@/pages/About";
import { ExtensionSettings } from "@/pages/ExtensionSettings";
import { GlobalSearch } from "@/pages/GlobalSearch";
import { BootScreen } from "@/components/BootScreen";
import { useServerHealth } from "@/hooks/useApi";
import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

import { ThemeProvider } from "@/components/layout/ThemeProvider";

function ServerHealthProvider({ children }: { children: React.ReactNode }) {
  useServerHealth();
  return <>{children}</>;
}

function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        const appWindow = getCurrentWindow();
        const isFullscreen = await appWindow.isFullscreen();
        await appWindow.setFullscreen(!isFullscreen);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!booted) {
    return <BootScreen onReady={() => setBooted(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Toaster position="bottom-right" theme="system" />
        <BrowserRouter>
        <ServerHealthProvider>
          <Routes>
            {/* Reader is full-screen, outside the shell */}
            <Route path="/reader/:mangaId/:chapterIndex" element={<Reader />} />

            {/* All other pages use the app shell */}
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/library" replace />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/updates" element={<UpdatesPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/browse" element={<SearchPage />} />
              <Route path="/global-search" element={<GlobalSearch />} />
              <Route path="/extensions" element={<ExtensionsPage />} />
              <Route path="/extensions/:sourceId" element={<ExtensionSettings />} />
              
              <Route path="/manga/:id" element={<MangaDetail />} />
              <Route path="/downloads" element={<DownloadsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Route>
          </Routes>
        </ServerHealthProvider>
      </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
