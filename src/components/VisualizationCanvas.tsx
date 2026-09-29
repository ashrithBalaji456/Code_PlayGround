import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExecutionStep, DataStructureState } from '../types/execution';
import { ArrayVisualizer } from './visualizers/ArrayVisualizer';
import { StackVisualizer } from './visualizers/StackVisualizer';
import { QueueVisualizer } from './visualizers/QueueVisualizer';
import { DequeVisualizer } from './visualizers/DequeVisualizer';
import { LinkedListVisualizer } from './visualizers/LinkedListVisualizer';
import { TreeVisualizer } from './visualizers/TreeVisualizer';
import { HeapVisualizer } from './visualizers/HeapVisualizer';
import { TrieVisualizer } from './visualizers/TrieVisualizer';
import { HashMapVisualizer } from './visualizers/HashMapVisualizer';
import { HashSetVisualizer } from './visualizers/HashSetVisualizer';
import { PriorityQueueVisualizer } from './visualizers/PriorityQueueVisualizer';
import { GraphVisualizer } from './visualizers/GraphVisualizer';
import { DSUVisualizer } from './visualizers/DSUVisualizer';
import { BitVisualizer } from './visualizers/BitVisualizer';
import { StringVisualizer } from './visualizers/StringVisualizer';
import { NumberVisualizer } from './visualizers/NumberVisualizer';
import { SegmentTreeVisualizer } from './visualizers/SegmentTreeVisualizer';
import { FenwickVisualizer } from './visualizers/FenwickVisualizer';
import { JvmObjectVisualizer } from './visualizers/JvmObjectVisualizer';
import {
  Sparkles,
  AlertCircle,
  ArrowRightLeft,
  Maximize2,
  Minimize2,
  Move,
  LayoutGrid,
  Columns,
  Rows,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  Expand,
  Shrink,
  Layers,
  ListOrdered,
  Hash,
  Database,
  Network,
  GitBranch,
  Play,
} from 'lucide-react';

interface VisualizationCanvasProps {
  currentStep: ExecutionStep | null;
  isRunning: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onRunPreset?: () => void;
}

type CardSize = 'normal' | 'wide' | 'large';
type CanvasLayoutMode = 'freeform' | 'grid';

