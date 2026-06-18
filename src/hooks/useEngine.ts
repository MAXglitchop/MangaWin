import { useState, useEffect } from 'react';
import { tauriApi, AppSettings, LifecyclePhase } from '../lib/tauri';

export function useEngine() {
  const [settings, setSettings] = useState<AppSettings>({ port: '4567', custom_java_args: '' });
  const [phase, setPhase] = useState<LifecyclePhase>('Initializing');
  const [logs, setLogs] = useState<Array<{type: string, message: string}>>([]);

  useEffect(() => {
    // Load initial settings and status
    tauriApi.getSettings().then(setSettings);
    tauriApi.checkEngineStatus().then(setPhase);

    // Listen to phase changes
    const unlistenStatus = tauriApi.onLifecycleChange((newPhase) => {
      setPhase(newPhase);
    });

    // Listen to real-time logs
    const unlistenLog = tauriApi.onLogMessage((log) => {
      setLogs(prev => {
        const newLogs = [...prev, log];
        if (newLogs.length > 1000) newLogs.shift();
        return newLogs;
      });
    });

    return () => {
      unlistenStatus.then(f => f());
      unlistenLog.then(f => f());
    };
  }, []);

  const saveSettings = async (port: string, args: string) => {
    await tauriApi.saveSettings(port, args);
    setSettings({ port, custom_java_args: args });
  };

  const retryLaunch = async () => {
    setLogs([]);
    await tauriApi.launchEngine();
  };

  return {
    settings,
    phase,
    logs,
    setPhase,
    saveSettings,
    retryLaunch
  };
}
