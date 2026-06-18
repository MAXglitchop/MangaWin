import { useExtensions, useInstallExtension, useUninstallExtension } from "@/hooks/useApi";
import { getServerUrl } from "@/lib/api/client";
import { PageHeader, EmptyState, Badge, SearchInput } from "@/components/common";
import { cn } from "@/lib/utils";
import { Puzzle, Download, Check, AlertTriangle, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useUIStore } from "@/lib/store/uiStore";

export function ExtensionsPage({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const { data: extensions, isLoading } = useExtensions();
  const { showNSFW } = useUIStore();
  const installMutation = useInstallExtension();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "installed" | "available" | "updates">("all");
  const [installing, setInstalling] = useState<string | null>(null);
  const [uninstalling, setUninstalling] = useState<string | null>(null);
  const uninstallMutation = useUninstallExtension();

  const handleInstall = async (pkgName: string) => {
    setInstalling(pkgName);
    try {
      await installMutation.mutateAsync(pkgName);
    } catch (e) {
      console.error("Failed to install extension", e);
    } finally {
      setInstalling(null);
    }
  };

  const handleUninstall = async (pkgName: string) => {
    setUninstalling(pkgName);
    try {
      await uninstallMutation.mutateAsync(pkgName);
    } catch (e) {
      console.error("Failed to uninstall extension", e);
    } finally {
      setUninstalling(null);
    }
  };

  const filtered = useMemo(() => {
    let result = extensions || [];

    if (!showNSFW) {
      result = result.filter((e) => !e.isNsfw);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) => e.name.toLowerCase().includes(q) || e.lang.toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case "installed":
        result = result.filter((e) => e.isInstalled);
        break;
      case "available":
        result = result.filter((e) => !e.isInstalled);
        break;
      case "updates":
        result = result.filter((e) => e.hasUpdate);
        break;
    }

    return result;
  }, [extensions, searchQuery, filter]);

  const filterTabs = [
    { key: "all" as const, label: "All", count: extensions?.length || 0 },
    { key: "installed" as const, label: "Installed", count: extensions?.filter((e) => e.isInstalled).length || 0 },
    { key: "available" as const, label: "Available", count: extensions?.filter((e) => !e.isInstalled).length || 0 },
    { key: "updates" as const, label: "Updates", count: extensions?.filter((e) => e.hasUpdate).length || 0 },
  ];

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 82, // 74px height + 8px gap
    overscan: 5,
  });

  return (
    <div className="h-full flex flex-col">
      {!hideHeader && <PageHeader title="Extensions" subtitle="Manage manga source extensions" />}

      <div className="px-6 py-3 border-b border-[var(--color-border)] space-y-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                filter === tab.key
                  ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
              )}
            >
              {tab.label}
              <span className="ml-1 opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search extensions..."
          className="max-w-sm"
        />
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Puzzle size={28} />}
            title="No Extensions"
            description={searchQuery ? `No extensions match "${searchQuery}"` : "No extensions available."}
          />
        ) : (
          <div 
            className="relative w-full max-w-3xl mx-auto"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const ext = filtered[virtualItem.index];
              return (
                <div
                  key={ext.pkgName}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size - 8}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-[var(--radius-md)]",
                    "bg-[var(--color-bg-secondary)] border border-[var(--color-border)]",
                    "hover:border-[var(--color-border-hover)] transition-colors duration-200"
                  )}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                    {ext.iconUrl ? (
                      <img src={`${getServerUrl()}${ext.iconUrl}`} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <Puzzle size={18} className="text-[var(--color-text-muted)]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {ext.name}
                      </p>
                      {ext.isNsfw && <Badge variant="error">18+</Badge>}
                      {ext.isObsolete && <Badge variant="warning">Obsolete</Badge>}
                    </div>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      v{ext.versionName} • {ext.lang.toUpperCase()}
                    </p>
                  </div>

                  {/* Status / Action */}
                  <div className="shrink-0">
                    {ext.isInstalled ? (
                      <div className="flex items-center gap-2">
                        {ext.hasUpdate ? (
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors">
                            <RefreshCw size={12} /> Update
                          </button>
                        ) : (
                          <Badge variant="success">
                            <Check size={10} className="mr-1" /> Installed
                          </Badge>
                        )}
                        <button
                          onClick={() => handleUninstall(ext.pkgName)}
                          disabled={uninstalling === ext.pkgName || uninstallMutation.isPending}
                          className="flex items-center justify-center size-8 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Uninstall extension"
                        >
                          {uninstalling === ext.pkgName ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleInstall(ext.pkgName)}
                        disabled={installing === ext.pkgName || installMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent-light)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors disabled:opacity-50"
                      >
                        {installing === ext.pkgName ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        {installing === ext.pkgName ? "Installing..." : "Install"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
