import { useParams, useNavigate } from "react-router-dom";
import { useSourcePreferences, useUninstallExtension } from "@/hooks/useApi";
import { getServerUrl } from "@/lib/api/client";
import { PreferenceItem } from "@/components/extensions/PreferenceItem";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";

export function ExtensionSettings() {
  const { sourceId } = useParams();
  const navigate = useNavigate();
  const { data: source, isLoading } = useSourcePreferences(sourceId);
  const uninstallMutation = useUninstallExtension();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    );
  }

  if (!source) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Extension not found</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 text-primary hover:underline text-sm font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  // Finding the matching extension to uninstall uses pkgName.
  // Suwayomi API doesn't return pkgName in `source` easily without parsing.
  // However, `updateExtension` needs `pkgName`. We can guess it from `source.id` but the backend uses `pkgName` for uninstall.
  // We can just omit the uninstall button here if it's too complex to get pkgName, or we can use the `extensions` cache.
  // Actually, we can fetch extensions list and find the one that matches this source name/lang.
  
  return (
    <div className="flex h-full flex-col">
      {/* Header Bar */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Extension info
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Info Header */}
        <div className="flex flex-col items-center py-8 bg-secondary/20">
          <div className="size-24 rounded-2xl overflow-hidden bg-secondary mb-4 shadow-sm border border-border">
            {source.iconUrl ? (
              <img 
                src={`${getServerUrl()}${source.iconUrl}`} 
                alt={source.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
                {source.name.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">{source.name}</h2>
          <p className="text-xs text-muted-foreground mt-1">en.{source.name.toLowerCase()}</p>
          
          <div className="flex items-center gap-16 mt-8">
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold">{source.extension?.versionName || source.version || "Unknown"}</span>
              <span className="text-xs text-muted-foreground">Version</span>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold capitalize">{source.lang}</span>
              <span className="text-xs text-muted-foreground">Language</span>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-red-500">{source.isNsfw ? "18+" : "All ages"}</span>
              <span className="text-xs text-muted-foreground">Age rating</span>
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="p-6">
          {source.preferences && source.preferences.length > 0 ? (
            <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-card">
              {source.preferences.map((pref, index) => (
                <PreferenceItem 
                  key={pref.key} 
                  sourceId={source.id}
                  position={index}
                  preference={pref}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>No settings available for this extension.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
