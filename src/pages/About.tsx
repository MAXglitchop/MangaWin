import { useServerInfo } from "@/hooks/useApi";
import { PageHeader, Button } from "@/components/common";
import { BookOpen, MessageCircle, Code, Heart, ExternalLink, Globe, Cpu, Box } from "lucide-react";

export function AboutPage() {
  const { data: serverInfo } = useServerInfo();

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-base)]">
      <PageHeader title="About" />

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-8">
        <div className="max-w-3xl space-y-6">
          {/* Hero Logo */}
          <div className="flex flex-col items-center py-12">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-[var(--color-accent)] mb-4">
              <BookOpen size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">
              MangaWin
            </h1>
            <p className="text-[var(--color-text-tertiary)] mb-4">
              A modern desktop manga reader
            </p>

            <div className="flex gap-2">
              <span className="text-xs font-mono px-2 py-1 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                v0.1.0-alpha
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                Suwayomi Powered
              </span>
            </div>
          </div>

          {/* Tech stack */}
          <div className="bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              <Cpu size={18} className="text-[var(--color-text-secondary)]" />
              <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Technology Stack</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <TechItem name="Tauri 2" />
                <TechItem name="React 19" />
                <TechItem name="TypeScript" />
                <TechItem name="TailwindCSS" />
                <TechItem name="TanStack Query" />
                <TechItem name="Zustand" />
              </div>
            </div>
          </div>

          {/* Server info */}
          {serverInfo && (
            <div className="bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                <Box size={18} className="text-[var(--color-text-secondary)]" />
                <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Server Information</h3>
              </div>
              <div className="p-5 grid grid-cols-3 gap-4">
                <InfoRow label="Name" value={serverInfo.name} />
                <InfoRow label="Version" value={serverInfo.version} />
                <InfoRow label="Build" value={serverInfo.buildType} />
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-4 pt-4">
            <Button variant="secondary" onClick={() => window.open("https://github.com/Suwayomi/Suwayomi-Server", "_blank")}>
              <Globe size={16} /> GitHub
            </Button>
            <Button variant="secondary" onClick={() => {}}>
              <MessageCircle size={16} /> Discord
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechItem({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
      <span className="text-sm text-[var(--color-text-secondary)]">{name}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-tertiary)] mb-1">{label}</p>
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}
