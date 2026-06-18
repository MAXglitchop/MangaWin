import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tauriApi, AppSettings } from '../../lib/tauri';

export function Advanced() {
  const [settings, setSettings] = useState<AppSettings>({ port: '4567', custom_java_args: '' });
  const navigate = useNavigate();

  useEffect(() => {
    tauriApi.getSettings().then(setSettings);
  }, []);

  const handleSave = () => {
    tauriApi.saveSettings(settings.port, settings.custom_java_args).then(() => {
      alert("Settings saved. Restart the engine to apply.");
    });
  };

  const handleReset = () => {
    if (confirm("WARNING: This will delete ALL local AppData, engines, and runtimes! Are you sure?")) {
      tauriApi.resetApp();
    }
  };

  return (
    <div className="h-full w-full bg-black text-gray-300 font-mono p-4 sm:p-8 md:p-12 selection:bg-gray-300 selection:text-black text-sm sm:text-base">
      <div className="max-w-4xl w-full flex flex-col gap-8 uppercase">
        
        {/* Navigation */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="hover:bg-gray-300 hover:text-black border border-gray-500 px-4 py-1.5 transition-none font-bold mb-4"
          >
            [ &lt; RETURN_TO_SYSTEM ]
          </button>
        </div>

        {/* CLI Header */}
        <div>
          <p className="text-gray-400">MangaWin Configuration Utility [Version 2.4.1]</p>
          <p className="text-gray-400">(c) MangaWin Corporation. All rights reserved.</p>
          <br />
          <p>C:\MangaWin\system&gt; config.exe --advanced</p>
          <br />
          <p className="text-white">Loading Advanced Configuration Module...</p>
          <p>Status: OK</p>
        </div>

        {/* Engine Orchestration */}
        <div className="flex flex-col gap-4">
          <p className="text-white border-b border-gray-700 border-dashed pb-1">
            [ ENGINE ORCHESTRATION SETTINGS ]
          </p>
          
          <div className="flex flex-col gap-6 mt-2">
            <div>
              <label htmlFor="local-port" className="block mb-1">
                SET LOCAL_BINDING_PORT =
              </label>
              <div className="flex items-center gap-2">
                <span>&gt;</span>
                <input
                  id="local-port"
                  type="text"
                  value={settings.port}
                  onChange={e => setSettings({...settings, port: e.target.value})}
                  className="bg-transparent border-none outline-none text-white w-full focus:bg-gray-900 px-2 py-0.5"
                />
              </div>
              <p className="text-gray-500 mt-1 normal-case tracking-tight">
                # Internal port for Suwayomi WebUI
              </p>
            </div>

            <div>
              <label htmlFor="jvm-args" className="block mb-1">
                SET CUSTOM_JVM_ARGUMENTS =
              </label>
              <div className="flex items-center gap-2">
                <span>&gt;</span>
                <input
                  id="jvm-args"
                  type="text"
                  value={settings.custom_java_args || ''}
                  onChange={e => setSettings({...settings, custom_java_args: e.target.value})}
                  placeholder="-Xmx2G -Dfoo=bar"
                  className="bg-transparent border-none outline-none text-white w-full focus:bg-gray-900 px-2 py-0.5 placeholder:text-gray-700"
                />
              </div>
              <p className="text-gray-500 mt-1 normal-case tracking-tight">
                # Optional java runtime flags for memory limits etc.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="hover:bg-gray-300 hover:text-black border border-gray-500 px-4 py-1.5 transition-none font-bold"
              >
                [ APPLY_CONFIGURATION ]
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="flex flex-col gap-4 mt-6 text-red-500">
          <p className="border-b border-red-800 border-dashed pb-1 font-bold">
            !!! WARNING: DANGER ZONE !!!
          </p>
          
          <div className="flex flex-col gap-4 mt-2">
            <p>
              Executing the following command will completely wipe:
              <br />
              <span className="text-red-400 mt-1 inline-block">%APPDATA%\MangaWin</span>
            </p>
            <div className="text-red-800 normal-case tracking-tight">
              <p># The application engine, local databases, and temporary caches</p>
              <p># will be permanently erased. System will hard reboot afterwards.</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="hover:bg-red-500 hover:text-black border border-red-500 text-red-500 px-4 py-1.5 transition-none font-bold"
              >
                [ EXECUTE: ERASE_AND_REBOOT ]
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
