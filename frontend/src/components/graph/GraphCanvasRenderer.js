/**
 * Graph Canvas Rendering & Physics Algorithms
 */

export function renderGraphToCanvas(canvas, nodes, links, transform, hoveredNode) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const w = canvas.clientWidth || 800;
  const h = canvas.clientHeight || 540;

  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Background grid
  ctx.strokeStyle = 'rgba(200, 197, 204, 0.2)';
  ctx.lineWidth = 1;
  const gridSize = 24;
  const offsetX = ((transform.x % gridSize) + gridSize) % gridSize;
  const offsetY = ((transform.y % gridSize) + gridSize) % gridSize;

  ctx.beginPath();
  for (let x = offsetX; x < w; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = offsetY; y < h; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Apply pan & zoom
  const { x: panX, y: panY, k: zoom } = transform;
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  // 1. Draw Links
  const linkCount = links.length;
  for (let i = 0; i < linkCount; i++) {
    const link = links[i];
    const a = link.sourceNode;
    const b = link.targetNode;
    if (!a || !b) continue;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);

    if (link.label === 'AFFECTED_BY') {
      ctx.strokeStyle = '#ba1a1a';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
    } else {
      ctx.strokeStyle = 'rgba(0, 0, 4, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
    }
    ctx.stroke();

    // Directional arrow head
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const arrowDist = b.radius + 3;
    const arrowX = b.x - Math.cos(angle) * arrowDist;
    const arrowY = b.y - Math.sin(angle) * arrowDist;

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 7 * Math.cos(angle - Math.PI / 6), arrowY - 7 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(arrowX - 7 * Math.cos(angle + Math.PI / 6), arrowY - 7 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = link.label === 'AFFECTED_BY' ? '#ba1a1a' : '#000004';
    ctx.fill();
  }

  // 2. Draw Nodes
  const nodeCount = nodes.length;
  for (let i = 0; i < nodeCount; i++) {
    const node = nodes[i];
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    const r = node.radius + (isHovered ? 3 : 0);

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);

    if (node.type === 'Package') {
      ctx.fillStyle = node.isRoot ? '#edecfc' : '#ffffff';
    } else if (node.type === 'Vulnerability') {
      ctx.fillStyle = '#fff5f5';
    } else if (node.type === 'Maintainer') {
      ctx.fillStyle = '#e6f4ea';
    } else {
      ctx.fillStyle = '#fbf8ff';
    }
    ctx.fill();

    ctx.lineWidth = isHovered ? 2.5 : node.isRoot ? 2 : 1.2;
    if (node.type === 'Vulnerability') {
      ctx.strokeStyle = '#ba1a1a';
    } else if (node.type === 'Maintainer') {
      ctx.strokeStyle = '#137333';
    } else {
      ctx.strokeStyle = '#000004';
    }
    ctx.stroke();

    // Node Label text
    const label = node.label || node.id;
    ctx.font = isHovered
      ? 'bold 11px "JetBrains Mono", monospace'
      : '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#000004';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxChars = 14;
    const truncated = label.length > maxChars ? label.slice(0, maxChars) + '…' : label;
    ctx.fillText(truncated, node.x, node.y + r + 11);
  }

  ctx.restore();
}

export function layoutNodesSpiral(rawNodes, rawLinks, width, height) {
  const nodeMap = new Map();
  const nodes = rawNodes.map((n, i) => {
    const isRoot = n.isRoot || i === 0;
    const radius = isRoot ? 16 : n.type === 'Vulnerability' ? 13 : 11;
    let initialX = width / 2;
    let initialY = height / 2;

    if (rawNodes.length > 1) {
      if (rawNodes.length > 25) {
        const spiralRadius = 38 * Math.sqrt(i + 1);
        const spiralAngle = i * 2.399963;
        initialX = width / 2 + spiralRadius * Math.cos(spiralAngle);
        initialY = height / 2 + spiralRadius * Math.sin(spiralAngle);
      } else {
        const ringRadius = Math.min(width, height) * 0.35;
        const angle = (2 * Math.PI * i) / rawNodes.length;
        initialX = width / 2 + ringRadius * Math.cos(angle);
        initialY = height / 2 + ringRadius * Math.sin(angle);
      }
    }

    const nodeObj = {
      ...n,
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      radius,
      isRoot,
    };
    nodeMap.set(n.id, nodeObj);
    return nodeObj;
  });

  const links = [];
  for (let i = 0; i < rawLinks.length; i++) {
    const l = rawLinks[i];
    const sId = typeof l.source === 'object' ? l.source.id : l.source;
    const tId = typeof l.target === 'object' ? l.target.id : l.target;
    const sourceNode = nodeMap.get(sId);
    const targetNode = nodeMap.get(tId);
    if (sourceNode && targetNode) {
      links.push({
        ...l,
        sourceNode,
        targetNode,
      });
    }
  }

  return { nodes, links };
}

export function stepSimulationPhysics(nodes, links, width, height, isDragging, draggedNode) {
  const nodeCount = nodes.length;
  const linkCount = links.length;
  if (nodeCount === 0) return;

  const k = Math.sqrt((width * height) / Math.max(nodeCount, 1)) * 0.85;
  const kSq = k * k;

  // 1. Repulsion
  for (let i = 0; i < nodeCount; i++) {
    const v = nodes[i];
    for (let j = i + 1; j < nodeCount; j++) {
      const u = nodes[j];
      const dx = v.x - u.x || (Math.random() - 0.5) * 0.1;
      const dy = v.y - u.y || (Math.random() - 0.5) * 0.1;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq) || 1;

      if (dist < k * 3.5) {
        const force = kSq / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        v.vx += fx;
        v.vy += fy;
        u.vx -= fx;
        u.vy -= fy;
      }
    }
  }

  // 2. Attraction along links
  for (let i = 0; i < linkCount; i++) {
    const link = links[i];
    const u = link.sourceNode;
    const v = link.targetNode;
    if (!u || !v) continue;

    const dx = v.x - u.x;
    const dy = v.y - u.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = (dist * dist) / (k * 1.8);
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    u.vx += fx;
    u.vy += fy;
    v.vx -= fx;
    v.vy -= fy;
  }

  // 3. Center gravity & integrate
  const cx = width / 2;
  const cy = height / 2;
  const gravity = 0.035;
  const damping = 0.82;
  const maxVelocity = 15;

  for (let i = 0; i < nodeCount; i++) {
    const node = nodes[i];
    if (isDragging && draggedNode && draggedNode.id === node.id) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }

    node.vx += (cx - node.x) * gravity;
    node.vy += (cy - node.y) * gravity;

    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > maxVelocity) {
      node.vx = (node.vx / speed) * maxVelocity;
      node.vy = (node.vy / speed) * maxVelocity;
    }

    node.x += node.vx * 0.08;
    node.y += node.vy * 0.08;

    node.vx *= damping;
    node.vy *= damping;
  }
}
