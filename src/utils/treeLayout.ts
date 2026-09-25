import { TreeNodeData, TrieNodeData } from '../types/execution';

export interface LayoutNode {
  id: string;
  value: any;
  x: number;
  y: number;
  level: number;
  leftId: string | null;
  rightId: string | null;
}

export interface TreeEdge {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isLeft: boolean;
}

export interface TreeLayoutResult {
  nodes: LayoutNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
}

/**
 * Computes collision-free layout for an arbitrary binary tree.
 * Uses inorder positioning with parent-centering smoothing to guarantee:
 * 1. Left child is always to the left of parent.
 * 2. Right child is always to the right of parent.
 * 3. No node or branch collisions regardless of skew or depth.
 */
export function computeBinaryTreeLayout(
  rootId: string | null,
  nodesMap: Record<string, TreeNodeData>,
  options?: {
    nodeRadius?: number;
    levelHeight?: number;
    minNodeSpacing?: number;
    paddingX?: number;
    paddingY?: number;
  }
): TreeLayoutResult {
  if (!rootId || !nodesMap[rootId]) {
    return { nodes: [], edges: [], width: 300, height: 160 };
  }

  const levelHeight = options?.levelHeight ?? 75;
  const minSpacing = options?.minNodeSpacing ?? 55;
  const paddingX = options?.paddingX ?? 50;
  const paddingY = options?.paddingY ?? 40;

  // Step 1: Inorder traversal to determine x ordering and levels
  let inorderIndex = 0;
  const positions = new Map<string, { x: number; y: number; level: number }>();
  let maxLevel = 0;

  function traverseInorder(nodeId: string | null, level: number) {
    if (!nodeId || !nodesMap[nodeId]) return;
    const node = nodesMap[nodeId];
    if (level > maxLevel) maxLevel = level;

    // Traverse left
    traverseInorder(node.leftId, level + 1);

    // Assign x position based on inorder sequence
    const x = paddingX + inorderIndex * minSpacing;
    const y = paddingY + level * levelHeight;
    positions.set(nodeId, { x, y, level });
    inorderIndex++;

    // Traverse right
    traverseInorder(node.rightId, level + 1);
  }

  traverseInorder(rootId, 0);

  // Step 2: Post-process smoothing - center parents over their children where possible
  // Bottom-up pass
  function centerParents(nodeId: string | null) {
    if (!nodeId || !nodesMap[nodeId]) return;
    const node = nodesMap[nodeId];
    centerParents(node.leftId);
    centerParents(node.rightId);

    const pos = positions.get(nodeId);
    if (!pos) return;

    const leftPos = node.leftId ? positions.get(node.leftId) : null;
    const rightPos = node.rightId ? positions.get(node.rightId) : null;

    if (leftPos && rightPos) {
      // If both children exist, parent can be nicely centered between them
      const midX = (leftPos.x + rightPos.x) / 2;
      positions.set(nodeId, { ...pos, x: midX });
    }
  }

  centerParents(rootId);

  // Step 3: Shift so minimum X is at paddingX
  let minX = Infinity;
  let maxX = -Infinity;
  for (const pos of positions.values()) {
    if (pos.x < minX) minX = pos.x;
    if (pos.x > maxX) maxX = pos.x;
  }
  const xOffset = minX < paddingX ? paddingX - minX : 0;

  const resultNodes: LayoutNode[] = [];
  const resultEdges: TreeEdge[] = [];

  for (const [id, pos] of positions.entries()) {
    const nodeData = nodesMap[id];
    const adjustedX = pos.x + xOffset;
    resultNodes.push({
      id,
      value: nodeData.value,
      x: adjustedX,
      y: pos.y,
      level: pos.level,
      leftId: nodeData.leftId,
      rightId: nodeData.rightId,
    });

    if (nodeData.leftId && positions.has(nodeData.leftId)) {
      const childPos = positions.get(nodeData.leftId)!;
      resultEdges.push({
        id: `${id}-left-${nodeData.leftId}`,
        fromId: id,
        toId: nodeData.leftId,
        x1: adjustedX,
        y1: pos.y,
        x2: childPos.x + xOffset,
        y2: childPos.y,
        isLeft: true,
      });
    }

    if (nodeData.rightId && positions.has(nodeData.rightId)) {
      const childPos = positions.get(nodeData.rightId)!;
      resultEdges.push({
        id: `${id}-right-${nodeData.rightId}`,
        fromId: id,
        toId: nodeData.rightId,
        x1: adjustedX,
        y1: pos.y,
        x2: childPos.x + xOffset,
        y2: childPos.y,
        isLeft: false,
      });
    }
  }

  const totalWidth = Math.max(380, maxX + xOffset + paddingX);
  const totalHeight = Math.max(200, paddingY * 2 + maxLevel * levelHeight + 40);

  return {
    nodes: resultNodes,
    edges: resultEdges,
    width: totalWidth,
    height: totalHeight,
  };
}

