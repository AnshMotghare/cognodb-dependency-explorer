import GraphLegend from './graph/GraphLegend.jsx';
import GraphControls from './graph/GraphControls.jsx';
import GraphTooltip from './graph/GraphTooltip.jsx';
import { useGraphSimulation } from './graph/useGraphSimulation.js';

export default function GraphVisualizer({ graphData, height = '540px', onNodeClick }) {
  const {
    canvasRef,
    containerRef,
    tooltip,
    cursorStyle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    zoomIn,
    zoomOut,
    resetView,
    exportSnapshot,
  } = useGraphSimulation({ graphData, height, onNodeClick });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height,
        border: '1px solid var(--color-primary)',
        background: '#ffffff',
        overflow: 'hidden',
        boxSizing: 'border-box',
        touchAction: 'none',
      }}
    >
      <GraphLegend />
      <GraphControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
        onExportSnapshot={exportSnapshot}
      />
      <GraphTooltip tooltip={tooltip} />
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: cursorStyle,
          display: 'block',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
}