export const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
  currentStep,
  isRunning,
  isFullscreen = false,
  onToggleFullscreen,
  onRunPreset,
}) => {
  // Canvas arrangement state
  const [layoutMode, setLayoutMode] = useState<CanvasLayoutMode>('freeform');
  const [zoom, setZoom] = useState<number>(1.0);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [sizes, setSizes] = useState<Record<string, CardSize>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [maximizedCardId, setMaximizedCardId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))));
  const handleZoomReset = () => setZoom(1.0);

  // Helper to compute default position for a structure
  const getDefaultPosition = useCallback((id: string, index: number = 0) => {
    const cardWidth = 470;
    const cardHeight = 380;
    const gap = 24;
    const cols = isFullscreen ? 3 : 2;
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: 24 + col * (cardWidth + gap),
      y: 24 + row * (cardHeight + gap),
    };
  }, [isFullscreen]);

  // Auto-arrange all structures into a tidy grid
  const handleAutoArrangeGrid = () => {
    if (!currentStep) return;
    setLayoutMode('freeform');
    setMaximizedCardId(null);
    const structList = Object.values(currentStep.structures);
    const hasJvm = currentStep.heap.some((h) => h.className) || Object.keys(currentStep.variables).length > 0;
    const allIds = structList.map((s) => s.id);
    if (hasJvm) allIds.push('jvm-memory-card');

    const newPositions: Record<string, { x: number; y: number }> = {};
    const cardWidth = 480;
    const cardHeight = 390;
    const gap = 24;
    const cols = isFullscreen ? 3 : 2;

    allIds.forEach((id, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      newPositions[id] = {
        x: 24 + col * (cardWidth + gap),
        y: 24 + row * (cardHeight + gap),
      };
    });

    setPositions(newPositions);
  };

  // Auto-arrange horizontally
  const handleArrangeHorizontal = () => {
    if (!currentStep) return;
    setLayoutMode('freeform');
    setMaximizedCardId(null);
    const structList = Object.values(currentStep.structures);
    const hasJvm = currentStep.heap.some((h) => h.className) || Object.keys(currentStep.variables).length > 0;
    const allIds = structList.map((s) => s.id);
    if (hasJvm) allIds.push('jvm-memory-card');

    const newPositions: Record<string, { x: number; y: number }> = {};
    const cardWidth = 490;
    const gap = 24;

    allIds.forEach((id, idx) => {
      newPositions[id] = {
        x: 24 + idx * (cardWidth + gap),
        y: 24,
      };
    });

    setPositions(newPositions);
  };

  // Auto-arrange vertically
  const handleArrangeVertical = () => {
    if (!currentStep) return;
    setLayoutMode('freeform');
    setMaximizedCardId(null);
    const structList = Object.values(currentStep.structures);
    const hasJvm = currentStep.heap.some((h) => h.className) || Object.keys(currentStep.variables).length > 0;
    const allIds = structList.map((s) => s.id);
    if (hasJvm) allIds.push('jvm-memory-card');

    const newPositions: Record<string, { x: number; y: number }> = {};
    const cardHeight = 390;
    const gap = 24;

    allIds.forEach((id, idx) => {
      newPositions[id] = {
        x: 24,
        y: 24 + idx * (cardHeight + gap),
      };
    });

    setPositions(newPositions);
  };

  // Reset entire layout
  const handleResetLayout = () => {
    setPositions({});
    setSizes({});
    setCollapsed({});
    setMaximizedCardId(null);
    setZoom(1.0);
  };

  // Toggle card size
  const handleToggleCardSize = (id: string) => {
    setSizes((prev) => {
      const curr = prev[id] || 'normal';
      const next: CardSize = curr === 'normal' ? 'wide' : curr === 'wide' ? 'large' : 'normal';
      return { ...prev, [id]: next };
    });
  };

  // Toggle card maximize
  const handleToggleMaximizeCard = (id: string) => {
    setMaximizedCardId((prev) => (prev === id ? null : id));
  };

  // Toggle card collapse
  const handleToggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Smooth dragging of cards on canvas
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    if (e.button !== 0 || layoutMode === 'grid') return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.no-drag')) return;

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const currentPos = positions[id] || getDefaultPosition(id);
    const startPosX = currentPos.x;
    const startPosY = currentPos.y;

    setDraggingId(id);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;
      setPositions((prev) => ({
        ...prev,
        [id]: {
          x: Math.max(12, Math.round(startPosX + deltaX)),
          y: Math.max(12, Math.round(startPosY + deltaY)),
        },
      }));
    };

    const onMouseUp = () => {
      setDraggingId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Icon selector for data structures
  const getStructureIcon = (type: string) => {
    switch (type) {
      case 'stack':
        return <Layers className="w-4 h-4 text-[#58a6ff]" />;
      case 'queue':
      case 'deque':
        return <ListOrdered className="w-4 h-4 text-[#3fb950]" />;
      case 'linkedlist':
        return <ListOrdered className="w-4 h-4 text-[#bc8cff]" />;
      case 'map':
        return <Hash className="w-4 h-4 text-[#f0883e]" />;
      case 'set':
        return <Database className="w-4 h-4 text-[#a371f7]" />;
      case 'priorityqueue':
      case 'heap':
        return <Database className="w-4 h-4 text-[#d29922]" />;
      case 'tree':
      case 'bst':
        return <GitBranch className="w-4 h-4 text-[#58a6ff]" />;
      case 'trie':
      case 'graph':
        return <Network className="w-4 h-4 text-[#bc8cff]" />;
      default:
        return <Database className="w-4 h-4 text-[#8b949e]" />;
    }
  };

  // Individual visualizer renderer
  const renderVisualizerContent = (st: DataStructureState) => {
    if (!currentStep) return null;
    switch (st.type) {
      case 'array':
      case 'matrix':
        return (
          <ArrayVisualizer
            structure={st}
            pointers={currentStep.activePointers}
            comparisonIndices={st.comparingIndices}
            activeIndices={st.activeIndices}
            lastEvent={currentStep.event}
            comparisonInfo={currentStep.comparison || undefined}
            whyChanged={currentStep.algorithmState?.whyChanged}
          />
        );
      case 'stack':
        return <StackVisualizer structure={st} />;
      case 'queue':
        return <QueueVisualizer structure={st} />;
      case 'deque':
        return <DequeVisualizer structure={st} lastEvent={currentStep.event} />;
      case 'linkedlist':
        return (
          <LinkedListVisualizer
            structure={st}
            pointers={currentStep.activePointers}
          />
        );
      case 'map':
        return <HashMapVisualizer structure={st} />;
      case 'set':
        return <HashSetVisualizer structure={st} lastEvent={currentStep.event} />;
      case 'priorityqueue':
        return (
          <div className="flex flex-col gap-3">
            <PriorityQueueVisualizer structure={st} lastEvent={currentStep.event} />
            {st.priorityQueueData && st.priorityQueueData.length > 0 && (
              <HeapVisualizer structure={st} lastEvent={currentStep.event} />
            )}
          </div>
        );
      case 'heap':
        return <HeapVisualizer structure={st} lastEvent={currentStep.event} />;
      case 'tree':
      case 'bst':
        return <TreeVisualizer structure={st} />;
      case 'trie':
        return <TrieVisualizer structure={st} />;
      case 'graph':
        return <GraphVisualizer structure={st} />;
      case 'dsu':
        return <DSUVisualizer structure={st} />;
      case 'bits':
        return <BitVisualizer structure={st} />;
      case 'string':
        return <StringVisualizer structure={st} />;
      case 'number':
        return <NumberVisualizer structure={st} />;
      case 'segmenttree':
        return <SegmentTreeVisualizer structure={st} />;
      case 'fenwick':
        return <FenwickVisualizer structure={st} />;
      default:
        return null;
    }
  };

  // Empty State with Enlarge Canvas button
  if (!currentStep) {
    return (
      <div className="h-full w-full flex flex-col bg-[#0b0e14] text-[#8b949e] select-none">
        {/* Canvas Toolbar in empty state */}
        <div className="h-10 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#58a6ff]" />
            <span className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
              Visualizer Canvas
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-[#f0f6fc] border border-[#30363d] px-2.5 py-1 rounded-md text-xs font-semibold transition-all shadow-sm"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enlarge Canvas Full'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? 'Exit Full' : 'Enlarge Canvas Full'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State Welcome Hub */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[radial-gradient(#1f242c_1px,transparent_1px)] [background-size:20px_20px]">
          <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4 text-[#58a6ff] shadow-xl">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-[#f0f6fc] mb-1">Visualizer Canvas Ready</h3>
          <p className="text-sm text-[#8b949e] max-w-md text-center mb-5">
            Write Java or Python code on the left, or pick a preset algorithm, then click <strong className="text-[#3fb950]">Run</strong> to watch live memory and data structures evolve.
          </p>

          <div className="flex items-center gap-3">
            {onRunPreset && (
              <button
                onClick={onRunPreset}
                className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md transition-all transform hover:scale-105"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Code & Populate Canvas</span>
              </button>
            )}

            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] font-semibold text-xs px-4 py-2 rounded-lg shadow-md transition-all"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? 'Restore Split View' : 'Enlarge Canvas Workspace'}</span>
              </button>
            )}
          </div>

          <div className="mt-8 flex items-center gap-6 text-xs text-[#8b949e]">
            <span className="flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-[#58a6ff]" />
              Freely move any data structure
            </span>
            <span className="flex items-center gap-1.5">
              <Expand className="w-3.5 h-3.5 text-[#3fb950]" />
              Enlarge & scale structures
            </span>
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-[#f0883e]" />
              Auto-arrange in neat order
            </span>
          </div>
        </div>
      </div>
    );
  }

  const structures = Object.values(currentStep.structures);
  const comparison = currentStep.comparison;
  const error = currentStep.error;

  const hasJvmObjects =
    currentStep.heap.some((h) => h.className) ||
    (currentStep.staticFields && Object.keys(currentStep.staticFields).length > 0) ||
    (currentStep.threads && Object.keys(currentStep.threads).length > 1) ||
    !!currentStep.activeJavaConcept ||
    (structures.length === 0 && Object.keys(currentStep.variables).length > 0);

  return (
    <div className="h-full w-full flex flex-col bg-[#0b0e14] text-[#f0f6fc] select-none overflow-hidden">
      {/* ─── TOP CANVAS CONTROL & ARRANGE TOOLBAR ─── */}
      <header className="h-11 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between gap-3 shadow-md z-20 flex-shrink-0">
        {/* Left: Status, Line & Structure count */}
        <div className="flex items-center gap-2.5">
          <span className="bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
            Line {currentStep.line}
          </span>
          <span className="text-xs font-medium text-[#f0f6fc] hidden md:inline truncate max-w-[260px]">
            {currentStep.explanation}
          </span>
          <span className="bg-[#21262d] text-[#8b949e] border border-[#30363d] text-[11px] font-mono px-2 py-0.5 rounded-full">
            {structures.length + (hasJvmObjects ? 1 : 0)} structure{structures.length + (hasJvmObjects ? 1 : 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Center: Arrangement & Layout Controls */}
        <div className="flex items-center gap-1.5">
          {/* Layout Mode Selector */}
          <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5">
            <button
              onClick={() => {
                setLayoutMode('freeform');
                setMaximizedCardId(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                layoutMode === 'freeform'
                  ? 'bg-[#58a6ff]/20 text-[#58a6ff] font-semibold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
              title="Freeform Canvas Mode (Drag & place anywhere)"
            >
              <Move className="w-3 h-3" />
              <span>Freeform</span>
            </button>
            <button
              onClick={() => {
                setLayoutMode('grid');
                setMaximizedCardId(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                layoutMode === 'grid'
                  ? 'bg-[#3fb950]/20 text-[#3fb950] font-semibold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
              title="Auto Grid Mode (Neat responsive layout)"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Grid</span>
            </button>
          </div>

          {/* Quick Arrangement Actions */}
          <button
            onClick={handleAutoArrangeGrid}
            className="flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] px-2 py-1 rounded-md text-xs font-medium transition-colors"
            title="Auto-Arrange in Neat Grid"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span className="hidden sm:inline">Neat Grid</span>
          </button>

          <button
            onClick={handleArrangeHorizontal}
            className="hidden lg:flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] px-2 py-1 rounded-md text-xs font-medium transition-colors"
            title="Arrange Horizontally"
          >
            <Columns className="w-3.5 h-3.5 text-[#bc8cff]" />
            <span>Row</span>
          </button>

          <button
            onClick={handleArrangeVertical}
            className="hidden lg:flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] px-2 py-1 rounded-md text-xs font-medium transition-colors"
            title="Arrange Vertically"
          >
            <Rows className="w-3.5 h-3.5 text-[#e3b341]" />
            <span>Stack</span>
          </button>

          <button
            onClick={handleResetLayout}
            className="flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] px-2 py-1 rounded-md text-xs font-medium transition-colors"
            title="Reset All Card Positions and Sizes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Reset</span>
          </button>
        </div>

        {/* Right: Zoom & Enlarge Fullscreen Button */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomReset}
              className="px-1.5 py-0.5 text-[11px] font-mono text-[#8b949e] hover:text-[#f0f6fc]"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Enlarge / Fullscreen Canvas Toggle Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm ${
                isFullscreen
                  ? 'bg-[#bc8cff]/20 text-[#d2a8ff] border border-[#bc8cff]/50 hover:bg-[#bc8cff]/30'
                  : 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/50 hover:bg-[#58a6ff]/30'
              }`}
              title={isFullscreen ? 'Restore Canvas to Split View' : 'Enlarge Visualizer Canvas to Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Exit Full' : 'Enlarge Canvas Full'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── PEDAGOGICAL HUD / EXPLANATION BANNER (Collapsible) ─── */}
      <div className="px-3 pt-2 pb-1 flex flex-col gap-2 bg-[#0b0e14] border-b border-[#30363d]/60">
        {/* Condition Evaluation Banner if active */}
        {comparison && (
          <div
            className={`border rounded-xl p-2.5 flex items-center justify-between shadow-sm transition-all text-xs ${
              comparison.result
                ? 'bg-[#3fb950]/10 border-[#3fb950]/50 text-[#3fb950]'
                : 'bg-[#f85149]/10 border-[#f85149]/50 text-[#f85149]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />
              <span className="font-mono font-semibold">
                Condition: {comparison.explanation}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                comparison.result ? 'bg-[#3fb950] text-black' : 'bg-[#f85149] text-white'
              }`}
            >
              {comparison.result ? 'TRUE' : 'FALSE'}
            </span>
          </div>
        )}

        {/* Error Callout if exception occurred */}
        {error && (
          <div className="bg-[#f85149]/15 border border-[#f85149] rounded-xl p-3 shadow-lg flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#f85149] font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error.type} on Line {error.line}:</span>
              <span className="font-mono text-[#f0f6fc] font-normal">{error.message}</span>
            </div>
            <span className="text-[11px] text-[#8b949e]">{error.detail}</span>
          </div>
        )}
      </div>

      {/* ─── MAIN WORKSPACE CANVAS ─── */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto relative p-4 bg-[#0b0e14] bg-[radial-gradient(#21262d_1px,transparent_1px)] [background-size:20px_20px]"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Solo Maximized Structure View */}
        {maximizedCardId && (
          <div className="w-full h-full flex flex-col gap-3">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-2 flex items-center justify-between shadow-md">
              <span className="text-xs font-bold text-[#58a6ff] uppercase tracking-wider flex items-center gap-2">
                <Expand className="w-4 h-4" />
                Focused Structure View: {maximizedCardId}
              </span>
              <button
                onClick={() => setMaximizedCardId(null)}
                className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] px-3 py-1 rounded-lg text-xs font-semibold shadow-sm"
              >
                <Shrink className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span>Return to Multi-Structure Canvas</span>
              </button>
            </div>

            <div className="flex-1 bg-[#161b22]/90 border border-[#30363d] rounded-2xl p-4 overflow-auto shadow-2xl">
              {maximizedCardId === 'jvm-memory-card' ? (
                <JvmObjectVisualizer currentStep={currentStep} />
              ) : (
                (() => {
                  const target = structures.find((s) => s.id === maximizedCardId);
                  return target ? renderVisualizerContent(target) : null;
                })()
              )}
            </div>
          </div>
        )}

        {/* Regular Multi-Structure Arrangement View */}
        {!maximizedCardId && (
          <div
            className={
              layoutMode === 'freeform'
                ? 'relative min-w-[2000px] min-h-[1400px] transition-transform duration-75 origin-top-left'
                : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12'
            }
            style={layoutMode === 'freeform' ? { transform: `scale(${zoom})` } : undefined}
          >
            {/* 1. Render all Data Structures */}
            {structures.map((st, idx) => {
              const cardId = st.id;
              const pos = positions[cardId] || getDefaultPosition(cardId, idx);
              const cardSize = sizes[cardId] || 'normal';
              const isCol = !!collapsed[cardId];
              const isDragging = draggingId === cardId;

              // Card width classes depending on size
              const widthClass =
                cardSize === 'large'
                  ? 'w-[820px] max-w-full'
                  : cardSize === 'wide'
                  ? 'w-[640px] max-w-full'
                  : 'w-[470px] max-w-full';

              return (
                <div
                  key={st.id}
                  id={`dsa-struct-${st.id}`}
                  className={`bg-[#161b22] border rounded-2xl shadow-xl transition-shadow ${
                    isDragging
                      ? 'border-[#58a6ff] shadow-2xl ring-2 ring-[#58a6ff]/40 z-40'
                      : 'border-[#30363d] hover:border-[#58a6ff]/50'
                  } ${
                    layoutMode === 'freeform'
                      ? `absolute ${widthClass}`
                      : cardSize === 'large'
                      ? 'col-span-1 md:col-span-2 xl:col-span-3'
                      : cardSize === 'wide'
                      ? 'col-span-1 md:col-span-2'
                      : 'col-span-1'
                  }`}
                  style={
                    layoutMode === 'freeform'
                      ? {
                          left: `${pos.x}px`,
                          top: `${pos.y}px`,
                          zIndex: isDragging ? 40 : 10,
                        }
                      : undefined
                  }
                >
                  {/* Draggable Header */}
                  <div
                    onMouseDown={(e) => handleMouseDown(cardId, e)}
                    className={`px-3.5 py-2.5 bg-[#0d1117]/90 border-b border-[#30363d] rounded-t-2xl flex items-center justify-between select-none ${
                      layoutMode === 'freeform' ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                  >
                    {/* Left: Icon, Name & Type */}
                    <div className="flex items-center gap-2">
                      {layoutMode === 'freeform' && (
                        <Move className="w-3.5 h-3.5 text-[#8b949e] opacity-60" />
                      )}
                      {getStructureIcon(st.type)}
                      <span className="text-xs font-bold text-[#f0f6fc]">{st.name || st.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                        {st.dataType || st.type}
                      </span>
                      {st.size !== undefined && (
                        <span className="text-[10px] font-mono text-[#8b949e]">
                          ({st.size} item{st.size !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>

                    {/* Right: Card Actions (Size, Maximize, Collapse) */}
                    <div className="flex items-center gap-1 no-drag">
                      {/* Enlarge / Size toggle (1x / 1.5x / 2x) */}
                      <button
                        onClick={() => handleToggleCardSize(cardId)}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition-colors"
                        title="Toggle Card Size (Normal 1x ➔ Wide 1.5x ➔ Large 2x)"
                      >
                        {cardSize === 'normal' ? '1x' : cardSize === 'wide' ? '1.5x' : '2x'}
                      </button>

                      {/* Solo Maximize */}
                      <button
                        onClick={() => handleToggleMaximizeCard(cardId)}
                        className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
                        title="Focus Maximize this Structure"
                      >
                        <Expand className="w-3.5 h-3.5 text-[#58a6ff]" />
                      </button>

                      {/* Collapse / Fold */}
                      <button
                        onClick={() => handleToggleCollapse(cardId)}
                        className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
                        title={isCol ? 'Expand Card' : 'Collapse Card'}
                      >
                        {isCol ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Card Content Area */}
                  {!isCol && (
                    <div className="p-3.5 overflow-auto max-h-[500px]">
                      {renderVisualizerContent(st)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 2. Render JVM Heap & Objects Card if present */}
            {hasJvmObjects && (
              (() => {
                const jvmId = 'jvm-memory-card';
                const pos = positions[jvmId] || getDefaultPosition(jvmId, structures.length);
                const cardSize = sizes[jvmId] || 'large';
                const isCol = !!collapsed[jvmId];
                const isDragging = draggingId === jvmId;

                const widthClass =
                  cardSize === 'large'
                    ? 'w-[840px] max-w-full'
                    : cardSize === 'wide'
                    ? 'w-[640px] max-w-full'
                    : 'w-[470px] max-w-full';

                return (
                  <div
                    key={jvmId}
                    id={`dsa-struct-${jvmId}`}
                    className={`bg-[#161b22] border rounded-2xl shadow-xl transition-shadow ${
                      isDragging
                        ? 'border-[#3fb950] shadow-2xl ring-2 ring-[#3fb950]/40 z-40'
                        : 'border-[#30363d] hover:border-[#3fb950]/50'
                    } ${
                      layoutMode === 'freeform'
                        ? `absolute ${widthClass}`
                        : 'col-span-1 md:col-span-2 xl:col-span-3'
                    }`}
                    style={
                      layoutMode === 'freeform'
                        ? {
                            left: `${pos.x}px`,
                            top: `${pos.y}px`,
                            zIndex: isDragging ? 40 : 10,
                          }
                        : undefined
                    }
                  >
                    {/* Header */}
                    <div
                      onMouseDown={(e) => handleMouseDown(jvmId, e)}
                      className={`px-3.5 py-2.5 bg-[#0d1117]/90 border-b border-[#30363d] rounded-t-2xl flex items-center justify-between select-none ${
                        layoutMode === 'freeform' ? 'cursor-grab active:cursor-grabbing' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {layoutMode === 'freeform' && (
                          <Move className="w-3.5 h-3.5 text-[#8b949e] opacity-60" />
                        )}
                        <Database className="w-4 h-4 text-[#3fb950]" />
                        <span className="text-xs font-bold text-[#f0f6fc]">JVM Heap, Objects & Metaspace</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#3fb950] border border-[#30363d]">
                          Runtime Memory
                        </span>
                      </div>

                      <div className="flex items-center gap-1 no-drag">
                        <button
                          onClick={() => handleToggleCardSize(jvmId)}
                          className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition-colors"
                          title="Toggle Size"
                        >
                          {cardSize === 'normal' ? '1x' : cardSize === 'wide' ? '1.5x' : '2x'}
                        </button>
                        <button
                          onClick={() => handleToggleMaximizeCard(jvmId)}
                          className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
                          title="Maximize Memory Card"
                        >
                          <Expand className="w-3.5 h-3.5 text-[#3fb950]" />
                        </button>
                        <button
                          onClick={() => handleToggleCollapse(jvmId)}
                          className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
                          title={isCol ? 'Expand' : 'Collapse'}
                        >
                          {isCol ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {!isCol && (
                      <div className="p-3.5 overflow-auto max-h-[500px]">
                        <JvmObjectVisualizer currentStep={currentStep} />
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>
    </div>
  );
};
