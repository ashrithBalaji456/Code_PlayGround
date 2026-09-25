import {
  ExecutionEvent,
  ExecutionStep,
  VariableInfo,
  CallFrame,
  DataStructureState,
  HeapObject,
  ComparisonInfo,
  ExecutionError,
  GraphNodeData,
  GraphEdgeData,
  AlgorithmState,
  AlgorithmMetrics,
  RecursionTreeNode,
} from '../types/execution';

function estimateSize(type: string, val: any): number {
  switch (type.toLowerCase()) {
    case 'int':
    case 'float':
    case 'boolean':
      return 4;
    case 'char':
      return 2;
    case 'long':
    case 'double':
      return 8;
    case 'string':
      return 24 + (typeof val === 'string' ? val.length * 2 : 8);
    case 'stack':
    case 'queue':
    case 'deque':
    case 'linkedlist':
    case 'hashmap':
    case 'hashset':
    case 'priorityqueue':
      return 32 + (Array.isArray(val) ? val.length * 8 : 16);
    default:
      if (Array.isArray(val)) return 16 + val.length * 4;
      return 8;
  }
}

function toNumericIndex(idx: number | [number, number] | undefined, defaultVal = 0): number {
  if (typeof idx === 'number') return idx;
  if (Array.isArray(idx) && typeof idx[0] === 'number') return idx[0];
  return defaultVal;
}

