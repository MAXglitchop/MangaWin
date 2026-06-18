import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";
import { useLibraryStore, type TriState, type SortField } from "@/lib/store/uiStore";

// TriStateCheckbox Component
function TriStateCheckbox({ label, value, onChange }: { label: string, value: TriState, onChange: (v: TriState) => void }) {
  const handleClick = () => {
    if (value === "IGNORE") onChange("INCLUDE");
    else if (value === "INCLUDE") onChange("EXCLUDE");
    else onChange("IGNORE");
  };

  return (
    <button onClick={handleClick} className="flex items-center gap-3 py-2 w-full text-left group outline-none">
      <div className={cn(
        "flex size-5 items-center justify-center rounded border transition-colors",
        value === "IGNORE" ? "border-border bg-transparent group-hover:border-primary/50" : "border-primary bg-primary text-primary-foreground"
      )}>
        {value === "INCLUDE" && <Check className="size-3.5" strokeWidth={3} />}
        {value === "EXCLUDE" && <Minus className="size-3.5" strokeWidth={3} />}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

// Simple Checkbox
function SimpleCheckbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-3 py-2 w-full text-left group outline-none">
      <div className={cn(
        "flex size-5 items-center justify-center rounded border transition-colors",
        !checked ? "border-border bg-transparent group-hover:border-primary/50" : "border-primary bg-primary text-primary-foreground"
      )}>
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

// Radio Button
function RadioOption({ label, checked, onClick }: { label: string, checked: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 py-2 w-full text-left group outline-none">
      <div className={cn(
        "flex size-5 items-center justify-center rounded-full border transition-colors",
        !checked ? "border-border bg-transparent group-hover:border-primary/50" : "border-primary bg-transparent"
      )}>
        {checked && <div className="size-2.5 rounded-full bg-primary" />}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

export function LibraryFilterSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"FILTER" | "SORT" | "DISPLAY">("FILTER");
  
  const store = useLibraryStore();

  // Animation state for slide up
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      setTimeout(() => setMounted(false), 300); // Wait for slide out
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div 
        className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <div 
        className={cn(
          "relative flex w-full max-w-sm flex-col rounded-t-2xl sm:rounded-xl bg-background shadow-2xl transition-transform duration-300 h-[85vh] sm:h-[600px] border border-border/50",
          isOpen ? "translate-y-0 scale-100" : "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0"
        )}
      >
        {/* Tabs Header */}
        <div className="flex items-center border-b border-border shrink-0">
          <button onClick={() => setActiveTab("FILTER")} className={cn("flex-1 py-4 text-xs font-bold tracking-widest transition-colors border-b-2", activeTab === "FILTER" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>FILTER</button>
          <button onClick={() => setActiveTab("SORT")} className={cn("flex-1 py-4 text-xs font-bold tracking-widest transition-colors border-b-2", activeTab === "SORT" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>SORT</button>
          <button onClick={() => setActiveTab("DISPLAY")} className={cn("flex-1 py-4 text-xs font-bold tracking-widest transition-colors border-b-2", activeTab === "DISPLAY" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>DISPLAY</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === "FILTER" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <TriStateCheckbox label="Unread" value={store.filterUnread} onChange={store.setFilterUnread} />
                <TriStateCheckbox label="Started" value={store.filterStarted} onChange={store.setFilterStarted} />
                <TriStateCheckbox label="Downloaded" value={store.filterDownloaded} onChange={store.setFilterDownloaded} />
                <TriStateCheckbox label="Bookmarked" value={store.filterBookmarked} onChange={store.setFilterBookmarked} />
              </div>
              
              <div className="pt-5 border-t border-border">
                <h3 className="mb-4 text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">Status</h3>
                <div className="space-y-1">
                  {["Cancelled", "Completed", "Licensed", "Ongoing", "Hiatus", "Publishing finished", "Unknown"].map(status => {
                    const isChecked = store.filterStatus.includes(status);
                    return (
                      <SimpleCheckbox 
                        key={status} 
                        label={status} 
                        checked={isChecked} 
                        onChange={(c) => {
                          if (c) store.setFilterStatus([...store.filterStatus, status]);
                          else store.setFilterStatus(store.filterStatus.filter(s => s !== status));
                        }} 
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "SORT" && (
            <div className="space-y-1">
              {[
                { id: "UNREAD", label: "Unread chapters" },
                { id: "TOTAL_CHAPTERS", label: "Total chapters" },
                { id: "ALPHABETICAL", label: "A-Z" },
                { id: "DATE_ADDED", label: "Recently added" },
                { id: "LAST_READ", label: "Recently read" },
                { id: "LATEST_CHAPTER", label: "Latest fetched chapter" }
              ].map(sort => (
                <div key={sort.id} className="flex items-center justify-between group rounded-md hover:bg-secondary/50 -mx-2 px-2">
                  <div className="flex-1">
                    <RadioOption 
                      label={sort.label} 
                      checked={store.sortField === sort.id} 
                      onClick={() => {
                        if (store.sortField === sort.id) {
                          store.setSortDirection(store.sortDirection === "ASC" ? "DESC" : "ASC");
                        } else {
                          store.setSortField(sort.id as SortField);
                          // Default descending for most numeric/date things, asc for alphabetical
                          store.setSortDirection(sort.id === "ALPHABETICAL" ? "ASC" : "DESC");
                        }
                      }} 
                    />
                  </div>
                  {store.sortField === sort.id && (
                    <button 
                      className="p-2 text-primary hover:bg-secondary rounded-full transition-colors"
                      onClick={() => store.setSortDirection(store.sortDirection === "ASC" ? "DESC" : "ASC")}
                    >
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-300", store.sortDirection === "DESC" && "rotate-180")}>
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                       </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "DISPLAY" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="mb-4 text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">Display mode</h3>
                <RadioOption label="Compact grid" checked={store.viewMode === "COMPACT_GRID"} onClick={() => store.setViewMode("COMPACT_GRID")} />
                <RadioOption label="Comfortable grid" checked={store.viewMode === "COMFORTABLE_GRID"} onClick={() => store.setViewMode("COMFORTABLE_GRID")} />
                <RadioOption label="List" checked={store.viewMode === "LIST"} onClick={() => store.setViewMode("LIST")} />
              </div>

              <div className="pt-5 border-t border-border space-y-1">
                <h3 className="mb-4 text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">Badges</h3>
                <SimpleCheckbox label="Unread badges" checked={store.showUnreadBadge} onChange={store.setShowUnreadBadge} />
                <SimpleCheckbox label="Download badges" checked={store.showDownloadBadge} onChange={store.setShowDownloadBadge} />
              </div>

              <div className="pt-5 border-t border-border space-y-1">
                <h3 className="mb-4 text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">Tabs</h3>
                <SimpleCheckbox label="Show number of items" checked={store.showItemCount} onChange={store.setShowItemCount} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
