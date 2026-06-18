import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Loader2, Server } from "lucide-react";
import { PageHeader } from "./common";

export function BootScreen({ onReady }: { onReady: () => void }) {
  const [status, setStatus] = useState<"checking" | "downloading" | "starting" | "error">("checking");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function bootSequence() {
      try {
        // 1. Check if server exists
        const exists = await invoke<boolean>("check_server_exists");
        
        if (!exists) {
          setStatus("downloading");
          // Set up progress listener
          const unlisten = await listen<{ progress: number }>("download_progress", (event) => {
            setProgress(event.payload.progress);
          });
          
          // 2. Download and extract
          await invoke("download_server");
          unlisten();
        }

        // 3. Start server
        setStatus("starting");
        await invoke("setup_server_config");
        await invoke("start_server");

        // Wait a bit for the Java process to bind to its port
        setTimeout(() => {
          onReady();
        }, 5000);

      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.toString());
      }
    }

    bootSequence();
  }, [onReady]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground overflow-hidden">
      <div className="max-w-md w-full p-8 rounded-xl bg-card border border-border shadow-xl flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Server className="w-8 h-8 text-accent" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">
            {status === "checking" && "Initializing Engine..."}
            {status === "downloading" && "Downloading Core Server..."}
            {status === "starting" && "Starting Local Server..."}
            {status === "error" && "Boot Failed"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {status === "checking" && "Checking local files"}
            {status === "downloading" && "This only happens once. Please wait while MangaWin downloads the backend."}
            {status === "starting" && "Warming up the background process"}
            {status === "error" && "An error occurred during startup."}
          </p>
        </div>

        {status === "downloading" && (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Downloading</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {(status === "checking" || status === "starting") && (
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        )}

        {status === "error" && (
          <div className="w-full p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-left font-mono break-words">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