export function reconstructExecutionSteps(
  events: ExecutionEvent[],
  _sourceCode: string
): ExecutionStep[] {
  const steps: ExecutionStep[] = [];

  let currentVariables: Record<string, VariableInfo> = {};
  let currentStructures: Record<string, DataStructureState> = {};
  let currentCallStack: CallFrame[] = [
    {
      id: 'frame-main',
      functionName: 'main',
      arguments: { args: 'String[0]' },
      localVariables: {},
      line: 1,
      depth: 1,
    },
  ];
  let currentConsole: string[] = [];
  let currentPointers: Record<string, any> = {};
  let currentComparison: ComparisonInfo | null = null;
  let currentError: ExecutionError | null = null;
  let currentHeap: HeapObject[] = [];

  let currentMetrics: AlgorithmMetrics = {
    comparisons: 0,
    swaps: 0,
    accesses: 0,
    assignments: 0,
    functionCalls: 0,
    recursiveCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  let currentAlgorithmState: AlgorithmState = {
    metrics: { ...currentMetrics },
  };

  let currentLine = 1;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.line && ev.line > 0) {
      currentLine = ev.line;
    }

    // Clone mutable objects for step immutability
    const nextVariables: Record<string, VariableInfo> = {};
    for (const [k, v] of Object.entries(currentVariables)) {
      nextVariables[k] = { ...v };
    }

    const nextStructures: Record<string, DataStructureState> = {};
    for (const [k, st] of Object.entries(currentStructures)) {
      nextStructures[k] = {
        ...st,
        arrayData: st.arrayData ? [...st.arrayData] : undefined,
        stackData: st.stackData ? [...st.stackData] : undefined,
        queueData: st.queueData ? [...st.queueData] : undefined,
        dequeData: st.dequeData ? [...st.dequeData] : undefined,
        priorityQueueData: st.priorityQueueData ? [...st.priorityQueueData] : undefined,
        linkedListData: st.linkedListData
          ? {
              headId: st.linkedListData.headId,
              nodes: { ...st.linkedListData.nodes },
            }
          : undefined,
        treeData: st.treeData
          ? {
              rootId: st.treeData.rootId,
              nodes: Object.fromEntries(
                Object.entries(st.treeData.nodes).map(([k, v]) => [k, { ...v }])
              ),
              traversalOrder: st.treeData.traversalOrder ? [...st.treeData.traversalOrder] : undefined,
              activeTraversalNodeId: st.treeData.activeTraversalNodeId,
              traversalType: st.treeData.traversalType,
              comparisonStep: st.treeData.comparisonStep,
              selectedNodeId: st.treeData.selectedNodeId,
            }
          : undefined,
        heapData: st.heapData
          ? {
              array: [...st.heapData.array],
              isMinHeap: st.heapData.isMinHeap,
              comparingIndices: st.heapData.comparingIndices ? [...st.heapData.comparingIndices] : undefined,
              swappingIndices: st.heapData.swappingIndices ? [...st.heapData.swappingIndices] : undefined,
              lastAction: st.heapData.lastAction,
            }
          : undefined,
        trieData: st.trieData
          ? {
              rootId: st.trieData.rootId,
              nodes: Object.fromEntries(
                Object.entries(st.trieData.nodes).map(([k, v]) => [
                  k,
                  { ...v, children: { ...v.children } },
                ])
              ),
              wordsCount: st.trieData.wordsCount,
              words: [...st.trieData.words],
              activeSearchWord: st.trieData.activeSearchWord,
              activeSearchPath: st.trieData.activeSearchPath ? [...st.trieData.activeSearchPath] : undefined,
              searchResult: st.trieData.searchResult,
              selectedNodeId: st.trieData.selectedNodeId,
            }
          : undefined,
        mapData: st.mapData
          ? {
              bucketCount: st.mapData.bucketCount,
              entries: st.mapData.entries.map((e) => ({ ...e })),
            }
          : undefined,
        setData: st.setData ? [...st.setData] : undefined,
        graphData: st.graphData
          ? (() => {
              const nodes: Record<string, GraphNodeData> = Object.fromEntries(
                Object.entries(st.graphData.nodes || {}).map(([k, v]) => [
                  k,
                  {
                    ...v,
                    inNeighbors: v.inNeighbors ? [...v.inNeighbors] : undefined,
                    outNeighbors: v.outNeighbors ? [...v.outNeighbors] : undefined,
                  },
                ])
              );
              const edges: Record<string, GraphEdgeData> = Object.fromEntries(
                Object.entries(st.graphData.edges || {}).map(([k, v]) => [k, { ...v }])
              );
              return {
                directed: st.graphData.directed,
                weighted: st.graphData.weighted,
                nodes,
                nodeList: Object.values(nodes),
                edges,
                edgeList: Object.values(edges),
                startNodeId: st.graphData.startNodeId,
                currentNodeId: st.graphData.currentNodeId,
                activeEdgeId: st.graphData.activeEdgeId,
                selectedNodeId: st.graphData.selectedNodeId,
                selectedEdgeId: st.graphData.selectedEdgeId,
                algorithm: st.graphData.algorithm,
                algorithmPhase: st.graphData.algorithmPhase,
                visitedOrder: st.graphData.visitedOrder ? [...st.graphData.visitedOrder] : undefined,
                queueState: st.graphData.queueState ? [...st.graphData.queueState] : undefined,
                distances: st.graphData.distances ? { ...st.graphData.distances } : undefined,
                shortestPath: st.graphData.shortestPath ? [...st.graphData.shortestPath] : undefined,
                cycleDetected: st.graphData.cycleDetected,
                cycleEdges: st.graphData.cycleEdges ? [...st.graphData.cycleEdges] : undefined,
              };
            })()
          : undefined,
        activeIndices: [],
        comparingIndices: [],
        swappingIndices: undefined,
        pointers: st.pointers ? { ...st.pointers } : {},
        pointerBadges: st.pointerBadges
          ? Object.fromEntries(Object.entries(st.pointerBadges).map(([pk, pv]) => [pk, [...pv]]))
          : undefined,
        windowRange: st.windowRange ? [...st.windowRange] : undefined,
        searchRange: st.searchRange ? [...st.searchRange] : undefined,
        pivotIndex: st.pivotIndex,
        sortedIndices: st.sortedIndices ? [...st.sortedIndices] : undefined,
      };
    }

    const nextCallStack: CallFrame[] = currentCallStack.map((f) => ({
      ...f,
      arguments: { ...f.arguments },
      localVariables: { ...f.localVariables },
    }));

    const nextConsole = [...currentConsole];
    const nextPointers = { ...currentPointers };
    let nextComparison: ComparisonInfo | null = null;
    let nextError: ExecutionError | null = null;
    if (currentError) {
      nextError = {
        type: currentError.type,
        message: currentError.message,
        line: currentError.line,
        detail: currentError.detail,
        brokenReference: currentError.brokenReference,
        variableName: currentError.variableName,
      };
    }

    const nextMetrics: AlgorithmMetrics = { ...currentMetrics };
    const nextAlgorithmState: AlgorithmState = {
      ...currentAlgorithmState,
      metrics: nextMetrics,
      sortRange: currentAlgorithmState.sortRange ? [...currentAlgorithmState.sortRange] : undefined,
      sortedIndices: currentAlgorithmState.sortedIndices ? [...currentAlgorithmState.sortedIndices] : undefined,
      differenceArray: currentAlgorithmState.differenceArray ? [...currentAlgorithmState.differenceArray] : undefined,
      reconstructedArray: currentAlgorithmState.reconstructedArray ? [...currentAlgorithmState.reconstructedArray] : undefined,
      recursionTree: currentAlgorithmState.recursionTree
        ? Object.fromEntries(
            Object.entries(currentAlgorithmState.recursionTree).map(([k, v]) => [
              k,
              { ...v, args: { ...v.args }, children: v.children ? [...v.children] : [] },
            ])
          )
        : undefined,
      choicesHistory: currentAlgorithmState.choicesHistory ? [...currentAlgorithmState.choicesHistory] : undefined,
      dpTable1D: currentAlgorithmState.dpTable1D ? [...currentAlgorithmState.dpTable1D] : undefined,
      dpTable2D: currentAlgorithmState.dpTable2D
        ? currentAlgorithmState.dpTable2D.map((row) => [...row])
        : undefined,
      dpPreviousCells: currentAlgorithmState.dpPreviousCells
        ? currentAlgorithmState.dpPreviousCells.map((c) => [...c] as [number, number])
        : undefined,
      memoEntries: currentAlgorithmState.memoEntries
        ? currentAlgorithmState.memoEntries.map((e) => ({ ...e }))
        : undefined,
      candidates: currentAlgorithmState.candidates ? [...currentAlgorithmState.candidates] : undefined,
    };

    let explanation = `Executing step ${i + 1}`;
    const stId = ev.structureId || ev.variable || ev.arrayId || 'struct';

    switch (ev.type) {
      case 'PROGRAM_START':
        explanation = 'Program execution started';
        break;

      case 'LINE_EXECUTE':
        explanation = `Executing line ${ev.line}`;
        break;

      case 'VARIABLE_CREATE': {
        const type = ev.dataType || 'int';
        const val = ev.value;
        const bytes = estimateSize(type, val);
        const varInfo: VariableInfo = {
          name: ev.variable!,
          type,
          value: val,
          scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
          isReference: false,
          estimatedBytes: bytes,
        };
        nextVariables[ev.variable!] = varInfo;
        const topFrame = nextCallStack[nextCallStack.length - 1];
        if (topFrame) {
          topFrame.localVariables[ev.variable!] = varInfo;
        }
        explanation = `Declared ${type} ${ev.variable} = ${val}`;
        break;
      }

      case 'VARIABLE_UPDATE': {
        const v = nextVariables[ev.variable!];
        if (v) {
          v.value = ev.newValue;
        } else {
          nextVariables[ev.variable!] = {
            name: ev.variable!,
            type: ev.dataType || 'int',
            value: ev.newValue,
            scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
            isReference: false,
            estimatedBytes: estimateSize(ev.dataType || 'int', ev.newValue),
          };
        }
        explanation = `Updated variable ${ev.variable} from ${ev.oldValue} to ${ev.newValue}`;
        break;
      }

      // === ARRAY ===
      case 'ARRAY_CREATE': {
        const arrId = ev.structureId || ev.arrayId || 'arr';
        const arrVals = Array.isArray(ev.values) ? [...ev.values] : [];
        nextStructures[arrId] = {
          id: arrId,
          name: ev.arrayId || arrId,
          type: 'array',
          dataType: ev.dataType || 'int[]',
          arrayData: arrVals,
          size: arrVals.length,
          activeIndices: [],
          pointers: {},
          lastOperation: `Allocated int[${arrVals.length}]`,
        };

        nextVariables[arrId] = {
          name: arrId,
          type: 'int[]',
          value: `[${arrVals.join(', ')}]`,
          scope: 'main',
          isReference: true,
          refTargetId: arrId,
          estimatedBytes: 16 + arrVals.length * 4,
        };

        explanation = `Initialized array ${arrId} with elements [${arrVals.join(', ')}]`;
        break;
      }

      case 'ARRAY_UPDATE': {
        const arrId = ev.structureId || ev.arrayId || 'arr';
        const st = nextStructures[arrId];
        if (st && st.arrayData && typeof ev.index === 'number') {
          st.arrayData[ev.index] = ev.newValue;
          st.activeIndices = [ev.index];
          st.lastOperation = `${arrId}[${ev.index}] = ${ev.newValue}`;
          if (nextVariables[arrId]) {
            nextVariables[arrId].value = `[${st.arrayData.join(', ')}]`;
          }
        }
        explanation = `Mutated ${arrId}[${ev.index}] from ${ev.oldValue} to ${ev.newValue}`;
        break;
      }

      case 'ARRAY_ACCESS': {
        const arrId = ev.structureId || ev.arrayId || 'arr';
        const st = nextStructures[arrId];
        if (st && typeof ev.index === 'number') {
          st.activeIndices = [ev.index];
        }
        explanation = `Read ${arrId}[${ev.index}] = ${ev.value}`;
        break;
      }

      case 'MATRIX_CREATE': {
        const matId = ev.structureId || ev.variable || 'matrix';
        const mat = Array.isArray(ev.values) ? ev.values : [];
        const rows = mat.length;
        const cols = rows > 0 && Array.isArray(mat[0]) ? mat[0].length : 0;
        nextStructures[matId] = {
          id: matId,
          name: ev.variable || matId,
          type: 'matrix',
          dataType: ev.dataType || 'int[][]',
          size: rows * cols,
          matrixData: mat.map((r: any[]) => [...r]),
          createdAtStep: ev.step || 0,
          lastUpdatedStep: ev.step || 0,
          lastOperation: `Allocated int[${rows}][${cols}]`,
          stateCategory: 'RUNTIME_STATE',
        };
        nextVariables[matId] = {
          name: matId,
          type: ev.dataType || 'int[][]',
          value: `@${matId}`,
          scope: 'main',
          isReference: true,
          refTargetId: `@${matId}`,
          estimatedBytes: 8,
        };
        explanation = `Initialized 2D Matrix ${matId} [${rows}x${cols}]`;
        break;
      }

      case 'MATRIX_UPDATE': {
        const matId = ev.structureId || ev.variable || 'matrix';
        const st = nextStructures[matId];
        const r = ev.row ?? 0;
        const c = ev.col ?? 0;
        if (st && st.matrixData) {
          if (!st.matrixData[r]) st.matrixData[r] = [];
          st.matrixData[r][c] = ev.newValue;
          st.lastUpdatedStep = ev.step || 0;
          st.lastOperation = `${matId}[${r}][${c}] = ${ev.newValue}`;
        }
        explanation = `Updated matrix ${matId}[${r}][${c}] from ${ev.oldValue} to ${ev.newValue}`;
        break;
      }

      // === STACK ===
      case 'STACK_CREATE': {
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'stack',
          dataType: ev.dataType || 'Stack<Integer>',
          stackData: [],
          size: 0,
          lastOperation: 'new Stack<>()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'Stack<Integer>',
          value: 'size = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32,
        };
        explanation = `Created new Stack: ${stId}`;
        break;
      }

      case 'STACK_PUSH': {
        const st = nextStructures[stId];
        if (st) {
          st.stackData = [...(st.stackData || []), ev.value];
          st.size = st.stackData.length;
          st.lastOperation = `push(${ev.value})`;
          if (nextVariables[stId]) {
            nextVariables[stId].value = `size = ${st.size}`;
          }
        }
        explanation = `Pushed ${ev.value} onto stack ${stId}`;
        break;
      }

      case 'STACK_POP': {
        const st = nextStructures[stId];
        if (st && st.stackData && st.stackData.length > 0) {
          const popped = st.stackData[st.stackData.length - 1];
          st.stackData = st.stackData.slice(0, -1);
          st.size = st.stackData.length;
          st.lastOperation = `pop() ➔ ${ev.value ?? popped}`;
          if (nextVariables[stId]) {
            nextVariables[stId].value = `size = ${st.size}`;
          }
        }
        explanation = `Popped ${ev.value} from stack ${stId}`;
        break;
      }

      case 'STACK_PEEK': {
        const st = nextStructures[stId];
        if (st) {
          st.lastOperation = `peek() ➔ ${ev.value}`;
        }
        explanation = `Inspected top of stack ${stId}: ${ev.value}`;
        break;
      }

      case 'STACK_CLEAR': {
        const st = nextStructures[stId];
        if (st) {
          st.stackData = [];
          st.size = 0;
          st.lastOperation = 'clear()';
          if (nextVariables[stId]) nextVariables[stId].value = 'size = 0';
        }
        explanation = `Cleared stack ${stId}`;
        break;
      }

      // === QUEUE ===
      case 'QUEUE_CREATE': {
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'queue',
          dataType: ev.dataType || 'Queue<Integer>',
          queueData: [],
          size: 0,
          lastOperation: 'new LinkedList<>()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'Queue<Integer>',
          value: 'size = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32,
        };
        explanation = `Created new Queue: ${stId}`;
        break;
      }

      case 'QUEUE_ENQUEUE': {
        const st = nextStructures[stId];
        if (st) {
          st.queueData = [...(st.queueData || []), ev.value];
          st.size = st.queueData.length;
          st.lastOperation = `add(${ev.value})`;
          if (nextVariables[stId]) {
            nextVariables[stId].value = `size = ${st.size}`;
          }
        }
        explanation = `Enqueued ${ev.value} into queue ${stId}`;
        break;
      }

      case 'QUEUE_DEQUEUE': {
        const st = nextStructures[stId];
        if (st && st.queueData && st.queueData.length > 0) {
          const dequeued = st.queueData[0];
          st.queueData = st.queueData.slice(1);
          st.size = st.queueData.length;
          st.lastOperation = `poll() ➔ ${ev.value ?? dequeued}`;
          if (nextVariables[stId]) {
            nextVariables[stId].value = `size = ${st.size}`;
          }
        }
        explanation = `Dequeued ${ev.value} from queue ${stId}`;
        break;
      }

      case 'QUEUE_PEEK': {
        const st = nextStructures[stId];
        if (st) {
          st.lastOperation = `peek() ➔ ${ev.value}`;
        }
        explanation = `Inspected front of queue ${stId}: ${ev.value}`;
        break;
      }

      case 'QUEUE_CLEAR': {
        const st = nextStructures[stId];
        if (st) {
          st.queueData = [];
          st.size = 0;
          st.lastOperation = 'clear()';
          if (nextVariables[stId]) nextVariables[stId].value = 'size = 0';
        }
        explanation = `Cleared queue ${stId}`;
        break;
      }

      // === DEQUE ===
      case 'DEQUE_CREATE': {
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'deque',
          dataType: ev.dataType || 'Deque<Integer>',
          dequeData: [],
          queueData: [],
          size: 0,
          lastOperation: 'new ArrayDeque<>()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'Deque<Integer>',
          value: 'size = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32,
        };
        explanation = `Created new Deque: ${stId}`;
        break;
      }

      case 'DEQUE_ADD_FIRST': {
        const st = nextStructures[stId];
        if (st) {
          st.dequeData = [ev.value, ...(st.dequeData || [])];
          st.queueData = st.dequeData;
          st.size = st.dequeData.length;
          st.lastOperation = `addFirst(${ev.value})`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Inserted ${ev.value} at FRONT of deque ${stId}`;
        break;
      }

      case 'DEQUE_ADD_LAST': {
        const st = nextStructures[stId];
        if (st) {
          st.dequeData = [...(st.dequeData || []), ev.value];
          st.queueData = st.dequeData;
          st.size = st.dequeData.length;
          st.lastOperation = `addLast(${ev.value})`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Inserted ${ev.value} at REAR of deque ${stId}`;
        break;
      }

      case 'DEQUE_REMOVE_FIRST': {
        const st = nextStructures[stId];
        if (st && st.dequeData && st.dequeData.length > 0) {
          st.dequeData = st.dequeData.slice(1);
          st.queueData = st.dequeData;
          st.size = st.dequeData.length;
          st.lastOperation = `removeFirst() ➔ ${ev.value}`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Removed FRONT element ${ev.value} from deque ${stId}`;
        break;
      }

      case 'DEQUE_REMOVE_LAST': {
        const st = nextStructures[stId];
        if (st && st.dequeData && st.dequeData.length > 0) {
          st.dequeData = st.dequeData.slice(0, -1);
          st.queueData = st.dequeData;
          st.size = st.dequeData.length;
          st.lastOperation = `removeLast() ➔ ${ev.value}`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Removed REAR element ${ev.value} from deque ${stId}`;
        break;
      }

      case 'DEQUE_PEEK_FIRST':
      case 'DEQUE_PEEK_LAST': {
        const st = nextStructures[stId];
        if (st) {
          st.lastOperation = `${ev.type === 'DEQUE_PEEK_FIRST' ? 'peekFirst' : 'peekLast'}() ➔ ${ev.value}`;
        }
        explanation = `Inspected deque ${stId}: ${ev.value}`;
        break;
      }

      // === LINKED LIST ===
      case 'LINKEDLIST_CREATE': {
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'linkedlist',
          dataType: ev.dataType || 'LinkedList<Integer>',
          linkedListData: { headId: null, nodes: {} },
          size: 0,
          lastOperation: 'new LinkedList<>()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'LinkedList<Integer>',
          value: 'size = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32,
        };
        explanation = `Created new LinkedList: ${stId}`;
        break;
      }

      case 'LINKEDLIST_ADD':
      case 'LINKEDLIST_ADD_FIRST':
      case 'LINKEDLIST_ADD_LAST': {
        const st = nextStructures[stId];
        if (st) {
          if (!st.linkedListData) st.linkedListData = { headId: null, nodes: {} };
          const nodes = { ...st.linkedListData.nodes };
          const nodeId = `Node#${100 + Object.keys(nodes).length + 1}`;
          const isAddFirst = ev.type === 'LINKEDLIST_ADD_FIRST' || ev.index === 0;

          if (isAddFirst) {
            const oldHead = st.linkedListData.headId;
            nodes[nodeId] = {
              id: nodeId,
              value: ev.value,
              nextId: oldHead,
            };
            st.linkedListData.headId = nodeId;
          } else {
            // Append to end of linked chain
            let curr = st.linkedListData.headId;
            while (curr && nodes[curr]?.nextId) {
              curr = nodes[curr].nextId;
            }

            nodes[nodeId] = {
              id: nodeId,
              value: ev.value,
              nextId: null,
            };

            if (curr && nodes[curr]) {
              nodes[curr] = { ...nodes[curr], nextId: nodeId };
            } else {
              st.linkedListData.headId = nodeId;
            }
          }

          st.linkedListData.nodes = nodes;
          st.size = Object.keys(nodes).length;
          st.lastOperation = `add(${ev.value})`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Added node ${ev.value} to LinkedList ${stId}`;
        break;
      }

      case 'LINKEDLIST_REMOVE':
      case 'LINKEDLIST_REMOVE_FIRST':
      case 'LINKEDLIST_REMOVE_LAST': {
        const st = nextStructures[stId];
        if (st && st.linkedListData) {
          const nodes = { ...st.linkedListData.nodes };
          const isRemoveFirst = ev.type === 'LINKEDLIST_REMOVE_FIRST' || ev.index === 0;

          if (isRemoveFirst && st.linkedListData.headId) {
            const headNode = nodes[st.linkedListData.headId];
            st.linkedListData.headId = headNode?.nextId || null;
            if (headNode) delete nodes[headNode.id];
          } else {
            // Remove node from chain
            let curr = st.linkedListData.headId;
            let prev: string | null = null;
            let count = 0;
            const targetIdx = typeof ev.index === 'number' ? ev.index : 9999;

            while (curr && count < targetIdx && nodes[curr]?.nextId) {
              prev = curr;
              curr = nodes[curr].nextId;
              count++;
            }

            if (curr && nodes[curr]) {
              const nextOfCurr = nodes[curr].nextId;
              if (prev && nodes[prev]) {
                nodes[prev] = { ...nodes[prev], nextId: nextOfCurr };
              } else {
                st.linkedListData.headId = nextOfCurr;
              }
              delete nodes[curr];
            }
          }

          st.linkedListData.nodes = nodes;
          st.size = Object.keys(nodes).length;
          st.lastOperation = `remove() ➔ ${ev.value}`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Removed node ${ev.value} from LinkedList ${stId}`;
        break;
      }

      case 'LINKEDLIST_CLEAR': {
        const st = nextStructures[stId];
        if (st) {
          st.linkedListData = { headId: null, nodes: {} };
          st.size = 0;
          st.lastOperation = 'clear()';
          if (nextVariables[stId]) nextVariables[stId].value = 'size = 0';
        }
        explanation = `Cleared LinkedList ${stId}`;
        break;
      }

      // === HASHMAP ===
      case 'MAP_CREATE': {
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'map',
          dataType: ev.dataType || 'HashMap<K, V>',
          mapData: { entries: [], bucketCount: 8 },
          size: 0,
          lastOperation: 'new HashMap<>()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'HashMap<K, V>',
          value: 'size = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 48,
        };
        explanation = `Created new HashMap: ${stId}`;
        break;
      }

      case 'MAP_INSERT': {
        const st = nextStructures[stId];
        if (st) {
          if (!st.mapData) st.mapData = { entries: [], bucketCount: 8 };
          const entries = [...st.mapData.entries];
          const existingIdx = entries.findIndex((e) => String(e.key) === String(ev.key));

          const hash = ev.hash !== undefined ? ev.hash : Math.abs(String(ev.key).split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0));
          const bucket = ev.bucket !== undefined ? ev.bucket : Math.abs(hash % (st.mapData.bucketCount || 8));

          if (existingIdx >= 0) {
            entries[existingIdx] = { key: ev.key, value: ev.value, hash, bucket };
            st.lastOperation = `put(${ev.key}, ${ev.value}) [updated]`;
          } else {
            entries.push({ key: ev.key, value: ev.value, hash, bucket });
            st.lastOperation = `put(${ev.key}, ${ev.value})`;
          }

          st.mapData.entries = entries;
          st.size = entries.length;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `HashMap put: "${ev.key}" ➔ ${ev.value} (hash: ${ev.hash ?? 'computed'}, bucket: ${ev.bucket ?? 0})`;
        break;
      }

      case 'MAP_LOOKUP': {
        const st = nextStructures[stId];
        if (st) {
          st.lastOperation = `get(${ev.key}) ➔ ${ev.value}`;
        }
        explanation = `HashMap get("${ev.key}") returned ${ev.value}`;
        break;
      }

      case 'MAP_DELETE': {
        const st = nextStructures[stId];
        if (st && st.mapData) {
          st.mapData.entries = st.mapData.entries.filter((e) => String(e.key) !== String(ev.key));
          st.size = st.mapData.entries.length;
          st.lastOperation = `remove(${ev.key}) ➔ ${ev.value}`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `HashMap removed entry: "${ev.key}"`;
        break;
      }

      case 'MAP_CLEAR': {
        const st = nextStructures[stId];
        if (st) {
          st.mapData = { entries: [], bucketCount: 8 };
          st.size = 0;
          st.lastOperation = 'clear()';
          if (nextVariables[stId]) nextVariables[stId].value = 'size = 0';
        }
        explanation = `Cleared HashMap ${stId}`;
        break;
      }

      // === HASHSET ===
      case 'SET_CREATE': {
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'set',
          dataType: ev.dataType || 'HashSet<Integer>',
          setData: [],
          size: 0,
          lastOperation: 'new HashSet<>()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'HashSet<Integer>',
          value: 'size = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32,
        };
        explanation = `Created new HashSet: ${stId}`;
        break;
      }

      case 'SET_ADD': {
        const st = nextStructures[stId];
        if (st) {
          const currentSet = st.setData || [];
          const alreadyExists = currentSet.some((v) => String(v) === String(ev.value));

          if (alreadyExists || ev.conditionResult === false) {
            st.lastOperation = `add(${ev.value}) ➔ Duplicate rejected`;
            nextComparison = {
              left: String(ev.value),
              right: 'HashSet',
              operator: '∈',
              result: false,
              explanation: `${ev.value} already exists in HashSet! Set size remains ${currentSet.length}.`,
            };
          } else {
            st.setData = [...currentSet, ev.value];
            st.size = st.setData.length;
            st.lastOperation = `add(${ev.value})`;
            if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
          }
        }
        explanation = `HashSet add(${ev.value}): ${ev.conditionResult === false ? 'Duplicate rejected' : 'Added successfully'}`;
        break;
      }

      case 'SET_REMOVE': {
        const st = nextStructures[stId];
        if (st) {
          st.setData = (st.setData || []).filter((v) => String(v) !== String(ev.value));
          st.size = st.setData.length;
          st.lastOperation = `remove(${ev.value})`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Removed ${ev.value} from HashSet ${stId}`;
        break;
      }

      case 'SET_LOOKUP': {
        const st = nextStructures[stId];
        if (st) {
          st.lastOperation = `contains(${ev.value}) ➔ ${ev.conditionResult ? 'TRUE' : 'FALSE'}`;
          nextComparison = {
            left: String(ev.value),
            right: 'HashSet',
            operator: '∈',
            result: !!ev.conditionResult,
            explanation: `${ev.value} ${ev.conditionResult ? 'is PRESENT' : 'is NOT present'} in HashSet`,
          };
        }
        explanation = `HashSet contains(${ev.value}): ${ev.conditionResult ? 'TRUE ✓' : 'FALSE ✗'}`;
        break;
      }

      case 'SET_CLEAR': {
        const st = nextStructures[stId];
        if (st) {
          st.setData = [];
          st.size = 0;
          st.lastOperation = 'clear()';
          if (nextVariables[stId]) nextVariables[stId].value = 'size = 0';
        }
        explanation = `Cleared HashSet ${stId}`;
        break;
      }

      // === PRIORITY QUEUE ===
      case 'PRIORITYQUEUE_CREATE': {
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'priorityqueue',
          dataType: ev.dataType || 'PriorityQueue<Integer>',
          priorityQueueData: [],
          size: 0,
          lastOperation: 'new PriorityQueue<>()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'PriorityQueue<Integer>',
          value: 'size = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32,
        };
        explanation = `Created new PriorityQueue: ${stId}`;
        break;
      }

      case 'PRIORITYQUEUE_ADD': {
        const st = nextStructures[stId];
        if (st) {
          const rawElems = Array.isArray(ev.values) ? [...ev.values] : [...(st.priorityQueueData || []), ev.value];
          st.priorityQueueData = rawElems;
          st.size = rawElems.length;
          st.lastOperation = `add(${ev.value})`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Inserted ${ev.value} into PriorityQueue ${stId}`;
        break;
      }

      case 'PRIORITYQUEUE_POLL': {
        const st = nextStructures[stId];
        if (st) {
          const rawElems = Array.isArray(ev.values) ? [...ev.values] : (st.priorityQueueData || []).slice(1);
          st.priorityQueueData = rawElems;
          st.size = rawElems.length;
          st.lastOperation = `poll() ➔ ${ev.value}`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Polled highest priority element ${ev.value} from PriorityQueue ${stId}`;
        break;
      }

      case 'PRIORITYQUEUE_PEEK': {
        const st = nextStructures[stId];
        if (st) {
          st.lastOperation = `peek() ➔ ${ev.value}`;
        }
        explanation = `Inspected min/max element in PriorityQueue ${stId}: ${ev.value}`;
        break;
      }

      // === BINARY TREE ===
      case 'TREE_CREATE': {
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'tree',
          dataType: ev.dataType || 'BinaryTree',
          treeData: { rootId: null, nodes: {} },
          size: 0,
          lastOperation: 'new BinaryTree()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'BinaryTree',
          value: 'size = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32,
        };
        explanation = `Created Binary Tree: ${stId}`;
        break;
      }

      case 'TREE_NODE_CREATE': {
        let st = nextStructures[stId];
        if (!st) {
          st = {
            id: stId,
            name: stId,
            type: 'tree',
            dataType: 'BinaryTree',
            treeData: { rootId: null, nodes: {} },
            size: 0,
          };
          nextStructures[stId] = st;
        }
        if (!st.treeData) st.treeData = { rootId: null, nodes: {} };
        const nodeId = ev.nodeId || `Node#${ev.value}`;
        st.treeData.nodes[nodeId] = {
          id: nodeId,
          value: ev.value,
          leftId: null,
          rightId: null,
          parentId: null,
        };
        if (!st.treeData.rootId) {
          st.treeData.rootId = nodeId;
        }
        st.size = Object.keys(st.treeData.nodes).length;
        st.lastOperation = `createNode(${ev.value})`;
        if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        explanation = `Created Tree Node (${ev.value}) [${nodeId}]`;
        break;
      }

      case 'TREE_LINK_LEFT': {
        const st = nextStructures[stId];
        if (st && st.treeData && ev.parentNodeId && ev.childNodeId) {
          if (st.treeData.nodes[ev.parentNodeId]) {
            st.treeData.nodes[ev.parentNodeId].leftId = ev.childNodeId;
          }
          if (st.treeData.nodes[ev.childNodeId]) {
            st.treeData.nodes[ev.childNodeId].parentId = ev.parentNodeId;
            st.treeData.nodes[ev.childNodeId].isLeft = true;
          }
          const pVal = st.treeData.nodes[ev.parentNodeId]?.value ?? ev.parentNodeId;
          const cVal = st.treeData.nodes[ev.childNodeId]?.value ?? ev.childNodeId;
          st.lastOperation = `linkLeft(${pVal} ➔ ${cVal})`;
        }
        explanation = `Linked node ${ev.childNodeId} as LEFT child of ${ev.parentNodeId}`;
        break;
      }

      case 'TREE_LINK_RIGHT': {
        const st = nextStructures[stId];
        if (st && st.treeData && ev.parentNodeId && ev.childNodeId) {
          if (st.treeData.nodes[ev.parentNodeId]) {
            st.treeData.nodes[ev.parentNodeId].rightId = ev.childNodeId;
          }
          if (st.treeData.nodes[ev.childNodeId]) {
            st.treeData.nodes[ev.childNodeId].parentId = ev.parentNodeId;
            st.treeData.nodes[ev.childNodeId].isLeft = false;
          }
          const pVal = st.treeData.nodes[ev.parentNodeId]?.value ?? ev.parentNodeId;
          const cVal = st.treeData.nodes[ev.childNodeId]?.value ?? ev.childNodeId;
          st.lastOperation = `linkRight(${pVal} ➔ ${cVal})`;
        }
        explanation = `Linked node ${ev.childNodeId} as RIGHT child of ${ev.parentNodeId}`;
        break;
      }

      case 'TREE_UNLINK_LEFT': {
        const st = nextStructures[stId];
        if (st && st.treeData && ev.parentNodeId && st.treeData.nodes[ev.parentNodeId]) {
          st.treeData.nodes[ev.parentNodeId].leftId = null;
          st.lastOperation = `unlinkLeft(${st.treeData.nodes[ev.parentNodeId].value})`;
        }
        explanation = `Unlinked LEFT child from node ${ev.parentNodeId}`;
        break;
      }

      case 'TREE_UNLINK_RIGHT': {
        const st = nextStructures[stId];
        if (st && st.treeData && ev.parentNodeId && st.treeData.nodes[ev.parentNodeId]) {
          st.treeData.nodes[ev.parentNodeId].rightId = null;
          st.lastOperation = `unlinkRight(${st.treeData.nodes[ev.parentNodeId].value})`;
        }
        explanation = `Unlinked RIGHT child from node ${ev.parentNodeId}`;
        break;
      }

      case 'TREE_NODE_DELETE': {
        const st = nextStructures[stId];
        if (st && st.treeData && ev.nodeId) {
          delete st.treeData.nodes[ev.nodeId];
          st.size = Object.keys(st.treeData.nodes).length;
          if (st.treeData.rootId === ev.nodeId) st.treeData.rootId = null;
          st.lastOperation = `deleteNode(${ev.nodeId})`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Deleted node ${ev.nodeId} from tree ${stId}`;
        break;
      }

      case 'TREE_ROOT_UPDATE': {
        const st = nextStructures[stId];
        if (st && st.treeData) {
          st.treeData.rootId = ev.nodeId || null;
        }
        explanation = `Updated root of tree ${stId} to ${ev.nodeId}`;
        break;
      }

      case 'TREE_TRAVERSAL_START': {
        const st = nextStructures[stId];
        if (st && st.treeData) {
          st.treeData.traversalOrder = [];
          st.treeData.traversalType = ev.traversal || 'INORDER';
          st.lastOperation = `${st.treeData.traversalType} traversal started`;
        }
        explanation = `Started ${ev.traversal || 'tree'} traversal on ${stId}`;
        break;
      }

      case 'TREE_NODE_VISIT': {
        const st = nextStructures[stId];
        if (st && st.treeData) {
          st.treeData.activeTraversalNodeId = ev.nodeId || null;
          if (ev.value !== undefined) {
            st.treeData.traversalOrder = [...(st.treeData.traversalOrder || []), ev.value];
          }
          st.lastOperation = `visited(${ev.value}) [${ev.traversal || 'TRAVERSAL'}]`;
        }
        explanation = `Visited tree node ${ev.value} (${ev.traversal || 'Traversal'})`;
        break;
      }

      case 'TREE_TRAVERSAL_END': {
        const st = nextStructures[stId];
        if (st && st.treeData) {
          st.treeData.activeTraversalNodeId = null;
        }
        explanation = `Finished tree traversal on ${stId}`;
        break;
      }

      case 'TREE_CLEAR': {
        const st = nextStructures[stId];
        if (st && st.treeData) {
          st.treeData = { rootId: null, nodes: {} };
          st.size = 0;
          st.lastOperation = 'clear()';
          if (nextVariables[stId]) nextVariables[stId].value = 'size = 0';
        }
        explanation = `Cleared tree ${stId}`;
        break;
      }

      // === BST ===
      case 'BST_CREATE': {
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'bst',
          dataType: ev.dataType || 'BST',
          treeData: { rootId: null, nodes: {} },
          size: 0,
          lastOperation: 'new BST()',
        };
        nextVariables[stId] = {
          name: stId,
          type: 'BST',
          value: 'size = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32,
        };
        explanation = `Created Binary Search Tree (BST): ${stId}`;
        break;
      }

      case 'BST_INSERT': {
        let st = nextStructures[stId];
        if (!st) {
          st = {
            id: stId,
            name: stId,
            type: 'bst',
            dataType: 'BST',
            treeData: { rootId: null, nodes: {} },
            size: 0,
          };
          nextStructures[stId] = st;
        }
        if (!st.treeData) st.treeData = { rootId: null, nodes: {} };
        const nodeId = ev.nodeId || `Node#${ev.value}`;
        const val = typeof ev.value === 'number' ? ev.value : parseInt(ev.value, 10) || 0;
        st.treeData.nodes[nodeId] = {
          id: nodeId,
          value: val,
          leftId: null,
          rightId: null,
          parentId: null,
        };

        if (!st.treeData.rootId) {
          st.treeData.rootId = nodeId;
        } else {
          // Find standard BST parent
          let currId: string | null = st.treeData.rootId;
          let pId: string | null = null;
          let isLeftChild = false;
          while (currId && st.treeData.nodes[currId] && currId !== nodeId) {
            pId = currId;
            const currVal = st.treeData.nodes[currId].value;
            if (val < currVal) {
              isLeftChild = true;
              currId = st.treeData.nodes[currId].leftId;
            } else {
              isLeftChild = false;
              currId = st.treeData.nodes[currId].rightId;
            }
          }
          if (pId && st.treeData.nodes[pId]) {
            st.treeData.nodes[nodeId].parentId = pId;
            st.treeData.nodes[nodeId].isLeft = isLeftChild;
            if (isLeftChild) {
              st.treeData.nodes[pId].leftId = nodeId;
            } else {
              st.treeData.nodes[pId].rightId = nodeId;
            }
          }
        }

        st.size = Object.keys(st.treeData.nodes).length;
        st.lastOperation = `insert(${val})`;
        if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        explanation = `Inserted ${val} into BST ${stId}`;
        break;
      }

      case 'BST_COMPARE': {
        const st = nextStructures[stId];
        const res = !!ev.conditionResult;
        const compStr = `${ev.leftVal} ${ev.operator || '<'} ${ev.rightVal} ? ${res ? 'TRUE' : 'FALSE'}`;
        nextComparison = {
          left: String(ev.leftVal),
          right: String(ev.rightVal),
          operator: ev.operator || '<',
          result: res,
          explanation: `${compStr} ➔ ${res ? 'Move LEFT' : 'Move RIGHT'}`,
        };
        if (st && st.treeData) {
          st.treeData.comparisonStep = compStr;
          st.lastOperation = compStr;
        }
        explanation = `BST Decision: ${compStr}`;
        break;
      }

      case 'BST_SEARCH_START': {
        const st = nextStructures[stId];
        if (st) {
          st.lastOperation = `search(${ev.value})`;
        }
        explanation = `Started BST search for key ${ev.value}`;
        break;
      }

      case 'BST_NODE_FOUND': {
        const st = nextStructures[stId];
        if (st && st.treeData) {
          st.treeData.selectedNodeId = ev.nodeId || null;
          st.lastOperation = `found(${ev.value}) ✓`;
        }
        nextComparison = {
          left: String(ev.value),
          right: 'BST',
          operator: '∈',
          result: true,
          explanation: `Key ${ev.value} FOUND in BST!`,
        };
        explanation = `Key ${ev.value} found in BST ${stId}`;
        break;
      }

      case 'BST_SEARCH_END': {
        const found = !!ev.conditionResult;
        nextComparison = {
          left: String(ev.value),
          right: 'BST',
          operator: found ? '∈' : '∉',
          result: found,
          explanation: `Key ${ev.value} ${found ? 'FOUND' : 'NOT FOUND'} in BST`,
        };
        explanation = `BST search for ${ev.value}: ${found ? 'FOUND ✓' : 'NOT FOUND ✗'}`;
        break;
      }

      case 'BST_DELETE': {
        const st = nextStructures[stId];
        if (st && st.treeData && ev.value !== undefined) {
          const targetNode = Object.values(st.treeData.nodes).find(
            (n) => n.value === ev.value || n.id === ev.nodeId
          );
          if (targetNode) {
            delete st.treeData.nodes[targetNode.id];
            // Unlink from parent
            if (targetNode.parentId && st.treeData.nodes[targetNode.parentId]) {
              const p = st.treeData.nodes[targetNode.parentId];
              if (p.leftId === targetNode.id) p.leftId = targetNode.leftId || targetNode.rightId || null;
              if (p.rightId === targetNode.id) p.rightId = targetNode.rightId || targetNode.leftId || null;
            } else if (st.treeData.rootId === targetNode.id) {
              st.treeData.rootId = targetNode.rightId || targetNode.leftId || null;
            }
          }
          st.size = Object.keys(st.treeData.nodes).length;
          st.lastOperation = `delete(${ev.value}) [${ev.detail || 'node removed'}]`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Deleted ${ev.value} from BST ${stId}`;
        break;
      }

      // === HEAP ===
      case 'HEAP_CREATE': {
        const isMin = ev.heapType !== 'MAX';
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'heap',
          dataType: ev.dataType || (isMin ? 'MinHeap' : 'MaxHeap'),
          heapData: { array: [], isMinHeap: isMin },
          size: 0,
          lastOperation: `new ${isMin ? 'MinHeap' : 'MaxHeap'}()`,
        };
        nextVariables[stId] = {
          name: stId,
          type: isMin ? 'MinHeap' : 'MaxHeap',
          value: 'size = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32,
        };
        explanation = `Created ${isMin ? 'Min-Heap' : 'Max-Heap'}: ${stId}`;
        break;
      }

      case 'HEAP_INSERT': {
        let st = nextStructures[stId];
        if (!st) {
          st = {
            id: stId,
            name: stId,
            type: 'heap',
            dataType: 'Heap',
            heapData: { array: [], isMinHeap: true },
            size: 0,
          };
          nextStructures[stId] = st;
        }
        if (!st.heapData) st.heapData = { array: [], isMinHeap: true };
        const rawArr = Array.isArray(ev.values) ? [...ev.values] : [...st.heapData.array, ev.value];
        st.heapData.array = rawArr;
        st.size = rawArr.length;
        st.lastOperation = `insert(${ev.value})`;
        st.heapData.lastAction = `Inserted ${ev.value} at index ${rawArr.length - 1}`;
        if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        explanation = `Inserted ${ev.value} into Heap ${stId}`;
        break;
      }

      case 'HEAP_COMPARE': {
        const st = nextStructures[stId];
        if (st && st.heapData && typeof ev.fromIndex === 'number' && typeof ev.toIndex === 'number') {
          st.heapData.comparingIndices = [ev.fromIndex, ev.toIndex];
          st.lastOperation = `compare([${ev.fromIndex}] vs [${ev.toIndex}])`;
        }
        nextComparison = {
          left: String(ev.leftVal),
          right: String(ev.rightVal),
          operator: ev.operator || '<',
          result: !!ev.conditionResult,
          explanation: `Heap compare: ${ev.leftVal} ${ev.operator || '<'} ${ev.rightVal} ➔ ${ev.conditionResult ? 'SWAP' : 'OK'}`,
        };
        explanation = `Heap comparison at indices [${ev.fromIndex}] and [${ev.toIndex}]`;
        break;
      }

      case 'HEAP_SWAP': {
        const st = nextStructures[stId];
        if (st && st.heapData) {
          if (Array.isArray(ev.values)) {
            st.heapData.array = [...ev.values];
          }
          if (typeof ev.fromIndex === 'number' && typeof ev.toIndex === 'number') {
            st.heapData.swappingIndices = [ev.fromIndex, ev.toIndex];
            st.lastOperation = `swap([${ev.fromIndex}] ⇄ [${ev.toIndex}])`;
          }
        }
        explanation = `Swapped heap elements at indices [${ev.fromIndex}] and [${ev.toIndex}]`;
        break;
      }

      case 'HEAPIFY_UP': {
        const st = nextStructures[stId];
        if (st && st.heapData) {
          st.heapData.lastAction = `heapifyUp(index: ${ev.index})`;
          st.lastOperation = `heapifyUp(${ev.value})`;
        }
        explanation = `Heapify Up triggered for value ${ev.value} at index ${ev.index}`;
        break;
      }

      case 'HEAPIFY_DOWN': {
        const st = nextStructures[stId];
        if (st && st.heapData) {
          st.heapData.lastAction = `heapifyDown(index: ${ev.index})`;
          st.lastOperation = `heapifyDown(${ev.value})`;
        }
        explanation = `Heapify Down triggered starting at root index ${ev.index}`;
        break;
      }

      case 'HEAP_REMOVE': {
        const st = nextStructures[stId];
        if (st && st.heapData) {
          const rawArr = Array.isArray(ev.values) ? [...ev.values] : st.heapData.array.slice(1);
          st.heapData.array = rawArr;
          st.size = rawArr.length;
          st.lastOperation = `remove() ➔ ${ev.value}`;
          if (nextVariables[stId]) nextVariables[stId].value = `size = ${st.size}`;
        }
        explanation = `Extracted root element ${ev.value} from Heap ${stId}`;
        break;
      }

      case 'HEAP_PEEK': {
        const st = nextStructures[stId];
        if (st) {
          st.lastOperation = `peek() ➔ ${ev.value}`;
        }
        explanation = `Inspected root of Heap ${stId}: ${ev.value}`;
        break;
      }

      case 'HEAP_CLEAR': {
        const st = nextStructures[stId];
        if (st && st.heapData) {
          st.heapData.array = [];
          st.size = 0;
          st.lastOperation = 'clear()';
          if (nextVariables[stId]) nextVariables[stId].value = 'size = 0';
        }
        explanation = `Cleared Heap ${stId}`;
        break;
      }

      // === TRIE ===
      case 'TRIE_CREATE': {
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'trie',
          dataType: 'Trie',
          trieData: {
            rootId: 'root',
            nodes: {
              root: { id: 'root', char: 'root', isWord: false, children: {} },
            },
            wordsCount: 0,
            words: [],
          },
          size: 1,
          lastOperation: 'new Trie()',
        };
        nextVariables[stId] = {
          name: stId,
          type: 'Trie',
          value: 'words = 0',
          scope: 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32,
        };
        explanation = `Created Trie: ${stId}`;
        break;
      }

      case 'TRIE_NODE_CREATE': {
        let st = nextStructures[stId];
        if (!st) {
          st = {
            id: stId,
            name: stId,
            type: 'trie',
            dataType: 'Trie',
            trieData: {
              rootId: 'root',
              nodes: { root: { id: 'root', char: 'root', isWord: false, children: {} } },
              wordsCount: 0,
              words: [],
            },
            size: 1,
          };
          nextStructures[stId] = st;
        }
        if (!st.trieData) {
          st.trieData = {
            rootId: 'root',
            nodes: { root: { id: 'root', char: 'root', isWord: false, children: {} } },
            wordsCount: 0,
            words: [],
          };
        }
        const nodeId = ev.nodeId || `node_${ev.char}`;
        const pId = ev.parentNodeId || 'root';
        const ch = ev.char || '';

        if (!st.trieData.nodes[nodeId]) {
          st.trieData.nodes[nodeId] = {
            id: nodeId,
            char: ch,
            isWord: false,
            children: {},
            parentId: pId,
          };
        }
        if (st.trieData.nodes[pId]) {
          st.trieData.nodes[pId].children[ch] = nodeId;
        }
        st.size = Object.keys(st.trieData.nodes).length;
        st.lastOperation = `char('${ch}')`;
        explanation = `Added character '${ch}' to Trie ${stId}`;
        break;
      }

      case 'TRIE_WORD_COMPLETE': {
        const st = nextStructures[stId];
        if (st && st.trieData) {
          if (ev.nodeId && st.trieData.nodes[ev.nodeId]) {
            st.trieData.nodes[ev.nodeId].isWord = true;
          }
          if (ev.word && !st.trieData.words.includes(ev.word)) {
            st.trieData.words = [...st.trieData.words, ev.word];
            st.trieData.wordsCount = st.trieData.words.length;
          }
          st.lastOperation = `inserted "${ev.word}" ✓`;
          if (nextVariables[stId]) nextVariables[stId].value = `words = ${st.trieData.wordsCount}`;
        }
        explanation = `Completed insertion of word "${ev.word}" into Trie ${stId}`;
        break;
      }

      case 'TRIE_SEARCH_START': {
        const st = nextStructures[stId];
        if (st && st.trieData) {
          st.trieData.activeSearchWord = ev.word;
          st.trieData.activeSearchPath = ['root'];
          st.trieData.searchResult = null;
          st.lastOperation = `search("${ev.word}")`;
        }
        explanation = `Started Trie search for "${ev.word}"`;
        break;
      }

      case 'TRIE_SEARCH_STEP': {
        const st = nextStructures[stId];
        if (st && st.trieData && ev.nodeId) {
          st.trieData.activeSearchPath = [...(st.trieData.activeSearchPath || []), ev.nodeId];
          st.lastOperation = `step('${ev.char}')`;
        }
        explanation = `Trie search step for character '${ev.char}'`;
        break;
      }

      case 'TRIE_WORD_FOUND':
      case 'TRIE_WORD_NOT_FOUND': {
        const st = nextStructures[stId];
        const isFound = ev.type === 'TRIE_WORD_FOUND' || !!ev.conditionResult;
        if (st && st.trieData) {
          st.trieData.searchResult = isFound ? 'FOUND' : 'NOT_FOUND';
          st.lastOperation = `search("${ev.word}") ➔ ${isFound ? 'FOUND ✓' : 'NOT FOUND ✗'}`;
        }
        nextComparison = {
          left: `"${ev.word}"`,
          right: 'Trie',
          operator: '∈',
          result: isFound,
          explanation: `Word "${ev.word}" ${isFound ? 'EXISTS in Trie' : 'NOT FOUND in Trie'}`,
        };
        explanation = `Trie search for "${ev.word}": ${isFound ? 'FOUND ✓' : 'NOT FOUND ✗'}`;
        break;
      }

      case 'TRIE_CLEAR': {
        const st = nextStructures[stId];
        if (st && st.trieData) {
          st.trieData = {
            rootId: 'root',
            nodes: { root: { id: 'root', char: 'root', isWord: false, children: {} } },
            wordsCount: 0,
            words: [],
          };
          st.size = 1;
          st.lastOperation = 'clear()';
          if (nextVariables[stId]) nextVariables[stId].value = 'words = 0';
        }
        explanation = `Cleared Trie ${stId}`;
        break;
      }

      // === GRAPH (PHASE 4) ===
      case 'GRAPH_CREATE': {
        const directed = ev.directed ?? false;
        const weighted = ev.weighted ?? false;
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'graph',
          dataType: `Graph<${directed ? 'Directed' : 'Undirected'}${weighted ? ', Weighted' : ''}>`,
          size: 0,
          graphData: {
            directed,
            weighted,
            nodes: {},
            nodeList: [],
            edges: {},
            edgeList: [],
            visitedOrder: [],
            distances: {},
          },
          lastOperation: `new Graph(directed=${directed}, weighted=${weighted})`,
        };
        nextVariables[stId] = {
          name: ev.variable || stId,
          type: 'Graph',
          value: `nodes=0, edges=0, ${directed ? 'directed' : 'undirected'}${weighted ? ', weighted' : ''}`,
          scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 48,
        };
        explanation = `Created ${directed ? 'Directed' : 'Undirected'} ${weighted ? 'Weighted ' : ''}Graph '${stId}'`;
        break;
      }

      case 'GRAPH_DELETE': {
        delete nextStructures[stId];
        delete nextVariables[stId];
        explanation = `Deleted Graph ${stId}`;
        break;
      }

      case 'GRAPH_NODE_CREATE': {
        let st = nextStructures[stId];
        if (!st || !st.graphData) {
          st = {
            id: stId,
            name: ev.variable || stId,
            type: 'graph',
            dataType: 'Graph',
            size: 0,
            graphData: {
              directed: false,
              weighted: false,
              nodes: {},
              nodeList: [],
              edges: {},
              edgeList: [],
            },
          };
          nextStructures[stId] = st;
        }
        const gd = st.graphData!;
        const nid = ev.nodeId || String(ev.value ?? 'N');
        const val = ev.value ?? nid;
        gd.nodes[nid] = {
          id: nid,
          label: String(val),
          value: val,
          state: 'UNVISITED',
          degree: 0,
          inNeighbors: [],
          outNeighbors: [],
        };
        gd.nodeList = Object.values(gd.nodes);
        st.size = gd.nodeList.length;
        st.lastOperation = `addVertex("${nid}")`;
        if (nextVariables[stId]) {
          nextVariables[stId].value = `nodes=${gd.nodeList.length}, edges=${gd.edgeList.length}`;
        }
        explanation = `Added vertex '${nid}' to graph ${stId}`;
        break;
      }

      case 'GRAPH_NODE_DELETE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const gd = st.graphData;
          const nid = ev.nodeId || String(ev.value);
          delete gd.nodes[nid];
          for (const [eid, edge] of Object.entries(gd.edges)) {
            if (edge.source === nid || edge.target === nid) {
              delete gd.edges[eid];
            }
          }
          for (const n of Object.values(gd.nodes)) {
            if (n.inNeighbors) n.inNeighbors = n.inNeighbors.filter((x) => x !== nid);
            if (n.outNeighbors) n.outNeighbors = n.outNeighbors.filter((x) => x !== nid);
            n.degree = (n.inNeighbors?.length || 0) + (n.outNeighbors?.length || 0);
          }
          gd.nodeList = Object.values(gd.nodes);
          gd.edgeList = Object.values(gd.edges);
          st.size = gd.nodeList.length;
          st.lastOperation = `removeVertex("${nid}")`;
          if (nextVariables[stId]) {
            nextVariables[stId].value = `nodes=${gd.nodeList.length}, edges=${gd.edgeList.length}`;
          }
        }
        explanation = `Removed vertex '${ev.nodeId}' from graph ${stId}`;
        break;
      }

      case 'GRAPH_NODE_ACCESS': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          st.graphData.currentNodeId = ev.nodeId;
          st.graphData.selectedNodeId = ev.nodeId;
          st.lastOperation = `getVertex("${ev.nodeId}")`;
        }
        explanation = `Accessed vertex '${ev.nodeId}' in graph ${stId}`;
        break;
      }

      case 'GRAPH_EDGE_CREATE': {
        let st = nextStructures[stId];
        if (!st || !st.graphData) {
          st = {
            id: stId,
            name: ev.variable || stId,
            type: 'graph',
            dataType: 'Graph',
            size: 0,
            graphData: {
              directed: ev.directed ?? false,
              weighted: ev.weighted ?? false,
              nodes: {},
              nodeList: [],
              edges: {},
              edgeList: [],
            },
          };
          nextStructures[stId] = st;
        }
        const gd = st.graphData!;
        const src = ev.sourceNodeId || 'A';
        const tgt = ev.targetNodeId || 'B';
        const directed = ev.directed ?? gd.directed;
        const weighted = ev.weighted ?? gd.weighted;
        const weight = ev.weight;
        const edgeId = ev.edgeId || (directed ? `${src}->${tgt}` : `${src}--${tgt}`);

        if (!gd.nodes[src]) {
          gd.nodes[src] = { id: src, label: src, value: src, state: 'UNVISITED', degree: 0, inNeighbors: [], outNeighbors: [] };
        }
        if (!gd.nodes[tgt]) {
          gd.nodes[tgt] = { id: tgt, label: tgt, value: tgt, state: 'UNVISITED', degree: 0, inNeighbors: [], outNeighbors: [] };
        }

        gd.edges[edgeId] = {
          id: edgeId,
          source: src,
          target: tgt,
          directed,
          weighted,
          weight,
          state: 'NORMAL',
        };

        if (!gd.nodes[src].outNeighbors) gd.nodes[src].outNeighbors = [];
        if (!gd.nodes[src].outNeighbors!.includes(tgt)) gd.nodes[src].outNeighbors!.push(tgt);
        if (!gd.nodes[tgt].inNeighbors) gd.nodes[tgt].inNeighbors = [];
        if (!gd.nodes[tgt].inNeighbors!.includes(src)) gd.nodes[tgt].inNeighbors!.push(src);

        if (!directed) {
          if (!gd.nodes[tgt].outNeighbors) gd.nodes[tgt].outNeighbors = [];
          if (!gd.nodes[tgt].outNeighbors!.includes(src)) gd.nodes[tgt].outNeighbors!.push(src);
          if (!gd.nodes[src].inNeighbors) gd.nodes[src].inNeighbors = [];
          if (!gd.nodes[src].inNeighbors!.includes(tgt)) gd.nodes[src].inNeighbors!.push(tgt);
        }

        for (const n of Object.values(gd.nodes)) {
          const outs = n.outNeighbors?.length || 0;
          const ins = n.inNeighbors?.length || 0;
          n.degree = directed ? outs + ins : outs;
        }

        gd.nodeList = Object.values(gd.nodes);
        gd.edgeList = Object.values(gd.edges);
        st.size = gd.nodeList.length;
        gd.activeEdgeId = edgeId;
        st.lastOperation = directed
          ? `addEdge(${src} ➔ ${tgt}${weighted ? `, w=${weight}` : ''})`
          : `addEdge(${src} — ${tgt}${weighted ? `, w=${weight}` : ''})`;
        if (nextVariables[stId]) {
          nextVariables[stId].value = `nodes=${gd.nodeList.length}, edges=${gd.edgeList.length}`;
        }
        explanation = directed
          ? `Created directed edge: ${src} ➔ ${tgt}${weighted ? ` (weight ${weight})` : ''}`
          : `Created undirected edge: ${src} ── ${tgt}${weighted ? ` (weight ${weight})` : ''}`;
        break;
      }

      case 'GRAPH_EDGE_DELETE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const gd = st.graphData;
          let targetEid = ev.edgeId;
          if (!targetEid && ev.sourceNodeId && ev.targetNodeId) {
            for (const [k, e] of Object.entries(gd.edges)) {
              if (
                (e.source === ev.sourceNodeId && e.target === ev.targetNodeId) ||
                (!e.directed && e.source === ev.targetNodeId && e.target === ev.sourceNodeId)
              ) {
                targetEid = k;
                break;
              }
            }
          }
          if (targetEid && gd.edges[targetEid]) {
            const e = gd.edges[targetEid];
            const src = e.source;
            const tgt = e.target;
            delete gd.edges[targetEid];
            if (gd.nodes[src] && gd.nodes[src].outNeighbors) {
              gd.nodes[src].outNeighbors = gd.nodes[src].outNeighbors!.filter((x) => x !== tgt);
            }
            if (gd.nodes[tgt] && gd.nodes[tgt].inNeighbors) {
              gd.nodes[tgt].inNeighbors = gd.nodes[tgt].inNeighbors!.filter((x) => x !== src);
            }
            if (!e.directed) {
              if (gd.nodes[tgt] && gd.nodes[tgt].outNeighbors) {
                gd.nodes[tgt].outNeighbors = gd.nodes[tgt].outNeighbors!.filter((x) => x !== src);
              }
              if (gd.nodes[src] && gd.nodes[src].inNeighbors) {
                gd.nodes[src].inNeighbors = gd.nodes[src].inNeighbors!.filter((x) => x !== tgt);
              }
            }
            for (const n of Object.values(gd.nodes)) {
              n.degree = (n.outNeighbors?.length || 0) + (n.inNeighbors?.length || 0);
            }
            gd.edgeList = Object.values(gd.edges);
            st.lastOperation = `removeEdge(${src}, ${tgt})`;
            if (nextVariables[stId]) {
              nextVariables[stId].value = `nodes=${gd.nodeList.length}, edges=${gd.edgeList.length}`;
            }
          }
        }
        explanation = `Removed edge ${ev.sourceNodeId ?? ''} - ${ev.targetNodeId ?? ''} from graph ${stId}`;
        break;
      }

      case 'GRAPH_EDGE_WEIGHT_UPDATE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const gd = st.graphData;
          let targetEdge = ev.edgeId ? gd.edges[ev.edgeId] : undefined;
          if (!targetEdge && ev.sourceNodeId && ev.targetNodeId) {
            targetEdge = Object.values(gd.edges).find(
              (e) =>
                (e.source === ev.sourceNodeId && e.target === ev.targetNodeId) ||
                (!e.directed && e.source === ev.targetNodeId && e.target === ev.sourceNodeId)
            );
          }
          if (targetEdge) {
            targetEdge.weight = ev.weight;
            targetEdge.weighted = true;
            targetEdge.state = 'ACTIVE';
            gd.activeEdgeId = targetEdge.id;
          }
        }
        explanation = `Updated edge weight for (${ev.sourceNodeId} ➔ ${ev.targetNodeId}) to ${ev.weight}`;
        break;
      }

      case 'GRAPH_CLEAR': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          st.graphData.nodes = {};
          st.graphData.nodeList = [];
          st.graphData.edges = {};
          st.graphData.edgeList = [];
          st.graphData.visitedOrder = [];
          st.graphData.distances = {};
          st.graphData.queueState = [];
          st.size = 0;
          st.lastOperation = 'clear()';
          if (nextVariables[stId]) {
            nextVariables[stId].value = 'nodes=0, edges=0';
          }
        }
        explanation = `Cleared graph ${stId}`;
        break;
      }

      case 'GRAPH_ROOT_UPDATE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          st.graphData.startNodeId = ev.nodeId;
        }
        explanation = `Updated start root of graph ${stId} to '${ev.nodeId}'`;
        break;
      }

      case 'GRAPH_NEIGHBORS_ACCESS': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          st.graphData.currentNodeId = ev.nodeId;
          const neighbors = ev.neighbors || st.graphData.nodes[ev.nodeId!]?.outNeighbors || [];
          for (const e of Object.values(st.graphData.edges)) {
            if (e.source === ev.nodeId && neighbors.includes(e.target)) {
              e.state = 'ACTIVE';
            }
          }
          st.lastOperation = `getNeighbors("${ev.nodeId}")`;
        }
        explanation = `Accessed neighbors of node '${ev.nodeId}' in graph ${stId}`;
        break;
      }

      case 'GRAPH_NODE_VISIT':
      case 'GRAPH_VISIT': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId!;
          if (st.graphData.nodes[nid]) {
            st.graphData.nodes[nid].state = 'VISITED';
            st.graphData.nodes[nid].visited = true;
          }
          st.graphData.currentNodeId = nid;
          if (!st.graphData.visitedOrder) st.graphData.visitedOrder = [];
          if (!st.graphData.visitedOrder.includes(nid)) {
            st.graphData.visitedOrder.push(nid);
          }
          st.lastOperation = `visitNode("${nid}")`;
        }
        explanation = `Visited node '${ev.nodeId}' in graph ${stId}`;
        break;
      }

      case 'GRAPH_EDGE_TRAVERSE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const src = ev.sourceNodeId;
          const tgt = ev.targetNodeId;
          let foundEdge = ev.edgeId ? st.graphData.edges[ev.edgeId] : undefined;
          if (!foundEdge && src && tgt) {
            foundEdge = Object.values(st.graphData.edges).find(
              (e) =>
                (e.source === src && e.target === tgt) ||
                (!e.directed && e.source === tgt && e.target === src)
            );
          }
          if (foundEdge) {
            foundEdge.state = 'TRAVERSED';
            st.graphData.activeEdgeId = foundEdge.id;
          }
        }
        explanation = `Traversed edge ${ev.sourceNodeId} ➔ ${ev.targetNodeId}`;
        break;
      }

      // === BFS ALGORITHM ===
      case 'BFS_START': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const gd = st.graphData;
          gd.algorithm = 'BFS';
          gd.algorithmPhase = 'START';
          gd.startNodeId = ev.nodeId || ev.startNodeId || gd.nodeList[0]?.id;
          gd.visitedOrder = [];
          gd.queueState = [];
          for (const n of Object.values(gd.nodes)) {
            n.state = 'UNVISITED';
            n.visited = false;
          }
          for (const e of Object.values(gd.edges)) {
            e.state = 'NORMAL';
          }
          st.lastOperation = `bfs(start="${gd.startNodeId}")`;
        }
        explanation = `Started BFS traversal from node '${ev.nodeId || ev.startNodeId}'`;
        break;
      }

      case 'BFS_NODE_DISCOVER': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId!;
          if (st.graphData.nodes[nid]) {
            st.graphData.nodes[nid].state = 'DISCOVERED';
          }
          st.lastOperation = `discoverNode("${nid}")`;
        }
        explanation = `BFS discovered node '${ev.nodeId}'`;
        break;
      }

      case 'BFS_ENQUEUE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId || String(ev.value);
          if (!st.graphData.queueState) st.graphData.queueState = [];
          st.graphData.queueState.push(nid);
          if (st.graphData.nodes[nid] && st.graphData.nodes[nid].state !== 'VISITED') {
            st.graphData.nodes[nid].state = 'DISCOVERED';
          }
          st.lastOperation = `queue.add("${nid}")`;
        }
        explanation = `BFS enqueued node '${ev.nodeId || ev.value}' into Queue`;
        break;
      }

      case 'BFS_DEQUEUE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId || String(ev.value);
          if (st.graphData.queueState && st.graphData.queueState.length > 0) {
            const idx = st.graphData.queueState.indexOf(nid);
            if (idx !== -1) {
              st.graphData.queueState.splice(idx, 1);
            } else {
              st.graphData.queueState.shift();
            }
          }
          if (st.graphData.nodes[nid]) {
            st.graphData.nodes[nid].state = 'PROCESSING';
          }
          st.graphData.currentNodeId = nid;
          st.lastOperation = `queue.poll() ➔ "${nid}"`;
        }
        explanation = `BFS dequeued node '${ev.nodeId || ev.value}' from Queue for processing`;
        break;
      }

      case 'BFS_NODE_VISIT': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId!;
          if (st.graphData.nodes[nid]) {
            st.graphData.nodes[nid].state = 'VISITED';
            st.graphData.nodes[nid].visited = true;
          }
          st.graphData.currentNodeId = nid;
          if (!st.graphData.visitedOrder) st.graphData.visitedOrder = [];
          if (!st.graphData.visitedOrder.includes(nid)) {
            st.graphData.visitedOrder.push(nid);
          }
          st.lastOperation = `visit("${nid}")`;
        }
        explanation = `BFS visited node '${ev.nodeId}' (Added to visited set)`;
        break;
      }

      case 'BFS_EDGE_TRAVERSE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const src = ev.sourceNodeId;
          const tgt = ev.targetNodeId;
          const edge = Object.values(st.graphData.edges).find(
            (e) =>
              (e.source === src && e.target === tgt) ||
              (!e.directed && e.source === tgt && e.target === src)
          );
          if (edge) {
            edge.state = 'TRAVERSED';
            st.graphData.activeEdgeId = edge.id;
          }
        }
        explanation = `BFS explored edge ${ev.sourceNodeId} ➔ ${ev.targetNodeId}`;
        break;
      }

      case 'BFS_END': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          st.graphData.algorithmPhase = 'COMPLETED';
          st.graphData.currentNodeId = null;
          st.graphData.activeEdgeId = null;
        }
        explanation = `BFS traversal completed. Visited ${st?.graphData?.visitedOrder?.length || 0} nodes.`;
        break;
      }

      // === DFS ALGORITHM ===
      case 'DFS_START': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const gd = st.graphData;
          gd.algorithm = 'DFS';
          gd.algorithmPhase = 'START';
          gd.startNodeId = ev.nodeId || ev.startNodeId || gd.nodeList[0]?.id;
          gd.visitedOrder = [];
          gd.cycleDetected = false;
          gd.cycleEdges = [];
          for (const n of Object.values(gd.nodes)) {
            n.state = 'UNVISITED';
            n.visited = false;
          }
          for (const e of Object.values(gd.edges)) {
            e.state = 'NORMAL';
          }
          st.lastOperation = `dfs(start="${gd.startNodeId}")`;
        }
        explanation = `Started DFS traversal from node '${ev.nodeId || ev.startNodeId}'`;
        break;
      }

      case 'DFS_NODE_DISCOVER': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId!;
          if (st.graphData.nodes[nid]) {
            st.graphData.nodes[nid].state = 'DISCOVERED';
          }
        }
        explanation = `DFS discovered node '${ev.nodeId}'`;
        break;
      }

      case 'DFS_CALL': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId!;
          if (st.graphData.nodes[nid]) {
            st.graphData.nodes[nid].state = 'PROCESSING';
          }
          st.graphData.currentNodeId = nid;
          st.lastOperation = `dfs("${nid}")`;
        }
        explanation = `Recursive DFS called for node '${ev.nodeId}' (Pushed to call stack)`;
        break;
      }

      case 'DFS_NODE_VISIT': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId!;
          if (st.graphData.nodes[nid]) {
            st.graphData.nodes[nid].state = 'VISITED';
            st.graphData.nodes[nid].visited = true;
          }
          st.graphData.currentNodeId = nid;
          if (!st.graphData.visitedOrder) st.graphData.visitedOrder = [];
          if (!st.graphData.visitedOrder.includes(nid)) {
            st.graphData.visitedOrder.push(nid);
          }
          st.lastOperation = `visit("${nid}")`;
        }
        explanation = `DFS visited node '${ev.nodeId}'`;
        break;
      }

      case 'DFS_EDGE_TRAVERSE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const src = ev.sourceNodeId;
          const tgt = ev.targetNodeId;
          const edge = Object.values(st.graphData.edges).find(
            (e) =>
              (e.source === src && e.target === tgt) ||
              (!e.directed && e.source === tgt && e.target === src)
          );
          if (edge) {
            edge.state = 'TRAVERSED';
            st.graphData.activeEdgeId = edge.id;
          }
        }
        explanation = `DFS followed edge ${ev.sourceNodeId} ➔ ${ev.targetNodeId}`;
        break;
      }

      case 'DFS_RETURN':
      case 'DFS_BACKTRACK': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId!;
          if (st.graphData.nodes[nid]) {
            st.graphData.nodes[nid].state = 'VISITED';
          }
          st.graphData.currentNodeId = nid;
          st.lastOperation = `backtrack("${nid}")`;
        }
        explanation = `DFS backtracked from node '${ev.nodeId}' (Popped frame / returned)`;
        break;
      }

      case 'DFS_ALREADY_VISITED': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const src = ev.sourceNodeId;
          const tgt = ev.targetNodeId || ev.nodeId;
          st.graphData.cycleDetected = true;
          if (!st.graphData.cycleEdges) st.graphData.cycleEdges = [];
          const edge = Object.values(st.graphData.edges).find(
            (e) =>
              (e.source === src && e.target === tgt) ||
              (!e.directed && e.source === tgt && e.target === src)
          );
          if (edge) {
            edge.state = 'CYCLE';
            st.graphData.cycleEdges.push(edge.id);
          }
          st.lastOperation = `cycleCheck: ${tgt} already visited!`;
        }
        explanation = `DFS detected cycle / already visited node '${ev.targetNodeId || ev.nodeId}' from '${ev.sourceNodeId}'`;
        break;
      }

      case 'DFS_END': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          st.graphData.algorithmPhase = 'COMPLETED';
          st.graphData.currentNodeId = null;
          st.graphData.activeEdgeId = null;
        }
        explanation = `DFS traversal complete. Total nodes visited: ${st?.graphData?.visitedOrder?.length || 0}${st?.graphData?.cycleDetected ? ' (Cycle Detected)' : ''}`;
        break;
      }

      // === DIJKSTRA ALGORITHM ===
      case 'DIJKSTRA_START': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const gd = st.graphData;
          gd.algorithm = 'DIJKSTRA';
          gd.algorithmPhase = 'START';
          gd.startNodeId = ev.nodeId || ev.startNodeId || gd.nodeList[0]?.id;
          gd.visitedOrder = [];
          gd.distances = {};
          gd.queueState = [];
          gd.shortestPath = [];
          for (const n of Object.values(gd.nodes)) {
            n.state = 'UNVISITED';
            gd.distances[n.id] = n.id === gd.startNodeId ? 0 : '∞';
          }
          for (const e of Object.values(gd.edges)) {
            e.state = 'NORMAL';
          }
          st.lastOperation = `dijkstra(start="${gd.startNodeId}")`;
        }
        explanation = `Started Dijkstra's shortest-path algorithm from node '${ev.nodeId || ev.startNodeId}'`;
        break;
      }

      case 'DISTANCE_INITIALIZE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          if (!st.graphData.distances) st.graphData.distances = {};
          const d = ev.distance !== undefined ? ev.distance : (ev.nodeId === st.graphData.startNodeId ? 0 : '∞');
          st.graphData.distances[ev.nodeId!] = d;
        }
        explanation = `Initialized distance to node '${ev.nodeId}' = ${ev.distance ?? '∞'}`;
        break;
      }

      case 'DIJKSTRA_QUEUE_INSERT': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          if (!st.graphData.queueState) st.graphData.queueState = [];
          const item = `(${ev.nodeId}, ${ev.distance ?? ev.weight ?? 0})`;
          st.graphData.queueState.push(item);
          st.lastOperation = `pq.add(${item})`;
        }
        explanation = `Inserted (${ev.nodeId}, dist=${ev.distance ?? ev.weight ?? 0}) into PriorityQueue`;
        break;
      }

      case 'DIJKSTRA_QUEUE_REMOVE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          if (st.graphData.queueState && st.graphData.queueState.length > 0) {
            const nid = ev.nodeId;
            const idx = st.graphData.queueState.findIndex((s) => s.startsWith(`(${nid},`));
            if (idx !== -1) {
              st.graphData.queueState.splice(idx, 1);
            } else {
              st.graphData.queueState.shift();
            }
          }
        }
        explanation = `Extracted node '${ev.nodeId}' from PriorityQueue`;
        break;
      }

      case 'DIJKSTRA_NODE_SELECT': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId!;
          st.graphData.currentNodeId = nid;
          if (st.graphData.nodes[nid]) {
            st.graphData.nodes[nid].state = 'PROCESSING';
          }
          st.lastOperation = `selectMinNode("${nid}")`;
        }
        explanation = `Selected minimum-distance node '${ev.nodeId}' for exploration`;
        break;
      }

      case 'DIJKSTRA_EDGE_RELAX': {
        const st = nextStructures[stId];
        const u = ev.sourceNodeId || 'u';
        const v = ev.targetNodeId || 'v';
        const w = ev.weight ?? 0;
        const oldD = ev.oldDistance ?? '∞';
        const newD = ev.newDistance;
        if (st && st.graphData) {
          const edge = Object.values(st.graphData.edges).find(
            (e) =>
              (e.source === u && e.target === v) ||
              (!e.directed && e.source === v && e.target === u)
          );
          if (edge) {
            edge.state = 'RELAXED';
            st.graphData.activeEdgeId = edge.id;
          }
          if (newD !== undefined) {
            if (!st.graphData.distances) st.graphData.distances = {};
            st.graphData.distances[v] = newD;
          }
          st.lastOperation = `relax(${u} ➔ ${v}): dist[${v}] updated ${oldD} ➔ ${newD}`;
        }
        nextComparison = {
          left: `dist[${u}] + w(${w})`,
          right: `dist[${v}]`,
          operator: '<',
          result: true,
          explanation: `dist[${u}] + ${w} < ${oldD} ➔ True: Update dist[${v}] to ${newD}`,
        };
        explanation = `Relaxed edge ${u} ➔ ${v} (weight ${w}): dist[${v}] updated from ${oldD} to ${newD}`;
        break;
      }

      case 'DISTANCE_UPDATE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          if (!st.graphData.distances) st.graphData.distances = {};
          st.graphData.distances[ev.nodeId!] = ev.newDistance!;
          st.lastOperation = `dist[${ev.nodeId}] = ${ev.newDistance}`;
        }
        explanation = `Updated shortest distance to '${ev.nodeId}': ${ev.oldDistance ?? ''} ➔ ${ev.newDistance}`;
        break;
      }

      case 'DIJKSTRA_NODE_FINALIZE': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          const nid = ev.nodeId!;
          if (st.graphData.nodes[nid]) {
            st.graphData.nodes[nid].state = 'FINALIZED';
            st.graphData.nodes[nid].visited = true;
          }
          if (!st.graphData.visitedOrder) st.graphData.visitedOrder = [];
          if (!st.graphData.visitedOrder.includes(nid)) {
            st.graphData.visitedOrder.push(nid);
          }
          st.lastOperation = `finalize("${nid}", d=${st.graphData.distances?.[nid]})`;
        }
        explanation = `Finalized shortest path to node '${ev.nodeId}' with distance ${st?.graphData?.distances?.[ev.nodeId!] ?? ''}`;
        break;
      }

      case 'DIJKSTRA_END': {
        const st = nextStructures[stId];
        if (st && st.graphData) {
          st.graphData.algorithmPhase = 'COMPLETED';
          st.graphData.currentNodeId = null;
          st.graphData.activeEdgeId = null;
          if (ev.path && Array.isArray(ev.path)) {
            st.graphData.shortestPath = ev.path;
            for (let p = 0; p < ev.path.length - 1; p++) {
              const u = ev.path[p];
              const v = ev.path[p + 1];
              const edge = Object.values(st.graphData.edges).find(
                (e) =>
                  (e.source === u && e.target === v) ||
                  (!e.directed && e.source === v && e.target === u)
              );
              if (edge) edge.state = 'PATH';
            }
          }
        }
        explanation = `Dijkstra algorithm finished. Shortest paths computed.${ev.path ? ` Path: ${ev.path.join(' ➔ ')}` : ''}`;
        break;
      }

      // === CONTROL FLOW ===
      case 'CONDITION_EVALUATE': {
        nextComparison = {
          left: ev.condition || 'condition',
          right: '',
          operator: '',
          result: !!ev.conditionResult,
          explanation: `${ev.condition} ➔ ${ev.conditionResult ? 'TRUE' : 'FALSE'}`,
        };
        explanation = `Condition (${ev.condition}) evaluated to ${ev.conditionResult ? 'TRUE ✓' : 'FALSE ✗'}`;
        break;
      }

      case 'LOOP_START':
        explanation = `Loop started on line ${ev.line}`;
        break;

      case 'LOOP_ITERATION':
        if (ev.variable && ev.value !== undefined) {
          nextPointers[ev.variable] = ev.value;
          if (nextVariables[ev.variable]) {
            nextVariables[ev.variable].value = ev.value;
          } else {
            nextVariables[ev.variable] = {
              name: ev.variable,
              type: 'int',
              value: ev.value,
              scope: 'main',
              isReference: false,
              estimatedBytes: 4,
            };
          }
        }
        explanation = `Loop iteration: ${ev.variable} = ${ev.value}`;
        break;

      case 'LOOP_END':
        explanation = `Loop finished execution on line ${ev.line}`;
        break;

      case 'FUNCTION_CALL': {
        const fnName = ev.functionName || 'function';
        let parsedArgs: Record<string, any> = {};
        if (typeof ev.arguments === 'string') {
          try {
            parsedArgs = JSON.parse(ev.arguments);
          } catch {
            parsedArgs = { raw: ev.arguments };
          }
        } else if (ev.arguments) {
          parsedArgs = ev.arguments;
        }

        const newFrame: CallFrame = {
          id: `frame-${nextCallStack.length + 1}`,
          functionName: fnName,
          arguments: parsedArgs,
          localVariables: {},
          line: ev.line || currentLine,
          depth: nextCallStack.length + 1,
        };
        nextCallStack.push(newFrame);
        explanation = `Invoked method ${fnName}(${Object.values(parsedArgs).join(', ')})`;
        break;
      }

      case 'FUNCTION_RETURN': {
        const fnName = ev.functionName || 'function';
        if (nextCallStack.length > 1) {
          nextCallStack.pop();
        }
        explanation = `Method ${fnName} returned ${ev.returnValue}`;
        break;
      }

      // === PHASE 5 ALGORITHM EVENTS ===
      // --- SEARCHING ---
      case 'LINEAR_SEARCH_START': {
        nextAlgorithmState.algorithmName = 'Linear Search';
        nextAlgorithmState.category = 'Searching';
        nextAlgorithmState.target = ev.target;
        nextAlgorithmState.status = 'Searching';
        nextAlgorithmState.searchResult = 'SEARCHING';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(n)', space: 'O(1)', best: 'O(1)', average: 'O(n)', worst: 'O(n)' };
        explanation = `Starting Linear Search for target ${ev.target}`;
        break;
      }

      case 'LINEAR_SEARCH_ACCESS': {
        nextMetrics.accesses++;
        const targetIdx = toNumericIndex(ev.index);
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].activeIndices = [targetIdx];
        }
        explanation = `Inspecting index ${targetIdx}: value = ${ev.value}`;
        break;
      }

      case 'LINEAR_SEARCH_COMPARE': {
        nextMetrics.comparisons++;
        const targetIdx = toNumericIndex(ev.index);
        nextComparison = {
          left: ev.value,
          right: ev.target,
          operator: '==',
          result: !!ev.conditionResult,
          explanation: `arr[${targetIdx}] (${ev.value}) == target (${ev.target})`
        };
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].comparingIndices = [targetIdx];
        }
        explanation = `Comparing arr[${targetIdx}] (${ev.value}) with target (${ev.target}): ${ev.conditionResult ? 'MATCH' : 'NO MATCH'}`;
        break;
      }

      case 'LINEAR_SEARCH_MATCH': {
        const targetIdx = toNumericIndex(ev.index);
        nextAlgorithmState.searchResult = 'FOUND';
        nextAlgorithmState.foundIndex = targetIdx;
        nextAlgorithmState.status = 'Found';
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].activeIndices = [targetIdx];
          nextStructures[ev.structureId].pointerBadges = { [targetIdx]: ['Target Found'] };
        }
        explanation = `Target ${ev.value} found at index ${targetIdx}!`;
        break;
      }

      case 'LINEAR_SEARCH_NOT_FOUND': {
        nextAlgorithmState.searchResult = 'NOT_FOUND';
        nextAlgorithmState.status = 'Not Found';
        explanation = `Target ${ev.target} not found in array`;
        break;
      }

      case 'LINEAR_SEARCH_END': {
        const isFound = ev.found ?? ev.conditionResult ?? false;
        nextAlgorithmState.status = isFound ? 'Completed (Found)' : 'Completed (Not Found)';
        explanation = `Linear Search finished: ${isFound ? `Found at index ${ev.index}` : 'Target not found'}`;
        break;
      }

      // BINARY SEARCH
      case 'BINARY_SEARCH_START': {
        nextAlgorithmState.algorithmName = 'Binary Search';
        nextAlgorithmState.category = 'Searching';
        nextAlgorithmState.target = ev.target;
        nextAlgorithmState.status = 'Searching';
        nextAlgorithmState.searchResult = 'SEARCHING';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(log n)', space: 'O(1)', best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' };
        explanation = `Starting Binary Search for target ${ev.target}`;
        break;
      }

      case 'BINARY_SEARCH_RANGE': {
        nextAlgorithmState.searchLow = ev.low;
        nextAlgorithmState.searchHigh = ev.high;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.searchRange = [ev.low ?? 0, ev.high ?? 0];
          st.pointerBadges = { [ev.low ?? 0]: ['L'], [ev.high ?? 0]: ['H'] };
        }
        explanation = `Search range active: [low=${ev.low}, high=${ev.high}]`;
        break;
      }

      case 'BINARY_SEARCH_MID': {
        nextMetrics.accesses++;
        nextAlgorithmState.searchMid = ev.mid;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.activeIndices = [ev.mid ?? 0];
          st.pointerBadges = {
            ...(st.pointerBadges || {}),
            [ev.mid ?? 0]: [...(st.pointerBadges?.[ev.mid ?? 0] || []), 'M']
          };
        }
        explanation = `Calculated mid index = ${ev.mid}, arr[${ev.mid}] = ${ev.value}`;
        break;
      }

      case 'BINARY_SEARCH_COMPARE': {
        nextMetrics.comparisons++;
        const op = ev.operator || '==';
        nextComparison = {
          left: ev.value,
          right: ev.target,
          operator: op,
          result: !!ev.conditionResult,
          explanation: `arr[${ev.mid}] (${ev.value}) ${op} target (${ev.target})`
        };
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].comparingIndices = [ev.mid ?? 0];
        }
        explanation = `Comparing mid arr[${ev.mid}] (${ev.value}) ${op} target (${ev.target}): result = ${ev.conditionResult}`;
        break;
      }

      case 'BINARY_SEARCH_RANGE_UPDATE': {
        nextAlgorithmState.searchLow = ev.low;
        nextAlgorithmState.searchHigh = ev.high;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.searchRange = [ev.low ?? 0, ev.high ?? 0];
          st.pointerBadges = { [ev.low ?? 0]: ['L'], [ev.high ?? 0]: ['H'] };
        }
        explanation = `Updated search range to [low=${ev.low}, high=${ev.high}]`;
        break;
      }

      case 'BINARY_SEARCH_FOUND': {
        const foundIdx = toNumericIndex(ev.index);
        nextAlgorithmState.searchResult = 'FOUND';
        nextAlgorithmState.foundIndex = foundIdx;
        nextAlgorithmState.status = 'Found';
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.activeIndices = [foundIdx];
          st.pointerBadges = { [foundIdx]: ['Target Found!'] };
        }
        explanation = `Binary Search: Target found at index ${foundIdx}!`;
        break;
      }

      case 'BINARY_SEARCH_NOT_FOUND': {
        nextAlgorithmState.searchResult = 'NOT_FOUND';
        nextAlgorithmState.status = 'Not Found';
        explanation = `Binary Search: Target ${ev.target} not found (search space empty)`;
        break;
      }

      case 'BINARY_SEARCH_END': {
        const isFound = ev.found ?? ev.conditionResult ?? false;
        nextAlgorithmState.status = isFound ? 'Completed (Found)' : 'Completed (Not Found)';
        explanation = `Binary Search completed: ${isFound ? `Found at index ${ev.index}` : 'Not found'}`;
        break;
      }

      // --- SORTING ---
      case 'SORT_START': {
        const algo = ev.algorithmName || 'Sorting';
        nextAlgorithmState.algorithmName = algo;
        nextAlgorithmState.category = 'Sorting';
        nextAlgorithmState.status = 'Sorting';
        if (algo.includes('Bubble')) {
          nextAlgorithmState.theoreticalComplexity = { time: 'O(n²)', space: 'O(1)', best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' };
        } else if (algo.includes('Selection')) {
          nextAlgorithmState.theoreticalComplexity = { time: 'O(n²)', space: 'O(1)', best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' };
        } else if (algo.includes('Insertion')) {
          nextAlgorithmState.theoreticalComplexity = { time: 'O(n²)', space: 'O(1)', best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' };
        } else if (algo.includes('Merge')) {
          nextAlgorithmState.theoreticalComplexity = { time: 'O(n log n)', space: 'O(n)', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' };
        } else if (algo.includes('Quick')) {
          nextAlgorithmState.theoreticalComplexity = { time: 'O(n log n)', space: 'O(log n)', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' };
        } else if (algo.includes('Heap')) {
          nextAlgorithmState.theoreticalComplexity = { time: 'O(n log n)', space: 'O(1)', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' };
        }
        explanation = `Starting ${algo} on ${ev.structureId}`;
        break;
      }

      case 'SORT_COMPARE': {
        nextMetrics.comparisons++;
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].comparingIndices = [ev.fromIndex ?? 0, ev.toIndex ?? 0];
        }
        nextComparison = {
          left: ev.leftVal,
          right: ev.rightVal,
          operator: '>',
          result: !!ev.conditionResult,
          explanation: `arr[${ev.fromIndex}] (${ev.leftVal}) > arr[${ev.toIndex}] (${ev.rightVal})`
        };
        explanation = `Comparing arr[${ev.fromIndex}] (${ev.leftVal}) > arr[${ev.toIndex}] (${ev.rightVal}): ${ev.conditionResult ? 'TRUE (Swap needed)' : 'FALSE'}`;
        break;
      }

      case 'SORT_SWAP': {
        nextMetrics.swaps++;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.swappingIndices = [ev.fromIndex ?? 0, ev.toIndex ?? 0];
          if (st.arrayData && ev.fromIndex !== undefined && ev.toIndex !== undefined) {
            const tmp = st.arrayData[ev.fromIndex];
            st.arrayData[ev.fromIndex] = st.arrayData[ev.toIndex];
            st.arrayData[ev.toIndex] = tmp;
          }
        }
        explanation = `Swapped arr[${ev.fromIndex}] (${ev.leftVal}) <-> arr[${ev.toIndex}] (${ev.rightVal})`;
        break;
      }

      case 'SORT_ASSIGN': {
        nextMetrics.assignments++;
        const assignIdx = toNumericIndex(ev.index);
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          if (st.arrayData && ev.index !== undefined) {
            st.arrayData[assignIdx] = ev.value;
          }
          st.activeIndices = [assignIdx];
        }
        explanation = `Assigned arr[${assignIdx}] = ${ev.value}`;
        break;
      }

      case 'SORT_RANGE': {
        nextAlgorithmState.sortRange = [ev.rangeStart ?? 0, ev.rangeEnd ?? 0];
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].searchRange = [ev.rangeStart ?? 0, ev.rangeEnd ?? 0];
        }
        explanation = `Subarray range: [${ev.rangeStart}..${ev.rangeEnd}]`;
        break;
      }

      case 'SORT_PARTITION': {
        nextAlgorithmState.phase = 'Partitioning';
        nextAlgorithmState.pivotIndex = ev.pivotIndex;
        nextAlgorithmState.pivotValue = ev.pivotValue;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.pivotIndex = ev.pivotIndex;
          st.pointerBadges = { [ev.pivotIndex ?? 0]: ['Pivot'] };
        }
        explanation = `Partitioned subarray around pivot ${ev.pivotValue} at index ${ev.pivotIndex}`;
        break;
      }

      case 'SORT_MERGE': {
        nextAlgorithmState.phase = 'Merging';
        nextAlgorithmState.sortRange = [ev.low ?? 0, ev.high ?? 0];
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].searchRange = [ev.low ?? 0, ev.high ?? 0];
        }
        explanation = `Merging sorted halves [${ev.low}..${ev.mid}] and [${(ev.mid ?? 0) + 1}..${ev.high}]`;
        break;
      }

      case 'SORT_COMPLETE': {
        nextAlgorithmState.status = 'Completed';
        nextAlgorithmState.phase = 'Sorted';
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.sortedIndices = st.arrayData ? st.arrayData.map((_, idx) => idx) : [];
          st.searchRange = undefined;
          st.pivotIndex = undefined;
        }
        explanation = `Sorting complete! All array elements are in sorted order.`;
        break;
      }

      // Quick Sort Specialized
      case 'QUICK_SORT_START': {
        nextAlgorithmState.algorithmName = 'Quick Sort';
        nextAlgorithmState.category = 'Sorting';
        nextAlgorithmState.status = 'Sorting';
        nextAlgorithmState.sortRange = [ev.rangeStart ?? 0, ev.rangeEnd ?? 0];
        nextAlgorithmState.theoreticalComplexity = { time: 'O(n log n)', space: 'O(log n)', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' };
        explanation = `QuickSort: Range [${ev.rangeStart}..${ev.rangeEnd}]`;
        break;
      }

      case 'QUICK_SORT_RANGE': {
        nextAlgorithmState.sortRange = [ev.rangeStart ?? 0, ev.rangeEnd ?? 0];
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].searchRange = [ev.rangeStart ?? 0, ev.rangeEnd ?? 0];
        }
        explanation = `QuickSort active range: [${ev.rangeStart}..${ev.rangeEnd}]`;
        break;
      }

      case 'QUICK_SORT_PIVOT': {
        nextAlgorithmState.pivotIndex = ev.pivotIndex;
        nextAlgorithmState.pivotValue = ev.pivotValue;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.pivotIndex = ev.pivotIndex;
          st.pointerBadges = { [ev.pivotIndex ?? 0]: ['Pivot'] };
        }
        explanation = `Pivot selected: arr[${ev.pivotIndex}] = ${ev.pivotValue}`;
        break;
      }

      case 'QUICK_SORT_COMPARE': {
        nextMetrics.comparisons++;
        const cmpIdx = toNumericIndex(ev.index);
        nextComparison = {
          left: ev.value,
          right: ev.pivotValue,
          operator: '<',
          result: !!ev.conditionResult,
          explanation: `arr[${cmpIdx}] (${ev.value}) < pivot (${ev.pivotValue})`
        };
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].comparingIndices = [cmpIdx, nextAlgorithmState.pivotIndex ?? 0];
        }
        explanation = `Comparing arr[${cmpIdx}] (${ev.value}) < pivot (${ev.pivotValue}): ${ev.conditionResult}`;
        break;
      }

      case 'QUICK_SORT_PARTITION': {
        nextAlgorithmState.pivotIndex = ev.pivotIndex;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.pivotIndex = ev.pivotIndex;
          st.pointerBadges = { [ev.pivotIndex ?? 0]: ['Pivot Placed'] };
        }
        explanation = `Partition done: Pivot placed at final index ${ev.pivotIndex}`;
        break;
      }

      case 'QUICK_SORT_SWAP': {
        nextMetrics.swaps++;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.swappingIndices = [ev.fromIndex ?? 0, ev.toIndex ?? 0];
          if (st.arrayData && ev.fromIndex !== undefined && ev.toIndex !== undefined) {
            const tmp = st.arrayData[ev.fromIndex];
            st.arrayData[ev.fromIndex] = st.arrayData[ev.toIndex];
            st.arrayData[ev.toIndex] = tmp;
          }
        }
        explanation = `QuickSort swap: arr[${ev.fromIndex}] <-> arr[${ev.toIndex}]`;
        break;
      }

      case 'QUICK_SORT_RECURSE': {
        nextMetrics.recursiveCalls++;
        nextAlgorithmState.sortRange = [ev.rangeStart ?? 0, ev.rangeEnd ?? 0];
        explanation = `QuickSort recurse on partition [${ev.rangeStart}..${ev.rangeEnd}]`;
        break;
      }

      case 'QUICK_SORT_RETURN': {
        explanation = `QuickSort partition call returned`;
        break;
      }

      case 'QUICK_SORT_END': {
        nextAlgorithmState.status = 'Completed';
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.sortedIndices = st.arrayData ? st.arrayData.map((_, i) => i) : [];
        }
        explanation = `Quick Sort completed successfully`;
        break;
      }

      // --- ARRAY PATTERNS ---
      case 'TWO_POINTER_START': {
        nextAlgorithmState.algorithmName = 'Two Pointers';
        nextAlgorithmState.category = 'Array Patterns';
        nextAlgorithmState.leftPointer = ev.low;
        nextAlgorithmState.rightPointer = ev.high;
        nextAlgorithmState.theoreticalComplexity = { time: 'O(n)', space: 'O(1)', best: 'O(1)', average: 'O(n)', worst: 'O(n)' };
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].pointerBadges = { [ev.low ?? 0]: ['L'], [ev.high ?? 0]: ['R'] };
        }
        explanation = `Two Pointers initialized: left=${ev.low}, right=${ev.high}`;
        break;
      }

      case 'TWO_POINTER_COMPARE': {
        nextMetrics.comparisons++;
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].comparingIndices = [ev.fromIndex ?? 0, ev.toIndex ?? 0];
        }
        explanation = `Comparing arr[${ev.fromIndex}] (${ev.leftVal}) with arr[${ev.toIndex}] (${ev.rightVal})`;
        break;
      }

      case 'TWO_POINTER_MOVE_LEFT': {
        nextAlgorithmState.leftPointer = ev.low;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.pointerBadges = { ...(st.pointerBadges || {}), [ev.low ?? 0]: ['L'] };
        }
        explanation = `Moved left pointer to index ${ev.low}`;
        break;
      }

      case 'TWO_POINTER_MOVE_RIGHT': {
        nextAlgorithmState.rightPointer = ev.high;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.pointerBadges = { ...(st.pointerBadges || {}), [ev.high ?? 0]: ['R'] };
        }
        explanation = `Moved right pointer to index ${ev.high}`;
        break;
      }

      case 'TWO_POINTER_UPDATE': {
        nextAlgorithmState.leftPointer = ev.low;
        nextAlgorithmState.rightPointer = ev.high;
        nextAlgorithmState.windowSum = ev.currentSum;
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].pointerBadges = { [ev.low ?? 0]: ['L'], [ev.high ?? 0]: ['R'] };
        }
        explanation = `Pointers at [${ev.low}, ${ev.high}], sum = ${ev.currentSum}`;
        break;
      }

      case 'TWO_POINTER_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Two Pointers finished`;
        break;
      }

      case 'WINDOW_START': {
        const wStart = ev.windowStart ?? (ev as any).start;
        const wEnd = ev.windowEnd ?? (ev as any).end;
        const cSum = ev.currentSum ?? (ev as any).sum;
        nextAlgorithmState.algorithmName = 'Sliding Window';
        nextAlgorithmState.category = 'Array Patterns';
        nextAlgorithmState.windowStart = wStart;
        nextAlgorithmState.windowEnd = wEnd;
        nextAlgorithmState.windowSum = cSum;
        nextAlgorithmState.theoreticalComplexity = { time: 'O(n)', space: 'O(1)', best: 'O(1)', average: 'O(n)', worst: 'O(n)' };
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.windowRange = [wStart ?? 0, wEnd ?? 0];
          st.pointerBadges = { [wStart ?? 0]: ['Win Start'], [wEnd ?? 0]: ['Win End'] };
        }
        explanation = `Sliding Window initialized: [${wStart}..${wEnd}], sum=${cSum}`;
        break;
      }

      case 'WINDOW_EXPAND': {
        nextMetrics.accesses++;
        const wEnd = ev.windowEnd ?? (ev as any).newEnd;
        const cSum = ev.currentSum ?? (ev as any).sum;
        nextAlgorithmState.windowEnd = wEnd;
        nextAlgorithmState.windowSum = cSum;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.windowRange = [nextAlgorithmState.windowStart ?? 0, wEnd ?? 0];
          st.pointerBadges = { [nextAlgorithmState.windowStart ?? 0]: ['Win Start'], [wEnd ?? 0]: ['Win End'] };
        }
        explanation = `Expanded window right to ${wEnd} (+${ev.value ?? (ev as any).addedValue}), current sum = ${cSum}`;
        break;
      }

      case 'WINDOW_SHRINK': {
        nextMetrics.accesses++;
        const wStart = ev.windowStart ?? (ev as any).newStart;
        const cSum = ev.currentSum ?? (ev as any).sum;
        nextAlgorithmState.windowStart = wStart;
        nextAlgorithmState.windowSum = cSum;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.windowRange = [wStart ?? 0, nextAlgorithmState.windowEnd ?? 0];
          st.pointerBadges = { [wStart ?? 0]: ['Win Start'], [nextAlgorithmState.windowEnd ?? 0]: ['Win End'] };
        }
        explanation = `Shrunk window from left to ${wStart} (-${ev.value ?? (ev as any).removedValue}), current sum = ${cSum}`;
        break;
      }

      case 'WINDOW_ACCESS': {
        nextMetrics.accesses++;
        explanation = `Window accessed arr[${ev.index}] = ${ev.value}`;
        break;
      }

      case 'WINDOW_UPDATE': {
        const wStart = ev.windowStart ?? (ev as any).start;
        const wEnd = ev.windowEnd ?? (ev as any).end;
        const cSum = ev.currentSum ?? (ev as any).sum;
        const bSum = ev.bestSum ?? (ev as any).bestValue;
        nextAlgorithmState.windowStart = wStart;
        nextAlgorithmState.windowEnd = wEnd;
        nextAlgorithmState.windowSize = ev.windowSize;
        nextAlgorithmState.windowSum = cSum;
        nextAlgorithmState.windowBest = bSum;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          st.windowRange = [wStart ?? 0, wEnd ?? 0];
          st.pointerBadges = { [wStart ?? 0]: ['Win Start'], [wEnd ?? 0]: ['Win End'] };
        }
        explanation = `Window [${wStart}..${wEnd}] size=${ev.windowSize}: sum=${cSum}, best=${bSum}`;
        break;
      }

      case 'WINDOW_RESULT': {
        const bVal = ev.bestSum ?? (ev as any).bestValue;
        nextAlgorithmState.windowBest = bVal;
        explanation = `Best window result updated: ${bVal}`;
        break;
      }

      case 'WINDOW_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Sliding Window execution completed`;
        break;
      }

      case 'PREFIX_SUM_START': {
        nextAlgorithmState.algorithmName = 'Prefix Sum';
        nextAlgorithmState.category = 'Array Patterns';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(n)', space: 'O(n)', best: 'O(n)', average: 'O(n)', worst: 'O(n)' };
        explanation = `Initialized Prefix Sum array computation`;
        break;
      }

      case 'PREFIX_SUM_ACCESS': {
        nextMetrics.accesses++;
        const aIdx = toNumericIndex(ev.index);
        explanation = `Reading original element at index ${aIdx}: ${ev.value}`;
        break;
      }

      case 'PREFIX_SUM_UPDATE': {
        nextMetrics.assignments++;
        const pIdx = toNumericIndex(ev.index);
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          if (st.arrayData && ev.index !== undefined) {
            st.arrayData[pIdx] = ev.value;
          }
          st.activeIndices = [pIdx];
        }
        explanation = `prefix[${pIdx}] = ${ev.leftVal ?? 0} + ${ev.rightVal ?? ev.value} = ${ev.value}`;
        break;
      }

      case 'PREFIX_SUM_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Prefix Sum array calculation completed`;
        break;
      }

      case 'DIFFERENCE_ARRAY_START': {
        nextAlgorithmState.algorithmName = 'Difference Array';
        nextAlgorithmState.category = 'Array Patterns';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(1) updates, O(n) reconstruct', space: 'O(n)' };
        explanation = `Initialized Difference Array`;
        break;
      }

      case 'DIFFERENCE_ARRAY_UPDATE': {
        nextMetrics.assignments += 2;
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          if (st.arrayData && ev.rangeStart !== undefined && ev.rangeEnd !== undefined) {
            st.arrayData[ev.rangeStart] = (st.arrayData[ev.rangeStart] || 0) + Number(ev.value);
            if (ev.rangeEnd + 1 < st.arrayData.length) {
              st.arrayData[ev.rangeEnd + 1] = (st.arrayData[ev.rangeEnd + 1] || 0) - Number(ev.value);
            }
          }
        }
        explanation = `Range update [${ev.rangeStart}..${ev.rangeEnd}] by ${ev.value}`;
        break;
      }

      case 'DIFFERENCE_ARRAY_RECONSTRUCT': {
        nextMetrics.accesses++;
        const rIdx = toNumericIndex(ev.index);
        if (ev.structureId && nextStructures[ev.structureId]) {
          const st = nextStructures[ev.structureId];
          if (st.arrayData && ev.index !== undefined) {
            st.arrayData[rIdx] = ev.value;
          }
          st.activeIndices = [rIdx];
        }
        explanation = `Reconstructed element [${rIdx}] = ${ev.value}`;
        break;
      }

      case 'DIFFERENCE_ARRAY_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Difference Array operations completed`;
        break;
      }

      case 'KADANE_START': {
        nextAlgorithmState.algorithmName = "Kadane's Algorithm";
        nextAlgorithmState.category = 'Array Patterns';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(n)', space: 'O(1)', best: 'O(n)', average: 'O(n)', worst: 'O(n)' };
        explanation = `Starting Kadane's maximum subarray search`;
        break;
      }

      case 'KADANE_UPDATE': {
        nextMetrics.accesses++;
        const kIdx = toNumericIndex(ev.index);
        nextAlgorithmState.kadaneCurrentSum = Number(ev.currentSum);
        nextAlgorithmState.kadaneBestSum = Number(ev.bestSum);
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].activeIndices = [kIdx];
        }
        explanation = `arr[${kIdx}] (${ev.value}): currentSum=${ev.currentSum}, bestSum=${ev.bestSum}`;
        break;
      }

      case 'KADANE_BEST_UPDATE': {
        nextAlgorithmState.kadaneBestSum = Number(ev.bestSum);
        nextAlgorithmState.kadaneBestStart = ev.bestStart;
        nextAlgorithmState.kadaneBestEnd = ev.bestEnd;
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].searchRange = [ev.bestStart ?? 0, ev.bestEnd ?? 0];
        }
        explanation = `New best subarray found: sum=${ev.bestSum} [${ev.bestStart}..${ev.bestEnd}]`;
        break;
      }

      case 'KADANE_RANGE_UPDATE': {
        nextAlgorithmState.kadaneCurrentStart = ev.currentStart;
        if (ev.structureId && nextStructures[ev.structureId]) {
          nextStructures[ev.structureId].windowRange = [ev.currentStart ?? 0, ev.rangeEnd ?? 0];
        }
        explanation = `Active subarray range: [${ev.currentStart}..${ev.rangeEnd}]`;
        break;
      }

      case 'KADANE_END': {
        const bSum = ev.bestSum ?? (ev as any).maxSubarraySum ?? nextAlgorithmState.kadaneBestSum;
        nextAlgorithmState.kadaneBestSum = bSum;
        if (ev.bestStart !== undefined) nextAlgorithmState.kadaneBestStart = ev.bestStart;
        if (ev.bestEnd !== undefined) nextAlgorithmState.kadaneBestEnd = ev.bestEnd;
        nextAlgorithmState.status = 'Completed';
        explanation = `Kadane completed: Max sum = ${bSum} [${ev.bestStart ?? nextAlgorithmState.kadaneBestStart}..${ev.bestEnd ?? nextAlgorithmState.kadaneBestEnd}]`;
        break;
      }

      // --- RECURSION ---
      case 'RECURSION_START': {
        nextAlgorithmState.algorithmName = ev.functionName || 'Recursion';
        nextAlgorithmState.category = 'Recursion';
        nextAlgorithmState.recursionTree = nextAlgorithmState.recursionTree || {};
        explanation = `Starting recursive function ${ev.functionName}`;
        break;
      }

      case 'RECURSION_CALL': {
        nextMetrics.recursiveCalls++;
        nextMetrics.functionCalls++;
        const callId = ev.callId || `call-${nextMetrics.recursiveCalls}`;
        if (!nextAlgorithmState.recursionRootId) nextAlgorithmState.recursionRootId = callId;
        nextAlgorithmState.activeCallId = callId;
        const parentId = ev.parentNodeId || null;
        if (!nextAlgorithmState.recursionTree) nextAlgorithmState.recursionTree = {};
        nextAlgorithmState.recursionTree[callId] = {
          id: callId,
          parentId,
          fnName: ev.functionName || 'func',
          args: ev.arguments || {},
          depth: ev.depth || 1,
          status: 'CALLING',
          children: [],
        };
        if (parentId && nextAlgorithmState.recursionTree[parentId]) {
          if (!nextAlgorithmState.recursionTree[parentId].children.includes(callId)) {
            nextAlgorithmState.recursionTree[parentId].children.push(callId);
          }
        }
        explanation = `Recursive call: ${ev.functionName}(${JSON.stringify(ev.arguments || {})}) [depth=${ev.depth || 1}]`;
        break;
      }

      case 'RECURSION_BASE_CASE': {
        nextAlgorithmState.phase = 'Base Case Reached';
        if (ev.callId && nextAlgorithmState.recursionTree?.[ev.callId]) {
          nextAlgorithmState.recursionTree[ev.callId].status = 'BASE_CASE';
          nextAlgorithmState.recursionTree[ev.callId].returnValue = ev.returnValue;
        } else if (ev.callId) {
          nextAlgorithmState.recursionTree = nextAlgorithmState.recursionTree || {};
          nextAlgorithmState.recursionTree[ev.callId] = {
            id: ev.callId,
            parentId: null,
            fnName: ev.functionName || 'fn',
            args: ev.args || {},
            depth: ev.depth || 0,
            status: 'BASE_CASE',
            returnValue: ev.returnValue,
            children: []
          };
        }
        explanation = `Base case reached! Returning ${ev.returnValue}`;
        break;
      }

      case 'RECURSION_RETURN': {
        if (ev.callId && nextAlgorithmState.recursionTree?.[ev.callId]) {
          nextAlgorithmState.recursionTree[ev.callId].status = 'RETURNED';
          nextAlgorithmState.recursionTree[ev.callId].returnValue = ev.returnValue;
          nextAlgorithmState.activeCallId = nextAlgorithmState.recursionTree[ev.callId].parentId;
        }
        explanation = `Recursive call returned: ${ev.returnValue}`;
        break;
      }

      case 'RECURSION_BACKTRACK': {
        if (ev.callId && nextAlgorithmState.recursionTree?.[ev.callId]) {
          nextAlgorithmState.recursionTree[ev.callId].status = 'BACKTRACKED';
        }
        explanation = `Backtracking from recursion node ${ev.callId}`;
        break;
      }

      case 'RECURSION_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Recursion completed: result = ${ev.returnValue}`;
        break;
      }

      // --- BACKTRACKING ---
      case 'BACKTRACK_START': {
        nextAlgorithmState.algorithmName = ev.algorithmName || 'Backtracking';
        nextAlgorithmState.category = 'Backtracking';
        nextAlgorithmState.choicesHistory = [];
        explanation = `Starting Backtracking search: ${ev.algorithmName}`;
        break;
      }

      case 'BACKTRACK_CHOICE': {
        nextAlgorithmState.currentChoice = ev.choice;
        nextAlgorithmState.choicesHistory = [...(nextAlgorithmState.choicesHistory || []), ev.choice || ''];
        explanation = `CHOOSE: Choice '${ev.choice}' (state = ${JSON.stringify(ev.stateValue)})`;
        break;
      }

      case 'BACKTRACK_ENTER': {
        explanation = `EXPLORE: Branching with choice '${ev.choice}'`;
        break;
      }

      case 'BACKTRACK_SUCCESS': {
        const sol = ev.choice ?? (ev as any).solution ?? 'Valid Solution';
        nextAlgorithmState.status = `Found Solution: ${sol}`;
        nextAlgorithmState.phase = 'Solution Found';
        explanation = `SUCCESS: Valid solution found -> ${sol}`;
        break;
      }

      case 'BACKTRACK_FAILURE': {
        nextAlgorithmState.phase = 'Pruned / Backtrack';
        explanation = `DEAD END: Invalid state reached, pruning branch (${ev.message || ''})`;
        break;
      }

      case 'BACKTRACK_UNDO': {
        nextAlgorithmState.phase = 'Undo / Backtrack';
        if (nextAlgorithmState.choicesHistory && nextAlgorithmState.choicesHistory.length > 0) {
          nextAlgorithmState.choicesHistory.pop();
        }
        explanation = `UNDO: Backtracking and reverting choice '${ev.choice}'`;
        break;
      }

      case 'BACKTRACK_RETURN': {
        explanation = `Returning from branch for choice '${ev.choice}'`;
        break;
      }

      case 'BACKTRACK_END': {
        const total = (ev as any).totalSolutions ?? nextAlgorithmState.choicesHistory?.length ?? 1;
        nextAlgorithmState.status = `Completed. Total Solutions: ${total}`;
        nextAlgorithmState.phase = 'Completed';
        explanation = `Backtracking search completed: Total solutions = ${total}`;
        break;
      }

      // --- DYNAMIC PROGRAMMING ---
      case 'DP_START':
      case 'DP_STATE_CREATE': {
        const rawType = String(ev.dpType || '').toUpperCase();
        if (rawType.includes('MEMO')) {
          nextAlgorithmState.dpType = 'MEMOIZATION';
          nextAlgorithmState.algorithmName = 'DP Memoization';
        } else if (rawType.includes('2D') || (ev.dimensions && ev.dimensions.length > 1) || (ev.high && ev.high > 0)) {
          nextAlgorithmState.dpType = 'TABULATION_2D';
          nextAlgorithmState.algorithmName = 'DP Tabulation (2D)';
        } else {
          nextAlgorithmState.dpType = 'TABULATION_1D';
          nextAlgorithmState.algorithmName = 'DP Tabulation (1D)';
        }
        nextAlgorithmState.category = 'Dynamic Programming';
        const rows = ev.dimensions?.[0] ?? ev.low ?? 10;
        const cols = ev.dimensions?.[1] ?? ev.high ?? 0;
        const structId = ev.dpId || ev.structureId || 'dp';
        if (cols > 0) {
          nextAlgorithmState.dpTable2D = Array.from({ length: rows }, () => Array(cols).fill(0));
          nextStructures[structId] = {
            id: structId,
            name: structId,
            type: 'matrix',
            dataType: 'int[][] (DP Table)',
            size: rows * cols,
            matrixData: nextAlgorithmState.dpTable2D.map(row => [...row]),
            createdAtStep: ev.step || 0,
            lastUpdatedStep: ev.step || 0,
            lastOperation: `Allocated 2D DP Table [${rows}x${cols}]`,
            stateCategory: 'RUNTIME_STATE',
          };
        } else {
          nextAlgorithmState.dpTable1D = Array(rows).fill(0);
          nextStructures[structId] = {
            id: structId,
            name: structId,
            type: 'array',
            dataType: 'int[] (DP Table)',
            size: rows,
            arrayData: [...nextAlgorithmState.dpTable1D],
            createdAtStep: ev.step || 0,
            lastUpdatedStep: ev.step || 0,
            lastOperation: `Allocated 1D DP Table [${rows}]`,
            stateCategory: 'RUNTIME_STATE',
          };
        }
        nextVariables[structId] = {
          name: structId,
          type: cols > 0 ? 'int[][]' : 'int[]',
          value: `@${structId}`,
          scope: 'main',
          isReference: true,
          refTargetId: `@${structId}`,
          estimatedBytes: 8,
        };
        explanation = `Initialized DP state table (${nextAlgorithmState.dpType}: ${rows}${cols > 0 ? `x${cols}` : ' cells'})`;
        break;
      }

      case 'DP_STATE_ACCESS': {
        nextMetrics.accesses++;
        const r = ev.row ?? (ev.stateKey !== undefined ? parseInt(String(ev.stateKey).replace(/[^0-9]/g, '')) : 0);
        const c = ev.col ?? 0;
        nextAlgorithmState.dpCurrentCell = [r, c];
        const structId = ev.dpId || ev.structureId || 'dp';
        if (nextStructures[structId]) {
          nextStructures[structId].activeIndices = [r * ((nextStructures[structId].matrixData?.[0]?.length) || 1) + c];
        }
        explanation = `Read DP state at [${r}${c > 0 ? `,${c}` : ''}]: ${ev.value}`;
        break;
      }

      case 'DP_STATE_UPDATE': {
        nextMetrics.assignments++;
        const r = ev.row ?? (ev.stateKey !== undefined ? parseInt(String(ev.stateKey).replace(/[^0-9]/g, '')) : 0);
        const c = ev.col ?? 0;
        if (nextAlgorithmState.dpTable2D) {
          if (!nextAlgorithmState.dpTable2D[r]) nextAlgorithmState.dpTable2D[r] = [];
          nextAlgorithmState.dpTable2D[r][c] = ev.value;
        } else if (nextAlgorithmState.dpTable1D) {
          nextAlgorithmState.dpTable1D[r] = ev.value;
        }
        nextAlgorithmState.dpCurrentCell = [r, c];
        nextAlgorithmState.dpTransitionFormula = ev.transitionFormula;
        if (ev.path) {
          try {
            nextAlgorithmState.dpPreviousCells = typeof ev.path === 'string' ? JSON.parse(ev.path) : ev.path;
          } catch (_) {}
        }
        const structId = ev.dpId || ev.structureId || 'dp';
        if (nextStructures[structId]) {
          const st = nextStructures[structId];
          st.lastUpdatedStep = ev.step || 0;
          st.lastOperation = `dp[${r}][${c}] = ${ev.value}`;
          if (nextAlgorithmState.dpTable2D) {
            st.matrixData = nextAlgorithmState.dpTable2D.map(row => [...row]);
            st.highlightedIndices = [r * (st.matrixData[0]?.length || 1) + c];
          } else if (nextAlgorithmState.dpTable1D) {
            st.arrayData = [...nextAlgorithmState.dpTable1D];
            st.highlightedIndices = [r];
          }
        }
        explanation = `DP Transition: dp[${r}${c > 0 ? `,${c}` : ''}] = ${ev.transitionFormula || ev.value} => ${ev.value}`;
        break;
      }

      case 'DP_TRANSITION': {
        nextAlgorithmState.dpTransitionFormula = ev.transitionFormula;
        explanation = `Transition: ${ev.transitionFormula} => ${ev.value ?? ''}`;
        break;
      }

      case 'DP_CACHE_HIT': {
        nextMetrics.cacheHits++;
        const k = ev.key ?? ev.stateKey;
        const v = ev.value ?? (ev as any).cachedValue;
        nextAlgorithmState.memoEntries = [...(nextAlgorithmState.memoEntries || []), { key: k, value: v, status: 'HIT' }];
        explanation = `CACHE HIT: memo[${k}] already computed! Returned ${v} (Avoided subproblem recomputation!)`;
        break;
      }

      case 'DP_CACHE_MISS': {
        nextMetrics.cacheMisses++;
        const k = ev.key ?? ev.stateKey;
        nextAlgorithmState.memoEntries = [...(nextAlgorithmState.memoEntries || []), { key: k, value: undefined, status: 'MISS' }];
        explanation = `CACHE MISS: memo[${k}] not cached. Computing subproblem...`;
        break;
      }

      case 'DP_BASE_CASE': {
        const br = ev.row ?? (ev.stateKey !== undefined ? parseInt(String(ev.stateKey).replace(/[^0-9]/g, '')) : 0);
        const bc = ev.col ?? 0;
        if (nextAlgorithmState.dpTable2D) {
          if (!nextAlgorithmState.dpTable2D[br]) nextAlgorithmState.dpTable2D[br] = [];
          nextAlgorithmState.dpTable2D[br][bc] = ev.value;
        } else if (nextAlgorithmState.dpTable1D) {
          nextAlgorithmState.dpTable1D[br] = ev.value;
        }
        const structId = ev.dpId || ev.structureId || 'dp';
        if (nextStructures[structId]) {
          const st = nextStructures[structId];
          st.lastUpdatedStep = ev.step || 0;
          st.lastOperation = `Base Case [${br}, ${bc}] = ${ev.value}`;
          if (nextAlgorithmState.dpTable2D) {
            st.matrixData = nextAlgorithmState.dpTable2D.map(row => [...row]);
          } else if (nextAlgorithmState.dpTable1D) {
            st.arrayData = [...nextAlgorithmState.dpTable1D];
          }
        }
        explanation = `DP Base Case: dp[${br}${bc > 0 ? `,${bc}` : ''}] = ${ev.value}`;
        break;
      }

      case 'DP_END': {
        const ans = ev.value ?? (ev as any).finalAnswer;
        nextAlgorithmState.status = ans !== undefined ? `DP Solved. Final Answer: ${ans}` : 'Completed';
        explanation = `DP completed: Final result = ${ans ?? ''}`;
        break;
      }

      case 'CONSOLE_OUTPUT': {
        nextConsole.push(String(ev.message));
        explanation = `Console output: ${ev.message}`;
        break;
      }

      case 'EXCEPTION': {
        nextError = {
          type: 'RuntimeError',
          message: ev.message || 'Execution Exception',
          line: ev.line || currentLine,
          detail: ev.detail || 'Exception caught by runtime',
        };
        explanation = `Exception thrown on line ${ev.line}: ${ev.message}`;
        break;
      }

      case 'PROGRAM_END':
        explanation = 'Program execution completed';
        break;

      default:
        explanation = `Step ${i + 1}: ${ev.type}`;
        break;
    }

    // Synchronize pointers into active structures
    for (const st of Object.values(nextStructures)) {
      if (st.type === 'array') {
        st.pointers = { ...nextPointers };
      }
    }

    // Ensure all active data structures have a reference variable on the stack
    for (const [stId, st] of Object.entries(nextStructures)) {
      if (!nextVariables[stId]) {
        nextVariables[stId] = {
          name: stId,
          type: st.dataType || `${st.type} ref`,
          value: `@${stId}`,
          scope: 'main',
          isReference: true,
          refTargetId: `@${stId}`,
          estimatedBytes: 8,
        };
      }
    }

    // Calculate memory stats & construct JVM Heap objects
    let stackBytes = 0;
    for (const v of Object.values(nextVariables)) {
      stackBytes += v.estimatedBytes;
    }

    let heapBytes = 0;
    const nextHeap: HeapObject[] = [];

    for (const st of Object.values(nextStructures)) {
      let estBytes = 0;
      let label = '';
      let fields: Record<string, any> = {};

      if (st.type === 'matrix' || st.matrixData) {
        const rows = st.matrixData?.length || 0;
        const cols = rows > 0 && Array.isArray(st.matrixData?.[0]) ? st.matrixData[0].length : 0;
        const cells = st.size || rows * cols;
        estBytes = 24 + rows * 16 + cells * 4;
        label = `${rows}x${cols} Matrix (${cells} elements)`;
        fields = { rows, cols, size: cells };
      } else if (st.type === 'array' || st.arrayData) {
        const len = st.arrayData?.length || 0;
        estBytes = 16 + len * 4;
        label = `length = ${len}`;
        fields = { length: len };
      } else if (st.type === 'stack' || st.stackData) {
        const sz = st.stackData?.length || 0;
        estBytes = 24 + sz * 8;
        label = `size = ${sz}`;
        fields = { size: sz };
      } else if (st.type === 'queue' || st.queueData) {
        const sz = st.queueData?.length || 0;
        estBytes = 24 + sz * 8;
        label = `size = ${sz}`;
        fields = { size: sz };
      } else if (st.type === 'deque' || st.dequeData) {
        const sz = st.dequeData?.length || 0;
        estBytes = 24 + sz * 8;
        label = `size = ${sz}`;
        fields = { size: sz };
      } else if (st.type === 'priorityqueue' || st.priorityQueueData) {
        const sz = st.priorityQueueData?.length || 0;
        estBytes = 32 + sz * 8;
        label = `size = ${sz}`;
        fields = { size: sz };
      } else if (st.type === 'linkedlist' || st.linkedListData) {
        const nodeCount = Object.keys(st.linkedListData?.nodes || {}).length;
        estBytes = 24 + nodeCount * 24;
        label = `nodes = ${nodeCount}`;
        fields = { head: st.linkedListData?.headId, size: nodeCount };
      } else if (st.type === 'map' || st.mapData) {
        const entryCount = st.mapData?.entries?.length || 0;
        estBytes = 48 + entryCount * 32;
        label = `size = ${entryCount}`;
        fields = { size: entryCount };
      } else if (st.type === 'set' || st.setData) {
        const sz = st.setData?.length || 0;
        estBytes = 32 + sz * 8;
        label = `size = ${sz}`;
        fields = { size: sz };
      } else if (st.type === 'tree' || st.type === 'bst' || st.treeData) {
        const nodeCount = Object.keys(st.treeData?.nodes || {}).length;
        estBytes = 32 + nodeCount * 32;
        label = `nodes = ${nodeCount}`;
        fields = { root: st.treeData?.rootId, size: nodeCount };
      } else if (st.type === 'heap' || st.heapData) {
        const sz = st.heapData?.array?.length || 0;
        estBytes = 24 + sz * 8;
        label = `size = ${sz}`;
        fields = { size: sz };
      } else if (st.type === 'trie' || st.trieData) {
        const nodeCount = Object.keys(st.trieData?.nodes || {}).length;
        estBytes = 40 + nodeCount * 48;
        label = `words = ${st.trieData?.wordsCount || 0}, nodes = ${nodeCount}`;
        fields = { words: st.trieData?.wordsCount || 0 };
      } else if (st.type === 'graph' || st.graphData) {
        const vCount = Object.keys(st.graphData?.nodes || {}).length;
        const eCount = Object.keys(st.graphData?.edges || {}).length;
        estBytes = 48 + vCount * 32 + eCount * 40;
        label = `${vCount} vertices, ${eCount} edges`;
        fields = { directed: st.graphData?.directed, weighted: st.graphData?.weighted };
      } else {
        estBytes = 32;
        label = `${st.type} instance`;
      }

      heapBytes += estBytes;
      nextHeap.push({
        id: `@${st.id}`,
        type: st.dataType || st.type,
        label,
        fields,
        estimatedBytes: estBytes,
        referencesTo: [],
      });
    }

    currentVariables = nextVariables;
    currentStructures = nextStructures;
    currentCallStack = nextCallStack;
    currentHeap = nextHeap;
    currentConsole = nextConsole;
    currentPointers = nextPointers;
    currentComparison = nextComparison;
    currentError = nextError;
    currentMetrics = nextMetrics;
    currentAlgorithmState = nextAlgorithmState;

    steps.push({
      stepIndex: i,
      totalSteps: events.length,
      line: currentLine,
      event: ev,
      explanation,
      variables: currentVariables,
      callStack: currentCallStack,
      structures: currentStructures,
      heap: nextHeap,
      consoleOutput: currentConsole,
      activePointers: currentPointers,
      comparison: currentComparison,
      error: currentError,
      memoryStats: {
        stackBytes,
        heapBytes,
        totalBytes: stackBytes + heapBytes,
      },
      algorithmState: nextAlgorithmState,
    });
  }

  return steps;
}
