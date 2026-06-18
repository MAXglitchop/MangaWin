import { useState } from "react";
import { useServerStore } from "@/lib/store/serverStore";
import { useReaderStore, useUIStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils";
import {
  Glasses,
  Palette,
  ChevronRight,
  Server,
  Save,
  Check,
  Puzzle,
  Trash2,
  Plus,
  Telescope,
  BookHeart
} from "lucide-react";
import { useServerInfo, useSettings, useSetSettings } from "../hooks/useApi";
import { toast } from "sonner";

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        enabled ? "bg-primary" : "bg-secondary"
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

const sections = [
  { id: "server", label: "Server", icon: Server },
  { id: "library", label: "Library", icon: BookHeart },
  { id: "browse", label: "Browse", icon: Telescope },
  { id: "reader", label: "Reader", icon: Glasses },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export function SettingsPage() {
  const { url, setUrl } = useServerStore();
  const { 
    readingMode, setReadingMode,
    imageScaleType, setImageScaleType,
    zoomStartPosition, setZoomStartPosition,
    animateTransitions, setAnimateTransitions,
    backgroundColor, setBackgroundColor,
    fullscreen, setFullscreen,
    keepScreenOn, setKeepScreenOn,
    showPageNumber, setShowPageNumber,
    tapZones, setTapZones,
    volumeKeyNavigation, setVolumeKeyNavigation,
    invertVolumeKeys, setInvertVolumeKeys
  } = useReaderStore();
  const {
    themeMode, setThemeMode,
    themePalette, setThemePalette,
    pureBlack, setPureBlack,
    thumbnailBackground, setThumbnailBackground,
    dynamicTheme, setDynamicTheme,
    showNSFW, setShowNSFW,
    hideInLibrary, setHideInLibrary
  } = useUIStore();
  const [active, setActive] = useState("server");
  const [serverUrl, setServerUrl] = useState(url);
  const [saved, setSaved] = useState(false);
  const [newRepo, setNewRepo] = useState("");

  const { data: settings } = useSettings();
  const setSettingsMutation = useSetSettings();

  const handleAddRepo = () => {
    if (!newRepo.trim()) return;
    const currentRepos = settings?.extensionRepos || [];
    if (currentRepos.includes(newRepo.trim())) {
      toast.error("Repository already exists");
      return;
    }
    
    setSettingsMutation.mutate({
      settings: { extensionRepos: [...currentRepos, newRepo.trim()] }
    }, {
      onSuccess: () => {
        toast.success("Repository added");
        setNewRepo("");
      },
      onError: (err: any) => toast.error(err.message || "Failed to add repository")
    });
  };

  const handleRemoveRepo = (repo: string) => {
    const currentRepos = settings?.extensionRepos || [];
    setSettingsMutation.mutate({
      settings: { extensionRepos: currentRepos.filter(r => r !== repo) }
    }, {
      onSuccess: () => toast.success("Repository removed"),
      onError: (err: any) => toast.error(err.message || "Failed to remove repository")
    });
  };

  const handleSave = () => {
    setUrl(serverUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-8 py-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize your reading experience.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-60 shrink-0 border-r border-border p-3">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active === s.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-[18px]" />
                  {s.label}
                </span>
                <ChevronRight className="size-4 opacity-40" />
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {active === "server" && (
            <SettingsGroup title="Server Connection">
              <div className="flex items-center justify-between border-b border-border px-4 py-3.5 last:border-b-0">
                <div className="pr-4 flex-1">
                  <p className="text-sm font-medium text-foreground">Suwayomi Server URL</p>
                  <p className="text-xs text-muted-foreground">The endpoint where your Suwayomi instance is running.</p>
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground outline-none focus:border-ring"
                    />
                    <button
                      onClick={handleSave}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5",
                        saved
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      {saved ? <><Check className="size-3.5" /> Saved</> : <><Save className="size-3.5" /> Save</>}
                    </button>
                  </div>
                </div>
              </div>
            </SettingsGroup>
          )}

          {active === "reader" && (
            <div className="mx-auto max-w-3xl space-y-8">
              <SettingsGroup title="Reading">
                <SelectRow
                  label="Default reading mode"
                  options={["Right to left", "Left to right", "Vertical", "Webtoon", "Continuous vertical"]}
                  value={
                    readingMode === "rtl" ? "Right to left" :
                    readingMode === "ltr" ? "Left to right" :
                    readingMode === "vertical" ? "Vertical" :
                    readingMode === "webtoon" ? "Webtoon" : "Continuous vertical"
                  }
                  onChange={(v) => {
                    const map: any = {
                      "Right to left": "rtl",
                      "Left to right": "ltr",
                      "Vertical": "vertical",
                      "Webtoon": "webtoon",
                      "Continuous vertical": "continuous"
                    };
                    setReadingMode(map[v]);
                  }}
                />
                <Row label="Animate page transitions" desc="Smoothly slide pages when turning">
                  <Toggle enabled={animateTransitions} onChange={setAnimateTransitions} />
                </Row>
                <SelectRow
                  label="Image scale type"
                  options={["Fit screen", "Stretch", "Fit width", "Fit height"]}
                  value={
                    imageScaleType === "fit-screen" ? "Fit screen" :
                    imageScaleType === "stretch" ? "Stretch" :
                    imageScaleType === "fit-width" ? "Fit width" : "Fit height"
                  }
                  onChange={(v) => {
                    const map: any = {
                      "Fit screen": "fit-screen",
                      "Stretch": "stretch",
                      "Fit width": "fit-width",
                      "Fit height": "fit-height"
                    };
                    setImageScaleType(map[v]);
                  }}
                />
                <SelectRow
                  label="Zoom start position"
                  options={["Automatic", "Left", "Right", "Center"]}
                  value={zoomStartPosition.charAt(0).toUpperCase() + zoomStartPosition.slice(1)}
                  onChange={(v) => setZoomStartPosition(v.toLowerCase() as any)}
                />
              </SettingsGroup>

              <SettingsGroup title="Display">
                <SelectRow
                  label="Background color"
                  options={["White", "Black", "Gray", "Automatic"]}
                  value={backgroundColor.charAt(0).toUpperCase() + backgroundColor.slice(1)}
                  onChange={(v) => setBackgroundColor(v.toLowerCase() as any)}
                />
                <Row label="Fullscreen" desc="Hide the system UI while reading">
                  <Toggle enabled={fullscreen} onChange={setFullscreen} />
                </Row>
                <Row label="Keep screen on" desc="Prevent the device from sleeping while reading">
                  <Toggle enabled={keepScreenOn} onChange={setKeepScreenOn} />
                </Row>
                <Row label="Show page number" desc="Display the current page number at the bottom">
                  <Toggle enabled={showPageNumber} onChange={setShowPageNumber} />
                </Row>
              </SettingsGroup>

              <SettingsGroup title="Navigation">
                <SelectRow
                  label="Tap zones"
                  options={["Normal", "Inverted", "None"]}
                  value={tapZones.charAt(0).toUpperCase() + tapZones.slice(1)}
                  onChange={(v) => setTapZones(v.toLowerCase() as any)}
                />
              </SettingsGroup>
            </div>
          )}

          {active === "appearance" && (
            <div className="mx-auto max-w-3xl space-y-8">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Theme</h2>
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                    <p className="text-sm font-medium text-foreground">Theme mode</p>
                    <select
                      value={themeMode}
                      onChange={(e) => setThemeMode(e.target.value as any)}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring"
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  
                  <div className="px-4 py-4 border-b border-border">
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 custom-scrollbar">
                      {[
                        { id: "default", name: "Default", bg: "#1e1b4b", accent: "#6366f1", primary: "#4f46e5" },
                        { id: "lavender", name: "Lavender", bg: "#2D2140", accent: "#B585F8", primary: "#9B6BE4" },
                        { id: "dune", name: "Dune", bg: "#332A20", accent: "#D6B58F", primary: "#C4A076" },
                        { id: "rosegold", name: "Rosegold", bg: "#332224", accent: "#E6A0A9", primary: "#D88691" },
                        { id: "forest-dew", name: "Forest Dew", bg: "#1A2E26", accent: "#71CF9D", primary: "#59BA87" },
                        { id: "mountain-sunset", name: "Mountain Sunset", bg: "#362134", accent: "#E86D9E", primary: "#D65487" },
                        { id: "crimson", name: "Crimson", bg: "#331A1A", accent: "#F25A5A", primary: "#E04343" },
                        { id: "minty-miracles", name: "Minty Miracles", bg: "#1F3333", accent: "#6DE6CC", primary: "#52D4BA" },
                        { id: "orange-juice", name: "Orange Juice", bg: "#332514", accent: "#FC9F4C", primary: "#E88935" },
                      ].map(p => (
                        <button 
                          key={p.id}
                          onClick={() => setThemePalette(p.id as any)}
                          className="flex flex-col items-center gap-3 shrink-0 outline-none group"
                        >
                          <div 
                            className={cn(
                              "relative h-36 w-24 rounded-xl border-2 p-2.5 transition-all duration-300",
                              themePalette === p.id ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-background" : "border-border group-hover:border-muted-foreground group-focus-visible:border-primary"
                            )}
                            style={{ backgroundColor: p.bg }}
                          >
                            {themePalette === p.id && (
                              <div className="absolute -top-2 -right-2 rounded-full bg-background shadow-md p-0.5 border border-border">
                                <Check className="size-4 text-[var(--color-primary)]" />
                              </div>
                            )}
                            <div className="h-3 w-10 rounded-sm mb-4" style={{ backgroundColor: p.primary }}></div>
                            <div className="h-12 w-full rounded-md mb-2 bg-black/20 flex gap-1.5 p-1.5">
                                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: p.accent }}></div>
                                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: p.primary }}></div>
                            </div>
                            <div className="absolute bottom-3 left-2.5 right-2.5 flex justify-between items-center">
                              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: p.accent }}></div>
                              <div className="h-3 w-10 rounded-sm" style={{ backgroundColor: p.primary }}></div>
                            </div>
                          </div>
                          <span className={cn(
                            "text-xs font-medium transition-colors",
                            themePalette === p.id ? "text-foreground font-bold" : "text-muted-foreground"
                          )}>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Row label="Pure black dark mode" desc="Uses absolute black for OLED screens">
                    <Toggle enabled={pureBlack} onChange={setPureBlack} />
                  </Row>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Display</h2>
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <SelectRow label="Language" options={["English", "Feel free to translate the project"]} />
                  
                  <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                    <div className="pr-4">
                      <p className="text-sm font-medium text-foreground">Manga item width</p>
                      <p className="text-xs text-muted-foreground">px: 300</p>
                    </div>
                  </div>

                  <Row label="Manga thumbnail as background" desc="Sets the manga thumbnail as the background image on the manga page">
                    <Toggle enabled={thumbnailBackground} onChange={setThumbnailBackground} />
                  </Row>

                  <Row label="Dynamic theme colors on manga page" desc="Changes the theme colors on the manga page based on the thumbnail">
                    <Toggle enabled={dynamicTheme} onChange={setDynamicTheme} />
                  </Row>
                </div>
              </div>
            </div>
          )}

          {active === "library" && (
            <div className="mx-auto max-w-3xl space-y-8">
              <SettingsGroup title="Library Updates">
                <SelectRow
                  label="Update frequency"
                  options={["Manual", "12 hours", "24 hours", "48 hours", "72 hours", "Weekly"]}
                  value={
                    settings?.globalUpdateInterval === 0 ? "Manual" :
                    settings?.globalUpdateInterval === 12 ? "12 hours" :
                    settings?.globalUpdateInterval === 24 ? "24 hours" :
                    settings?.globalUpdateInterval === 48 ? "48 hours" :
                    settings?.globalUpdateInterval === 72 ? "72 hours" :
                    settings?.globalUpdateInterval === 168 ? "Weekly" : "12 hours"
                  }
                  onChange={(v) => {
                    const map: any = {
                      "Manual": 0,
                      "12 hours": 12,
                      "24 hours": 24,
                      "48 hours": 48,
                      "72 hours": 72,
                      "Weekly": 168
                    };
                    setSettingsMutation.mutate({ settings: { globalUpdateInterval: map[v] } }, {
                      onSuccess: () => toast.success("Update frequency changed")
                    });
                  }}
                />
              </SettingsGroup>
            </div>
          )}



          {active === "browse" && (
            <div className="mx-auto max-w-3xl space-y-8">
              <SettingsGroup title="Browse">
                <Row label="Hide entries already in library" desc="When searching, hide manga that you have already added to your library">
                  <Toggle enabled={hideInLibrary} onChange={setHideInLibrary} />
                </Row>
                <Row label="Show NSFW" desc="Show 18+ extensions and sources in the Browse menu">
                  <Toggle enabled={showNSFW} onChange={setShowNSFW} />
                </Row>
              </SettingsGroup>

              <SettingsGroup title="Extension Repositories">
                <div className="flex flex-col border-b border-border px-4 py-3.5 last:border-b-0">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-foreground">Custom Repositories</p>
                    <p className="text-xs text-muted-foreground mb-3">Add JSON index URLs to install third-party extensions.</p>
                    
                    <div className="space-y-2 mb-4">
                      {(settings?.extensionRepos || []).map((repo) => (
                        <div key={repo} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 border border-border">
                          <span className="text-xs font-mono truncate mr-2">{repo}</span>
                          <button
                            onClick={() => handleRemoveRepo(repo)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                      {(!settings?.extensionRepos || settings.extensionRepos.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">No custom repositories added.</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newRepo}
                        onChange={(e) => setNewRepo(e.target.value)}
                        className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground outline-none focus:border-ring"
                      />
                      <button
                        onClick={handleAddRepo}
                        disabled={setSettingsMutation.isPending || !newRepo.trim()}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Plus className="size-3.5" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              </SettingsGroup>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="overflow-hidden rounded-xl border border-border">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3.5 last:border-b-0">
      <div className="pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function SelectRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [local, setLocal] = useState(value || options[0]);
  const currentValue = value || local;

  const handleChange = (v: string) => {
    setLocal(v);
    onChange?.(v);
  };

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3.5 last:border-b-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
