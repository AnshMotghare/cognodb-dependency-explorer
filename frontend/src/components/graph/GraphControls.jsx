import { Plus, Minus, RotateCcw, Camera } from 'lucide-react';

export default function GraphControls({ onZoomIn, onZoomOut, onResetView, onExportSnapshot }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        zIndex: 10,
      }}
    >
      <button
        type="button"
        className="btn-ink"
        onClick={onZoomIn}
        title="Zoom In"
        aria-label="Zoom in"
        style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
      >
        <Plus size={15} />
      </button>
      <button
        type="button"
        className="btn-ink"
        onClick={onZoomOut}
        title="Zoom Out"
        aria-label="Zoom out"
        style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
      >
        <Minus size={15} />
      </button>
      <button
        type="button"
        className="btn-ink"
        onClick={onResetView}
        title="Reset View"
        aria-label="Reset view"
        style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
      >
        <RotateCcw size={14} />
      </button>
      <button
        type="button"
        className="btn-ink"
        onClick={onExportSnapshot}
        title="Export PNG Snapshot"
        aria-label="Export PNG snapshot"
        style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
      >
        <Camera size={15} />
      </button>
    </div>
  );
}
