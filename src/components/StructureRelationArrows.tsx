import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ExecutionStep, DataStructureState } from '../types/execution';
import { CardSize } from './VisualizationCanvas';
import { Zap, Link2, Sparkles, Database, ArrowRight } from 'lucide-react';

export interface StructureRelation {
  id: string;
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
  type: 'foreign_key' | 'data_flow' | 'reference' | 'transfer';
  label: string;
  cardinality?: string;
  detail?: string;
  transferredValue?: any;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Point {
  x: number;
  y: number;
}

interface StructureRelationArrowsProps {
  currentStep: ExecutionStep | null;
  previousStep?: ExecutionStep | null;
  positions: Record<string, { x: number; y: number }>;
  sizes: Record<string, CardSize>;
  getDefaultPosition: (id: string, index?: number) => { x: number; y: number };
  showRelations?: boolean;
  onToggleRelations?: () => void;
  manualLightningTrigger?: number; // Increment to force a lightning pulse
}

// Compute approximate card bounds from CardSize
const getCardDimensions = (size: CardSize = '1x'): { w: number; h: number } => {
  switch (size) {
    case '0.25x':
      return { w: 230, h: 220 };
    case '0.5x':
      return { w: 330, h: 320 };
    case '1.5x':
      return { w: 680, h: 480 };
    case '2x':
      return { w: 920, h: 560 };
    case '1x':
    default:
      return { w: 480, h: 420 };
  }
};

// Compute anchor points on the rectangular boundary facing the target
function computeCardAnchors(
  source: Rect,
  target: Rect
): { start: Point; end: Point; cp1: Point; cp2: Point } {
  const cs = { x: source.x + source.w / 2, y: source.y + source.h / 2 };
  const ct = { x: target.x + target.w / 2, y: target.y + target.h / 2 };

  const dx = ct.x - cs.x;
  const dy = ct.y - cs.y;

  let start: Point;
  let end: Point;

  // Determine exit edge on source
  if (Math.abs(dx) * source.h > Math.abs(dy) * source.w) {
    // Horizontal exit
    start = dx > 0 ? { x: source.x + source.w, y: cs.y } : { x: source.x, y: cs.y };
  } else {
    // Vertical exit
    start = dy > 0 ? { x: cs.x, y: source.y + source.h } : { x: cs.x, y: source.y };
  }

  // Determine entry edge on target
  if (Math.abs(dx) * target.h > Math.abs(dy) * target.w) {
    // Horizontal entry
    end = dx > 0 ? { x: target.x, y: ct.y } : { x: target.x + target.w, y: ct.y };
  } else {
    // Vertical entry
    end = dy > 0 ? { x: ct.x, y: target.y } : { x: ct.x, y: target.y + target.h };
  }

  // Calculate smooth cubic bezier control points based on distance & direction
  const dist = Math.hypot(end.x - start.x, end.y - start.y);
  const curvature = Math.min(220, Math.max(60, dist * 0.35));

  const isSourceHorizontal = Math.abs(start.x - (source.x + source.w / 2)) > Math.abs(start.y - (source.y + source.h / 2));
  const isTargetHorizontal = Math.abs(end.x - (target.x + target.w / 2)) > Math.abs(end.y - (target.y + target.h / 2));

  const cp1: Point = isSourceHorizontal
    ? { x: start.x + (dx > 0 ? curvature : -curvature), y: start.y }
    : { x: start.x, y: start.y + (dy > 0 ? curvature : -curvature) };

  const cp2: Point = isTargetHorizontal
    ? { x: end.x - (dx > 0 ? curvature : -curvature), y: end.y }
    : { x: end.x, y: end.y - (dy > 0 ? curvature : -curvature) };

  return { start, end, cp1, cp2 };
}

// Cubic bezier evaluation at t [0, 1]
function evaluateBezier(t: number, p0: Point, cp1: Point, cp2: Point, p3: Point): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * cp1.x + 3 * mt * t * t * cp2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * cp1.y + 3 * mt * t * t * cp2.y + t * t * t * p3.y,
  };
}

