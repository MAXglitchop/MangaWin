import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/hooks/useApi";
import {
  BookHeart,
  Telescope,
  History,
  Download,
  Settings,
  BookOpen,
  Bookmark,
  Ghost,
} from "lucide-react";
import { useHistoryStore } from "@/lib/store/historyStore";

export type View = "library" | "browse" | "history" | "downloads" | "settings";

const navItems = [
  { id: "library", path: "/library", label: "Library", icon: BookHeart },
  { id: "browse", path: "/browse", label: "Browse", icon: Telescope },
  { id: "history", path: "/history", label: "History", icon: History },
  { id: "downloads", path: "/downloads", label: "Downloads", icon: Download },
];

export function Sidebar() {
  const location = useLocation();
  const { data: library } = useLibrary();
  const mangas = library?.nodes || [];
  const { incognitoMode, toggleIncognitoMode } = useHistoryStore();

  return (
    <nav className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar no-select">
      <div className="flex flex-col gap-1 p-3">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Browse
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="size-[18px]" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
      <div className="mt-auto p-3 flex flex-col gap-1">
        <button
          onClick={toggleIncognitoMode}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            incognitoMode
              ? "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <Ghost className="size-[18px]" />
            Incognito Mode
          </div>
          <div className={cn("text-xs px-1.5 py-0.5 rounded-full font-bold", incognitoMode ? "bg-indigo-500/20" : "bg-muted text-muted-foreground")}>
            {incognitoMode ? "ON" : "OFF"}
          </div>
        </button>
        <NavLink
          to="/settings"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            location.pathname.startsWith("/settings")
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Settings className="size-[18px]" />
          Settings
        </NavLink>
      </div>
    </nav>
  );
}
