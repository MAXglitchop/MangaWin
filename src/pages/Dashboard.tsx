import { useLibrary } from "@/hooks/useApi";
import { useServerStore } from "@/lib/store/serverStore";
import { MangaCard } from "@/components/library/MangaCard";
import { EmptyState, MangaCardSkeleton, Button } from "@/components/common";
import { useNavigate } from "react-router-dom";
import {
  Library,
  BookOpen,
  Download,
  Puzzle,
  WifiOff,
  ArrowRight,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const serverStatus = useServerStore((s) => s.status);
  const { data: library, isLoading } = useLibrary();
  const navigate = useNavigate();

  const mangas = library?.nodes || [];
  const totalCount = library?.totalCount || 0;

  const continueReading = mangas
    .filter((m) => m.lastReadChapter && m.unreadCount > 0)
    .sort((a, b) => {
      const aTime = a.lastReadChapter?.lastReadAt || "0";
      const bTime = b.lastReadChapter?.lastReadAt || "0";
      return bTime.localeCompare(aTime);
    })
    .slice(0, 10); // Show more items in a denser row

  const recentlyAdded = [...mangas]
    .sort((a, b) => b.lastFetchedAt.localeCompare(a.lastFetchedAt))
    .slice(0, 10);

  const unreadMangas = mangas.filter((m) => m.unreadCount > 0);
  const totalUnread = unreadMangas.reduce((sum, m) => sum + m.unreadCount, 0);

  if (serverStatus !== "connected") {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={<WifiOff size={48} />}
          title="Not Connected"
          description="MangaWin cannot reach the Suwayomi server. Make sure it's running on localhost:4567."
          action={
            <div className="flex gap-3">
              <Button onClick={() => navigate("/settings")} variant="secondary">
                <SettingsIcon size={16} /> Configure
              </Button>
              <Button onClick={() => window.location.reload()} variant="primary">
                Retry
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto animate-fadeIn">
      {/* Header Stats */}
      <div className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] px-6 py-4 shrink-0 flex items-center gap-6">
        <StatItem icon={<Library size={16} />} label="In Library" value={totalCount} />
        <div className="w-px h-6 bg-[var(--color-border-subtle)]" />
        <StatItem icon={<BookOpen size={16} />} label="Unread" value={totalUnread} highlight />
      </div>

      <div className="p-6 space-y-8">
        {/* Continue Reading */}
        {continueReading.length > 0 && (
          <Section
            title="Continue Reading"
            onViewAll={() => navigate("/library")}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {continueReading.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          </Section>
        )}

        {/* Recently Added */}
        {recentlyAdded.length > 0 && (
          <Section
            title="Recently Added"
            onViewAll={() => navigate("/library")}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {recentlyAdded.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          </Section>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6">
            <div>
              <div className="h-6 w-32 bg-[var(--color-bg-elevated)] rounded animate-pulse mb-4" />
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <MangaCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && mangas.length === 0 && (
          <EmptyState
            icon={<Library size={48} />}
            title="Library is Empty"
            description="Install extensions and browse for manga to add them to your library."
            action={
              <Button onClick={() => navigate("/extensions")} variant="primary">
                <Puzzle size={16} /> Go to Extensions
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}

/* ===== Sub-components ===== */

function StatItem({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "text-[var(--color-text-secondary)]",
        highlight && "text-[var(--color-accent)]"
      )}>
        {icon}
      </div>
      <div>
        <span className="text-sm font-medium mr-1 text-[var(--color-text-primary)]">
          {value}
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {label}
        </span>
      </div>
    </div>
  );
}

function Section({
  title,
  onViewAll,
  children,
}: {
  title: string;
  onViewAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-slideUp">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-[var(--color-text-primary)]">{title}</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            MORE
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
