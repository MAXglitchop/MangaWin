import { getCurrentWindow } from '@tauri-apps/api/window';
import { useNavigate, useLocation } from 'react-router-dom';

export function Titlebar() {
  const appWindow = getCurrentWindow();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      onPointerDown={(e) => {
        if (e.buttons === 1) appWindow.startDragging();
      }}
      className="bg-black text-primary font-headline-sm text-headline-sm uppercase tracking-tighter h-[40px] fixed top-0 left-0 w-full z-[9999] flex justify-between items-center px-4"
    >
      <div className="flex items-center gap-6 font-headline-md text-headline-md text-primary font-bold select-none cursor-default">
        <div className="flex items-center gap-3">
          <img src="/MangaWin logo.svg" alt="Logo" className="w-6 h-6 object-contain" />
          MangaWin
        </div>
        {location.pathname !== '/advanced' && (
          <button
            onClick={() => navigate('/advanced')}
            className="material-symbols-outlined cursor-pointer hover:text-white transition-colors"
            title="MangaWin Settings"
            onPointerDown={(e) => e.stopPropagation()}
          >
            settings
          </button>
        )}
      </div>

      <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
        <button
          onClick={() => appWindow.minimize()}
          className="material-symbols-outlined cursor-pointer hover:bg-primary hover:text-on-primary transition-none"
        >
          remove
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="material-symbols-outlined cursor-pointer hover:bg-primary hover:text-on-primary transition-none"
        >
          check_box_outline_blank
        </button>
        <button
          onClick={() => appWindow.close()}
          className="material-symbols-outlined cursor-pointer hover:bg-primary hover:text-on-primary transition-none"
        >
          close
        </button>
      </div>
    </nav>
  );
}
