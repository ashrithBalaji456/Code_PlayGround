import React, { useState } from 'react';
import { DataStructureState, TrieNodeData } from '../../types/execution';
import { computeTrieLayout, TrieLayoutResult } from '../../utils/treeLayout';
import { Network, Search, CheckCircle2, XCircle, Eye, Info, Sparkles } from 'lucide-react';

interface TrieVisualizerProps {
  structure: DataStructureState;
}

export const TrieVisualizer: React.FC<TrieVisualizerProps> = ({ structure }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const trieData = structure.trieData;
  if (!trieData || !trieData.rootId || Object.keys(trieData.nodes).length === 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-lg text-center font-mono">
        <div className="flex items-center justify-center gap-2 text-[#8b949e] mb-1">
          <Network className="w-5 h-5 text-[#bc8cff]" />
          <span className="font-bold text-sm text-[#f0f6fc]">{structure.name}</span>
        </div>
        <div className="text-xs text-[#8b949e]">[ Empty Trie: 0 words ]</div>
      </div>
    );
  }

  const nodes = trieData.nodes;
  const layout: TrieLayoutResult = computeTrieLayout(trieData.rootId, nodes, {
    levelHeight: 70,
    minSiblingSpacing: 55,
    paddingX: 50,
    paddingY: 40,
  });

  const activeSearchWord = trieData.activeSearchWord;
  const activeSearchPath = trieData.activeSearchPath || [];
  const searchResult = trieData.searchResult;

  const inspectedNodeId = selectedNodeId || (activeSearchPath.length > 0 ? activeSearchPath[activeSearchPath.length - 1] : 'root');
  const inspectedNode: TrieNodeData | undefined = nodes[inspectedNodeId];

  // Helper to reconstruct prefix path to a node
  function getPrefixPath(nodeId: string): string {
    let curr = nodeId;
    const chars: string[] = [];
    while (curr && curr !== 'root' && nodes[curr]) {
      chars.unshift(nodes[curr].char);
      curr = nodes[curr].parentId || '';
    }
    return chars.join('');
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-[#bc8cff]" />
          <span className="font-mono font-bold text-base text-[#f0f6fc]">{structure.name}</span>
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border bg-[#bc8cff]/15 border-[#bc8cff]/30 text-[#bc8cff]">
            Prefix Trie
          </span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {trieData.wordsCount || trieData.words?.length || 0} {trieData.words?.length === 1 ? 'word' : 'words'}
          </span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {Object.keys(nodes).length} nodes
          </span>
        </div>

        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#bc8cff] bg-[#bc8cff]/10 px-2.5 py-0.5 rounded border border-[#bc8cff]/20 shadow-sm">
            ⚡ {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Stored Words Chips */}
      {trieData.words && trieData.words.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono py-1 px-2 bg-[#0d1117] rounded-lg border border-[#30363d]/60">
          <span className="text-[#8b949e] text-[11px] font-semibold flex-shrink-0">Words:</span>
          {trieData.words.map((w, idx) => (
            <span
              key={idx}
              className="bg-[#161b22] border border-[#30363d] text-[#f0f6fc] px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 shadow-sm"
            >
              <span>{w}</span>
              <CheckCircle2 className="w-3 h-3 text-[#3fb950]" />
            </span>
          ))}
        </div>
      )}

      {/* Active Search Ribbon Banner */}
      {activeSearchWord && (
        <div
          className={`border rounded-lg px-3 py-2 flex items-center justify-between text-xs font-mono shadow-sm ${
            searchResult === 'FOUND'
              ? 'bg-[#3fb950]/10 border-[#3fb950]/40 text-[#3fb950]'
              : searchResult === 'NOT_FOUND'
              ? 'bg-[#f85149]/10 border-[#f85149]/40 text-[#f85149]'
              : 'bg-[#bc8cff]/10 border-[#bc8cff]/40 text-[#bc8cff]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span className="font-semibold">Query: &quot;{activeSearchWord}&quot;</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            {searchResult === 'FOUND' ? (
              <span className="flex items-center gap-1 bg-[#3fb950] text-black px-2 py-0.5 rounded text-[10px]">
                <CheckCircle2 className="w-3 h-3" />
                FOUND IN TRIE
              </span>
            ) : searchResult === 'NOT_FOUND' ? (
              <span className="flex items-center gap-1 bg-[#f85149] text-white px-2 py-0.5 rounded text-[10px]">
                <XCircle className="w-3 h-3" />
                NOT FOUND
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-[#bc8cff]/20 text-[#bc8cff] px-2 py-0.5 rounded text-[10px] animate-pulse">
                <Sparkles className="w-3 h-3" />
                SEARCHING PREFIX...
              </span>
            )}
          </div>
        </div>
      )}

      {/* SVG Canvas for Trie Hierarchy */}
      <div className="bg-[#0d1117] rounded-lg p-3 flex justify-center overflow-x-auto min-h-[220px] border border-[#30363d]/50">
        <svg
          width={layout.width}
          height={layout.height}
          className="overflow-visible select-none"
        >
          {/* Edges */}
          {layout.edges.map((edge) => {
            const isPathEdge =
              activeSearchPath.includes(edge.id.split('->')[0]) &&
              activeSearchPath.includes(edge.id.split('->')[1]);

            return (
              <line
                key={edge.id}
                x1={edge.x1}
                y1={edge.y1 + 16}
                x2={edge.x2}
                y2={edge.y2 - 16}
                stroke={isPathEdge ? '#3fb950' : '#bc8cff'}
                strokeWidth={isPathEdge ? '3' : '2'}
                strokeLinecap="round"
                opacity={isPathEdge ? 1 : 0.65}
              />
            );
          })}

          {/* Nodes */}
          {layout.nodes.map((node) => {
            const isRoot = node.id === 'root';
            const isInSearchPath = activeSearchPath.includes(node.id);
            const isSelected = inspectedNodeId === node.id;
            const isWord = node.isWord;

            let strokeColor = '#30363d';
            let fillColor = '#161b22';

            if (isInSearchPath) {
              strokeColor = searchResult === 'NOT_FOUND' ? '#f85149' : '#3fb950';
              fillColor = searchResult === 'NOT_FOUND' ? '#f8514922' : '#3fb95022';
            } else if (isSelected) {
              strokeColor = '#bc8cff';
              fillColor = '#bc8cff22';
            } else if (isWord) {
              strokeColor = '#3fb950';
              fillColor = '#3fb95015';
            } else if (isRoot) {
              strokeColor = '#58a6ff';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNodeId(node.id)}
                className="cursor-pointer transition-transform duration-200 hover:scale-110"
              >
                {/* Search path glow halo */}
                {isInSearchPath && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={searchResult === 'NOT_FOUND' ? '#f85149' : '#3fb950'}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin"
                  />
                )}

                <circle
                  r="18"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isWord || isInSearchPath || isSelected ? '3' : '2'}
                  className="filter drop-shadow-md"
                />

                {/* Character or Root symbol */}
                <text
                  textAnchor="middle"
                  dy="5"
                  fill={isWord ? '#3fb950' : '#f0f6fc'}
                  fontSize={isRoot ? '10' : '14'}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {isRoot ? '●' : node.char}
                </text>

                {/* isWord checkmark indicator */}
                {isWord && (
                  <g transform="translate(10, -10)">
                    <circle r="6" fill="#3fb950" />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill="#000"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      ✓
                    </text>
                  </g>
                )}

                {/* Label below node */}
                <text
                  textAnchor="middle"
                  dy="30"
                  fill="#8b949e"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {isRoot ? 'root' : isWord ? `"${getPrefixPath(node.id)}"` : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Structure Inspector (Section 43) */}
      {inspectedNode && (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono border-b border-[#30363d]/60 pb-1.5">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#bc8cff]" />
              <span className="font-bold text-[#f0f6fc]">TRIE NODE INSPECTOR</span>
              <span className="text-[#8b949e]">({inspectedNode.id})</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                inspectedNode.isWord
                  ? 'bg-[#3fb950]/20 text-[#3fb950]'
                  : 'bg-[#21262d] text-[#8b949e]'
              }`}
            >
              {inspectedNode.id === 'root'
                ? 'ROOT NODE'
                : inspectedNode.isWord
                ? 'COMPLETE WORD (isWord = true)'
                : 'PREFIX NODE'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
              <span className="text-[10px] text-[#8b949e]">CHARACTER:</span>
              <span className="text-sm font-bold text-[#f0f6fc]">
                {inspectedNode.id === 'root' ? 'root' : `'${inspectedNode.char}'`}
              </span>
            </div>

            <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
              <span className="text-[10px] text-[#8b949e]">PREFIX SO FAR:</span>
              <span className="text-xs font-bold text-[#bc8cff]">
                &quot;{getPrefixPath(inspectedNode.id)}&quot;
              </span>
            </div>

            <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
              <span className="text-[10px] text-[#8b949e]">IS WORD:</span>
              <span
                className={`text-xs font-bold ${
                  inspectedNode.isWord ? 'text-[#3fb950]' : 'text-[#8b949e]'
                }`}
              >
                {inspectedNode.isWord ? 'true ✓' : 'false'}
              </span>
            </div>

            <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
              <span className="text-[10px] text-[#8b949e]">CHILDREN:</span>
              <span className="text-xs font-bold text-[#58a6ff]">
                {Object.keys(inspectedNode.children || {}).length > 0
                  ? Object.keys(inspectedNode.children).join(', ')
                  : 'none'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Conceptual View vs Runtime State Distinction (Section 41) */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e] border-t border-[#30363d]/40 pt-2 px-1">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-[#bc8cff]" />
          Shared prefixes are merged into single branching paths.
        </span>
        <span className="bg-[#21262d] px-1.5 py-0.5 rounded">Prefix Tree</span>
      </div>
    </div>
  );
};