// Generate jagged electric lightning path around the cubic bezier curve
function generateJaggedLightning(
  p0: Point,
  cp1: Point,
  cp2: Point,
  p3: Point,
  jitterSeed: number = 0,
  amplitude: number = 14
): string {
  const segments = 16;
  const points: Point[] = [p0];

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const basePt = evaluateBezier(t, p0, cp1, cp2, p3);
    const nextPt = evaluateBezier(t + 0.01, p0, cp1, cp2, p3);

    // Tangent vector and perpendicular normal
    const tanX = nextPt.x - basePt.x;
    const tanY = nextPt.y - basePt.y;
    const len = Math.hypot(tanX, tanY) || 1;
    const normX = -tanY / len;
    const normY = tanX / len;

    // Pseudo-random deterministic jitter
    const pseudoRand = Math.sin(i * 12.9898 + jitterSeed * 78.233) * Math.cos(i * 43.123);
    const offset = pseudoRand * amplitude;

    points.push({
      x: basePt.x + normX * offset,
      y: basePt.y + normY * offset,
    });
  }

  points.push(p3);
  return `M ${points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`;
}

export const StructureRelationArrows: React.FC<StructureRelationArrowsProps> = ({
  currentStep,
  previousStep,
  positions,
  sizes,
  getDefaultPosition,
  showRelations = true,
  manualLightningTrigger = 0,
}) => {
  const [lightningActiveRelId, setLightningActiveRelId] = useState<string | null>(null);
  const [transferredValue, setTransferredValue] = useState<any>(null);
  const [transferEpoch, setTransferEpoch] = useState<number>(0);
  const [jitterCount, setJitterCount] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  // 1. Discover all relations between active structures in current step
  const relations = useMemo<StructureRelation[]>(() => {
    if (!currentStep) return [];
    const rels: StructureRelation[] = [];
    const structList = Object.values(currentStep.structures);
    const structIds = structList.map((s) => s.id);
    const hasJvm = currentStep.heap.some((h) => h.className) || Object.keys(currentStep.variables).length > 0;
    const allIds = [...structIds];
    if (hasJvm) allIds.push('jvm-memory-card');

    if (allIds.length < 2) return [];

    // A. Explicit Object Graph references
    if (currentStep.objectGraph && currentStep.objectGraph.length > 0) {
      currentStep.objectGraph.forEach((edge, idx) => {
        const fromMatched = allIds.find((id) => id.toLowerCase().includes(edge.fromName.toLowerCase()) || edge.fromId === id);
        const toMatched = allIds.find((id) => id.toLowerCase().includes(edge.toName.toLowerCase()) || edge.toId === id);
        if (fromMatched && toMatched && fromMatched !== toMatched) {
          rels.push({
            id: `obj-rel-${idx}`,
            sourceId: fromMatched,
            targetId: toMatched,
            sourceName: edge.fromName,
            targetName: edge.toName,
            type: 'reference',
            label: edge.label || 'references',
            cardinality: '1:1',
          });
        }
      });
    }

    // B. Entity / Foreign Key & Algorithmic pipeline matching
    for (let i = 0; i < structList.length; i++) {
      const s1 = structList[i];
      for (let j = 0; j < structList.length; j++) {
        if (i === j) continue;
        const s2 = structList[j];

        let matched = false;
        let relationLabel = '';
        let cardinality = '1:1';

        const s1Name = s1.name.toLowerCase();
        const s2Name = s2.name.toLowerCase();

        if (
          (s1Name.includes('order') && s2Name.includes('user')) ||
          (s1Name.includes('emp') && s2Name.includes('dep')) ||
          (s1Name.includes('item') && s2Name.includes('category'))
        ) {
          matched = true;
          relationLabel = `FK: ${s1.name} → ${s2.name}`;
          cardinality = 'N:1';
        } else if (
          (s1Name.includes('graph') && (s2Name.includes('queue') || s2Name.includes('visited') || s2Name.includes('stack'))) ||
          (s1Name.includes('queue') && s2Name.includes('visited')) ||
          (s1Name.includes('tree') && (s2Name.includes('queue') || s2Name.includes('visited') || s2Name.includes('stack')))
        ) {
          matched = true;
          relationLabel = `Pipeline: ${s1.name} ➔ ${s2.name}`;
          cardinality = '1:N';
        } else if (
          (s1Name.includes('stack1') && s2Name.includes('stack2')) ||
          (s1Name.includes('inbox') && s2Name.includes('outbox')) ||
          (s1Name.includes('left') && s2Name.includes('right'))
        ) {
          matched = true;
          relationLabel = `Transfer: ${s1.name} ⇄ ${s2.name}`;
          cardinality = '1:1';
        } else if (
          (s1Name.includes('arr') || s1Name.includes('num') || s1Name.includes('list') || s1Name.includes('data')) &&
          (s2Name.includes('set') || s2Name.includes('seen') || s2Name.includes('visited') || s2Name.includes('map') || s2Name.includes('freq') || s2Name.includes('queue') || s2Name.includes('stack') || s2Name.includes('heap') || s2Name.includes('pq') || s2Name.includes('res') || s2Name.includes('ans'))
        ) {
          matched = true;
          relationLabel = `Flow: ${s1.name} ➔ ${s2.name}`;
          cardinality = '1:1';
        }

        if (matched && !rels.some((r) => r.sourceId === s1.id && r.targetId === s2.id)) {
          rels.push({
            id: `rel-${s1.id}-${s2.id}`,
            sourceId: s1.id,
            targetId: s2.id,
            sourceName: s1.name,
            targetName: s2.name,
            type: 'foreign_key',
            label: relationLabel,
            cardinality,
          });
        }
      }
    }

    // C. Ensure all structures in multi-structure algorithms are connected in a data flow pipeline
    for (let i = 0; i < structList.length - 1; i++) {
      const s1 = structList[i];
      const s2 = structList[i + 1];
      if (!rels.some((r) => (r.sourceId === s1.id && r.targetId === s2.id) || (r.sourceId === s2.id && r.targetId === s1.id))) {
        rels.push({
          id: `flow-${s1.id}-${s2.id}`,
          sourceId: s1.id,
          targetId: s2.id,
          sourceName: s1.name,
          targetName: s2.name,
          type: 'data_flow',
          label: `Data Flow: ${s1.name} ➔ ${s2.name}`,
          cardinality: '1:1',
        });
      }
    }

    // D. Connect JVM Objects Memory card if present with first structure
    if (hasJvm && structList.length > 0 && !rels.some((r) => r.sourceId === 'jvm-memory-card' || r.targetId === 'jvm-memory-card')) {
      rels.push({
        id: `jvm-rel-${structList[0].id}`,
        sourceId: 'jvm-memory-card',
        targetId: structList[0].id,
        sourceName: 'JVM Memory',
        targetName: structList[0].name,
        type: 'reference',
        label: `Heap Allocation: ${structList[0].name}`,
        cardinality: '1:1',
      });
    }

    return rels;
  }, [currentStep]);

  // 2. Real-time Data Passage & Transfer Detection
  useEffect(() => {
    if (!currentStep) return;

    let detectedSource: string | null = null;
    let detectedTarget: string | null = null;
    let val: any = null;

    const currStructs = currentStep.structures;
    const prevStructs = previousStep ? previousStep.structures : {};

    // A. Element growth detection in target structure
    for (const [tgtId, targetCurrSt] of Object.entries(currStructs)) {
      const targetPrevSt = prevStructs[tgtId];
      const targetPrevSize = targetPrevSt
        ? (targetPrevSt.elements?.length || targetPrevSt.size || targetPrevSt.stackData?.length || targetPrevSt.queueData?.length || 0)
        : 0;
      const targetCurrSize =
        targetCurrSt.elements?.length || targetCurrSt.size || targetCurrSt.stackData?.length || targetCurrSt.queueData?.length || 0;

      if (targetCurrSize > targetPrevSize) {
        // Find added element
        const addedVal =
          (targetCurrSt.stackData && targetCurrSt.stackData[targetCurrSt.stackData.length - 1]) ??
          (targetCurrSt.queueData && targetCurrSt.queueData[targetCurrSt.queueData.length - 1]) ??
          (targetCurrSt.elements && targetCurrSt.elements[targetCurrSt.elements.length - 1]) ??
          currentStep.event?.value ??
          currentStep.event?.newValue;

        // Find source structure
        // 1. Shrinking structure (pop/poll)
        for (const [srcId, prevSt] of Object.entries(prevStructs)) {
          if (srcId === tgtId) continue;
          const currSt = currStructs[srcId];
          const prevSize = prevSt.elements?.length || prevSt.size || prevSt.stackData?.length || prevSt.queueData?.length || 0;
          const currSize = currSt ? (currSt.elements?.length || currSt.size || currSt.stackData?.length || currSt.queueData?.length || 0) : 0;
          if (prevSize > currSize) {
            detectedSource = srcId;
            detectedTarget = tgtId;
            val = addedVal;
            break;
          }
        }

        // 2. Reading/source structure containing this value
        if (!detectedSource) {
          for (const [srcId, currSt] of Object.entries(currStructs)) {
            if (srcId === tgtId) continue;
            const hasVal =
              currSt.elements?.includes(addedVal) ||
              currSt.arrayData?.includes(addedVal) ||
              (currSt.activeIndices && currSt.activeIndices.length > 0) ||
              (currentStep.event?.structureId === srcId);
            if (hasVal) {
              detectedSource = srcId;
              detectedTarget = tgtId;
              val = addedVal;
              break;
            }
          }
        }

        // 3. Known incoming pipeline relation
        if (!detectedSource && relations.length > 0) {
          const incomingRel = relations.find((r) => r.targetId === tgtId);
          if (incomingRel) {
            detectedSource = incomingRel.sourceId;
            detectedTarget = tgtId;
            val = addedVal;
          }
        }
      }
    }

    // B. Fallback: Explanation text or event-based transfer keywords
    if (!detectedSource && relations.length > 0) {
      const exp = currentStep.explanation.toLowerCase();
      const isTransferAction =
        exp.includes('pop') ||
        exp.includes('poll') ||
        exp.includes('dequeue') ||
        exp.includes('push') ||
        exp.includes('enqueue') ||
        exp.includes('add') ||
        exp.includes('transfer') ||
        exp.includes('moved') ||
        exp.includes('passed') ||
        exp.includes('offer') ||
        exp.includes('visited');

      if (isTransferAction) {
        const activeRel = relations.find(
          (r) =>
            exp.includes(r.sourceName.toLowerCase()) ||
            exp.includes(r.targetName.toLowerCase())
        ) || relations[0];

        if (activeRel) {
          detectedSource = activeRel.sourceId;
          detectedTarget = activeRel.targetId;
          val = currentStep.event?.value ?? currentStep.algorithmState?.target ?? 'data';
        }
      }
    }

    if (detectedSource && detectedTarget) {
      const matchedRel =
        relations.find(
          (r) =>
            (r.sourceId === detectedSource && r.targetId === detectedTarget) ||
            (r.sourceId === detectedTarget && r.targetId === detectedSource)
        ) || relations[0];

      if (matchedRel) {
        setLightningActiveRelId(matchedRel.id);
        setTransferredValue(val !== null && val !== undefined ? String(val) : 'data');
        setTransferEpoch((prev) => prev + 1);

        const timer = setTimeout(() => {
          setLightningActiveRelId(null);
          setTransferredValue(null);
        }, 1800);

        return () => clearTimeout(timer);
      }
    }
  }, [currentStep, previousStep, relations]);

  // Handle manual lightning trigger
  useEffect(() => {
    if (manualLightningTrigger > 0 && relations.length > 0) {
      const relToShock = relations[manualLightningTrigger % relations.length];
      setLightningActiveRelId(relToShock.id);
      setTransferredValue('⚡ Pass');
      setTransferEpoch((prev) => prev + 1);
      const timer = setTimeout(() => {
        setLightningActiveRelId(null);
        setTransferredValue(null);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [manualLightningTrigger, relations]);

  // Lightning high-frequency jitter animation loop
  useEffect(() => {
    if (!lightningActiveRelId) return;

    let frame = 0;
    const runJitter = () => {
      frame++;
      setJitterCount(frame);
      animRef.current = requestAnimationFrame(runJitter);
    };

    animRef.current = requestAnimationFrame(runJitter);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [lightningActiveRelId]);

  if (!showRelations || relations.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-visible"
      style={{ minWidth: '2400px', minHeight: '1800px' }}
    >
      <defs>
        {/* Neon Electric Aura Filter */}
        <filter id="electric-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur1" />
          <feGaussianBlur stdDeviation="7" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Standard Relation Arrowhead */}
        <marker
          id="relation-arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="7"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 8 3.5, 0 7" fill="#58a6ff" />
        </marker>

        {/* High-Voltage Lightning Arrowhead */}
        <marker
          id="lightning-arrowhead"
          markerWidth="12"
          markerHeight="12"
          refX="8"
          refY="4"
          orient="auto"
        >
          <polygon points="0 0, 10 4, 0 8" fill="#ffe600" />
        </marker>

        {/* Electric Gradient */}
        <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#58a6ff" />
          <stop offset="50%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#ffe600" />
        </linearGradient>
      </defs>

      {relations.map((rel, idx) => {
        // Resolve positions of source and target cards
        const sourcePos = positions[rel.sourceId] || getDefaultPosition(rel.sourceId, idx);
        const targetPos = positions[rel.targetId] || getDefaultPosition(rel.targetId, idx + 1);

        const sourceSize = sizes[rel.sourceId] || '1x';
        const targetSize = sizes[rel.targetId] || '1x';

        const sourceDim = getCardDimensions(sourceSize);
        const targetDim = getCardDimensions(targetSize);

        const sourceRect: Rect = { x: sourcePos.x, y: sourcePos.y, w: sourceDim.w, h: sourceDim.h };
        const targetRect: Rect = { x: targetPos.x, y: targetPos.y, w: targetDim.w, h: targetDim.h };

        const { start, end, cp1, cp2 } = computeCardAnchors(sourceRect, targetRect);
        const smoothPath = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

        const isLightning = lightningActiveRelId === rel.id;
        const midPoint = evaluateBezier(0.5, start, cp1, cp2, end);

        // Generate dynamic crackling lightning path when active
        const lightningPath = isLightning
          ? generateJaggedLightning(start, cp1, cp2, end, jitterCount, 16)
          : null;

        return (
          <g key={rel.id} className="transition-all duration-150">
            {/* 1. Underlying Base Connecting Thread */}
            <path
              d={smoothPath}
              fill="none"
              stroke={isLightning ? '#388bfd' : '#30363d'}
              strokeWidth={isLightning ? '5' : '2'}
              strokeDasharray={isLightning ? 'none' : '6, 6'}
              markerEnd={isLightning ? 'url(#lightning-arrowhead)' : 'url(#relation-arrowhead)'}
              opacity={isLightning ? 0.9 : 0.65}
              className="transition-all duration-200"
            />

            {/* 2. Ambient Continuous Flowing Data Photons along the Arrow (living conduit) */}
            {[0, 0.33, 0.66].map((offset, pIdx) => (
              <g key={`ambient-stream-${rel.id}-${pIdx}`}>
                <animateMotion
                  path={smoothPath}
                  dur="2.8s"
                  repeatCount="indefinite"
                  begin={`${offset * 2.8}s`}
                />
                <circle r="4.5" fill="#58a6ff" opacity="0.8" filter="url(#electric-glow)" />
                <circle r="2" fill="#ffffff" />
              </g>
            ))}

            {/* 3. Pulsing Data Flow Glow Thread */}
            {!isLightning && (
              <path
                d={smoothPath}
                fill="none"
                stroke="#58a6ff"
                strokeWidth="1.5"
                strokeDasharray="4, 12"
                opacity="0.8"
                style={{
                  animation: 'dashAnimation 1.5s linear infinite',
                }}
              />
            )}

            {/* ─── 4. HIGH-VOLTAGE LIGHTNING STRIKE EFFECT & IMPACT RIPPLES ─── */}
            {isLightning && lightningPath && (
              <>
                {/* Thick Outer Electric Aura */}
                <path
                  d={lightningPath}
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="8"
                  opacity="0.5"
                  filter="url(#electric-glow)"
                />

                {/* Jagged Electric Bolt Branch */}
                <path
                  d={lightningPath}
                  fill="none"
                  stroke="#79c0ff"
                  strokeWidth="4"
                  opacity="0.9"
                  filter="url(#electric-glow)"
                />

                {/* Ultra-Hot Lightning Core (Pure White) */}
                <path
                  d={lightningPath}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity="1"
                />

                {/* Additional Secondary Fractal Spark Fork */}
                <path
                  d={generateJaggedLightning(start, cp1, cp2, end, jitterCount + 7, 8)}
                  fill="none"
                  stroke="#ffe600"
                  strokeWidth="1.5"
                  opacity="0.8"
                />

                {/* Source Structure Emission Pulse */}
                <circle
                  cx={start.x}
                  cy={start.y}
                  r="16"
                  fill="none"
                  stroke="#58a6ff"
                  strokeWidth="2.5"
                  className="animate-ping"
                  opacity="0.8"
                />
                <circle
                  cx={start.x}
                  cy={start.y}
                  r="7"
                  fill="#58a6ff"
                  filter="url(#electric-glow)"
                />

                {/* Target Structure Impact Arrival Burst */}
                <circle
                  cx={end.x}
                  cy={end.y}
                  r="20"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="3"
                  className="animate-ping"
                  opacity="0.8"
                  style={{ animationDelay: '0.8s' }}
                />
                <circle
                  cx={end.x}
                  cy={end.y}
                  r="8"
                  fill="#ffe600"
                  filter="url(#electric-glow)"
                />
              </>
            )}

            {/* ─── 5. ACTIVE TRAVELING DATA PACKET (PASSING THROUGH THE CONNECTED ARROW) ─── */}
            {isLightning && (
              <>
                {/* Comet Trailing Sparks along the connected arrow */}
                {[0.05, 0.1, 0.15].map((delay, tIdx) => (
                  <g key={`comet-${rel.id}-${transferEpoch}-${tIdx}`}>
                    <animateMotion
                      path={smoothPath}
                      dur="1.4s"
                      repeatCount="1"
                      fill="freeze"
                      begin={`${delay}s`}
                    />
                    <circle
                      r={7 - tIdx * 1.5}
                      fill="#ffe600"
                      opacity={0.7 - tIdx * 0.2}
                      filter="url(#electric-glow)"
                    />
                  </g>
                ))}

                {/* Main Glowing Data Capsule traveling along smoothPath */}
                <g key={`data-packet-${rel.id}-${transferEpoch}`}>
                  <animateMotion
                    path={smoothPath}
                    dur="1.4s"
                    repeatCount="1"
                    fill="freeze"
                  />
                  {/* Outer Energy Field */}
                  <circle r="22" fill="#00f0ff" opacity="0.35" filter="url(#electric-glow)" />
                  {/* Capsule Chassis */}
                  <rect
                    x="-32"
                    y="-14"
                    width="64"
                    height="28"
                    rx="14"
                    fill="#0d1117"
                    stroke="#00f0ff"
                    strokeWidth="2.5"
                    filter="url(#electric-glow)"
                  />
                  {/* Data Value Text Label */}
                  <text
                    textAnchor="middle"
                    dy="4.5"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {String(transferredValue !== null && transferredValue !== undefined ? transferredValue : 'pass')}
                  </text>
                </g>
              </>
            )}

            {/* ─── 6. ENTITY RELATION BADGE & VALUE TRANSFER CHIP ─── */}
            <foreignObject
              x={midPoint.x - 90}
              y={midPoint.y - 18}
              width="180"
              height="36"
              className="pointer-events-auto overflow-visible select-none"
            >
              <div className="flex items-center justify-center">
                {isLightning ? (
                  // Active Data Passage Floating Pill
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0d1117]/95 border-2 border-[#00f0ff] text-[#00f0ff] font-extrabold text-[11px] shadow-[0_0_18px_rgba(0,240,255,0.8)] backdrop-blur-md animate-pulse">
                    <Zap className="w-3.5 h-3.5 fill-[#00f0ff] stroke-[#00f0ff] animate-bounce" />
                    <span>Passing: {transferredValue !== null && transferredValue !== undefined ? String(transferredValue) : 'Data'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#00f0ff]" />
                  </div>
                ) : (
                  // Normal Entity Relationship Pill (with cardinality e.g. 1:1, 1:N)
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#161b22]/95 border border-[#30363d] hover:border-[#58a6ff] text-[#8b949e] hover:text-[#f0f6fc] text-[10px] font-mono shadow-md backdrop-blur-md transition-all cursor-help"
                    title={`Relation: ${rel.label} (${rel.cardinality || '1:1'})`}
                  >
                    <Link2 className="w-3 h-3 text-[#58a6ff]" />
                    <span className="font-semibold text-[#58a6ff]">{rel.cardinality || '1:1'}</span>
                    <span className="truncate max-w-[100px]">{rel.label.split(':')[0]}</span>
                  </div>
                )}
              </div>
            </foreignObject>
          </g>
        );
      })}

      <style>{`
        @keyframes dashAnimation {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

    </svg>
  );
};
