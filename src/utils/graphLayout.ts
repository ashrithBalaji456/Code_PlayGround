import { GraphNodeData, GraphEdgeData } from '../types/execution';

export interface Point {
  x: number;
  y: number;
}

export interface NodeLayout {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface EdgeLayout {
  id: string;
  source: string;
  target: string;
  sourcePoint: Point;
  targetPoint: Point;
  pathD: string;
  labelPoint: Point;
  isSelfLoop: boolean;
  isCurved: boolean;
  directed: boolean;
  weighted?: boolean;
  weight?: number;
}

export interface ComputedGraphLayout {
  width: number;
  height: number;
  nodes: Record<string, NodeLayout>;
  edges: Record<string, EdgeLayout>;
}

const NODE_RADIUS = 26;
const PADDING = 50;

/**
 * Computes deterministic, aesthetic layout coordinates for graph vertices and edges.
 * Supports:
 * - Arbitrary node counts & cyclic connections
 * - Bi-directional curved edge routing (A -> B and B -> A)
 * - Self-loops (A -> A)
 * - Edge label centering with collision offsets
 * - Stable positions across execution step replays
 */
export function computeGraphLayout(
  nodes: GraphNodeData[],
  edges: GraphEdgeData[],
  width = 650,
  height = 420
): ComputedGraphLayout {
  const nodeMap: Record<string, NodeLayout> = {};
  const edgeMap: Record<string, EdgeLayout> = {};

  const N = nodes.length;
  if (N === 0) {
    return { width, height, nodes: nodeMap, edges: edgeMap };
  }

  const cx = width / 2;
  const cy = height / 2;

  // 1. Position Nodes
  if (N === 1) {
    nodeMap[nodes[0].id] = {
      id: nodes[0].id,
      x: cx,
      y: cy,
      radius: NODE_RADIUS,
    };
  } else {
    // Elliptical distribution
    const rx = Math.max(120, Math.min(width * 0.38, 260));
    const ry = Math.max(100, Math.min(height * 0.35, 170));

    // Sort nodes deterministically by ID to ensure replay position stability
    const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));

    sortedNodes.forEach((n, idx) => {
      const angle = (2 * Math.PI * idx) / N - Math.PI / 2;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      nodeMap[n.id] = {
        id: n.id,
        x: Math.round(x),
        y: Math.round(y),
        radius: NODE_RADIUS,
      };
    });
  }

  // Count edge pairings to determine which edges must curve
  const edgePairCounts: Record<string, number> = {};
  edges.forEach((e) => {
    const key = [e.source, e.target].sort().join(':::');
    edgePairCounts[key] = (edgePairCounts[key] || 0) + 1;
  });

  // Track multi-edge index for multiple edges between identical pair
  const seenPairCounts: Record<string, number> = {};

  // 2. Compute Edges & Curves
  edges.forEach((e) => {
    const srcNode = nodeMap[e.source];
    const tgtNode = nodeMap[e.target];

    if (!srcNode || !tgtNode) return;

    const isSelfLoop = e.source === e.target;
    const pairKey = [e.source, e.target].sort().join(':::');
    const pairTotal = edgePairCounts[pairKey] || 1;
    const pairIndex = seenPairCounts[pairKey] || 0;
    seenPairCounts[pairKey] = pairIndex + 1;

    if (isSelfLoop) {
      // Self loop: rendered as a smooth top arc
      const sx = srcNode.x - 10;
      const sy = srcNode.y - srcNode.radius + 2;
      const tx = srcNode.x + 10;
      const ty = srcNode.y - srcNode.radius + 2;

      const c1x = srcNode.x - 30;
      const c1y = srcNode.y - srcNode.radius - 36;
      const c2x = srcNode.x + 30;
      const c2y = srcNode.y - srcNode.radius - 36;

      const pathD = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;
      const labelPoint = {
        x: srcNode.x,
        y: srcNode.y - srcNode.radius - 38,
      };

      edgeMap[e.id] = {
        id: e.id,
        source: e.source,
        target: e.target,
        sourcePoint: { x: sx, y: sy },
        targetPoint: { x: tx, y: ty },
        pathD,
        labelPoint,
        isSelfLoop: true,
        isCurved: true,
        directed: e.directed,
        weighted: e.weighted,
        weight: e.weight,
      };
      return;
    }

    // Normal or Bidirectional / Multi-edge
    const dx = tgtNode.x - srcNode.x;
    const dy = tgtNode.y - srcNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Unit vector
    const ux = dx / dist;
    const uy = dy / dist;

    // Normal vector perpendicular to line
    const nx = -uy;
    const ny = ux;

    const needsCurve = pairTotal > 1;
    let curveOffset = 0;

    if (needsCurve) {
      // Offset depends on whether source < target or target < source
      const isReverse = e.source > e.target;
      const sign = isReverse ? -1 : 1;
      const offsetMag = 28 + (pairIndex > 1 ? (pairIndex - 1) * 20 : 0);
      curveOffset = sign * offsetMag;
    }

    // Source boundary point
    const sx = srcNode.x + ux * (srcNode.radius + 2);
    const sy = srcNode.y + uy * (srcNode.radius + 2);

    // Target boundary point (leave gap for arrowhead if directed)
    const tgtGap = e.directed ? tgtNode.radius + 7 : tgtNode.radius + 2;
    const tx = tgtNode.x - ux * tgtGap;
    const ty = tgtNode.y - uy * tgtGap;

    let pathD = '';
    let labelPoint: Point = { x: (sx + tx) / 2, y: (sy + ty) / 2 };

    if (needsCurve) {
      const midX = (sx + tx) / 2 + nx * curveOffset;
      const midY = (sy + ty) / 2 + ny * curveOffset;
      pathD = `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`;
      // Label placed at curve apex
      labelPoint = {
        x: midX + nx * (curveOffset > 0 ? 10 : -10),
        y: midY + ny * (curveOffset > 0 ? 10 : -10),
      };
    } else {
      pathD = `M ${sx} ${sy} L ${tx} ${ty}`;
      // Offset label slightly off the straight line so line doesn't strike through text
      labelPoint = {
        x: (sx + tx) / 2 + nx * 14,
        y: (sy + ty) / 2 + ny * 14,
      };
    }

    edgeMap[e.id] = {
      id: e.id,
      source: e.source,
      target: e.target,
      sourcePoint: { x: sx, y: sy },
      targetPoint: { x: tx, y: ty },
      pathD,
      labelPoint,
      isSelfLoop: false,
      isCurved: needsCurve,
      directed: e.directed,
      weighted: e.weighted,
      weight: e.weight,
    };
  });

  return {
    width,
    height,
    nodes: nodeMap,
    edges: edgeMap,
  };
}
