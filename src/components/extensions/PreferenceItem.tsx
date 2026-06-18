import { useState } from "react";
import { Preference } from "@/lib/api/types";
import { useUpdateSourcePreference } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
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

export function PreferenceItem({
  sourceId,
  position,
  preference,
}: {
  sourceId: string;
  position: number;
  preference: Preference;
}) {
  const mutation = useUpdateSourcePreference();

  const handleUpdate = (updates: any) => {
    mutation.mutate({
      sourceId,
      change: {
        position,
        ...updates
      }
    }, {
      onError: () => toast.error("Failed to update preference")
    });
  };

  switch (preference.__typename) {
    case "SwitchPreference":
    case "CheckBoxPreference":
      return (
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5 last:border-b-0">
          <div className="pr-4">
            <p className="text-sm font-medium text-foreground">{preference.title}</p>
            <p className="text-xs text-muted-foreground">{preference.summary}</p>
          </div>
          <Toggle 
            enabled={(preference as any).currentValue ?? (preference as any).default} 
            onChange={(v) => {
              if (preference.__typename === "SwitchPreference") {
                handleUpdate({ switchState: v });
              } else {
                handleUpdate({ checkBoxState: v });
              }
            }} 
          />
        </div>
      );

    case "ListPreference":
      return (
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5 last:border-b-0">
          <div className="pr-4">
            <p className="text-sm font-medium text-foreground">{preference.title}</p>
            <p className="text-xs text-muted-foreground">{preference.summary}</p>
          </div>
          <select
            value={(preference as any).currentValue ?? (preference as any).default}
            onChange={(e) => handleUpdate({ listState: e.target.value })}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring max-w-[200px]"
          >
            {(preference as any).entryValues?.map((val: string, idx: number) => (
              <option key={val} value={val}>
                {(preference as any).entries[idx] || val}
              </option>
            ))}
          </select>
        </div>
      );

    case "EditTextPreference":
      return (
        <div className="flex flex-col border-b border-border px-4 py-3.5 last:border-b-0">
          <p className="text-sm font-medium text-foreground">{preference.title}</p>
          <p className="text-xs text-muted-foreground mb-2">{preference.summary}</p>
          <div className="flex gap-2">
            <input
              type="text"
              defaultValue={(preference as any).currentValue ?? (preference as any).default}
              onBlur={(e) => handleUpdate({ editTextState: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring"
            />
          </div>
        </div>
      );

    case "MultiSelectListPreference":
      return (
        <div className="flex flex-col border-b border-border px-4 py-3.5 last:border-b-0">
          <p className="text-sm font-medium text-foreground">{preference.title}</p>
          <p className="text-xs text-muted-foreground mb-3">{preference.summary}</p>
          <div className="space-y-2 pl-2">
            {(preference as any).entryValues?.map((val: string, idx: number) => {
              const active = ((preference as any).currentValue ?? (preference as any).default ?? []).includes(val);
              return (
                <label key={val} className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                    active ? "bg-primary border-primary text-primary-foreground" : "border-border group-hover:border-foreground/50"
                  )}>
                    {active && <Check className="h-3 w-3" />}
                  </div>
                  <span className="text-sm text-foreground/90">{(preference as any).entries[idx] || val}</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={active}
                    onChange={(e) => {
                      const current = new Set((preference as any).currentValue ?? (preference as any).default ?? []);
                      if (e.target.checked) current.add(val);
                      else current.delete(val);
                      handleUpdate({ multiSelectState: Array.from(current) });
                    }}
                  />
                </label>
              );
            })}
          </div>
        </div>
      );

    default:
      return (
        <div className="px-4 py-3 border-b border-border text-sm text-muted-foreground">
          Unsupported preference type: {(preference as any).__typename}
        </div>
      );
  }
}
