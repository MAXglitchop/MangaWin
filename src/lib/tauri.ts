import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface AppSettings {
  port: string;
  custom_java_args: string;
}

export type LifecyclePhase = 
  | 'Initializing' 
  | { Installing: number } 
  | 'Starting' 
  | 'Ready' 
  | { Crashed: string };

export const tauriApi = {
  getSettings: async (): Promise<AppSettings> => {
    try {
      return await invoke('get_settings');
    } catch {
      return { port: '4567', custom_java_args: '' };
    }
  },
  
  saveSettings: async (port: string, custom_java_args: string): Promise<void> => {
    await invoke('save_settings', { port, custom_java_args });
  },
  
  checkEngineStatus: async (): Promise<LifecyclePhase> => {
    try {
      return await invoke('check_engine_status');
    } catch {
      return { Crashed: 'Failed to connect to backend' };
    }
  },
  
  launchEngine: async (): Promise<void> => {
    await invoke('launch_engine');
  },
  
  stopEngine: async (): Promise<void> => {
    await invoke('stop_engine');
  },

  resetApp: async (): Promise<void> => {
    await invoke('reset_app');
  },
  
  getRecentLogs: async (): Promise<Array<{type: string, message: string}>> => {
    try {
      return await invoke('get_recent_logs');
    } catch {
      return [];
    }
  },

  exportLogs: async (path: string): Promise<void> => {
    await invoke('export_logs', { path });
  },
  
  onLogMessage: (callback: (log: { type: 'info' | 'error' | 'success', message: string }) => void) => {
    return listen<{ type: 'info' | 'error' | 'success', message: string }>('engine-log', (event) => {
      callback(event.payload);
    });
  },

  onLifecycleChange: (callback: (phase: LifecyclePhase) => void) => {
    return listen<LifecyclePhase>('lifecycle-update', (event) => {
      callback(event.payload);
    });
  }
};
