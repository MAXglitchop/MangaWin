import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';

import { Titlebar } from './components/Layout/Titlebar';
import { Splash } from './components/Views/Splash';
import { Recovery } from './components/Views/Recovery';
import { WebUI } from './components/Views/WebUI';
import { Diagnostics } from './components/Views/Diagnostics';
import { Advanced } from './components/Views/Advanced';
import { useEngine } from './hooks/useEngine';

function App() {
  const { settings, phase, retryLaunch } = useEngine();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    let wasMaximized = false;

    const toggleFullscreen = async () => {
      const isFull = await appWindow.isFullscreen();
      if (!isFull) {
        wasMaximized = await appWindow.isMaximized();
        if (wasMaximized) {
          await appWindow.unmaximize();
          await new Promise(r => setTimeout(r, 100));
        }
        await appWindow.setFullscreen(true);
        setIsFullscreen(true);
      } else {
        await appWindow.setFullscreen(false);
        setIsFullscreen(false);
        // Restore maximized state if it was maximized before
        if (wasMaximized) {
          await new Promise(r => setTimeout(r, 100));
          await appWindow.maximize();
        }
      }
    };

    const exitFullscreen = async () => {
      const isFull = await appWindow.isFullscreen();
      if (isFull) {
        await appWindow.setFullscreen(false);
        setIsFullscreen(false);
        if (wasMaximized) {
          await new Promise(r => setTimeout(r, 100));
          await appWindow.maximize();
        }
      }
    };

    // Register OS-level global shortcuts so they work even when the iframe has focus
    register('F11', (e) => {
      if (e.state === 'Pressed') {
        toggleFullscreen();
      }
    });

    register('Escape', (e) => {
      if (e.state === 'Pressed') {
        exitFullscreen();
      }
    });

    return () => {
      unregister('F11');
      unregister('Escape');
    };
  }, []);



  let dashboardContent = null;
  
  if (phase === 'Initializing' || phase === 'Starting' || (typeof phase === 'object' && 'Installing' in phase)) {
    dashboardContent = <Splash phase={phase} />;
  } else if (phase === 'Ready') {
    dashboardContent = <WebUI port={settings.port} />;
  } else if (typeof phase === 'object' && 'Crashed' in phase) {
    dashboardContent = <Recovery error={phase.Crashed} onRetry={retryLaunch} />;
  } else {
    dashboardContent = <Splash phase={'Initializing'} />;
  }

  const isWebUI = phase === 'Ready';

  return (
    <>
      {!isFullscreen && <Titlebar />}
      <div className="app-container" style={{ width: '100%', height: '100%', paddingTop: isFullscreen ? '0' : '40px', boxSizing: 'border-box' }}>
      <div className="main-content" style={isWebUI ? { padding: 0 } : {}}>
        <Routes>
          <Route path="/" element={
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              {dashboardContent}
            </div>
          } />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/advanced" element={<Advanced />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
    </>
  );
}

export default App;
