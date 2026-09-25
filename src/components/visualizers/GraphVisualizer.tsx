import React, { useState, useMemo } from 'react';
import { DataStructureState, GraphNodeData, GraphEdgeData, GraphNodeState, GraphEdgeState } from '../../types/execution';
import { computeGraphLayout, NodeLayout, EdgeLayout } from '../../utils/graphLayout';
import {
  Network,
  ArrowRight,
  ArrowLeftRight,
  Eye,
  Activity,
  Layers,
  Grid,
  List,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
} from 'lucide-react';

interface GraphVisualizerProps {
  structure: DataStructureState;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ structure }) => {
  const gData = structure.graphData;
  const [activeTab, setActiveTab] = useState<'graph' | 'adjList' | 'adjMatrix'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [adjacencyMode, setAdjacencyMode] = useState<'runtime' | 'conceptual'>('runtime');

  // Zoom & Pan state for clear inspection of large graphs
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((prev) => Math.min(Number((prev + 0.2).toFixed(2)), 4.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(Number((prev - 0.2).toFixed(2)), 0.25));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => {
      const next = Number((prev * factor).toFixed(2));
      return Math.min(Math.max(next, 0.25), 4.5);
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background or svg element itself
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const nodes: GraphNodeData[] = useMemo(() => {
    if (!gData) return [];
    if (gData.nodeList && gData.nodeList.length > 0) return gData.nodeList;
    return Object.values(gData.nodes || {});
  }, [gData]);

  const edges: GraphEdgeData[] = useMemo(() => {
    if (!gData) return [];
    if (gData.edgeList && gData.edgeList.length > 0) return gData.edgeList;
    return Object.values(gData.edges || {});
  }, [gData]);

  // Compute Layout coordinates
  const layout = useMemo(() => {
    return computeGraphLayout(nodes, edges, 640, 380);
  }, [nodes, edges]);

  if (!gData) return null;

  const isDirected = gData.directed;
  const isWeighted = gData.weighted;
  const currentNodeId = gData.currentNodeId;
  const activeEdgeId = gData.activeEdgeId;
  const algorithm = gData.algorithm;
  const algorithmPhase = gData.algorithmPhase;
  const visitedOrder = gData.visitedOrder || [];
  const queueState = gData.queueState || [];
  const distances = gData.distances || {};
  const shortestPath = gData.shortestPath || [];
  const cycleDetected = gData.cycleDetected;

  // Selected item inspector details
  const selectedNode = selectedNodeId ? gData.nodes[selectedNodeId] : null;
  const selectedEdge = selectedEdgeId ? gData.edges[selectedEdgeId] : null;

  // Helper styles for node states
  const getNodeColor = (node: GraphNodeData, layoutNode?: NodeLayout) => {
    const isCurrent = node.id === currentNodeId;
    const isSelected = node.id === selectedNodeId;

    if (isCurrent) {
      return {
        fill: '#1f2937',
        stroke: '#38bdf8',
        strokeWidth: 3.5,
        textColor: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.4)',
        badge: 'PROCESSING',
      };
    }

    const state: GraphNodeState = node.state || 'UNVISITED';
    switch (state) {
      case 'DISCOVERED':
        return {
          fill: '#242010',
          stroke: '#e3b341',
          strokeWidth: 2.5,
          textColor: '#f0e6c8',
          glow: 'rgba(227, 179, 65, 0.25)',
          badge: 'DISCOVERED',
        };
      case 'PROCESSING':
        return {
          fill: '#112233',
          stroke: '#58a6ff',
          strokeWidth: 3,
          textColor: '#79c0ff',
          glow: 'rgba(88, 166, 255, 0.35)',
          badge: 'PROCESSING',
        };
      case 'VISITED':
        return {
          fill: '#0f241a',
          stroke: '#3fb950',
          strokeWidth: 2.5,
          textColor: '#7ee787',
          glow: 'rgba(63, 185, 80, 0.2)',
          badge: 'VISITED',
        };
      case 'FINALIZED':
        return {
          fill: '#1c172e',
          stroke: '#bc8cff',
          strokeWidth: 3,
          textColor: '#d2a8ff',
          glow: 'rgba(188, 140, 255, 0.3)',
          badge: 'FINALIZED',
        };
      case 'UNVISITED':
      default:
        return {
          fill: '#161b22',
          stroke: isSelected ? '#58a6ff' : '#30363d',
          strokeWidth: isSelected ? 2.5 : 1.5,
          textColor: '#c9d1d9',
          glow: 'none',
          badge: 'UNVISITED',
        };
    }
  };

  // Helper styles for edge states
  const getEdgeStyle = (edge: GraphEdgeData) => {
    const isActive = edge.id === activeEdgeId;
    const isSelected = edge.id === selectedEdgeId;
    const state: GraphEdgeState = edge.state || 'NORMAL';

    const isMST = edge.state === 'MST' || edge.inMST;
    if (isMST) {
      return { stroke: '#3fb950', strokeWidth: 4, strokeDasharray: 'none', marker: 'arrow-mst' };
    }
    if (state === 'CYCLE') {
      return { stroke: '#f85149', strokeWidth: 3.5, strokeDasharray: '6 4', marker: 'arrow-cycle' };
    }
    if (state === 'PATH') {
      return { stroke: '#2ea043', strokeWidth: 4, strokeDasharray: 'none', marker: 'arrow-path' };
    }
    if (state === 'RELAXED') {
      return { stroke: '#d29922', strokeWidth: 3.5, strokeDasharray: 'none', marker: 'arrow-relaxed' };
    }
    if (state === 'TRAVERSED') {
      return { stroke: '#3fb950', strokeWidth: 2.5, strokeDasharray: 'none', marker: 'arrow-traversed' };
    }
    if (isActive || isSelected) {
      return { stroke: '#58a6ff', strokeWidth: 3, strokeDasharray: 'none', marker: 'arrow-active' };
    }

    return { stroke: '#484f58', strokeWidth: 1.8, strokeDasharray: 'none', marker: 'arrow-normal' };
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-xl flex flex-col gap-3 transition-all duration-200">
      {/* 1. Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d]/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#bc8cff]/10 rounded-lg border border-[#bc8cff]/30">
            <Network className="w-4 h-4 text-[#bc8cff]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#bc8cff] text-base">{structure.name}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                {isDirected ? 'Directed' : 'Undirected'}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                {isWeighted ? 'Weighted' : 'Unweighted'}
              </span>
            </div>
            <div className="text-[11px] text-[#8b949e] font-mono flex items-center gap-2 mt-0.5">
              <span>Nodes: <strong className="text-[#f0f6fc]">{nodes.length}</strong></span>
              <span>•</span>
              <span>Edges: <strong className="text-[#f0f6fc]">{edges.length}</strong></span>
              {gData.startNodeId && (
                <>
                  <span>•</span>
                  <span>Start: <strong className="text-[#58a6ff]">{gData.startNodeId}</strong></span>
                </>
              )}
              {currentNodeId && (
                <>
                  <span>•</span>
                  <span className="text-[#38bdf8] flex items-center gap-1">
                    <Activity className="w-3 h-3 animate-spin" />
                    Current: <strong>{currentNodeId}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
              activeTab === 'graph'
                ? 'bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Graph View
          </button>
          <button
            onClick={() => setActiveTab('adjList')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
              activeTab === 'adjList'
                ? 'bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Adjacency List
          </button>
          <button
            onClick={() => setActiveTab('adjMatrix')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
              activeTab === 'adjMatrix'
                ? 'bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Matrix View
          </button>
        </div>
      </div>

      {/* Cycle Detection Banner if present */}
      {cycleDetected && (
        <div className="bg-[#f85149]/10 border border-[#f85149]/40 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-[#ff7b72] animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#f85149]" />
            <span className="font-semibold tracking-wide">CYCLE DETECTED:</span>
            <span>Graph contains back-edge cycle during traversal!</span>
          </div>
          <span className="font-mono text-[10px] bg-[#f85149]/20 px-2 py-0.5 rounded border border-[#f85149]/40">
            DFS Cycle Flag Active
          </span>
        </div>
      )}

      {/* Algorithm Banner if algorithm active */}
      {algorithm && (
        <div className="bg-[#1f242c] border border-[#388bfd]/30 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#58a6ff] bg-[#388bfd]/15 px-2 py-0.5 rounded border border-[#388bfd]/30">
              {algorithm}
            </span>
            <span className="text-[#8b949e]">Phase:</span>
            <span className="font-mono text-[#f0f6fc] font-semibold">{algorithmPhase || 'IN_PROGRESS'}</span>
          </div>

          {/* Cross Structure Status Displays */}
          {algorithm === 'BFS' && queueState.length > 0 && (
            <div className="flex items-center gap-2 bg-[#0d1117] px-2.5 py-1 rounded border border-[#30363d]">
              <span className="text-[#8b949e] font-mono text-[11px]">BFS Queue:</span>
              <div className="flex items-center gap-1 font-mono text-[11px] text-[#79c0ff]">
                [{queueState.join(', ')}]
              </div>
            </div>
          )}

          {algorithm === 'DIJKSTRA' && Object.keys(distances).length > 0 && (
            <div className="flex items-center gap-2 bg-[#0d1117] px-2.5 py-1 rounded border border-[#30363d]">
              <span className="text-[#8b949e] font-mono text-[11px]">PQ:</span>
              <div className="flex items-center gap-1 font-mono text-[11px] text-[#e3b341]">
                [{queueState.join(', ')}]
              </div>
            </div>
          )}

          {visitedOrder.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#8b949e]">
              <span>Visited ({visitedOrder.length}/{nodes.length}):</span>
              <span className="font-mono text-[#3fb950] font-medium">
                {visitedOrder.join(' ➔ ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Main Content Area */}
      {activeTab === 'graph' && (
        <div className="relative bg-[#0d1117] rounded-xl border border-[#30363d]/60 p-2 flex flex-col items-center justify-center min-h-[400px] overflow-hidden">
          {/* Floating Zoom & Pan Controls */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#161b22]/90 backdrop-blur-md border border-[#30363d] rounded-lg p-1 shadow-xl text-xs font-mono">
            <button
              onClick={handleZoomOut}
              title="Zoom Out (Scroll Down)"
              className="p-1.5 hover:bg-[#21262d] text-[#c9d1d9] hover:text-white rounded transition-colors active:scale-95"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-0.5 text-[11px] font-semibold text-[#58a6ff] min-w-[44px] text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom In (Scroll Up)"
              className="p-1.5 hover:bg-[#21262d] text-[#c9d1d9] hover:text-white rounded transition-colors active:scale-95"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-[#30363d] mx-0.5" />
            <button
              onClick={handleResetZoom}
              title="Reset Zoom & Pan"
              className="px-2 py-1 hover:bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] rounded flex items-center gap-1 transition-colors text-[11px] active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Drag & Zoom Info Badge */}
          <div className="absolute top-3 left-3 z-10 text-[10px] text-[#8b949e]/80 font-mono pointer-events-none flex items-center gap-1 bg-[#161b22]/70 backdrop-blur px-2 py-1 rounded border border-[#30363d]/50">
            <Move className="w-3 h-3 inline text-[#58a6ff]" /> Scroll to Zoom · Drag to Pan
          </div>

          {nodes.length === 0 ? (
            <div className="text-center py-16 text-[#8b949e]">
              <Network className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#8b949e]" />
              <p className="font-mono text-sm">Graph is empty</p>
              <p className="text-xs text-[#6e7681]">Add vertices with graph.addVertex("A")</p>
            </div>
          ) : (
            <svg
              width="100%"
              height="400"
              viewBox="0 0 640 400"
              className={`overflow-hidden select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <rect width="100%" height="100%" fill="transparent" />
              <defs>
                {/* Arrow markers for directed edges */}
                <marker
                  id="arrow-normal"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#484f58" />
                </marker>
                <marker
                  id="arrow-active"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#58a6ff" />
                </marker>
                <marker
                  id="arrow-traversed"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#3fb950" />
                </marker>
                <marker
                  id="arrow-relaxed"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#d29922" />
                </marker>
                <marker
                  id="arrow-cycle"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#f85149" />
                </marker>
                <marker
                  id="arrow-path"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#2ea043" />
                </marker>
                <marker
                  id="arrow-mst"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#3fb950" />
                </marker>

                {/* Filter for glowing nodes */}
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Zoom & Pan Group wrapping graph elements */}
              <g transform={`translate(${320 + pan.x}, ${200 + pan.y}) scale(${zoom}) translate(-320, -200)`}>
                {/* A. Render Edges */}
                <g className="edges-layer">
                {edges.map((e) => {
                  const edgeLayout = layout.edges[e.id];
                  if (!edgeLayout) return null;

                  const edgeStyle = getEdgeStyle(e);
                  const isDirectedEdge = e.directed;
                  const isSelected = e.id === selectedEdgeId;
                  const isMSTEdge = e.state === 'MST' || e.inMST;

                  return (
                    <g
                      key={e.id}
                      className="cursor-pointer group"
                      onClick={() => setSelectedEdgeId(e.id === selectedEdgeId ? null : e.id)}
                    >
                      {/* Transparent wider stroke for easy clicking */}
                      <path
                        d={edgeLayout.pathD}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="16"
                      />

                      {/* Visual Edge Path */}
                      <path
                        d={edgeLayout.pathD}
                        fill="none"
                        stroke={edgeStyle.stroke}
                        strokeWidth={edgeStyle.strokeWidth}
                        strokeDasharray={edgeStyle.strokeDasharray}
                        markerEnd={isDirectedEdge ? `url(#${edgeStyle.marker})` : undefined}
                        className="transition-all duration-300 group-hover:stroke-[#79c0ff]"
                      />

                      {/* Weighted Edge Label Badge */}
                      {e.weighted && e.weight !== undefined && (
                        <g transform={`translate(${edgeLayout.labelPoint.x}, ${edgeLayout.labelPoint.y})`}>
                          <rect
                            x={isMSTEdge ? '-18' : '-14'}
                            y="-9"
                            width={isMSTEdge ? '36' : '28'}
                            height="18"
                            rx="5"
                            fill="#161b22"
                            stroke={isMSTEdge ? '#3fb950' : edgeStyle.stroke}
                            strokeWidth={isMSTEdge ? '2' : '1.2'}
                            className="shadow-sm"
                          />
                          <text
                            textAnchor="middle"
                            dy="4"
                            fill={isMSTEdge ? '#3fb950' : '#f0f6fc'}
                            fontSize="11"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {e.weight}{isMSTEdge ? '★' : ''}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* B. Render Vertices */}
              <g className="vertices-layer">
                {nodes.map((n) => {
                  const nodeLayout = layout.nodes[n.id];
                  if (!nodeLayout) return null;

                  const nodeStyle = getNodeColor(n, nodeLayout);
                  const isCurrent = n.id === currentNodeId;
                  const isSelected = n.id === selectedNodeId;
                  const dist = distances[n.id];

                  return (
                    <g
                      key={n.id}
                      transform={`translate(${nodeLayout.x}, ${nodeLayout.y})`}
                      className="cursor-pointer group"
                      onClick={() => setSelectedNodeId(n.id === selectedNodeId ? null : n.id)}
                    >
                      {/* Pulse ring for active current node */}
                      {isCurrent && (
                        <circle
                          r={nodeLayout.radius + 6}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          opacity="0.6"
                          className="animate-ping"
                        />
                      )}

                      {/* Vertex Circle */}
                      <circle
                        r={nodeLayout.radius}
                        fill={n.sccGroup !== undefined ? '#161b22' : nodeStyle.fill}
                        stroke={n.sccGroup !== undefined ? ['#bc8cff', '#3fb950', '#f0883e', '#38bdf8', '#e3b341'][n.sccGroup % 5] : nodeStyle.stroke}
                        strokeWidth={nodeStyle.strokeWidth}
                        className="transition-all duration-300 filter drop-shadow-md group-hover:stroke-[#79c0ff]"
                      />

                      {/* SCC Group Indicator Badge if discovered */}
                      {n.sccGroup !== undefined && (
                        <circle
                          r={nodeLayout.radius + 3}
                          fill="none"
                          stroke={['#bc8cff', '#3fb950', '#f0883e', '#38bdf8', '#e3b341'][n.sccGroup % 5]}
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                        />
                      )}

                      {/* Vertex Label */}
                      <text
                        textAnchor="middle"
                        dy={dist !== undefined || n.inDegree !== undefined || n.lowLink !== undefined ? '-2' : '4'}
                        fill={nodeStyle.textColor}
                        fontSize="13"
                        fontFamily="monospace"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {n.label}
                      </text>

                      {/* Distance badge or In-Degree / Low-Link badge */}
                      {dist !== undefined ? (
                        <text
                          textAnchor="middle"
                          dy="12"
                          fill="#8b949e"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="semibold"
                          className="pointer-events-none"
                        >
                          {dist === Infinity || dist === 'Infinity' ? '∞' : dist}
                        </text>
                      ) : n.inDegree !== undefined ? (
                        <text
                          textAnchor="middle"
                          dy="12"
                          fill="#58a6ff"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                          className="pointer-events-none"
                        >
                          in:{n.inDegree}
                        </text>
                      ) : n.lowLink !== undefined && n.discoveryIndex !== undefined ? (
                        <text
                          textAnchor="middle"
                          dy="12"
                          fill="#d29922"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                          className="pointer-events-none"
                        >
                          {n.discoveryIndex}/{n.lowLink}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
          )}

          {/* Interactive Inspect Box overlays */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            {selectedNode && (
              <div className="bg-[#161b22]/95 border border-[#30363d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md pointer-events-auto text-xs max-w-sm">
                <div className="flex items-center justify-between border-b border-[#30363d] pb-1 mb-1.5">
                  <span className="font-mono font-bold text-[#58a6ff]">NODE INSPECTOR</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e]">
                    {selectedNode.state || 'UNVISITED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                  <div><span className="text-[#8b949e]">ID:</span> <strong className="text-[#f0f6fc]">{selectedNode.id}</strong></div>
                  <div><span className="text-[#8b949e]">Degree:</span> <strong className="text-[#f0f6fc]">{selectedNode.degree ?? (selectedNode.outNeighbors?.length || 0)}</strong></div>
                  {isDirected ? (
                    <>
                      <div><span className="text-[#8b949e]">Out:</span> {selectedNode.outNeighbors?.join(', ') || 'None'}</div>
                      <div><span className="text-[#8b949e]">In:</span> {selectedNode.inNeighbors?.join(', ') || 'None'}</div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <span className="text-[#8b949e]">Neighbors:</span> {selectedNode.outNeighbors?.join(', ') || 'None'}
                    </div>
                  )}
                  {distances[selectedNode.id] !== undefined && (
                    <div className="col-span-2 text-[#e3b341]">
                      Distance: <strong>{distances[selectedNode.id]}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedEdge && (
              <div className="bg-[#161b22]/95 border border-[#30363d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md pointer-events-auto text-xs max-w-sm">
                <div className="flex items-center justify-between border-b border-[#30363d] pb-1 mb-1.5">
                  <span className="font-mono font-bold text-[#58a6ff]">EDGE INSPECTOR</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e]">
                    {selectedEdge.state || 'NORMAL'}
                  </span>
                </div>
                <div className="font-mono text-[11px] flex flex-col gap-1">
                  <div>
                    <span className="text-[#8b949e]">Connection:</span>{' '}
                    <strong className="text-[#f0f6fc]">
                      {selectedEdge.source} {selectedEdge.directed ? '➔' : '──'} {selectedEdge.target}
                    </strong>
                  </div>
                  {selectedEdge.weighted && (
                    <div>
                      <span className="text-[#8b949e]">Weight:</span> <strong className="text-[#f0f6fc]">{selectedEdge.weight}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-[#8b949e]">Direction:</span>{' '}
                    {selectedEdge.directed ? 'Directed' : 'Undirected'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Adjacency List View */}
      {activeTab === 'adjList' && (
        <div className="bg-[#0d1117] rounded-xl border border-[#30363d]/60 p-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#f0f6fc]">ADJACENCY LIST</span>
              <span className="text-[10px] bg-[#21262d] text-[#58a6ff] px-2 py-0.5 rounded border border-[#30363d]">
                {adjacencyMode === 'runtime' ? 'Runtime State' : 'Conceptual View'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setAdjacencyMode('runtime')}
                className={`px-2 py-0.5 rounded ${adjacencyMode === 'runtime' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e]'}`}
              >
                Runtime
              </button>
              <button
                onClick={() => setAdjacencyMode('conceptual')}
                className={`px-2 py-0.5 rounded ${adjacencyMode === 'conceptual' ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e]'}`}
              >
                Conceptual
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {nodes.length === 0 ? (
              <p className="text-[#8b949e] py-4 text-center">No vertices defined</p>
            ) : (
              nodes.map((n) => {
                const outNeighbors = n.outNeighbors || [];
                const neighborEdges = edges.filter((e) => e.source === n.id);

                return (
                  <div
                    key={n.id}
                    className={`flex items-center gap-3 p-2 rounded border transition-colors ${
                      n.id === currentNodeId
                        ? 'bg-[#1f2937]/50 border-[#38bdf8]/40'
                        : 'bg-[#161b22] border-[#30363d]/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center font-bold text-[#f0f6fc]">
                      {n.label}
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8b949e]" />
                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                      {outNeighbors.length === 0 ? (
                        <span className="text-[#6e7681] italic">— None</span>
                      ) : (
                        outNeighbors.map((nbrId) => {
                          const matchingEdge = neighborEdges.find((e) => e.target === nbrId);
                          const weight = matchingEdge?.weight;

                          return (
                            <span
                              key={nbrId}
                              className="px-2 py-1 rounded bg-[#21262d] border border-[#30363d] text-[#c9d1d9] flex items-center gap-1.5"
                            >
                              <span>{nbrId}</span>
                              {isWeighted && weight !== undefined && (
                                <span className="text-[10px] bg-[#30363d] text-[#e3b341] px-1 py-0.2 rounded font-bold">
                                  w={weight}
                                </span>
                              )}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. Adjacency Matrix View */}
      {activeTab === 'adjMatrix' && (
        <div className="bg-[#0d1117] rounded-xl border border-[#30363d]/60 p-3 font-mono text-xs overflow-x-auto">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-3">
            <span className="font-bold text-[#f0f6fc]">ADJACENCY MATRIX</span>
            <span className="text-[10px] bg-[#21262d] text-[#e3b341] px-2 py-0.5 rounded border border-[#30363d]">
              Derived View
            </span>
          </div>

          {nodes.length === 0 ? (
            <p className="text-[#8b949e] py-4 text-center">No vertices defined</p>
          ) : (
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border border-[#30363d] text-[#8b949e] bg-[#161b22]"></th>
                  {nodes.map((n) => (
                    <th key={n.id} className="p-2 border border-[#30363d] text-[#58a6ff] bg-[#161b22]">
                      {n.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodes.map((rowNode) => (
                  <tr key={rowNode.id}>
                    <td className="p-2 border border-[#30363d] text-[#58a6ff] bg-[#161b22] font-bold">
                      {rowNode.label}
                    </td>
                    {nodes.map((colNode) => {
                      // Check connection from rowNode to colNode
                      const edge = edges.find((e) =>
                        (e.source === rowNode.id && e.target === colNode.id) ||
                        (!isDirected && e.source === colNode.id && e.target === rowNode.id)
                      );
                      const isConnected = !!edge;
                      const cellVal = isConnected
                        ? isWeighted && edge.weight !== undefined
                          ? edge.weight
                          : 1
                        : 0;

                      return (
                        <td
                          key={colNode.id}
                          className={`p-2 border border-[#30363d] transition-colors ${
                            isConnected
                              ? 'bg-[#1f242c] text-[#3fb950] font-bold'
                              : 'text-[#6e7681]'
                          }`}
                        >
                          {cellVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 5. Dijkstra Distances Table (Section 30) */}
      {algorithm === 'DIJKSTRA' && Object.keys(distances).length > 0 && (
        <div className="bg-[#0d1117] rounded-xl border border-[#e3b341]/30 p-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2">
            <span className="font-bold text-[#e3b341] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#e3b341]" />
              SHORTEST DISTANCES TABLE
            </span>
            {shortestPath.length > 0 && (
              <span className="text-[11px] text-[#3fb950]">
                Path: <strong>{shortestPath.join(' ➔ ')}</strong>
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {nodes.map((n) => {
              const d = distances[n.id];
              const isCurrent = n.id === currentNodeId;
              const isFinal = n.state === 'FINALIZED';

              return (
                <div
                  key={n.id}
                  className={`p-2 rounded border flex flex-col items-center justify-center transition-all ${
                    isFinal
                      ? 'bg-[#1c172e] border-[#bc8cff]/50 text-[#d2a8ff]'
                      : isCurrent
                      ? 'bg-[#1f2937] border-[#38bdf8] text-[#38bdf8]'
                      : 'bg-[#161b22] border-[#30363d] text-[#c9d1d9]'
                  }`}
                >
                  <span className="text-[10px] text-[#8b949e]">Node {n.id}</span>
                  <span className="font-bold text-sm">
                    {d === Infinity || d === 'Infinity' ? '∞' : d ?? '∞'}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#6e7681]">
                    {isFinal ? 'FINAL' : isCurrent ? 'EVAL' : 'PENDING'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
