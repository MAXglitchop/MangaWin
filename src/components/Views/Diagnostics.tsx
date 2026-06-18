import { useEffect, useState } from 'react';
import { tauriApi } from '../../lib/tauri';
import { Button } from '../UI/Button';
import { ClipboardCopy, Download } from 'lucide-react';

interface LogEntry {
  type: string;
  message: string;
}

export function Diagnostics() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    tauriApi.getRecentLogs().then(setLogs);
  }, []);

  const handleCopy = () => {
    const text = logs.map(l => `[${l.type.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert("Logs copied to clipboard!");
    });
  };

  const handleExport = async () => {
    // Ideally use tauri dialog picker here, but for now we fallback or save a fixed path
    // Let's just hardcode a download directory for demo purposes or ask user
    // Since we don't have tauri-plugin-dialog, we can just save it to "logs.txt" in current dir
    try {
      await tauriApi.exportLogs("mangawin-logs.txt");
      alert("Logs exported successfully to mangawin-logs.txt in the app directory!");
    } catch (e) {
      alert("Export failed: " + e);
    }
  };

  return (
    <div className="view-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Diagnostics & Logs</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={handleCopy} icon={<ClipboardCopy size={16} />}>
            Copy Logs
          </Button>
          <Button onClick={handleExport} icon={<Download size={16} />}>
            Export Logs
          </Button>
        </div>
      </div>

      <div className="card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', maxWidth: 'none', padding: '16px' }}>
        <div className="log-content" style={{ backgroundColor: '#000', padding: '16px', borderRadius: '4px', flexGrow: 1, overflowY: 'auto' }}>
          {logs.map((log, i) => (
            <div key={i} className={`log-line ${log.type}`}>
              [{log.type.toUpperCase()}] {log.message}
            </div>
          ))}
          {logs.length === 0 && <span style={{ color: 'var(--color-text-muted)' }}>No logs available.</span>}
        </div>
      </div>
    </div>
  );
}
