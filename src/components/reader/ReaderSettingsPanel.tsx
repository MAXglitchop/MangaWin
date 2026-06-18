import { X, Settings2 } from "lucide-react";
import { useReaderStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils";

interface ReaderSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

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
        "inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors outline-none",
        enabled ? "bg-primary" : "bg-white/20"
      )}
    >
      <span
        className={cn(
          "size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          enabled ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
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
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-white/5 last:border-0">
      <label className="text-sm font-medium text-white/90">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
      >
        {options.map(o => <option key={o} value={o} className="bg-neutral-900 text-white">{o}</option>)}
      </select>
    </div>
  );
}

function Row({ label, desc, children }: { label: string, desc?: string, children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="pr-4">
        <p className="text-sm font-medium text-white/90">{label}</p>
        {desc && <p className="text-[11px] text-white/50 leading-tight mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Group({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 px-1">{title}</h3>
      <div className="bg-white/5 rounded-xl border border-white/10 px-4">
        {children}
      </div>
    </div>
  );
}

export function ReaderSettingsPanel({ isOpen, onClose }: ReaderSettingsPanelProps) {
  const { 
    readingMode, setReadingMode,
    imageScaleType, setImageScaleType,
    zoomStartPosition, setZoomStartPosition,
    animateTransitions, setAnimateTransitions,
    backgroundColor, setBackgroundColor,
    fullscreen, setFullscreen,
    keepScreenOn, setKeepScreenOn,
    showPageNumber, setShowPageNumber,
    tapZones, setTapZones
  } = useReaderStore();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 z-[70] w-80 bg-neutral-950 border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Settings2 className="size-5" />
            <h2 className="font-semibold text-lg">Reader Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          
          <Group title="Reading">
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
            <Row label="Animate page transitions">
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
          </Group>

          <Group title="Display">
            <SelectRow
              label="Background color"
              options={["White", "Black", "Gray", "Automatic"]}
              value={backgroundColor.charAt(0).toUpperCase() + backgroundColor.slice(1)}
              onChange={(v) => setBackgroundColor(v.toLowerCase() as any)}
            />
            <Row label="Fullscreen" desc="Restart reader to apply">
              <Toggle enabled={fullscreen} onChange={setFullscreen} />
            </Row>
            <Row label="Keep screen on">
              <Toggle enabled={keepScreenOn} onChange={setKeepScreenOn} />
            </Row>
            <Row label="Show page number">
              <Toggle enabled={showPageNumber} onChange={setShowPageNumber} />
            </Row>
          </Group>

          <Group title="Navigation">
            <SelectRow
              label="Tap zones"
              options={["Normal", "Inverted", "None"]}
              value={tapZones.charAt(0).toUpperCase() + tapZones.slice(1)}
              onChange={(v) => setTapZones(v.toLowerCase() as any)}
            />
          </Group>

        </div>
      </div>
    </>
  );
}
