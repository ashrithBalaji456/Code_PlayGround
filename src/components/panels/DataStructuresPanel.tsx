import React from 'react';
import { DataStructureState } from '../../types/execution';
import { Database, Eye, Layers, ListOrdered, Hash, CheckSquare, GitFork, GitBranch, Network } from 'lucide-react';

interface DataStructuresPanelProps {
  structures: Record<string, DataStructureState>;
  onSelectStructure?: (id: string) => void;
}

export const DataStructuresPanel: React.FC<DataStructuresPanelProps> = ({
  structures,
  onSelectStructure,
}) => {
  const structureList = Object.values(structures);

  const getIcon = (type: string) => {
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
        return <CheckSquare className="w-4 h-4 text-[#a371f7]" />;
      case 'priorityqueue':
      case 'heap':
        return <Database className="w-4 h-4 text-[#d29922]" />;
      case 'tree':
        return <GitFork className="w-4 h-4 text-[#d29922]" />;
      case 'bst':
        return <GitBranch className="w-4 h-4 text-[#58a6ff]" />;
      case 'trie':
        return <Network className="w-4 h-4 text-[#bc8cff]" />;
      case 'graph':
        return <Network className="w-4 h-4 text-[#bc8cff]" />;
      default:
        return <Database className="w-4 h-4 text-[#8b949e]" />;
    }
  };

  const handleFocus = (id: string) => {
    onSelectStructure?.(id);
    const el = document.getElementById(`dsa-struct-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#58a6ff]', 'shadow-2xl');
      setTimeout(() => el.classList.remove('ring-2', 'ring-[#58a6ff]', 'shadow-2xl'), 1500);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#161b22] text-[#f0f6fc] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#f0883e]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
            Live Data Structures
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#f0883e] bg-[#f0883e]/15 border border-[#f0883e]/30 px-2 py-0.5 rounded-full font-bold">
          {structureList.length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {structureList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-[#8b949e]">
            <Database className="w-8 h-8 mb-2 opacity-40 text-[#8b949e]" />
            <p className="text-xs font-mono">No data structures active in current step.</p>
            <p className="text-[11px] text-[#8b949e]/80 mt-1 max-w-xs">
              Instantiate a Stack, Queue, Deque, LinkedList, HashMap, HashSet, PriorityQueue, Binary Tree, BST, Heap, or Trie to inspect its live state.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {structureList.map((st) => {
              const size = st.size ?? 0;
              return (
                <div
                  key={st.id}
                  onClick={() => handleFocus(st.id)}
                  className="bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff]/60 p-3 rounded-lg flex flex-col justify-between transition-all duration-200 cursor-pointer group hover:bg-[#161b22]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getIcon(st.type)}
                        <span className="font-bold text-sm text-[#f0f6fc] font-mono group-hover:text-[#58a6ff] transition-colors">
                          {st.name || st.id}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                        {st.type}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#8b949e] mb-1.5">
                      Type: <span className="text-[#58a6ff]">{st.dataType}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="text-[#8b949e]">{st.type === 'graph' ? 'Vertices / Edges:' : 'Size:'}</span>
                      <span className="text-[#3fb950] font-bold bg-[#3fb950]/15 px-1.5 py-0.2 rounded">
                        {st.type === 'graph' && st.graphData
                          ? `${Object.keys(st.graphData.nodes || {}).length} nodes, ${Object.keys(st.graphData.edges || {}).length} edges`
                          : `${size} elements`}
                      </span>
                    </div>

                    {st.lastOperation && (
                      <div className="text-[11px] font-mono text-[#d29922] bg-[#d29922]/10 border border-[#d29922]/30 px-2 py-1 rounded truncate">
                        ⚡ {st.lastOperation}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#30363d]/60 flex items-center justify-between text-[11px] text-[#8b949e]">
                    <span>ID: #{st.id}</span>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[#58a6ff] opacity-0 group-hover:opacity-100 transition-opacity font-semibold hover:underline"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Focus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
