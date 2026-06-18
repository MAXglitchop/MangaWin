import { useNavigate } from "react-router-dom";
import { Download, Settings, Info, Server, Palette, FileText } from "lucide-react";
import { useServerStore } from "@/lib/store/serverStore";
import { cn } from "@/lib/utils";

export function MorePage() {
  const navigate = useNavigate();
  const serverStatus = useServerStore((s) => s.status);

  const menuItems = [
    {
      id: "downloads",
      icon: <Download size={24} />,
      label: "Downloads",
      onClick: () => navigate("/downloads"),
    },
    {
      id: "settings",
      icon: <Settings size={24} />,
      label: "Settings",
      onClick: () => navigate("/settings"),
    },
    {
      id: "about",
      icon: <Info size={24} />,
      label: "About",
      onClick: () => navigate("/about"),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      {/* Top App Bar */}
      <header className="h-[var(--appbar-height)] flex items-center px-4 shrink-0 shadow-sm z-10 bg-[var(--color-bg-base)]">
        <h1 className="text-[20px] font-medium tracking-wide">More</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Banner for server status */}
        {serverStatus !== "connected" && (
          <div className="mb-6 bg-[var(--color-error-subtle)] text-[var(--color-error)] px-4 py-3 rounded-[var(--radius-sm)] flex items-center gap-3">
            <Server size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium">Server Disconnected</p>
              <p className="text-xs opacity-80">Check your connection settings.</p>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--color-error)] text-white"
            >
              Configure
            </button>
          </div>
        )}

        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-[var(--radius-sm)]",
                "hover:bg-[var(--color-surface-hover)] transition-colors text-left"
              )}
            >
              <div className="text-[var(--color-text-secondary)]">{item.icon}</div>
              <span className="flex-1 text-base font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
