import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  renderGraphToCanvas,
  layoutNodesSpiral,
  stepSimulationPhysics,
} from './GraphCanvasRenderer.js';

export function useGraphSimulation({ graphData, height, onNodeClick }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const [tooltip, setTooltip] = useState(null);
  const [cursorStyle, setCursorStyle] = useState('grab');

  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const hoveredNodeRef = useRef(null);
  const isDraggingRef = useRef(false);
  const draggedNodeRef = useRef(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const transformRef = useRef({ x: 0, y: 0, k: 1 });

  const renderCanvas = useCallback(() => {
    renderGraphToCanvas(
      canvasRef.current,
      nodesRef.current,
      linksRef.current,
      transformRef.current,
      hoveredNodeRef.current
    );
  }, []);

  const initLayout = useCallback((w, h) => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      nodesRef.current = [];
      linksRef.current = [];
      renderCanvas();
      return;
    }

    const { nodes, links } = layoutNodesSpiral(graphData.nodes, graphData.links || [], w, h);
    nodesRef.current = nodes;
    linksRef.current = links;

    // Run warmup steps
    const warmupSteps = nodes.length > 25 ? 50 : 25;
    for (let s = 0; s < warmupSteps; s++) {
      stepSimulationPhysics(nodes, links, w, h, false, null);
    }

    // Auto-fit bounding box
    if (nodes.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      }
      const graphW = Math.max(maxX - minX + 80, 100);
      const graphH = Math.max(maxY - minY + 80, 100);
      const scaleX = (w * 0.85) / graphW;
      const scaleY = (h * 0.85) / graphH;
      const fitZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.2);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      transformRef.current = {
        x: w / 2 - centerX * fitZoom,
        y: h / 2 - centerY * fitZoom,
        k: fitZoom,
      };
    } else {
      transformRef.current = { x: 0, y: 0, k: 1 };
    }

    renderCanvas();
  }, [graphData, renderCanvas]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId;
    let stepCount = 0;
    const maxSteps = 160;

    const w = container.clientWidth || 800;
    const h = parseInt(height, 10) || 540;
    initLayout(w, h);

    function tick() {
      const isDragging = isDraggingRef.current;
      const activeW = container?.clientWidth || 800;
      const activeH = parseInt(height, 10) || 540;

      if (stepCount < maxSteps || isDragging) {
        stepSimulationPhysics(
          nodesRef.current,
          linksRef.current,
          activeW,
          activeH,
          isDragging,
          draggedNodeRef.current
        );
        renderCanvas();
        if (!isDragging) stepCount++;
      }
      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          renderCanvas();
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [graphData, height, initLayout, renderCanvas]);

  // Non-passive wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function handleNativeWheel(e) {
      e.preventDefault();
      e.stopPropagation();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(Math.max(transformRef.current.k * factor, 0.15), 4.5);

      const worldX = (mouseX - transformRef.current.x) / transformRef.current.k;
      const worldY = (mouseY - transformRef.current.y) / transformRef.current.k;

      transformRef.current = {
        k: newZoom,
        x: mouseX - worldX * newZoom,
        y: mouseY - worldY * newZoom,
      };

      renderCanvas();
    }

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleNativeWheel);
  }, [renderCanvas]);

  function getNodeAtPosition(screenX, screenY) {
    const { x: panX, y: panY, k: zoom } = transformRef.current;
    const worldX = (screenX - panX) / zoom;
    const worldY = (screenY - panY) / zoom;

    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = worldX - n.x;
      const dy = worldY - n.y;
      if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) {
        return n;
      }
    }
    return null;
  }

  function handleMouseDown(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const hit = getNodeAtPosition(screenX, screenY);
    isDraggingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };

    if (hit) {
      draggedNodeRef.current = hit;
      setCursorStyle('grabbing');
    } else {
      draggedNodeRef.current = null;
      setCursorStyle('grabbing');
    }
  }

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };

      if (draggedNodeRef.current) {
        draggedNodeRef.current.x += dx / transformRef.current.k;
        draggedNodeRef.current.y += dy / transformRef.current.k;
        draggedNodeRef.current.vx = 0;
        draggedNodeRef.current.vy = 0;
      } else {
        transformRef.current.x += dx;
        transformRef.current.y += dy;
      }
      renderCanvas();
      return;
    }

    const hit = getNodeAtPosition(screenX, screenY);
    hoveredNodeRef.current = hit;
    renderCanvas();

    if (hit) {
      setCursorStyle('pointer');
      setTooltip({
        node: hit,
        x: Math.min(screenX + 12, (containerRef.current?.clientWidth || 800) - 220),
        y: Math.min(screenY + 12, (parseInt(height, 10) || 540) - 80),
      });
    } else {
      setCursorStyle('grab');
      setTooltip(null);
    }
  }

  function handleMouseUp(e) {
    const canvas = canvasRef.current;
    if (canvas && draggedNodeRef.current) {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const hit = getNodeAtPosition(screenX, screenY);

      if (hit && hit.id === draggedNodeRef.current.id) {
        if (onNodeClick) {
          onNodeClick(hit);
        } else if (hit.type === 'Package') {
          navigate(`/package/${encodeURIComponent(hit.id)}`);
        }
      }
    }

    isDraggingRef.current = false;
    draggedNodeRef.current = null;
    setCursorStyle('grab');
  }

  function zoomIn() {
    transformRef.current.k = Math.min(transformRef.current.k * 1.25, 4.5);
    renderCanvas();
  }

  function zoomOut() {
    transformRef.current.k = Math.max(transformRef.current.k * 0.8, 0.15);
    renderCanvas();
  }

  function exportSnapshot() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `graph-topology-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function resetView() {
    const container = containerRef.current;
    const w = container?.clientWidth || 800;
    const h = parseInt(height, 10) || 540;
    initLayout(w, h);
  }

  return {
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
  };
}
