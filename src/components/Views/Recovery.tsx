import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../UI/Button';

interface RecoveryProps {
  error: string;
  onRetry: () => void;
}

export function Recovery({ error, onRetry }: RecoveryProps) {
  return (
    <div className="view-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', color: 'var(--color-danger)' }}>
          <AlertTriangle size={48} />
        </div>
        
        <h2 style={{ marginBottom: '16px' }}>MangaWin needs to restart its engine</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
          An unexpected error occurred while running the library service.
        </p>

        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          padding: '12px', 
          borderRadius: '4px', 
          fontSize: '0.9rem',
          color: 'var(--color-danger)',
          textAlign: 'left',
          marginBottom: '24px',
          wordBreak: 'break-word',
          maxHeight: '100px',
          overflowY: 'auto'
        }}>
          {error}
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Button variant="primary" onClick={onRetry} icon={<RotateCcw size={16} />}>
            Restart Engine
          </Button>
        </div>
      </div>
    </div>
  );
}