/**
 * Computes layout for a Complete Binary Tree / Heap stored in an array.
 * Node at index `i` has left child `2i + 1` and right child `2i + 2`.
 */
export function computeHeapTreeLayout(
  elements: any[],
  options?: {
    nodeRadius?: number;
    levelHeight?: number;
    minNodeSpacing?: number;
    paddingX?: number;
    paddingY?: number;
  }
): TreeLayoutResult {
  const n = elements.length;
  if (n === 0) {
    return { nodes: [], edges: [], width: 340, height: 150 };
  }

  // Construct synthetic binary tree nodes for layout
  const syntheticNodes: Record<string, TreeNodeData> = {};
  for (let i = 0; i < n; i++) {
    const leftIdx = 2 * i + 1;
    const rightIdx = 2 * i + 2;
    syntheticNodes[`heap_${i}`] = {
      id: `heap_${i}`,
      value: elements[i],
      leftId: leftIdx < n ? `heap_${leftIdx}` : null,
      rightId: rightIdx < n ? `heap_${rightIdx}` : null,
      parentId: i > 0 ? `heap_${Math.floor((i - 1) / 2)}` : null,
    };
  }

  return computeBinaryTreeLayout('heap_0', syntheticNodes, options);
}

export interface TrieLayoutNode {
  id: string;
  char: string;
  isWord: boolean;
  x: number;
  y: number;
  level: number;
  children: string[];
}

export interface TrieLayoutResult {
  nodes: TrieLayoutNode[];
  edges: { id: string; x1: number; y1: number; x2: number; y2: number }[];
  width: number;
  height: number;
}

/**
 * Computes hierarchical layout for a Trie with branching character paths.
 */
export function computeTrieLayout(
  rootId: string,
  nodesMap: Record<string, TrieNodeData>,
  options?: {
    levelHeight?: number;
    minSiblingSpacing?: number;
    paddingX?: number;
    paddingY?: number;
  }
): TrieLayoutResult {
  if (!rootId || !nodesMap[rootId]) {
    return { nodes: [], edges: [], width: 340, height: 160 };
  }

  const levelHeight = options?.levelHeight ?? 65;
  const minSpacing = options?.minSiblingSpacing ?? 50;
  const paddingX = options?.paddingX ?? 45;
  const paddingY = options?.paddingY ?? 35;

  let currentX = paddingX;
  const positions = new Map<string, { x: number; y: number; level: number }>();
  let maxLevel = 0;

  function layoutSubtree(nodeId: string, level: number): { minX: number; maxX: number } {
    const node = nodesMap[nodeId];
    if (!node) return { minX: currentX, maxX: currentX };
    if (level > maxLevel) maxLevel = level;

    const childIds = Object.values(node.children || {}).filter((cid) => !!nodesMap[cid]);

    if (childIds.length === 0) {
      const x = currentX;
      positions.set(nodeId, { x, y: paddingY + level * levelHeight, level });
      currentX += minSpacing;
      return { minX: x, maxX: x };
    }

    let minChildX = Infinity;
    let maxChildX = -Infinity;

    for (const cId of childIds) {
      const childBounds = layoutSubtree(cId, level + 1);
      if (childBounds.minX < minChildX) minChildX = childBounds.minX;
      if (childBounds.maxX > maxChildX) maxChildX = childBounds.maxX;
    }

    const parentX = (minChildX + maxChildX) / 2;
    positions.set(nodeId, { x: parentX, y: paddingY + level * levelHeight, level });
    return { minX: minChildX, maxX: maxChildX };
  }

  layoutSubtree(rootId, 0);

  const resultNodes: TrieLayoutNode[] = [];
  const resultEdges: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];

  let maxX = 0;
  for (const [id, pos] of positions.entries()) {
    if (pos.x > maxX) maxX = pos.x;
    const nodeData = nodesMap[id];
    const childIds = Object.values(nodeData?.children || {}).filter((cid) => positions.has(cid));

    resultNodes.push({
      id,
      char: nodeData?.char || '',
      isWord: !!nodeData?.isWord,
      x: pos.x,
      y: pos.y,
      level: pos.level,
      children: childIds,
    });

    for (const cId of childIds) {
      const cPos = positions.get(cId)!;
      resultEdges.push({
        id: `${id}->${cId}`,
        x1: pos.x,
        y1: pos.y,
        x2: cPos.x,
        y2: cPos.y,
      });
    }
  }

  const width = Math.max(380, maxX + paddingX + 40);
  const height = Math.max(180, paddingY * 2 + maxLevel * levelHeight + 40);

  return {
    nodes: resultNodes,
    edges: resultEdges,
    width,
    height,
  };
}
