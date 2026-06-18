import { LifecyclePhase } from '../../lib/tauri';
import { Loader2 } from 'lucide-react';

interface SplashProps {
  phase: LifecyclePhase;
}

export function Splash({ phase }: SplashProps) {
  let title = "Preparing MangaWin";
  let message = "Please wait while we set things up...";
  let progress = undefined;

  if (phase === 'Initializing') {
    message = "Checking local environment...";
  } else if (typeof phase === 'object' && 'Installing' in phase) {
    title = "Installing Components";
    message = "Downloading engine and runtime securely...";
    progress = phase.Installing;
  } else if (phase === 'Starting') {
    title = "Starting Library Service";
    message = "Warming up the Suwayomi engine, please wait...";
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f13] relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6d42e5]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#815af3]/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Main Card */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8 py-10 bg-[#1a1a24]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
        
        {/* Animated Logo Container */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#6d42e5] rounded-full blur-xl opacity-30 animate-pulse" />
          <img 
            src="/MangaWin logo.svg" 
            alt="MangaWin Logo" 
            className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(109,66,229,0.5)] animate-bounce-slow"
          />
        </div>

        {/* Text content */}
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2 text-center drop-shadow-md">
          {title}
        </h2>
        <div className="flex items-center gap-2 text-[#9a9cae] text-sm mb-6 text-center">
          <Loader2 className="w-4 h-4 animate-spin text-[#6d42e5]" />
          <p>{message}</p>
        </div>
        
        {/* Progress Bar (Only shows when downloading) */}
        {progress !== undefined ? (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-[#9a9cae] font-medium tracking-wider px-1">
              <span>DOWNLOADING</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-black/50 rounded-full h-2.5 border border-white/5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#6d42e5] to-[#815af3] rounded-full relative"
                style={{ 
                  width: `${Math.max(2, progress)}%`,
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Shine effect on progress bar */}
                <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
        ) : (
          /* Indeterminate loading state */
          <div className="w-48 h-1 bg-black/50 rounded-full overflow-hidden mt-2 relative">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-[#6d42e5] to-transparent w-1/2 animate-[slide_1.5s_ease-in-out_infinite]" />
          </div>
        )}
        
      </div>
    </div>
  );
}
