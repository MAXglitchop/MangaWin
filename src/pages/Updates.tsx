import { PageHeader, EmptyState } from "@/components/common";
import { RefreshCw } from "lucide-react";

export function UpdatesPage() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Updates" subtitle="Check for new chapters" />
      <div className="flex-1 overflow-y-auto p-6">
        <EmptyState
          icon={<RefreshCw size={28} />}
          title="No Updates"
          description="Updates from your library manga will appear here. Check back after a library refresh."
        />
      </div>
    </div>
  );
}
