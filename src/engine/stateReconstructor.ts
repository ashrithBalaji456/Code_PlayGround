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
  LinkedListNode,
  TreeNodeData,
  ThreadState,
  LockState,
  JavaConceptInfo,
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
  // Phase 10: JVM & OOP State Tracking
  let currentStaticFields: Record<string, Record<string, any>> = {};
  let currentThreads: Record<string, ThreadState> = {
    main: {
      id: '1',
      name: 'main',
      state: 'RUNNING',
      callStack: currentCallStack,
    },
  };
  let currentLocks: Record<string, LockState> = {};
  let currentDeadlock = false;
  let currentActiveConcept: JavaConceptInfo | null = null;
  let currentCustomObjects: Record<
    string,
    {
      id: string;
      className: string;
      fields: Record<string, any>;
      creationStep: number;
      lifecycle: 'NOT_CREATED' | 'CREATED' | 'REFERENCED' | 'MUTATED' | 'GC_ELIGIBLE';
    }
  > = {};
  let currentStringPool: Array<{ value: string; references: string[] }> = [];

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
        arrayData: st.arrayData ? st.arrayData.map(item => Array.isArray(item) ? [...item] : item) : undefined,
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
        activeCell: undefined,
        dependencyCells: undefined,
        highlightedCells: st.highlightedCells ? st.highlightedCells.map((c) => [...c] as [number, number]) : undefined,
        lastUpdatedCell: st.lastUpdatedCell ? [...st.lastUpdatedCell] : undefined,
        rowLabels: st.rowLabels ? [...st.rowLabels] : undefined,
        colLabels: st.colLabels ? [...st.colLabels] : undefined,
        cellExplanation: undefined,
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

    // Phase 10: JVM & OOP State Immutability Cloning
    const nextStaticFields: Record<string, Record<string, any>> = {};
    for (const [cls, flds] of Object.entries(currentStaticFields)) {
      nextStaticFields[cls] = { ...flds };
    }

    const nextThreads: Record<string, ThreadState> = {};
    for (const [tid, th] of Object.entries(currentThreads)) {
      nextThreads[tid] = {
        ...th,
        callStack: th.callStack.map((f) => ({
          ...f,
          arguments: { ...f.arguments },
          localVariables: { ...f.localVariables },
        })),
      };
    }

    const nextLocks: Record<string, LockState> = {};
    for (const [lid, lk] of Object.entries(currentLocks)) {
      nextLocks[lid] = {
        ...lk,
        waitingThreadIds: [...lk.waitingThreadIds],
      };
    }

    let nextDeadlock: boolean = currentDeadlock;
    let nextActiveConcept: JavaConceptInfo | null = currentActiveConcept
      ? {
          name: currentActiveConcept.name,
          category: currentActiveConcept.category,
          explanation: currentActiveConcept.explanation,
          badge: currentActiveConcept.badge,
          details: currentActiveConcept.details ? Object.assign({}, currentActiveConcept.details) : undefined,
        }
      : null;

    const nextCustomObjects: Record<
      string,
      {
        id: string;
        className: string;
        fields: Record<string, any>;
        creationStep: number;
        lifecycle: 'NOT_CREATED' | 'CREATED' | 'REFERENCED' | 'MUTATED' | 'GC_ELIGIBLE';
      }
    > = {};
    for (const [oid, obj] of Object.entries(currentCustomObjects)) {
      nextCustomObjects[oid] = {
        ...obj,
        fields: { ...obj.fields },
      };
    }

    let nextStringPool: Array<{ value: string; references: string[] }> = currentStringPool.map((sp) => ({
      value: sp.value,
      references: [...sp.references],
    }));

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
      // Phase 6 Deep Cloning for Step Immutability & Leak-Free Backward Replay
      bellmanDistances: currentAlgorithmState.bellmanDistances ? { ...currentAlgorithmState.bellmanDistances } : undefined,
      bellmanCurrentEdge: currentAlgorithmState.bellmanCurrentEdge ? { ...currentAlgorithmState.bellmanCurrentEdge } : undefined,
      floydMatrix: currentAlgorithmState.floydMatrix ? currentAlgorithmState.floydMatrix.map((r) => [...r]) : undefined,
      floydLabels: currentAlgorithmState.floydLabels ? [...currentAlgorithmState.floydLabels] : undefined,
      mstEdges: currentAlgorithmState.mstEdges ? currentAlgorithmState.mstEdges.map((e) => ({ ...e })) : undefined,
      kruskalSortedEdges: currentAlgorithmState.kruskalSortedEdges ? currentAlgorithmState.kruskalSortedEdges.map((e) => ({ ...e })) : undefined,
      disjointSetParents: currentAlgorithmState.disjointSetParents ? { ...currentAlgorithmState.disjointSetParents } : undefined,
      disjointSetRanks: currentAlgorithmState.disjointSetRanks ? { ...currentAlgorithmState.disjointSetRanks } : undefined,
      indegrees: currentAlgorithmState.indegrees ? { ...currentAlgorithmState.indegrees } : undefined,
      topologicalQueue: currentAlgorithmState.topologicalQueue ? [...currentAlgorithmState.topologicalQueue] : undefined,
      topologicalOrder: currentAlgorithmState.topologicalOrder ? [...currentAlgorithmState.topologicalOrder] : undefined,
      sccComponents: currentAlgorithmState.sccComponents ? currentAlgorithmState.sccComponents.map((c) => [...c]) : undefined,
      currentSCC: currentAlgorithmState.currentSCC ? [...currentAlgorithmState.currentSCC] : undefined,
      tarjanDiscoveryIndex: currentAlgorithmState.tarjanDiscoveryIndex ? { ...currentAlgorithmState.tarjanDiscoveryIndex } : undefined,
      tarjanLowLink: currentAlgorithmState.tarjanLowLink ? { ...currentAlgorithmState.tarjanLowLink } : undefined,
      tarjanStack: currentAlgorithmState.tarjanStack ? [...currentAlgorithmState.tarjanStack] : undefined,
      kosarajuFinishStack: currentAlgorithmState.kosarajuFinishStack ? [...currentAlgorithmState.kosarajuFinishStack] : undefined,
      nodeHeights: currentAlgorithmState.nodeHeights ? { ...currentAlgorithmState.nodeHeights } : undefined,
      balanceFactors: currentAlgorithmState.balanceFactors ? { ...currentAlgorithmState.balanceFactors } : undefined,
      coordMapping: currentAlgorithmState.coordMapping ? { ...currentAlgorithmState.coordMapping } : undefined,
      monoStackElements: currentAlgorithmState.monoStackElements ? [...currentAlgorithmState.monoStackElements] : undefined,
      // Phase 7 DP Deep Cloning for Step Immutability & Replay
      dpCellStatus: currentAlgorithmState.dpCellStatus ? { ...currentAlgorithmState.dpCellStatus } : undefined,
      dpDimensions: currentAlgorithmState.dpDimensions ? [...currentAlgorithmState.dpDimensions] : undefined,
      dpRowLabels: currentAlgorithmState.dpRowLabels ? [...currentAlgorithmState.dpRowLabels] : undefined,
      dpColLabels: currentAlgorithmState.dpColLabels ? [...currentAlgorithmState.dpColLabels] : undefined,
      dpDependencies: currentAlgorithmState.dpDependencies ? [...currentAlgorithmState.dpDependencies] : undefined,
      dpCandidateValues: currentAlgorithmState.dpCandidateValues ? currentAlgorithmState.dpCandidateValues.map((c) => ({ ...c })) : undefined,
      dpSparseMap: currentAlgorithmState.dpSparseMap ? { ...currentAlgorithmState.dpSparseMap } : undefined,
      knapsackItems: currentAlgorithmState.knapsackItems ? currentAlgorithmState.knapsackItems.map((it) => ({ ...it })) : undefined,
      coins: currentAlgorithmState.coins ? [...currentAlgorithmState.coins] : undefined,
      lcsReconstructionPath: currentAlgorithmState.lcsReconstructionPath ? currentAlgorithmState.lcsReconstructionPath.map((p) => [...p] as [number, number]) : undefined,
      lisArray: currentAlgorithmState.lisArray ? [...currentAlgorithmState.lisArray] : undefined,
      lisParents: currentAlgorithmState.lisParents ? [...currentAlgorithmState.lisParents] : undefined,
      lisReconstructedIndices: currentAlgorithmState.lisReconstructedIndices ? [...currentAlgorithmState.lisReconstructedIndices] : undefined,
      gridObstacles: currentAlgorithmState.gridObstacles ? currentAlgorithmState.gridObstacles.map((o) => [...o] as [number, number]) : undefined,
      treeDpNodeStates: currentAlgorithmState.treeDpNodeStates ? { ...currentAlgorithmState.treeDpNodeStates } : undefined,
      bitmaskSelectedBits: currentAlgorithmState.bitmaskSelectedBits ? [...currentAlgorithmState.bitmaskSelectedBits] : undefined,
      digitOptions: currentAlgorithmState.digitOptions ? [...currentAlgorithmState.digitOptions] : undefined,
      reconstructionSequence: currentAlgorithmState.reconstructionSequence ? [...currentAlgorithmState.reconstructionSequence] : undefined,
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
        const isRef = !!ev.isReference || !!ev.objectId;
        const varInfo: VariableInfo = {
          name: ev.variable!,
          type,
          value: val,
          scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
          isReference: isRef,
          refTargetId: ev.refTargetId || ev.objectId,
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
        const isRef = !!ev.isReference || !!ev.objectId;
        if (v) {
          v.value = ev.newValue;
          if (isRef) {
            v.isReference = true;
            v.refTargetId = ev.refTargetId || ev.objectId;
          }
        } else {
          nextVariables[ev.variable!] = {
            name: ev.variable!,
            type: ev.dataType || 'int',
            value: ev.newValue,
            scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
            isReference: isRef,
            refTargetId: ev.refTargetId || ev.objectId,
            estimatedBytes: estimateSize(ev.dataType || 'int', ev.newValue),
          };
        }
        const topFrame = nextCallStack[nextCallStack.length - 1];
        if (topFrame && nextVariables[ev.variable!]) {
          topFrame.localVariables[ev.variable!] = nextVariables[ev.variable!];
        }
        explanation = `Updated variable ${ev.variable} from ${ev.oldValue} to ${ev.newValue}`;
        break;
      }

      case 'FUNCTION_CALL': {
        const fnName = ev.functionName || 'func';
        const frameId = `frame-${fnName}-${nextCallStack.length}`;
        const newFrame: CallFrame = {
          id: frameId,
          functionName: fnName,
          arguments: ev.arguments || {},
          localVariables: {},
          line: ev.line || currentLine,
          depth: nextCallStack.length + 1,
        };
        nextCallStack.push(newFrame);
        nextMetrics.functionCalls++;
        explanation = `Called ${fnName}()`;
        break;
      }

      case 'FUNCTION_RETURN': {
        const fnName = ev.functionName || '';
        if (nextCallStack.length > 1) {
          nextCallStack.pop();
        }
        explanation = `Returned from ${fnName || 'function'}${ev.returnValue !== undefined ? ` with ${ev.returnValue}` : ''}`;
        break;
      }

      case 'NESTED_COLLECTION_UPDATE': {
        const arrId = ev.structureId || ev.variable || 'nested';
        const rawVals = Array.isArray(ev.values) ? ev.values : [];
        nextStructures[arrId] = {
          id: arrId,
          name: ev.variable || arrId,
          type: 'array',
          dataType: ev.dataType || 'List<List<...>>',
          arrayData: rawVals,
          size: rawVals.length,
          lastOperation: `Updated ${arrId} (size ${rawVals.length})`,
        };
        if (ev.isGraph && rawVals.length > 0 && Array.isArray(rawVals[0])) {
          const graphId = `graph_${arrId}`;
          const nodes: Record<string, GraphNodeData> = {};
          const edges: Record<string, GraphEdgeData> = {};
          for (let u = 0; u < rawVals.length; u++) {
            const uStr = String(u);
            const nbrs: string[] = [];
            if (Array.isArray(rawVals[u])) {
              for (const v of rawVals[u]) {
                const vStr = String(v);
                nbrs.push(vStr);
                const edgeId = `edge_${u}_${v}`;
                edges[edgeId] = {
                  id: edgeId,
                  source: uStr,
                  target: vStr,
                  directed: false,
                };
              }
            }
            nodes[uStr] = {
              id: uStr,
              label: uStr,
              value: u,
              outNeighbors: nbrs,
              degree: nbrs.length,
            };
          }
          nextStructures[graphId] = {
            id: graphId,
            name: `Graph (${arrId})`,
            type: 'graph',
            dataType: 'Graph (Adjacency List)',
            size: rawVals.length,
            graphData: {
              directed: false,
              weighted: false,
              nodes,
              nodeList: Object.values(nodes),
              edges,
              edgeList: Object.values(edges),
            },
            lastOperation: `Adjacency Graph (${rawVals.length} vertices)`,
          };
        }
        nextVariables[arrId] = {
          name: arrId,
          type: ev.dataType || 'List<List<Integer>>',
          value: `size = ${rawVals.length}`,
          scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
          isReference: true,
          refTargetId: ev.objectId || arrId,
          estimatedBytes: 32 + rawVals.length * 8,
        };
        explanation = `Updated nested collection ${arrId} (size ${rawVals.length})`;
        break;
      }

      // === PHASE 10: ADVANCED JAVA & JVM EXECUTION ===
      case 'OBJECT_CREATE': {
        const objId = ev.objectId || `obj_${Object.keys(nextCustomObjects).length + 1}`;
        const className = ev.dataType || ev.className || 'Object';
        const varName = ev.variable;
        const initialFields = ev.fields || {};

        nextCustomObjects[objId] = {
          id: objId,
          className,
          fields: { ...initialFields },
          creationStep: i + 1,
          lifecycle: 'CREATED',
        };

        if (varName) {
          nextVariables[varName] = {
            name: varName,
            type: className,
            value: `${className}@${objId.replace(/\D/g, '') || '1'}`,
            scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
            isReference: true,
            refTargetId: objId,
            estimatedBytes: 8,
          };
          const topFrame = nextCallStack[nextCallStack.length - 1];
          if (topFrame) {
            topFrame.localVariables[varName] = nextVariables[varName];
          }
        }

        nextActiveConcept = {
          name: 'Object Creation (new)',
          category: 'OOP',
          explanation: `new ${className}() instantiates a new object on the Heap. A reference ${varName ? `to ${varName} ` : ''}is returned pointing to ${className}#${objId.replace(/\D/g, '') || '1'}.`,
          badge: 'Heap Allocation',
          details: { className, objectId: objId, variable: varName },
        };
        explanation = `Allocated new ${className} on Heap (ID: ${objId})${varName ? ` -> ${varName}` : ''}`;
        break;
      }

      case 'CUSTOM_OBJECT_UPDATE':
      case 'OBJECT_FIELD_UPDATE': {
        const objId = ev.objectId || ev.structureId || ev.variable || 'obj';
        const varName = ev.variable || ev.structureId;
        const className = ev.className || (nextCustomObjects[objId]?.className) || 'Object';
        const fieldName = ev.fieldName;
        const rawNewVal = ev.newValue !== undefined ? ev.newValue : ev.value;

        if (!nextCustomObjects[objId]) {
          nextCustomObjects[objId] = {
            id: objId,
            className,
            fields: {},
            creationStep: i + 1,
            lifecycle: 'CREATED',
          };
        }

        if (fieldName) {
          nextCustomObjects[objId].fields[fieldName] = rawNewVal;
        }
        if (ev.fields) {
          Object.assign(nextCustomObjects[objId].fields, ev.fields);
        }
        nextCustomObjects[objId].lifecycle = 'MUTATED';

        if (varName && !nextVariables[varName]) {
          nextVariables[varName] = {
            name: varName,
            type: className,
            value: `${className}@${objId.replace(/\D/g, '') || '1'}`,
            scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
            isReference: true,
            refTargetId: objId,
            estimatedBytes: 8,
          };
        }

        nextActiveConcept = {
          name: 'Field Mutation (Heap)',
          category: 'OOP',
          explanation: `Direct field write${fieldName ? ` (${fieldName} = ${JSON.stringify(rawNewVal)})` : ''} on ${className}#${objId.replace(/\D/g, '') || '1'}. All references pointing to this object observe this change.`,
          badge: 'Heap Mutation',
          details: { objectId: objId, field: fieldName, newValue: rawNewVal },
        };
        explanation = `Field update: ${objId}${fieldName ? `.${fieldName}` : ''} = ${JSON.stringify(rawNewVal)}`;
        break;
      }

      case 'OBJECT_FIELD_READ': {
        const objId = ev.objectId || 'obj';
        const fieldName = ev.fieldName || 'field';
        nextActiveConcept = {
          name: 'Field Dereference',
          category: 'OOP',
          explanation: `Reading field ${fieldName} via reference to ${objId}.`,
          badge: 'Field Read',
          details: { objectId: objId, field: fieldName, value: ev.value },
        };
        explanation = `Read field: ${objId}.${fieldName} => ${JSON.stringify(ev.value)}`;
        break;
      }

      case 'CONSTRUCTOR_CALL': {
        const className = ev.className || ev.dataType || 'Class';
        const fnName = `${className}()`;
        const frameId = `frame-ctor-${className}-${nextCallStack.length}`;
        const newFrame: CallFrame = {
          id: frameId,
          functionName: fnName,
          arguments: ev.arguments || {},
          localVariables: {},
          line: ev.line || currentLine,
          depth: nextCallStack.length + 1,
        };
        nextCallStack.push(newFrame);
        nextActiveConcept = {
          name: 'Constructor Execution',
          category: 'OOP',
          explanation: `Invoking constructor ${className}(). 'this' points to the newly allocated uninitialized instance on the Heap.`,
          badge: 'Constructor',
          details: { className, thisRef: ev.objectId },
        };
        explanation = `Invoked constructor ${className}()`;
        break;
      }

      case 'CONSTRUCTOR_RETURN': {
        if (nextCallStack.length > 1) {
          nextCallStack.pop();
        }
        explanation = `Constructor finished initializing object`;
        break;
      }

      case 'STATIC_FIELD_UPDATE': {
        const cls = ev.className || 'Main';
        const field = ev.fieldName || ev.variable || 'count';
        const val = ev.newValue !== undefined ? ev.newValue : ev.value;
        if (!nextStaticFields[cls]) {
          nextStaticFields[cls] = {};
        }
        nextStaticFields[cls][field] = val;
        nextActiveConcept = {
          name: 'Static / Class Area Variable',
          category: 'MEMORY',
          explanation: `Static field ${cls}.${field} = ${JSON.stringify(val)} stored in Metaspace/Class Area. It belongs to the class itself, not any single heap instance.`,
          badge: 'Static Metaspace',
          details: { class: cls, field, value: val },
        };
        explanation = `Static field updated: ${cls}.${field} = ${JSON.stringify(val)}`;
        break;
      }

      case 'POLYMORPHIC_CALL':
      case 'METHOD_OVERRIDE_CALL': {
        const refType = ev.refType || 'ReferenceType';
        const actualType = ev.actualType || 'ActualClass';
        const method = ev.methodName || ev.resolvedMethod || 'method()';
        nextActiveConcept = {
          name: 'Polymorphism (Dynamic Dispatch)',
          category: 'OOP',
          explanation: `Polymorphic call on reference ${ev.variable || 'obj'} of declared type [${refType}]. JVM resolves method at runtime via virtual table to actual type: [${actualType}.${method}].`,
          badge: 'Dynamic Dispatch',
          details: {
            declaredReferenceType: refType,
            actualRuntimeType: actualType,
            invokedMethod: method,
            resolvedTarget: `${actualType}.${method}`,
          },
        };
        explanation = `Dynamic method dispatch: ${refType} ref -> ${actualType}.${method}`;
        break;
      }

      case 'INSTANCEOF_CHECK': {
        nextActiveConcept = {
          name: 'instanceof Operator',
          category: 'OOP',
          explanation: `Checking if object is an instance of ${ev.refType}. Result: ${ev.instanceOfResult ? 'true' : 'false'}.`,
          badge: 'RTTI',
          details: { target: ev.variable, checkedType: ev.refType, result: ev.instanceOfResult },
        };
        explanation = `Evaluated: ${ev.variable || 'obj'} instanceof ${ev.refType} => ${ev.instanceOfResult}`;
        break;
      }

      case 'CAST_CHECK': {
        nextActiveConcept = {
          name: 'Reference Type Casting',
          category: 'OOP',
          explanation: `Casting reference from declared type [${ev.refType}] to [${ev.actualType}]. ${ev.castSuccess ? 'Cast succeeded (compatible runtime type).' : 'ClassCastException: Incompatible types.'}`,
          badge: 'Type Cast',
          details: { fromType: ev.refType, toType: ev.actualType, success: ev.castSuccess },
        };
        explanation = `Cast: (${ev.actualType}) reference of ${ev.refType}`;
        break;
      }

      case 'TRY_ENTER': {
        nextActiveConcept = {
          name: 'try-catch-finally Block',
          category: 'EXCEPTIONS',
          explanation: 'Entering try block. The JVM monitors this block for abnormal completion to route to matching catch handlers.',
          badge: 'Exception Handling',
        };
        explanation = 'Entered try block';
        break;
      }

      case 'CATCH_ENTER': {
        const exc = ev.dataType || 'Exception';
        nextActiveConcept = {
          name: 'Exception Caught',
          category: 'EXCEPTIONS',
          explanation: `Caught ${exc}${ev.message ? ` ("${ev.message}")` : ''}. Stack unwinding terminated at this handler.`,
          badge: 'Catch Handler',
          details: { exceptionType: exc, message: ev.message },
        };
        explanation = `Caught exception: ${exc} (${ev.message || ''})`;
        break;
      }

      case 'FINALLY_ENTER': {
        nextActiveConcept = {
          name: 'finally Block Execution',
          category: 'EXCEPTIONS',
          explanation: 'Entering finally block. Execution is guaranteed whether an exception was thrown, caught, or normally returned.',
          badge: 'Guaranteed Cleanup',
        };
        explanation = 'Entered finally block (guaranteed execution)';
        break;
      }

      case 'EXCEPTION_THROW': {
        const exc = ev.dataType || 'RuntimeException';
        const msg = ev.message || 'Exception thrown';
        nextError = {
          type: exc,
          message: msg,
          line: ev.line || currentLine,
          detail: `JVM Exception thrown: ${exc} - ${msg}`,
        };
        nextActiveConcept = {
          name: 'Exception Thrown & Stack Unwinding',
          category: 'EXCEPTIONS',
          explanation: `Explicit throw: ${exc} ("${msg}"). The JVM begins unwinding frames from the call stack until a matching catch is reached.`,
          badge: 'Throw',
          details: { exception: exc, message: msg },
        };
        explanation = `Thrown: ${exc} ("${msg}")`;
        break;
      }

      case 'ERROR':
      case 'EXCEPTION': {
        const isNpe =
          (ev.message || '').includes('NullPointer') ||
          (ev.detail || '').includes('NullPointer') ||
          ev.dataType === 'NullPointerException';

        const errType: string = ev.dataType || (isNpe ? 'NullPointerException' : 'RuntimeError');
        const errMessage: string = ev.message || 'Execution error occurred';
        const errDetail: string = ev.detail || (isNpe ? 'Attempted to dereference null reference.' : errMessage);
        const errLine: number = ev.line || currentLine;

        nextError = {
          type: errType,
          message: errMessage,
          line: errLine,
          detail: errDetail,
          brokenReference: isNpe,
          variableName: ev.variable || 'p',
        };
        nextActiveConcept = {
          name: isNpe ? 'NullPointerException (Null Dereference)' : 'JVM Runtime Exception',
          category: 'EXCEPTIONS',
          explanation: isNpe
            ? `Attempted to access field or method on reference '${ev.variable || 'p'}' which is pointing to NULL. The JVM throws NullPointerException.`
            : `JVM runtime exception encountered: ${errMessage}`,
          badge: isNpe ? 'Null Dereference' : 'Runtime Exception',
          details: { errorType: errType, message: errMessage, line: errLine },
        };
        explanation = `Runtime Exception: ${errType} - ${errMessage}`;
        break;
      }

      case 'EXCEPTION_UNWIND': {
        if (nextCallStack.length > 1) {
          const popped = nextCallStack.pop();
          explanation = `Unwound stack frame ${popped?.functionName || ''} due to active exception`;
        }
        break;
      }

      case 'THREAD_START': {
        const tid = ev.threadId || ev.threadName || 'Thread-1';
        const tname = ev.threadName || 'Thread-1';
        nextThreads[tid] = {
          id: tid,
          name: tname,
          state: 'RUNNABLE',
          callStack: [
            {
              id: `frame-${tid}`,
              functionName: 'run',
              arguments: {},
              localVariables: {},
              line: ev.line || currentLine,
              depth: 1,
            },
          ],
        };
        nextActiveConcept = {
          name: 'Multithreading (Thread.start)',
          category: 'CONCURRENCY',
          explanation: `Thread [${tname}] started. The OS and JVM allocate an independent execution thread with its own call stack and program counter.`,
          badge: 'Thread Lifecycle',
          details: { threadId: tid, threadName: tname, state: 'RUNNABLE' },
        };
        explanation = `Spawned thread [${tname}] (State: RUNNABLE)`;
        break;
      }

      case 'THREAD_STATE_CHANGE': {
        const tname = ev.threadName || 'Thread-1';
        const st = (ev.threadState as any) || 'RUNNING';
        const found = Object.values(nextThreads).find(t => t.name === tname || t.id === ev.threadId);
        if (found) {
          found.state = st;
        }
        nextActiveConcept = {
          name: 'Thread State Transition',
          category: 'CONCURRENCY',
          explanation: `Thread [${tname}] transitioned to [${st}].`,
          badge: st,
          details: { threadName: tname, state: st },
        };
        explanation = `Thread [${tname}] is now ${st}`;
        break;
      }

      case 'LOCK_ACQUIRE': {
        const lk = ev.lockName || 'mutex';
        const owner = ev.ownerThread || 'main';
        if (!nextLocks[lk]) {
          nextLocks[lk] = { id: lk, name: lk, ownerThreadId: owner, waitingThreadIds: [] };
        } else {
          nextLocks[lk].ownerThreadId = owner;
          nextLocks[lk].waitingThreadIds = nextLocks[lk].waitingThreadIds.filter(id => id !== owner);
        }
        nextActiveConcept = {
          name: 'Intrinsic Lock (synchronized)',
          category: 'CONCURRENCY',
          explanation: `Thread [${owner}] acquired intrinsic monitor lock on [${lk}]. Entered synchronized critical section.`,
          badge: 'Lock Acquired',
          details: { lock: lk, owner },
        };
        explanation = `Lock [${lk}] acquired by [${owner}]`;
        break;
      }

      case 'LOCK_RELEASE': {
        const lk = ev.lockName || 'mutex';
        const owner = ev.ownerThread || 'main';
        if (nextLocks[lk]) {
          nextLocks[lk].ownerThreadId = null;
        }
        nextActiveConcept = {
          name: 'Lock Release',
          category: 'CONCURRENCY',
          explanation: `Thread [${owner}] exited synchronized block and released lock on [${lk}].`,
          badge: 'Lock Released',
          details: { lock: lk, owner },
        };
        explanation = `Lock [${lk}] released by [${owner}]`;
        break;
      }

      case 'LOCK_WAIT': {
        const lk = ev.lockName || 'mutex';
        const tname = ev.threadName || 'Thread-2';
        if (!nextLocks[lk]) {
          nextLocks[lk] = { id: lk, name: lk, ownerThreadId: null, waitingThreadIds: [tname] };
        } else if (!nextLocks[lk].waitingThreadIds.includes(tname)) {
          nextLocks[lk].waitingThreadIds.push(tname);
        }
        const th = Object.values(nextThreads).find(t => t.name === tname);
        if (th) th.state = 'BLOCKED';
        nextActiveConcept = {
          name: 'Lock Contention (BLOCKED)',
          category: 'CONCURRENCY',
          explanation: `Thread [${tname}] attempted to enter synchronized block guarded by [${lk}], but lock is held by [${nextLocks[lk].ownerThreadId || 'another thread'}]. Thread is BLOCKED.`,
          badge: 'Lock Contention',
          details: { lock: lk, waitingThread: tname, heldBy: nextLocks[lk].ownerThreadId },
        };
        explanation = `Thread [${tname}] BLOCKED waiting for lock [${lk}]`;
        break;
      }

      case 'DEADLOCK_DETECTED': {
        nextDeadlock = true;
        nextActiveConcept = {
          name: 'Deadlock Detected',
          category: 'CONCURRENCY',
          explanation: `Deadlock Condition! Circular lock dependency detected. Neither thread can proceed: ${ev.detail || 'Circular wait'}`,
          badge: 'POSSIBLE DEADLOCK',
          details: { detail: ev.detail },
        };
        explanation = `DEADLOCK DETECTED: ${ev.detail || 'Circular lock dependency'}`;
        break;
      }

      case 'BOXING_OP': {
        nextActiveConcept = {
          name: 'Autoboxing (Primitive -> Wrapper)',
          category: 'MODERN_JAVA',
          explanation: `Java compiler automatically boxes primitive '${ev.dataType}' into '${ev.refType}' wrapper object on the heap via ${ev.refType}.valueOf().`,
          badge: 'Autoboxing',
          details: { from: ev.dataType, to: ev.refType, value: ev.value },
        };
        explanation = `Autoboxing: primitive ${ev.dataType} -> ${ev.refType}`;
        break;
      }

      case 'UNBOXING_OP': {
        nextActiveConcept = {
          name: 'Unboxing (Wrapper -> Primitive)',
          category: 'MODERN_JAVA',
          explanation: `Java compiler unboxes wrapper object '${ev.refType}' to primitive '${ev.dataType}'.`,
          badge: 'Unboxing',
          details: { from: ev.refType, to: ev.dataType, value: ev.value },
        };
        explanation = `Unboxing: ${ev.refType} -> primitive ${ev.dataType}`;
        break;
      }

      case 'STRING_POOL_INTERN': {
        const strVal = String(ev.value || '');
        let poolEntry = nextStringPool.find(sp => sp.value === strVal);
        if (!poolEntry) {
          poolEntry = { value: strVal, references: [] };
          nextStringPool.push(poolEntry);
        }
        if (ev.variable && !poolEntry.references.includes(ev.variable)) {
          poolEntry.references.push(ev.variable);
        }
        nextActiveConcept = {
          name: 'String Constant Pool (Conceptual JVM View)',
          category: 'MEMORY',
          explanation: `String literal "${strVal}" is deduplicated in the String Constant Pool. Multiple references to identical literals share the same immutable string instance.`,
          badge: 'String Pool',
          details: { value: strVal, references: poolEntry.references },
        };
        explanation = `String literal "${strVal}" referenced in String Pool`;
        break;
      }

      case 'STREAM_PIPELINE_STEP': {
        nextActiveConcept = {
          name: 'Stream Pipeline Step',
          category: 'MODERN_JAVA',
          explanation: `Stream intermediate/terminal operation: .${ev.streamOp || 'step'}() processed ${JSON.stringify(ev.value)} => ${JSON.stringify(ev.newValue)}.`,
          badge: `Stream .${ev.streamOp || 'op'}()`,
          details: { operation: ev.streamOp, input: ev.value, output: ev.newValue },
        };
        explanation = `Stream .${ev.streamOp || 'operation'}: ${JSON.stringify(ev.value)} -> ${JSON.stringify(ev.newValue)}`;
        break;
      }

      case 'LINKED_LIST_UPDATE': {
        const stId = ev.structureId || ev.variable || 'list';
        const headId = ev.headId || null;
        const nodes: Record<string, LinkedListNode> = (ev.nodes as any) || {};
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'linkedlist',
          dataType: 'LinkedList (Custom)',
          size: Object.keys(nodes).length,
          linkedListData: {
            headId,
            nodes,
          },
          lastOperation: `Updated custom linked list ${stId}`,
        };
        explanation = `Custom LinkedList ${stId}: ${Object.keys(nodes).length} nodes`;
        break;
      }

      case 'TREE_UPDATE': {
        const stId = ev.structureId || ev.variable || 'tree';
        const rootId = ev.rootId || null;
        const nodes: Record<string, TreeNodeData> = (ev.nodes as any) || {};
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'tree',
          dataType: 'BinaryTree (Custom)',
          size: Object.keys(nodes).length,
          treeData: {
            rootId,
            nodes,
          },
          lastOperation: `Updated custom binary tree ${stId}`,
        };
        explanation = `Custom Binary Tree ${stId}: ${Object.keys(nodes).length} nodes`;
        break;
      }

      // === PHASE 8: DSU / DISJOINT SET UNION ===
      case 'DSU_INIT': {
        const dsuId = ev.structureId || ev.variable || 'dsu';
        const parents = ev.meta?.parents || {};
        const ranks = ev.meta?.ranks || {};
        nextStructures[dsuId] = {
          id: dsuId,
          name: ev.variable || dsuId,
          type: 'dsu',
          dataType: 'DisjointSet (Union-Find)',
          size: Object.keys(parents).length,
          dsuData: {
            parents,
            ranks,
            lastAction: `Initialized DSU with ${Object.keys(parents).length} elements`,
          },
          lastOperation: `DSU initialized`,
        };
        nextAlgorithmState.category = 'Advanced Data Structure';
        nextAlgorithmState.algorithmName = 'Disjoint Set Union (DSU)';
        nextAlgorithmState.dsuParents = parents;
        nextAlgorithmState.dsuRanks = ranks;
        explanation = `Initialized Disjoint Set Union (${Object.keys(parents).length} elements)`;
        break;
      }

      case 'DSU_FIND': {
        const dsuId = ev.structureId || ev.variable || 'dsu';
        const st = nextStructures[dsuId];
        const u = ev.meta?.node;
        const root = ev.meta?.root;
        const path = ev.meta?.path || [];
        if (st && st.dsuData) {
          nextStructures[dsuId] = {
            ...st,
            dsuData: {
              ...st.dsuData,
              parents: { ...st.dsuData.parents },
              ranks: st.dsuData.ranks ? { ...st.dsuData.ranks } : undefined,
              activeSet1: String(u),
              pathCompressed: path.map(String),
              lastAction: `Find(${u}) ➔ Root ${root} (Path compressed: [${path.join(' ➔ ')}])`,
            },
          };
        }
        nextAlgorithmState.dsuOperation = 'FIND';
        nextAlgorithmState.dsuCompressedNodes = path;
        explanation = `DSU Find(${u}) traversed to root ${root} with path compression`;
        break;
      }

      case 'DSU_UNION': {
        const dsuId = ev.structureId || ev.variable || 'dsu';
        const st = nextStructures[dsuId];
        const u = ev.meta?.u;
        const v = ev.meta?.v;
        const rootU = ev.meta?.rootU;
        const rootV = ev.meta?.rootV;
        if (st && st.dsuData) {
          const nextParents = { ...st.dsuData.parents };
          if (rootU !== undefined && rootV !== undefined) {
            nextParents[String(rootV)] = String(rootU);
          }
          nextStructures[dsuId] = {
            ...st,
            dsuData: {
              ...st.dsuData,
              parents: nextParents,
              ranks: st.dsuData.ranks ? { ...st.dsuData.ranks } : undefined,
              activeSet1: String(u),
              activeSet2: String(v),
              lastAction: `Union(${u}, ${v}) ➔ Attached root ${rootV} to root ${rootU}`,
            },
          };
        }
        nextAlgorithmState.dsuOperation = 'UNION';
        explanation = `DSU Union: merged set of ${u} (root ${rootU}) with set of ${v} (root ${rootV})`;
        break;
      }

      // === PHASE 8: STRINGS & PATTERN MATCHING ===
      case 'STRING_TRAVERSE': {
        const strId = ev.structureId || ev.variable || 'str';
        const text = ev.meta?.text || '';
        const idx = typeof ev.index === 'number' ? ev.index : (Array.isArray(ev.index) ? ev.index[0] : 0);
        nextStructures[strId] = {
          id: strId,
          name: ev.variable || strId,
          type: 'string',
          dataType: 'String',
          size: text.length,
          stringData: {
            text,
            activeIndex: idx,
            frequencies: nextAlgorithmState.charFrequencies,
          },
          lastOperation: `Char at index ${idx}: '${text[idx] || ''}'`,
        };
        nextAlgorithmState.category = 'String Algorithm';
        nextAlgorithmState.stringText = text;
        nextAlgorithmState.stringI = idx;
        explanation = `Inspected character '${text[idx] || ''}' at index ${idx} of "${text}"`;
        break;
      }

      case 'STRING_COMPARE': {
        nextMetrics.comparisons++;
        const iIdx = Number(ev.indices?.[0] ?? 0);
        const jIdx = Number(ev.indices?.[1] ?? 0);
        const match = !!ev.conditionResult;
        const tChar = ev.meta?.textChar || '';
        const pChar = ev.meta?.patternChar || '';
        nextComparison = {
          left: `'${tChar}' (idx ${iIdx})`,
          right: `'${pChar}' (idx ${jIdx})`,
          operator: '==',
          result: match,
          explanation: match ? `Characters match ('${tChar}' == '${pChar}')` : `Mismatch ('${tChar}' != '${pChar}')`,
        };
        explanation = `Compared text[${iIdx}] '${tChar}' with pattern[${jIdx}] '${pChar}': ${match ? 'MATCH' : 'MISMATCH'}`;
        break;
      }

      case 'KMP_LPS_UPDATE': {
        const lpsVals = Array.isArray(ev.values) ? ev.values : [];
        nextAlgorithmState.category = 'String Algorithm';
        nextAlgorithmState.algorithmName = 'KMP Pattern Matching';
        nextAlgorithmState.kmpLps = lpsVals;
        explanation = `Constructed KMP LPS Array: [${lpsVals.join(', ')}]`;
        break;
      }

      case 'KMP_STEP': {
        nextMetrics.comparisons++;
        const iIdx = Number(ev.indices?.[0] ?? 0);
        const jIdx = Number(ev.indices?.[1] ?? 0);
        const match = !!ev.conditionResult;
        nextAlgorithmState.category = 'String Algorithm';
        nextAlgorithmState.algorithmName = 'KMP Pattern Matching';
        nextAlgorithmState.stringI = iIdx;
        nextAlgorithmState.stringJ = jIdx;
        explanation = `KMP comparing text[${iIdx}] with pattern[${jIdx}]: ${match ? 'MATCH (advance both pointers)' : 'MISMATCH'}`;
        break;
      }

      case 'KMP_FALLBACK': {
        const oldJ = Number(ev.fromIndex ?? 0);
        const newJ = Number(ev.toIndex ?? 0);
        nextAlgorithmState.kmpFallback = { from: oldJ, to: newJ };
        nextAlgorithmState.stringJ = newJ;
        explanation = `KMP Mismatch fallback: reset pattern pointer j from ${oldJ} ➔ LPS[${oldJ - 1}] = ${newJ}`;
        break;
      }

      case 'KMP_MATCH': {
        nextAlgorithmState.status = 'PATTERN_FOUND';
        explanation = `KMP Pattern match found at index ${ev.index}!`;
        break;
      }

      case 'RABIN_KARP_HASH': {
        nextMetrics.comparisons++;
        const start = typeof ev.index === 'number' ? ev.index : (Array.isArray(ev.index) ? ev.index[0] : 0);
        const pHash = ev.meta?.patternHash;
        const wHash = ev.meta?.windowHash;
        const match = !!ev.conditionResult;
        nextAlgorithmState.category = 'String Algorithm';
        nextAlgorithmState.algorithmName = 'Rabin-Karp String Match';
        nextAlgorithmState.rabinPatternHash = pHash;
        nextAlgorithmState.rabinWindowHash = wHash;
        nextAlgorithmState.rabinWindowStart = start;
        nextAlgorithmState.rabinMatched = match;
        explanation = `Rabin-Karp window [${start}..] hash (${wHash}) vs pattern hash (${pHash}): ${match ? 'HASH MATCH ➔ verifying characters' : 'NO MATCH'}`;
        break;
      }

      case 'CHAR_FREQUENCY_UPDATE': {
        const freqs = ev.meta?.frequencies || {};
        nextAlgorithmState.charFrequencies = freqs;
        explanation = `Updated character frequency map: ${JSON.stringify(freqs)}`;
        break;
      }

      case 'ANAGRAM_CHECK': {
        nextAlgorithmState.category = 'String Algorithm';
        nextAlgorithmState.algorithmName = 'Anagram Verification';
        explanation = `Checked character balance for anagram: ${ev.message || 'comparing frequency maps'}`;
        break;
      }

      // === PHASE 8: BIT MANIPULATION ===
      case 'BIT_OP_EXECUTE': {
        nextMetrics.accesses += 2;
        const varName = ev.variable || 'bits';
        const a = ev.meta?.operandA ?? 0;
        const b = ev.meta?.operandB ?? 0;
        const op = ev.meta?.operator || '&';
        const res = ev.meta?.result ?? 0;
        nextStructures[varName] = {
          id: varName,
          name: varName,
          type: 'bits',
          dataType: 'int (Binary Register)',
          size: 32,
          bitData: {
            operandA: a,
            operandB: b,
            operator: op,
            result: res,
            bitSize: 32,
            explanation: `${a} ${op} ${b} = ${res} (0b${(res >>> 0).toString(2).padStart(8, '0')})`,
          },
          lastOperation: `${a} ${op} ${b} = ${res}`,
        };
        nextAlgorithmState.category = 'Bit Manipulation';
        nextAlgorithmState.algorithmName = 'Bitwise Operations';
        nextAlgorithmState.bitOperandA = a;
        nextAlgorithmState.bitOperandB = b;
        nextAlgorithmState.bitOperator = op;
        nextAlgorithmState.bitResult = res;
        explanation = `Bitwise Operation: ${a} (${(a >>> 0).toString(2).padStart(8, '0')}) ${op} ${b} (${(b >>> 0).toString(2).padStart(8, '0')}) = ${res} (${(res >>> 0).toString(2).padStart(8, '0')})`;
        break;
      }

      case 'BIT_SHIFT': {
        const varName = ev.variable || 'bits';
        const a = ev.meta?.operandA ?? 0;
        const shift = ev.meta?.shift ?? 1;
        const op = ev.meta?.operator || '<<';
        const res = ev.meta?.result ?? 0;
        nextStructures[varName] = {
          id: varName,
          name: varName,
          type: 'bits',
          dataType: 'int (Binary Register)',
          size: 32,
          bitData: {
            operandA: a,
            operandB: shift,
            operator: op,
            result: res,
            bitSize: 32,
            explanation: `${a} ${op} ${shift} = ${res}`,
          },
          lastOperation: `${a} ${op} ${shift} = ${res}`,
        };
        nextAlgorithmState.category = 'Bit Manipulation';
        nextAlgorithmState.bitOperandA = a;
        nextAlgorithmState.bitOperator = op;
        nextAlgorithmState.bitResult = res;
        explanation = `Bit Shift: ${a} ${op} ${shift} = ${res} (0b${(res >>> 0).toString(2).padStart(8, '0')})`;
        break;
      }

      case 'BIT_CHECK':
      case 'BIT_SET':
      case 'BIT_CLEAR':
      case 'BIT_TOGGLE':
      case 'BIT_COUNT':
      case 'BIT_POWER_OF_TWO': {
        const opName = ev.type.replace('BIT_', '');
        const val = ev.meta?.val ?? 0;
        const k = ev.meta?.k ?? 0;
        const res = ev.meta?.result;
        nextAlgorithmState.category = 'Bit Manipulation';
        nextAlgorithmState.algorithmName = `Bit ${opName}`;
        nextAlgorithmState.bitIndexTarget = k;
        nextAlgorithmState.bitResult = res;
        explanation = `Bit ${opName}: on value ${val} at bit index ${k} ➔ Result: ${res}`;
        break;
      }

      // === PHASE 8: NUMBER ALGORITHMS ===
      case 'GCD_STEP': {
        nextMetrics.accesses += 2;
        const a = ev.meta?.a ?? 0;
        const b = ev.meta?.b ?? 0;
        const rem = ev.meta?.remainder ?? 0;
        const stepEntry = { a, b, remainder: rem };
        const existingSteps = nextAlgorithmState.gcdSteps ? [...nextAlgorithmState.gcdSteps, stepEntry] : [stepEntry];
        nextAlgorithmState.category = 'Number Algorithm';
        nextAlgorithmState.algorithmName = "Euclidean GCD";
        nextAlgorithmState.numberA = a;
        nextAlgorithmState.numberB = b;
        nextAlgorithmState.gcdRemainder = rem;
        nextAlgorithmState.gcdSteps = existingSteps;
        nextStructures['gcd'] = {
          id: 'gcd',
          name: 'GCD (Euclid)',
          type: 'number',
          dataType: 'Number Theory',
          size: existingSteps.length,
          numberData: {
            type: 'GCD',
            a,
            b,
            gcdSteps: existingSteps,
          },
          lastOperation: `${a} % ${b} = ${rem}`,
        };
        explanation = `Euclid's GCD: ${a} % ${b} = ${rem}${rem === 0 ? ` ➔ GCD is ${b}!` : ` ➔ next gcd(${b}, ${rem})`}`;
        break;
      }

      case 'SIEVE_START': {
        const maxN = ev.meta?.maxN ?? 10;
        let grid = Array.isArray(ev.values) ? [...ev.values] : [];
        if (grid.length === 0) {
          grid = new Array(maxN + 1).fill(true);
          if (grid.length > 0) grid[0] = false;
          if (grid.length > 1) grid[1] = false;
        }
        nextAlgorithmState.category = 'Number Algorithm';
        nextAlgorithmState.algorithmName = 'Sieve of Eratosthenes';
        nextAlgorithmState.sievePrimes = grid;
        nextStructures['sieve'] = {
          id: 'sieve',
          name: 'Sieve of Eratosthenes',
          type: 'number',
          dataType: 'Prime Sieve',
          size: grid.length,
          numberData: {
            type: 'SIEVE',
            sieveGrid: grid,
          },
          lastOperation: `Initialized Sieve up to ${grid.length - 1}`,
        };
        explanation = `Initialized Sieve of Eratosthenes up to N = ${grid.length - 1}`;
        break;
      }

      case 'SIEVE_COMPOSITE_CROSS': {
        const p = ev.meta?.prime ?? 2;
        const comp = ev.meta?.composite ?? (ev.index ?? 0);
        const existingCrossed = nextAlgorithmState.sieveCrossedIndices ? [...nextAlgorithmState.sieveCrossedIndices, comp] : [comp];
        nextAlgorithmState.sieveCurrentP = p;
        nextAlgorithmState.sieveCrossedIndices = existingCrossed;
        if (nextStructures['sieve'] && nextStructures['sieve'].numberData) {
          const nextGrid = nextStructures['sieve'].numberData.sieveGrid ? [...nextStructures['sieve'].numberData.sieveGrid] : [];
          if (comp < nextGrid.length) {
            nextGrid[comp] = false;
          }
          nextStructures['sieve'] = {
            ...nextStructures['sieve'],
            numberData: {
              ...nextStructures['sieve'].numberData,
              currentP: p,
              crossedIndex: comp,
              sieveGrid: nextGrid,
            },
          };
        }
        explanation = `Sieve: crossed out composite ${comp} (multiple of prime ${p})`;
        break;
      }

      case 'FAST_POWER_STEP': {
        const base = ev.meta?.base ?? 1;
        const exp = ev.meta?.exp ?? 0;
        const res = ev.meta?.result ?? 1;
        const binStr = (exp).toString(2);
        const stepItem = { expBinary: binStr, bit: exp & 1, base, currentResult: res };
        const steps = nextAlgorithmState.fastPowerSteps ? [...nextAlgorithmState.fastPowerSteps, stepItem] : [stepItem];
        nextAlgorithmState.category = 'Number Algorithm';
        nextAlgorithmState.algorithmName = 'Binary Exponentiation (Fast Power)';
        nextAlgorithmState.fastPowerBase = base;
        nextAlgorithmState.fastPowerExponent = exp;
        nextAlgorithmState.fastPowerResult = res;
        nextAlgorithmState.fastPowerSteps = steps;
        nextStructures['fast_power'] = {
          id: 'fast_power',
          name: 'Fast Exponentiation',
          type: 'number',
          dataType: 'Binary Power',
          size: steps.length,
          numberData: {
            type: 'FAST_POWER',
            powerBase: base,
            powerExp: exp,
            powerResult: res,
            powerBinaryExp: binStr,
          },
          lastOperation: `exp=${exp} (bit ${exp & 1}) ➔ result=${res}`,
        };
        explanation = `Binary Exponentiation: exp=${exp} (bit=${exp & 1}), base squared ➔ result accumulator = ${res}`;
        break;
      }

      // === PHASE 8: SEGMENT TREE & FENWICK TREE ===
      case 'SEG_TREE_UPDATE': {
        const stName = ev.structureId || 'segTree';
        const idx = ev.index ?? 0;
        const val = ev.newValue;
        const l = ev.rangeStart ?? 0;
        const r = ev.rangeEnd ?? 0;
        nextStructures[stName] = {
          id: stName,
          name: stName,
          type: 'segmenttree',
          dataType: 'SegmentTree (Interval)',
          segmentTreeData: {
            array: [],
            intervals: [
              { id: 'root', left: l, right: r, value: val }
            ],
            activeRange: [l, r],
            lastAction: `Updated segment [${l}..${r}] index ${idx} = ${val}`,
          },
          lastOperation: `SegmentTree update [${l}..${r}] = ${val}`,
        };
        nextAlgorithmState.category = 'Advanced Data Structure';
        nextAlgorithmState.algorithmName = 'Segment Tree';
        nextAlgorithmState.segActiveInterval = [l, r];
        explanation = `Segment Tree updated interval [${l}..${r}] for point ${idx} to value ${val}`;
        break;
      }

      case 'FENWICK_UPDATE': {
        const stName = ev.structureId || 'fenwick';
        const idx = typeof ev.index === 'number' ? ev.index : (Array.isArray(ev.index) ? ev.index[0] : 0);
        const delta = ev.newValue ?? 0;
        const existingArr = nextAlgorithmState.fenwickArray ? [...nextAlgorithmState.fenwickArray] : [];
        if (idx >= existingArr.length) {
          while (existingArr.length <= idx) existingArr.push(0);
        }
        existingArr[idx] = (existingArr[idx] || 0) + delta;
        nextStructures[stName] = {
          id: stName,
          name: stName,
          type: 'fenwick',
          dataType: 'Binary Indexed Tree (Fenwick)',
          fenwickData: {
            treeArray: existingArr,
            size: existingArr.length,
            activeIndex: idx,
            operation: 'UPDATE',
            lastAction: `Add delta ${delta} to index ${idx} (next: ${idx + (idx & -idx)})`,
          },
          lastOperation: `Fenwick update idx ${idx} += ${delta}`,
        };
        nextAlgorithmState.category = 'Advanced Data Structure';
        nextAlgorithmState.algorithmName = 'Fenwick Tree (BIT)';
        nextAlgorithmState.fenwickArray = existingArr;
        nextAlgorithmState.fenwickActiveIndex = idx;
        explanation = `Fenwick Tree update: added ${delta} at index ${idx} (navigating i += i & -i)`;
        break;
      }

      case 'FENWICK_QUERY': {
        const idx = typeof ev.index === 'number' ? ev.index : (Array.isArray(ev.index) ? ev.index[0] : 0);
        const sum = ev.value ?? 0;
        nextAlgorithmState.category = 'Advanced Data Structure';
        nextAlgorithmState.algorithmName = 'Fenwick Tree (BIT)';
        nextAlgorithmState.fenwickActiveIndex = idx;
        nextAlgorithmState.fenwickPrefixSum = sum;
        explanation = `Fenwick Tree prefix query: index ${idx} running prefix sum = ${sum}`;
        break;
      }

      case 'LCA_FOUND': {
        nextAlgorithmState.category = 'Advanced Tree';
        nextAlgorithmState.algorithmName = 'Lowest Common Ancestor (LCA)';
        nextAlgorithmState.lcaResult = String(ev.value);
        explanation = `Lowest Common Ancestor (LCA) identified: Node ${ev.value}`;
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
        if (ev.objectId) {
          (nextStructures[arrId] as any).objectId = ev.objectId;
        }

        const varName = ev.variable || arrId;
        nextVariables[varName] = {
          name: varName,
          type: 'int[]',
          value: `[${arrVals.join(', ')}]`,
          scope: 'main',
          isReference: true,
          refTargetId: ev.objectId || arrId,
          objectId: ev.objectId,
          estimatedBytes: 16 + arrVals.length * 4,
        };
        if (ev.variable && ev.variable !== arrId) {
          nextVariables[arrId] = {
            ...nextVariables[varName],
            name: arrId,
          };
        }

        explanation = `Initialized array ${arrId} with elements [${arrVals.join(', ')}]`;
        break;
      }

      case 'ARRAY_UPDATE': {
        nextMetrics.assignments++;
        nextMetrics.accesses += 2;
        const arrId = ev.structureId || ev.arrayId || 'arr';
        const st = nextStructures[arrId];
        const targetObjId = ev.objectId || (st as any)?.objectId || nextVariables[arrId]?.refTargetId;
        if (st && st.arrayData && typeof ev.index === 'number') {
          const nextArr = [...st.arrayData];
          nextArr[ev.index] = ev.newValue;
          st.arrayData = nextArr;
          st.activeIndices = [ev.index];
          st.lastOperation = `${arrId}[${ev.index}] = ${ev.newValue}`;

          // Propagate mutation to all other array structures aliasing the same heap object
          for (const sKey of Object.keys(nextStructures)) {
            const otherSt = nextStructures[sKey];
            if (otherSt !== st && otherSt.type === 'array') {
              const otherObjId = (otherSt as any)?.objectId || nextVariables[otherSt.id]?.refTargetId;
              if (targetObjId && otherObjId && otherObjId === targetObjId) {
                otherSt.arrayData = nextArr;
                otherSt.activeIndices = [ev.index];
                otherSt.lastOperation = `${arrId}[${ev.index}] = ${ev.newValue}`;
              }
            }
          }

          const updatedArrStr = `[${nextArr.join(', ')}]`;
          for (const vKey of Object.keys(nextVariables)) {
            const v = nextVariables[vKey];
            if (
              v.name === arrId ||
              v.refTargetId === arrId ||
              v.refTargetId === st.id ||
              (st.id && v.refTargetId === `@${st.id}`) ||
              (targetObjId && v.refTargetId === targetObjId) ||
              (targetObjId && (v as any).objectId === targetObjId)
            ) {
              nextVariables[vKey] = {
                ...v,
                value: updatedArrStr,
              };
            }
          }
        }
        explanation = `Mutated ${arrId}[${ev.index}] from ${ev.oldValue} to ${ev.newValue}`;
        break;
      }

      case 'ARRAY_ACCESS': {
        nextMetrics.accesses++;
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
          rowLabels: ev.rowLabels || (nextAlgorithmState.lcsStringA ? ['Ø', ...nextAlgorithmState.lcsStringA.split('')] : undefined),
          colLabels: ev.colLabels || (nextAlgorithmState.lcsStringB ? ['Ø', ...nextAlgorithmState.lcsStringB.split('')] : undefined),
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
        nextMetrics.assignments++;
        nextMetrics.accesses += 2;
        const matId = ev.structureId || ev.variable || 'matrix';
        const st = nextStructures[matId];
        const r = ev.row ?? 0;
        const c = ev.col ?? 0;
        if (st && st.matrixData) {
          if (!st.matrixData[r]) st.matrixData[r] = [];
          st.matrixData[r][c] = ev.newValue;
          st.lastUpdatedStep = ev.step || 0;
          st.lastOperation = `${matId}[${r}][${c}] = ${ev.newValue}`;
          st.activeCell = [r, c];
          st.lastUpdatedCell = [r, c];

          const rawDeps = (ev as any).dependencyCells || (ev as any).dependencies;
          if (rawDeps && Array.isArray(rawDeps)) {
            st.dependencyCells = rawDeps;
          } else if (nextAlgorithmState.dpPreviousCells && nextAlgorithmState.dpPreviousCells.length > 0) {
            st.dependencyCells = [...nextAlgorithmState.dpPreviousCells];
          } else if (r > 0 && c > 0) {
            if (nextAlgorithmState.lcsStringA && nextAlgorithmState.lcsStringB) {
              const chA = nextAlgorithmState.lcsStringA.charAt(r - 1);
              const chB = nextAlgorithmState.lcsStringB.charAt(c - 1);
              if (chA === chB) {
                st.dependencyCells = [[r - 1, c - 1]];
                st.cellExplanation = `Matched '${chA}' == '${chB}': dp[${r}][${c}] = dp[${r - 1}][${c - 1}] + 1`;
              } else {
                st.dependencyCells = [[r - 1, c], [r, c - 1]];
                st.cellExplanation = `Mismatch '${chA}' != '${chB}': dp[${r}][${c}] = Max(dp[${r - 1}][${c}], dp[${r}][${c - 1}])`;
              }
            } else {
              st.dependencyCells = [[r - 1, c], [r, c - 1]];
              st.cellExplanation = `Cell dp[${r}][${c}] derived from top [${r - 1}, ${c}] and left [${r}, ${c - 1}]`;
            }
          } else if (r > 0) {
            st.dependencyCells = [[r - 1, c]];
            st.cellExplanation = `Cell dp[${r}][${c}] derived from top [${r - 1}, ${c}]`;
          } else if (c > 0) {
            st.dependencyCells = [[r, c - 1]];
            st.cellExplanation = `Cell dp[${r}][${c}] derived from left [${r}, ${c - 1}]`;
          }
        }
        explanation = `Updated matrix ${matId}[${r}][${c}] from ${ev.oldValue} to ${ev.newValue}`;
        break;
      }

      case 'MATRIX_ACCESS': {
        nextMetrics.accesses++;
        const matId = ev.structureId || ev.variable || 'matrix';
        const st = nextStructures[matId];
        const r = ev.row ?? 0;
        const c = ev.col ?? 0;
        if (st) {
          st.activeCell = [r, c];
        }
        explanation = `Read matrix ${matId}[${r}][${c}] = ${ev.value}`;
        break;
      }

      // === STACK ===
      case 'STACK_CREATE': {
        const sVals = Array.isArray(ev.values) ? [...ev.values] : [];
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'stack',
          dataType: ev.dataType || 'Stack<Integer>',
          stackData: sVals,
          size: ev.size ?? sVals.length,
          lastOperation: sVals.length > 0 ? `Stack (${sVals.length} items)` : 'new Stack<>()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'Stack<Integer>',
          value: `size = ${sVals.length}`,
          scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32 + sVals.length * 8,
        };
        explanation = `Stack ${stId}: size = ${sVals.length}`;
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
        const qVals = Array.isArray(ev.values) ? [...ev.values] : [];
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'queue',
          dataType: ev.dataType || 'Queue<Integer>',
          queueData: qVals,
          size: ev.size ?? qVals.length,
          lastOperation: qVals.length > 0 ? `Queue (${qVals.length} items)` : 'new LinkedList<>()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'Queue<Integer>',
          value: `size = ${qVals.length}`,
          scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32 + qVals.length * 8,
        };
        explanation = `Queue ${stId}: size = ${qVals.length}`;
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

      case 'MAP_UPDATE': {
        const rawEntries = Array.isArray(ev.entries) ? ev.entries : [];
        const entries = rawEntries.map((e: any) => {
          const hash = Math.abs(String(e.key).split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0));
          const bucket = Math.abs(hash % 8);
          return {
            key: e.key,
            value: e.value,
            hash,
            bucket,
          };
        });
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'map',
          dataType: ev.dataType || 'HashMap',
          size: ev.size ?? entries.length,
          mapData: {
            entries,
            bucketCount: 8,
          },
          lastOperation: `Updated map (size ${entries.length})`,
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'HashMap',
          value: `size = ${entries.length}`,
          scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
          isReference: true,
          refTargetId: ev.objectId || stId,
          estimatedBytes: 48 + entries.length * 32,
        };
        explanation = `Updated HashMap ${stId} (${entries.length} entries)`;
        break;
      }

      // === HASHSET ===
      case 'SET_CREATE': {
        const setVals = Array.isArray(ev.values) ? [...ev.values] : [];
        nextStructures[stId] = {
          id: stId,
          name: ev.variable || stId,
          type: 'set',
          dataType: ev.dataType || 'HashSet<Integer>',
          setData: setVals,
          size: ev.size ?? setVals.length,
          lastOperation: setVals.length > 0 ? `HashSet (${setVals.length} items)` : 'new HashSet<>()',
        };
        nextVariables[stId] = {
          name: stId,
          type: ev.dataType || 'HashSet<Integer>',
          value: `size = ${setVals.length}`,
          scope: nextCallStack[nextCallStack.length - 1]?.functionName || 'main',
          isReference: true,
          refTargetId: stId,
          estimatedBytes: 32 + setVals.length * 8,
        };
        explanation = `HashSet ${stId}: size = ${setVals.length}`;
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
        nextMetrics.comparisons++;
        nextMetrics.accesses++;
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
        nextMetrics.functionCalls++;
        const fnName = ev.functionName || 'function';
        if (nextCallStack.some((f) => f.functionName === fnName)) {
          nextMetrics.recursiveCalls++;
        }
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
        nextMetrics.accesses += 2;
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
        nextMetrics.accesses += 2;
        nextMetrics.assignments += 2;
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
        nextMetrics.accesses += 2;
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

      // === PHASE 6: ADVANCED ALGORITHMS ===
      // --- Bellman-Ford ---
      case 'BELLMAN_FORD_START': {
        nextAlgorithmState.algorithmName = 'Bellman-Ford';
        nextAlgorithmState.category = 'Advanced Graph';
        nextAlgorithmState.bellmanDistances = {};
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData && g.graphData.nodes) {
          for (const nid of Object.keys(g.graphData.nodes)) {
            nextAlgorithmState.bellmanDistances[nid] = (nid === ev.startNodeId) ? 0 : 'Infinity';
            g.graphData.nodes[nid].distance = (nid === ev.startNodeId) ? 0 : 'Infinity';
          }
        } else if (ev.startNodeId) {
          nextAlgorithmState.bellmanDistances[ev.startNodeId] = 0;
        }
        nextAlgorithmState.negativeCycleDetected = false;
        nextAlgorithmState.theoreticalComplexity = { time: 'O(V * E)', space: 'O(V)' };
        explanation = `Started Bellman-Ford algorithm from source node: ${ev.startNodeId || 'start'}`;
        break;
      }

      case 'BELLMAN_FORD_PASS_START': {
        nextAlgorithmState.bellmanPass = ev.pass;
        nextAlgorithmState.bellmanTotalPasses = ev.totalPasses;
        explanation = `Bellman-Ford: Starting relaxation pass ${ev.pass} of ${ev.totalPasses}`;
        break;
      }

      case 'BELLMAN_FORD_EDGE_RELAX': {
        nextAlgorithmState.bellmanCurrentEdge = { from: ev.sourceNodeId!, to: ev.targetNodeId!, weight: ev.weight || 0 };
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData) {
          for (const e of Object.values(g.graphData.edges)) {
            if (e.source === ev.sourceNodeId && e.target === ev.targetNodeId) {
              e.state = 'ACTIVE';
            }
          }
        }
        explanation = `Evaluating edge ${ev.sourceNodeId} ➔ ${ev.targetNodeId} (weight: ${ev.weight})`;
        break;
      }

      case 'BELLMAN_FORD_COMPARE': {
        nextMetrics.comparisons++;
        nextComparison = {
          left: `dist[${ev.sourceNodeId}] + ${ev.weight ?? ''} = ${ev.candidateDistance}`,
          right: `dist[${ev.targetNodeId}] = ${ev.oldDistance}`,
          operator: '<',
          result: !!ev.conditionResult,
          explanation: ev.conditionResult
            ? `Candidate distance ${ev.candidateDistance} is shorter than current ${ev.oldDistance} ➔ Relax edge!`
            : `Candidate distance ${ev.candidateDistance} is NOT shorter than ${ev.oldDistance} ➔ Keep current`,
        };
        explanation = `Relaxation test: ${ev.candidateDistance} < ${ev.oldDistance} ➔ ${ev.conditionResult ? 'TRUE (Relax)' : 'FALSE'}`;
        break;
      }

      case 'BELLMAN_FORD_DISTANCE_UPDATE': {
        nextMetrics.assignments++;
        if (!nextAlgorithmState.bellmanDistances) nextAlgorithmState.bellmanDistances = {};
        nextAlgorithmState.bellmanDistances[ev.targetNodeId!] = ev.newDistance!;
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData && g.graphData.nodes[ev.targetNodeId!]) {
          g.graphData.nodes[ev.targetNodeId!].distance = ev.newDistance;
        }
        explanation = `Relaxed distance to ${ev.targetNodeId}: ${ev.oldDistance} ➔ ${ev.newDistance}`;
        break;
      }

      case 'BELLMAN_FORD_PASS_END': {
        explanation = `Completed relaxation pass ${ev.pass}`;
        break;
      }

      case 'BELLMAN_FORD_NEGATIVE_CYCLE': {
        nextAlgorithmState.negativeCycleDetected = true;
        nextAlgorithmState.status = 'Negative Cycle Detected!';
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData) {
          for (const e of Object.values(g.graphData.edges)) {
            if (e.source === ev.sourceNodeId && e.target === ev.targetNodeId) {
              e.state = 'CYCLE';
            }
          }
        }
        explanation = `NEGATIVE CYCLE DETECTED! Edge ${ev.sourceNodeId} ➔ ${ev.targetNodeId} can still be reduced.`;
        break;
      }

      case 'BELLMAN_FORD_END': {
        nextAlgorithmState.status = nextAlgorithmState.negativeCycleDetected ? 'Negative Cycle' : 'Completed';
        explanation = `Bellman-Ford algorithm completed${nextAlgorithmState.negativeCycleDetected ? ' (Negative cycle identified)' : ''}`;
        break;
      }

      // --- Floyd-Warshall ---
      case 'FLOYD_WARSHALL_START': {
        nextAlgorithmState.algorithmName = 'Floyd-Warshall';
        nextAlgorithmState.category = 'Advanced Graph';
        nextAlgorithmState.floydLabels = Array.isArray(ev.path) ? ev.path : [];
        nextAlgorithmState.floydMatrix = Array.isArray(ev.values) ? ev.values : [];
        nextAlgorithmState.theoreticalComplexity = { time: 'O(V³)', space: 'O(V²)' };
        explanation = 'Initialized Floyd-Warshall all-pairs shortest paths';
        break;
      }

      case 'FLOYD_K_UPDATE': {
        nextAlgorithmState.floydK = ev.k;
        explanation = `Testing intermediate vertex k = ${ev.k}`;
        break;
      }

      case 'FLOYD_DISTANCE_COMPARE': {
        nextMetrics.comparisons++;
        nextAlgorithmState.floydI = ev.iNode;
        nextAlgorithmState.floydJ = ev.jNode;
        nextAlgorithmState.floydOldDistance = ev.oldDistance;
        nextAlgorithmState.floydCandidateDistance = ev.candidateDistance;
        nextComparison = {
          left: `dist[${ev.iNode}][${ev.k}] + dist[${ev.k}][${ev.jNode}] = ${ev.candidateDistance}`,
          right: `dist[${ev.iNode}][${ev.jNode}] = ${ev.oldDistance}`,
          operator: '<',
          result: !!ev.conditionResult,
          explanation: ev.conditionResult ? `Shorter path found via ${ev.k}!` : `Existing path is shorter or equal.`,
        };
        explanation = `Compare: dist[${ev.iNode}][${ev.k}] + dist[${ev.k}][${ev.jNode}] (${ev.candidateDistance}) < dist[${ev.iNode}][${ev.jNode}] (${ev.oldDistance}) ➔ ${ev.conditionResult ? 'TRUE' : 'FALSE'}`;
        break;
      }

      case 'FLOYD_DISTANCE_UPDATE': {
        nextMetrics.assignments++;
        nextAlgorithmState.floydI = ev.iNode;
        nextAlgorithmState.floydJ = ev.jNode;
        const r = typeof ev.iNode === 'number' ? ev.iNode : (nextAlgorithmState.floydLabels ? nextAlgorithmState.floydLabels.indexOf(String(ev.iNode)) : -1);
        const c = typeof ev.jNode === 'number' ? ev.jNode : (nextAlgorithmState.floydLabels ? nextAlgorithmState.floydLabels.indexOf(String(ev.jNode)) : -1);
        if (r >= 0 && c >= 0 && nextAlgorithmState.floydMatrix) {
          if (!nextAlgorithmState.floydMatrix[r]) nextAlgorithmState.floydMatrix[r] = [];
          nextAlgorithmState.floydMatrix[r][c] = ev.newDistance !== undefined ? ev.newDistance : (ev.candidateDistance !== undefined ? ev.candidateDistance : 0);
        }
        explanation = `Updated dist[${ev.iNode}][${ev.jNode}]: ${ev.oldDistance} ➔ ${ev.newDistance}`;
        break;
      }

      case 'FLOYD_WARSHALL_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = 'Floyd-Warshall all-pairs shortest path matrix computed';
        break;
      }

      // --- Prim's Algorithm (MST) ---
      case 'PRIM_START': {
        nextAlgorithmState.algorithmName = "Prim's MST";
        nextAlgorithmState.category = 'Advanced Graph';
        nextAlgorithmState.mstEdges = [];
        nextAlgorithmState.mstTotalWeight = 0;
        nextAlgorithmState.primCurrentNode = ev.startNodeId;
        nextAlgorithmState.theoreticalComplexity = { time: 'O(E log V)', space: 'O(V + E)' };
        explanation = `Started Prim's MST from node ${ev.startNodeId || 'root'}`;
        break;
      }

      case 'PRIM_NODE_SELECT': {
        nextAlgorithmState.primCurrentNode = ev.nodeId;
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData && g.graphData.nodes[ev.nodeId!]) {
          g.graphData.nodes[ev.nodeId!].state = 'FINALIZED';
          g.graphData.nodes[ev.nodeId!].visited = true;
        }
        explanation = `Selected node ${ev.nodeId} into MST cut; inspecting adjacent edges`;
        break;
      }

      case 'PRIM_EDGE_CONSIDER': {
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData) {
          for (const e of Object.values(g.graphData.edges)) {
            if ((e.source === ev.sourceNodeId && e.target === ev.targetNodeId) ||
                (!e.directed && e.source === ev.targetNodeId && e.target === ev.sourceNodeId)) {
              e.state = 'ACTIVE';
            }
          }
        }
        explanation = `Considering edge ${ev.sourceNodeId}-${ev.targetNodeId} (weight: ${ev.weight})`;
        break;
      }

      case 'PRIM_EDGE_COMPARE': {
        nextMetrics.comparisons++;
        explanation = `Evaluated edge ${ev.sourceNodeId}-${ev.targetNodeId} against cut candidates`;
        break;
      }

      case 'PRIM_EDGE_ACCEPT': {
        if (!nextAlgorithmState.mstEdges) nextAlgorithmState.mstEdges = [];
        nextAlgorithmState.mstEdges.push({ from: ev.sourceNodeId!, to: ev.targetNodeId!, weight: ev.weight || 0 });
        nextAlgorithmState.mstTotalWeight = ev.distance !== undefined ? Number(ev.distance) : (nextAlgorithmState.mstTotalWeight || 0) + (ev.weight || 0);
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData) {
          for (const e of Object.values(g.graphData.edges)) {
            if ((e.source === ev.sourceNodeId && e.target === ev.targetNodeId) ||
                (!e.directed && e.source === ev.targetNodeId && e.target === ev.sourceNodeId)) {
              e.state = 'MST';
              e.inMST = true;
            }
          }
        }
        explanation = `ACCEPTED edge ${ev.sourceNodeId}-${ev.targetNodeId} into MST (Weight: ${ev.weight}, Total MST: ${nextAlgorithmState.mstTotalWeight})`;
        break;
      }

      case 'PRIM_EDGE_REJECT': {
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData) {
          for (const e of Object.values(g.graphData.edges)) {
            if ((e.source === ev.sourceNodeId && e.target === ev.targetNodeId) ||
                (!e.directed && e.source === ev.targetNodeId && e.target === ev.sourceNodeId)) {
              e.state = 'REJECTED';
            }
          }
        }
        explanation = `REJECTED edge ${ev.sourceNodeId}-${ev.targetNodeId}: ${ev.message || 'Target already in MST'}`;
        break;
      }

      case 'PRIM_QUEUE_INSERT': {
        nextMetrics.functionCalls++;
        explanation = `Enqueued edge (${ev.sourceNodeId}-${ev.targetNodeId}, w=${ev.weight}) into PriorityQueue`;
        break;
      }

      case 'PRIM_QUEUE_REMOVE': {
        explanation = `Extracted minimum edge (${ev.sourceNodeId}-${ev.targetNodeId}, w=${ev.weight}) from PriorityQueue`;
        break;
      }

      case 'PRIM_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Prim's MST completed with total weight ${ev.distance ?? nextAlgorithmState.mstTotalWeight}`;
        break;
      }

      // --- Kruskal's Algorithm (MST) ---
      case 'KRUSKAL_START': {
        nextAlgorithmState.algorithmName = "Kruskal's MST";
        nextAlgorithmState.category = 'Advanced Graph';
        nextAlgorithmState.mstEdges = [];
        nextAlgorithmState.mstTotalWeight = 0;
        nextAlgorithmState.disjointSetParents = {};
        nextAlgorithmState.disjointSetRanks = {};
        nextAlgorithmState.kruskalSortedEdges = [];
        nextAlgorithmState.theoreticalComplexity = { time: 'O(E log E)', space: 'O(V + E)' };
        explanation = `Started Kruskal's MST on ${ev.size || 'all'} sorted edges`;
        break;
      }

      case 'KRUSKAL_EDGE_SELECT': {
        if (!nextAlgorithmState.kruskalSortedEdges) nextAlgorithmState.kruskalSortedEdges = [];
        const existing = nextAlgorithmState.kruskalSortedEdges.find(
          (e) => (e.from === ev.sourceNodeId && e.to === ev.targetNodeId) || (e.from === ev.targetNodeId && e.to === ev.sourceNodeId)
        );
        if (!existing) {
          nextAlgorithmState.kruskalSortedEdges.push({ from: ev.sourceNodeId!, to: ev.targetNodeId!, weight: ev.weight || 0, status: 'PENDING' });
        }
        explanation = `Selecting next lightest edge: ${ev.sourceNodeId}-${ev.targetNodeId} (weight: ${ev.weight})`;
        break;
      }

      case 'KRUSKAL_EDGE_COMPARE': {
        nextMetrics.comparisons++;
        explanation = `Inspecting edge ${ev.sourceNodeId}-${ev.targetNodeId} for cycle check`;
        break;
      }

      case 'KRUSKAL_FIND': {
        if (!nextAlgorithmState.disjointSetParents) nextAlgorithmState.disjointSetParents = {};
        if (ev.nodeId && ev.parentNodeId) {
          nextAlgorithmState.disjointSetParents[ev.nodeId] = ev.parentNodeId;
        }
        explanation = `DSU find(${ev.nodeId}) ➔ root component: ${ev.parentNodeId}`;
        break;
      }

      case 'KRUSKAL_CYCLE_CHECK': {
        explanation = ev.cycle
          ? `Cycle detected! Both ${ev.sourceNodeId} and ${ev.targetNodeId} belong to the same component`
          : `No cycle: ${ev.sourceNodeId} and ${ev.targetNodeId} belong to different components`;
        break;
      }

      case 'KRUSKAL_UNION': {
        if (!nextAlgorithmState.disjointSetParents) nextAlgorithmState.disjointSetParents = {};
        nextAlgorithmState.disjointSetParents[ev.sourceNodeId!] = ev.parentNodeId!;
        nextAlgorithmState.disjointSetParents[ev.targetNodeId!] = ev.parentNodeId!;
        explanation = `DSU union(${ev.sourceNodeId}, ${ev.targetNodeId}) ➔ connected under parent ${ev.parentNodeId}`;
        break;
      }

      case 'KRUSKAL_EDGE_ACCEPT': {
        if (!nextAlgorithmState.mstEdges) nextAlgorithmState.mstEdges = [];
        nextAlgorithmState.mstEdges.push({ from: ev.sourceNodeId!, to: ev.targetNodeId!, weight: ev.weight || 0 });
        nextAlgorithmState.mstTotalWeight = ev.distance !== undefined ? Number(ev.distance) : (nextAlgorithmState.mstTotalWeight || 0) + (ev.weight || 0);

        if (!nextAlgorithmState.kruskalSortedEdges) nextAlgorithmState.kruskalSortedEdges = [];
        const acceptEntry = nextAlgorithmState.kruskalSortedEdges.find(
          (e) => (e.from === ev.sourceNodeId && e.to === ev.targetNodeId) || (e.from === ev.targetNodeId && e.to === ev.sourceNodeId)
        );
        if (acceptEntry) {
          acceptEntry.status = 'ACCEPTED';
        } else {
          nextAlgorithmState.kruskalSortedEdges.push({ from: ev.sourceNodeId!, to: ev.targetNodeId!, weight: ev.weight || 0, status: 'ACCEPTED' });
        }

        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData) {
          for (const e of Object.values(g.graphData.edges)) {
            if ((e.source === ev.sourceNodeId && e.target === ev.targetNodeId) ||
                (!e.directed && e.source === ev.targetNodeId && e.target === ev.sourceNodeId)) {
              e.state = 'MST';
              e.inMST = true;
            }
          }
        }
        explanation = `ACCEPTED edge ${ev.sourceNodeId}-${ev.targetNodeId} into MST (Weight: ${ev.weight}, Total MST: ${nextAlgorithmState.mstTotalWeight})`;
        break;
      }

      case 'KRUSKAL_EDGE_REJECT': {
        if (!nextAlgorithmState.kruskalSortedEdges) nextAlgorithmState.kruskalSortedEdges = [];
        const rejEntry = nextAlgorithmState.kruskalSortedEdges.find(
          (e) => (e.from === ev.sourceNodeId && e.to === ev.targetNodeId) || (e.from === ev.targetNodeId && e.to === ev.sourceNodeId)
        );
        if (rejEntry) {
          rejEntry.status = 'REJECTED';
        } else {
          nextAlgorithmState.kruskalSortedEdges.push({ from: ev.sourceNodeId!, to: ev.targetNodeId!, weight: ev.weight || 0, status: 'REJECTED' });
        }

        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData) {
          for (const e of Object.values(g.graphData.edges)) {
            if ((e.source === ev.sourceNodeId && e.target === ev.targetNodeId) ||
                (!e.directed && e.source === ev.targetNodeId && e.target === ev.sourceNodeId)) {
              e.state = 'REJECTED';
            }
          }
        }
        explanation = `REJECTED edge ${ev.sourceNodeId}-${ev.targetNodeId} (would create a cycle!)`;
        break;
      }

      case 'KRUSKAL_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Kruskal's MST completed with total weight ${ev.distance ?? nextAlgorithmState.mstTotalWeight}`;
        break;
      }

      // --- Topological Sort ---
      case 'TOPOLOGICAL_SORT_START': {
        nextAlgorithmState.algorithmName = 'Topological Sort';
        nextAlgorithmState.category = 'Advanced Graph';
        nextAlgorithmState.indegrees = {};
        nextAlgorithmState.topologicalQueue = [];
        nextAlgorithmState.topologicalOrder = [];
        nextAlgorithmState.topologicalCycle = false;
        nextAlgorithmState.theoreticalComplexity = { time: 'O(V + E)', space: 'O(V)' };
        explanation = `Starting Topological Sort (${ev.algorithmName || "Kahn's Algorithm"})`;
        break;
      }

      case 'INDEGREE_INITIALIZE': {
        nextAlgorithmState.indegrees = ev.arguments || {};
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData && ev.arguments) {
          for (const [nid, deg] of Object.entries(ev.arguments)) {
            if (g.graphData.nodes[nid]) {
              g.graphData.nodes[nid].inDegree = Number(deg);
            }
          }
        }
        explanation = 'Computed in-degrees for all vertices';
        break;
      }

      case 'TOPOLOGICAL_NODE_ENQUEUE': {
        if (!nextAlgorithmState.topologicalQueue) nextAlgorithmState.topologicalQueue = [];
        nextAlgorithmState.topologicalQueue.push(ev.nodeId!);
        explanation = `Node ${ev.nodeId} has in-degree 0 ➔ Enqueued`;
        break;
      }

      case 'TOPOLOGICAL_NODE_DEQUEUE': {
        if (nextAlgorithmState.topologicalQueue) {
          nextAlgorithmState.topologicalQueue = nextAlgorithmState.topologicalQueue.filter(x => x !== ev.nodeId);
        }
        explanation = `Dequeued node ${ev.nodeId} for processing`;
        break;
      }

      case 'TOPOLOGICAL_EDGE_PROCESS': {
        if (!nextAlgorithmState.indegrees) nextAlgorithmState.indegrees = {};
        if (ev.targetNodeId && ev.value !== undefined) {
          nextAlgorithmState.indegrees[ev.targetNodeId] = Number(ev.value);
          const g = nextStructures[ev.structureId || 'graph'];
          if (g && g.graphData && g.graphData.nodes[ev.targetNodeId]) {
            g.graphData.nodes[ev.targetNodeId].inDegree = Number(ev.value);
          }
        }
        explanation = `Processed edge ${ev.sourceNodeId} ➔ ${ev.targetNodeId}, new in-degree: ${ev.value}`;
        break;
      }

      case 'INDEGREE_UPDATE': {
        if (!nextAlgorithmState.indegrees) nextAlgorithmState.indegrees = {};
        nextAlgorithmState.indegrees[ev.nodeId!] = ev.newValue;
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData && g.graphData.nodes[ev.nodeId!]) {
          g.graphData.nodes[ev.nodeId!].inDegree = ev.newValue;
        }
        explanation = `Updated in-degree of ${ev.nodeId}: ${ev.oldValue} ➔ ${ev.newValue}`;
        break;
      }

      case 'TOPOLOGICAL_NODE_OUTPUT': {
        if (!nextAlgorithmState.topologicalOrder) nextAlgorithmState.topologicalOrder = [];
        nextAlgorithmState.topologicalOrder.push(ev.nodeId!);
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData && g.graphData.nodes[ev.nodeId!]) {
          g.graphData.nodes[ev.nodeId!].state = 'FINALIZED';
        }
        explanation = `Appended node ${ev.nodeId} to topological order`;
        break;
      }

      case 'TOPOLOGICAL_CYCLE_DETECTED': {
        nextAlgorithmState.topologicalCycle = true;
        nextAlgorithmState.status = 'Cycle Detected (Not a DAG)';
        explanation = 'CYCLE DETECTED: Graph contains directed cycles! Cannot complete topological sort.';
        break;
      }

      case 'TOPOLOGICAL_SORT_END': {
        nextAlgorithmState.status = nextAlgorithmState.topologicalCycle ? 'Cycle Detected' : 'Completed';
        explanation = `Topological sort completed. Result: [${(nextAlgorithmState.topologicalOrder || []).join(' ➔ ')}]`;
        break;
      }

      // --- Strongly Connected Components: Kosaraju ---
      case 'KOSARAJU_START': {
        nextAlgorithmState.algorithmName = "Kosaraju's SCC";
        nextAlgorithmState.category = 'Advanced Graph';
        nextAlgorithmState.kosarajuFinishStack = [];
        nextAlgorithmState.sccComponents = [];
        nextAlgorithmState.isTransposePhase = false;
        nextAlgorithmState.theoreticalComplexity = { time: 'O(V + E)', space: 'O(V)' };
        explanation = "Started Kosaraju's algorithm for Strongly Connected Components";
        break;
      }

      case 'KOSARAJU_FIRST_DFS': {
        explanation = `First DFS pass: Visiting node ${ev.nodeId}`;
        break;
      }

      case 'KOSARAJU_FINISH': {
        explanation = `Node ${ev.nodeId} finished in First DFS`;
        break;
      }

      case 'KOSARAJU_STACK_PUSH': {
        if (!nextAlgorithmState.kosarajuFinishStack) nextAlgorithmState.kosarajuFinishStack = [];
        nextAlgorithmState.kosarajuFinishStack.push(ev.nodeId!);
        explanation = `Pushed node ${ev.nodeId} to finish order stack`;
        break;
      }

      case 'KOSARAJU_TRANSPOSE': {
        nextAlgorithmState.isTransposePhase = true;
        explanation = 'Constructed transpose graph G^T (All edges reversed)';
        break;
      }

      case 'KOSARAJU_SECOND_DFS': {
        explanation = `Second DFS on G^T from stack top: ${ev.nodeId} (SCC #${ev.componentId})`;
        break;
      }

      case 'KOSARAJU_SCC_START': {
        nextAlgorithmState.currentSCC = [];
        explanation = `Discovered new Strongly Connected Component #${ev.componentId}`;
        break;
      }

      case 'KOSARAJU_SCC_NODE': {
        if (!nextAlgorithmState.currentSCC) nextAlgorithmState.currentSCC = [];
        nextAlgorithmState.currentSCC.push(ev.nodeId!);
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData && g.graphData.nodes[ev.nodeId!]) {
          g.graphData.nodes[ev.nodeId!].sccGroup = Number(ev.componentId);
        }
        explanation = `Added node ${ev.nodeId} to SCC #${ev.componentId}`;
        break;
      }

      case 'KOSARAJU_SCC_END': {
        if (!nextAlgorithmState.sccComponents) nextAlgorithmState.sccComponents = [];
        const nodes = typeof ev.path === 'string' ? JSON.parse(ev.path) : (nextAlgorithmState.currentSCC || []);
        nextAlgorithmState.sccComponents.push(nodes);
        explanation = `Formed SCC #${ev.componentId}: {${nodes.join(', ')}}`;
        break;
      }

      case 'KOSARAJU_END': {
        nextAlgorithmState.status = `Found ${ev.size || nextAlgorithmState.sccComponents?.length} SCCs`;
        explanation = `Kosaraju complete: Discovered ${ev.size || nextAlgorithmState.sccComponents?.length} strongly connected components`;
        break;
      }

      // --- Strongly Connected Components: Tarjan ---
      case 'TARJAN_START': {
        nextAlgorithmState.algorithmName = "Tarjan's SCC";
        nextAlgorithmState.category = 'Advanced Graph';
        nextAlgorithmState.tarjanDiscoveryIndex = {};
        nextAlgorithmState.tarjanLowLink = {};
        nextAlgorithmState.tarjanStack = [];
        nextAlgorithmState.sccComponents = [];
        nextAlgorithmState.theoreticalComplexity = { time: 'O(V + E)', space: 'O(V)' };
        explanation = "Started Tarjan's Single-Pass SCC algorithm";
        break;
      }

      case 'TARJAN_DISCOVER': {
        if (!nextAlgorithmState.tarjanDiscoveryIndex) nextAlgorithmState.tarjanDiscoveryIndex = {};
        if (!nextAlgorithmState.tarjanLowLink) nextAlgorithmState.tarjanLowLink = {};
        nextAlgorithmState.tarjanDiscoveryIndex[ev.nodeId!] = ev.fromIndex!;
        nextAlgorithmState.tarjanLowLink[ev.nodeId!] = ev.toIndex!;
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData && g.graphData.nodes[ev.nodeId!]) {
          g.graphData.nodes[ev.nodeId!].discoveryIndex = ev.fromIndex;
          g.graphData.nodes[ev.nodeId!].lowLink = ev.toIndex;
          g.graphData.nodes[ev.nodeId!].onStack = true;
        }
        explanation = `Discovered node ${ev.nodeId}: dfn = ${ev.fromIndex}, low = ${ev.toIndex}`;
        break;
      }

      case 'TARJAN_STACK_PUSH': {
        if (!nextAlgorithmState.tarjanStack) nextAlgorithmState.tarjanStack = [];
        nextAlgorithmState.tarjanStack.push(ev.nodeId!);
        explanation = `Pushed node ${ev.nodeId} onto Tarjan recursion stack`;
        break;
      }

      case 'TARJAN_EDGE_PROCESS': {
        explanation = `Tarjan: Inspecting edge ${ev.sourceNodeId} ➔ ${ev.targetNodeId}`;
        break;
      }

      case 'TARJAN_LOWLINK_UPDATE': {
        if (!nextAlgorithmState.tarjanLowLink) nextAlgorithmState.tarjanLowLink = {};
        nextAlgorithmState.tarjanLowLink[ev.nodeId!] = ev.newValue!;
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData && g.graphData.nodes[ev.nodeId!]) {
          g.graphData.nodes[ev.nodeId!].lowLink = ev.newValue;
        }
        explanation = `Updated low-link for node ${ev.nodeId}: ${ev.oldValue} ➔ ${ev.newValue}`;
        break;
      }

      case 'TARJAN_SCC_START': {
        explanation = `Root of SCC identified at node ${ev.nodeId} (dfn == low)`;
        break;
      }

      case 'TARJAN_STACK_POP': {
        if (nextAlgorithmState.tarjanStack) {
          nextAlgorithmState.tarjanStack = nextAlgorithmState.tarjanStack.filter(x => x !== ev.nodeId);
        }
        const g = nextStructures[ev.structureId || 'graph'];
        if (g && g.graphData && g.graphData.nodes[ev.nodeId!]) {
          g.graphData.nodes[ev.nodeId!].onStack = false;
          g.graphData.nodes[ev.nodeId!].sccGroup = Number(ev.componentId);
        }
        explanation = `Popped node ${ev.nodeId} from stack into SCC #${ev.componentId}`;
        break;
      }

      case 'TARJAN_SCC_END': {
        if (!nextAlgorithmState.sccComponents) nextAlgorithmState.sccComponents = [];
        const nodes = typeof ev.path === 'string' ? JSON.parse(ev.path) : [];
        nextAlgorithmState.sccComponents.push(nodes);
        explanation = `Formed SCC #${ev.componentId}: {${nodes.join(', ')}}`;
        break;
      }

      case 'TARJAN_END': {
        nextAlgorithmState.status = `Found ${ev.size || nextAlgorithmState.sccComponents?.length} SCCs`;
        explanation = `Tarjan complete: Discovered ${ev.size || nextAlgorithmState.sccComponents?.length} strongly connected components`;
        break;
      }

      // --- AVL Tree ---
      case 'AVL_CREATE': {
        const treeId = ev.structureId || 'avl';
        nextStructures[treeId] = {
          id: treeId,
          name: treeId,
          type: 'tree',
          dataType: 'AVLTree',
          size: 0,
          treeData: {
            rootId: null,
            nodes: {},
          },
          lastOperation: 'new AVLTree()',
        };
        nextAlgorithmState.algorithmName = 'AVL Tree';
        nextAlgorithmState.category = 'Advanced Tree';
        nextAlgorithmState.avlRotationsCount = 0;
        nextAlgorithmState.theoreticalComplexity = { time: 'O(log N)', space: 'O(N)' };
        explanation = 'Initialized self-balancing AVL Tree';
        break;
      }

      case 'AVL_INSERT': {
        const treeId = ev.structureId || 'avl';
        const st = nextStructures[treeId];
        if (st && st.treeData) {
          const nid = ev.nodeId || `Node#${ev.value}`;
          st.treeData.nodes[nid] = {
            id: nid,
            value: ev.value,
            leftId: null,
            rightId: null,
            height: 1,
            balanceFactor: 0,
          };
          if (!st.treeData.rootId) {
            st.treeData.rootId = nid;
          }
          st.size = Object.keys(st.treeData.nodes).length;
          st.lastOperation = `insert(${ev.value})`;
        }
        explanation = `Inserted value ${ev.value} into AVL Tree`;
        break;
      }

      case 'AVL_DELETE': {
        const treeId = ev.structureId || 'avl';
        const st = nextStructures[treeId];
        if (st && st.treeData && ev.nodeId) {
          delete st.treeData.nodes[ev.nodeId];
          st.size = Object.keys(st.treeData.nodes).length;
          st.lastOperation = `delete(${ev.value})`;
        }
        explanation = `Deleted value ${ev.value} from AVL Tree`;
        break;
      }

      case 'AVL_HEIGHT_UPDATE': {
        if (!nextAlgorithmState.nodeHeights) nextAlgorithmState.nodeHeights = {};
        nextAlgorithmState.nodeHeights[ev.nodeId!] = ev.newValue!;
        const st = nextStructures[ev.structureId || 'avl'];
        if (st && st.treeData && st.treeData.nodes[ev.nodeId!]) {
          st.treeData.nodes[ev.nodeId!].height = ev.newValue;
        }
        explanation = `Updated height of ${ev.nodeId}: ${ev.oldValue} ➔ ${ev.newValue}`;
        break;
      }

      case 'AVL_BALANCE_CHECK': {
        if (!nextAlgorithmState.balanceFactors) nextAlgorithmState.balanceFactors = {};
        nextAlgorithmState.balanceFactors[ev.nodeId!] = ev.balanceFactor!;
        const st = nextStructures[ev.structureId || 'avl'];
        if (st && st.treeData && st.treeData.nodes[ev.nodeId!]) {
          st.treeData.nodes[ev.nodeId!].balanceFactor = ev.balanceFactor;
        }
        explanation = `Balance check on ${ev.nodeId}: leftH=${ev.fromIndex}, rightH=${ev.toIndex} ➔ Balance Factor = ${ev.balanceFactor}`;
        break;
      }

      case 'AVL_ROTATE_LEFT': {
        nextAlgorithmState.lastRotationType = 'RR';
        nextAlgorithmState.avlRotationsCount = (nextAlgorithmState.avlRotationsCount || 0) + 1;
        const st = nextStructures[ev.structureId || 'avl'];
        if (st && st.treeData && ev.nodeId && ev.childNodeId) {
          const oldRoot = st.treeData.nodes[ev.nodeId];
          const newRoot = st.treeData.nodes[ev.childNodeId];
          if (oldRoot && newRoot) {
            oldRoot.rightId = newRoot.leftId;
            newRoot.leftId = oldRoot.id;
            if (st.treeData.rootId === oldRoot.id) {
              st.treeData.rootId = newRoot.id;
            }
          }
        }
        explanation = `Executed LEFT ROTATION (RR) on node ${ev.nodeId} (New subtree root: ${ev.childNodeId})`;
        break;
      }

      case 'AVL_ROTATE_RIGHT': {
        nextAlgorithmState.lastRotationType = 'LL';
        nextAlgorithmState.avlRotationsCount = (nextAlgorithmState.avlRotationsCount || 0) + 1;
        const st = nextStructures[ev.structureId || 'avl'];
        if (st && st.treeData && ev.nodeId && ev.childNodeId) {
          const oldRoot = st.treeData.nodes[ev.nodeId];
          const newRoot = st.treeData.nodes[ev.childNodeId];
          if (oldRoot && newRoot) {
            oldRoot.leftId = newRoot.rightId;
            newRoot.rightId = oldRoot.id;
            if (st.treeData.rootId === oldRoot.id) {
              st.treeData.rootId = newRoot.id;
            }
          }
        }
        explanation = `Executed RIGHT ROTATION (LL) on node ${ev.nodeId} (New subtree root: ${ev.childNodeId})`;
        break;
      }

      case 'AVL_ROTATE_LEFT_RIGHT': {
        nextAlgorithmState.lastRotationType = 'LR';
        nextAlgorithmState.avlRotationsCount = (nextAlgorithmState.avlRotationsCount || 0) + 1;
        explanation = `Executed LEFT-RIGHT ROTATION (LR Double Rotation) on node ${ev.nodeId}`;
        break;
      }

      case 'AVL_ROTATE_RIGHT_LEFT': {
        nextAlgorithmState.lastRotationType = 'RL';
        nextAlgorithmState.avlRotationsCount = (nextAlgorithmState.avlRotationsCount || 0) + 1;
        explanation = `Executed RIGHT-LEFT ROTATION (RL Double Rotation) on node ${ev.nodeId}`;
        break;
      }

      case 'AVL_ROOT_UPDATE': {
        const st = nextStructures[ev.structureId || 'avl'];
        if (st && st.treeData) {
          st.treeData.rootId = ev.nodeId!;
        }
        explanation = `AVL Tree root updated to node ${ev.nodeId}`;
        break;
      }

      case 'AVL_END': {
        nextAlgorithmState.status = 'Tree Balanced';
        explanation = 'AVL Tree operation finished: All nodes adhere to AVL balance condition (-1 <= BF <= 1)';
        break;
      }

      // --- Binary Search on Answer ---
      case 'ANSWER_SEARCH_START': {
        nextAlgorithmState.algorithmName = 'Binary Search on Answer';
        nextAlgorithmState.category = 'Advanced Search / Optimization';
        nextAlgorithmState.searchLow = Number(ev.low);
        nextAlgorithmState.searchHigh = Number(ev.high);
        nextAlgorithmState.theoreticalComplexity = { time: 'O(log(Range) * Check)', space: 'O(1)' };
        explanation = `Started Binary Search on Answer in range [${ev.low}, ${ev.high}]`;
        break;
      }

      case 'ANSWER_SEARCH_RANGE': {
        nextAlgorithmState.searchLow = Number(ev.low);
        nextAlgorithmState.searchHigh = Number(ev.high);
        explanation = `Search space refined: [low = ${ev.low}, high = ${ev.high}]`;
        break;
      }

      case 'ANSWER_SEARCH_MID': {
        nextAlgorithmState.searchMid = Number(ev.mid);
        explanation = `Testing candidate solution mid = ${ev.mid}`;
        break;
      }

      case 'ANSWER_SEARCH_FEASIBILITY_CHECK': {
        nextMetrics.comparisons++;
        nextAlgorithmState.answerFeasibility = !!ev.feasible;
        explanation = `Feasibility check for ${ev.mid}: ${ev.feasible ? 'FEASIBLE ✓' : 'INFEASIBLE ✗'} ${ev.message ? `(${ev.message})` : ''}`;
        break;
      }

      case 'ANSWER_SEARCH_RANGE_UPDATE': {
        nextAlgorithmState.searchLow = Number(ev.low);
        nextAlgorithmState.searchHigh = Number(ev.high);
        explanation = `Updated search bounds: [${ev.low}, ${ev.high}], optimal feasible so far = ${ev.value}`;
        break;
      }

      case 'ANSWER_SEARCH_END': {
        nextAlgorithmState.status = `Optimal Answer = ${ev.value}`;
        explanation = `Binary Search on Answer complete: Optimal answer is ${ev.value}`;
        break;
      }

      // --- Coordinate Compression ---
      case 'COORD_COMPRESS_START': {
        nextAlgorithmState.algorithmName = 'Coordinate Compression';
        nextAlgorithmState.category = 'Advanced Search / Optimization';
        nextAlgorithmState.coordMapping = {};
        nextAlgorithmState.theoreticalComplexity = { time: 'O(N log N)', space: 'O(N)' };
        explanation = `Started Coordinate Compression on ${ev.size} elements`;
        break;
      }

      case 'COORD_COMPRESS_MAP': {
        if (!nextAlgorithmState.coordMapping) nextAlgorithmState.coordMapping = {};
        nextAlgorithmState.coordMapping[String(ev.value)] = Number(ev.index);
        explanation = `Mapped coordinate value ${ev.value} ➔ compressed rank ${ev.index}`;
        break;
      }

      case 'COORD_COMPRESS_APPLY': {
        nextMetrics.assignments++;
        explanation = `Applied compressed coordinate: arr[${ev.index}] ${ev.oldValue} ➔ ${ev.newValue}`;
        break;
      }

      case 'COORD_COMPRESS_END': {
        nextAlgorithmState.status = `Compressed ${ev.size} unique values`;
        explanation = `Coordinate Compression finished (${ev.size} unique ranks)`;
        break;
      }

      // --- Monotonic Stack ---
      case 'MONO_STACK_START': {
        nextAlgorithmState.algorithmName = 'Monotonic Stack';
        nextAlgorithmState.category = 'Advanced Search / Optimization';
        nextAlgorithmState.monoStackType = (ev.monoType as any) || 'DECREASING';
        nextAlgorithmState.monoStackElements = [];
        nextAlgorithmState.theoreticalComplexity = { time: 'O(N)', space: 'O(N)' };
        explanation = `Initialized ${ev.monoType || 'Monotonic'} Stack pattern`;
        break;
      }

      case 'MONO_STACK_COMPARE': {
        nextMetrics.comparisons++;
        const mType = ev.monoType || nextAlgorithmState.monoStackType || 'DECREASING';
        nextComparison = {
          left: `Stack Top: ${ev.leftVal}`,
          right: `Current: ${ev.rightVal}`,
          operator: mType === 'INCREASING' ? '>=' : '<=',
          result: !!ev.conditionResult,
          explanation: ev.conditionResult
            ? `Top element violates monotonicity with respect to incoming element ➔ POP stack!`
            : `Incoming element preserves monotonicity ➔ Proceed to PUSH`,
        };
        explanation = `Comparing stack top (${ev.leftVal}) with current (${ev.rightVal}) ➔ ${ev.conditionResult ? 'Violates monotonicity: POP needed' : 'Maintains order: Ready to PUSH'}`;
        break;
      }

      case 'MONO_STACK_POP': {
        if (nextAlgorithmState.monoStackElements) {
          nextAlgorithmState.monoStackElements.pop();
        }
        explanation = `Popped ${ev.value} from monotonic stack`;
        break;
      }

      case 'MONO_STACK_PUSH': {
        if (!nextAlgorithmState.monoStackElements) nextAlgorithmState.monoStackElements = [];
        nextAlgorithmState.monoStackElements.push(ev.value);
        explanation = `Pushed ${ev.value} onto monotonic stack`;
        break;
      }

      case 'MONO_STACK_RESULT': {
        explanation = `Assigned result for index ${ev.index} (${ev.oldValue}): Next = ${ev.newValue}`;
        break;
      }

      case 'MONO_STACK_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = 'Monotonic stack processing completed';
        break;
      }

      // ==========================================
      // === PHASE 7 ADVANCED DYNAMIC PROGRAMMING ===
      // ==========================================

      // --- Core DP & Table ---
      case 'DP_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = ev.algorithmName || 'Dynamic Programming';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpSparseMap = {};
        nextAlgorithmState.dpDependencies = [];
        nextAlgorithmState.dpCandidateValues = [];
        if (!nextAlgorithmState.theoreticalComplexity) {
          nextAlgorithmState.theoreticalComplexity = { time: 'Algorithm dependent', space: 'Algorithm dependent' };
        }
        explanation = `Started ${ev.algorithmName || 'Dynamic Programming'} algorithm`;
        break;
      }

      case 'DP_TABLE_CREATE': {
        nextAlgorithmState.dpDimensions = ev.dimensions ? [...ev.dimensions] : [0, 0];
        if (ev.rowLabels) nextAlgorithmState.dpRowLabels = [...ev.rowLabels];
        if (ev.colLabels) nextAlgorithmState.dpColLabels = [...ev.colLabels];
        if (ev.dimensions && ev.dimensions.length === 1) {
          nextAlgorithmState.dpTable1D = new Array(ev.dimensions[0]).fill(0);
          nextAlgorithmState.dpType = 'TABULATION_1D';
        } else if (ev.dimensions && ev.dimensions.length === 2) {
          nextAlgorithmState.dpTable2D = Array.from({ length: ev.dimensions[0] }, () => new Array(ev.dimensions![1]).fill(0));
          nextAlgorithmState.dpType = 'TABULATION_2D';
        }
        explanation = `Initialized DP table with dimensions [${ev.dimensions ? ev.dimensions.join(' × ') : ''}]`;
        break;
      }

      case 'DP_TABLE_ACCESS':
      case 'DP_STATE_ACCESS': {
        nextMetrics.accesses++;
        const idxStr = Array.isArray(ev.indices) ? ev.indices.join(',') : String(ev.indices ?? '');
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[idxStr] = 'CURRENT';
        explanation = `Accessed DP state dp[${idxStr}] = ${ev.value}`;
        break;
      }

      case 'DP_STATE_COMPUTE': {
        nextAlgorithmState.dpTransitionFormula = ev.transitionFormula;
        const idxStr = Array.isArray(ev.indices) ? ev.indices.join(',') : String(ev.indices ?? '');
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[idxStr] = 'COMPUTING';
        explanation = `Computing dp[${idxStr}] using formula: ${ev.transitionFormula}`;
        break;
      }

      case 'DP_STATE_COMPARE': {
        nextMetrics.comparisons++;
        const idxStr = Array.isArray(ev.indices) ? ev.indices.join(',') : String(ev.indices ?? '');
        nextComparison = {
          left: `Candidate 1: ${ev.leftVal}`,
          right: `Candidate 2: ${ev.rightVal}`,
          operator: 'vs',
          result: true,
          explanation: `Compared candidates for dp[${idxStr}]. Selected optimal value: ${ev.value}`,
        };
        nextAlgorithmState.dpCandidateValues = [
          { label: 'Candidate 1', value: ev.leftVal, selected: ev.value === ev.leftVal },
          { label: 'Candidate 2', value: ev.rightVal, selected: ev.value === ev.rightVal },
        ];
        explanation = `Comparing options for dp[${idxStr}]: (${ev.leftVal} vs ${ev.rightVal}) ➔ Optimal: ${ev.value}`;
        break;
      }

      case 'DP_STATE_TRANSITION': {
        const idxStr = Array.isArray(ev.indices) ? ev.indices.join(',') : String(ev.indices ?? '');
        const deps = Array.isArray(ev.dependencies) ? ev.dependencies : [];
        nextAlgorithmState.dpDependencies = deps;
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        deps.forEach((dep) => {
          const dStr = Array.isArray(dep) ? dep.join(',') : String(dep);
          nextAlgorithmState.dpCellStatus![dStr] = 'DEPENDENCY';
        });
        explanation = `State transition for dp[${idxStr}] from dependencies: ${deps.map(d => Array.isArray(d) ? `dp[${d.join('][')}]` : `dp[${d}]`).join(', ')}`;
        break;
      }

      case 'DP_TABLE_UPDATE':
      case 'DP_STATE_UPDATE': {
        nextMetrics.assignments++;
        const idxStr = Array.isArray(ev.indices) ? ev.indices.join(',') : String(ev.indices ?? '');
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[idxStr] = 'UPDATED';

        if (Array.isArray(ev.indices)) {
          if (ev.indices.length === 1 && typeof ev.indices[0] === 'number') {
            if (!nextAlgorithmState.dpTable1D) nextAlgorithmState.dpTable1D = [];
            nextAlgorithmState.dpTable1D[ev.indices[0]] = ev.newValue;
          } else if (ev.indices.length === 2 && typeof ev.indices[0] === 'number' && typeof ev.indices[1] === 'number') {
            const [r, c] = ev.indices as [number, number];
            if (!nextAlgorithmState.dpTable2D) nextAlgorithmState.dpTable2D = [];
            while (nextAlgorithmState.dpTable2D.length <= r) nextAlgorithmState.dpTable2D.push([]);
            nextAlgorithmState.dpTable2D[r][c] = ev.newValue;
            nextAlgorithmState.dpCurrentCell = [r, c];
          }
        }
        if (!nextAlgorithmState.dpSparseMap) nextAlgorithmState.dpSparseMap = {};
        nextAlgorithmState.dpSparseMap[idxStr] = ev.newValue;

        explanation = `Updated dp[${idxStr}]: ${ev.oldValue} ➔ ${ev.newValue}`;
        break;
      }

      case 'DP_STATE_COMPLETE': {
        const idxStr = Array.isArray(ev.indices) ? ev.indices.join(',') : String(ev.indices ?? '');
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[idxStr] = 'FINAL';
        explanation = `State dp[${idxStr}] computation finalized = ${ev.value}`;
        break;
      }

      case 'DP_CACHE_LOOKUP': {
        const key = String(ev.stateKey ?? '');
        explanation = `Cache lookup for subproblem state (${key})`;
        break;
      }

      case 'DP_CACHE_HIT': {
        nextMetrics.cacheHits++;
        const key = String(ev.stateKey ?? '');
        if (!nextAlgorithmState.memoEntries) nextAlgorithmState.memoEntries = [];
        nextAlgorithmState.memoEntries.push({ key, value: ev.value, status: 'HIT' });
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[key] = 'CACHE_HIT';
        explanation = `Cache HIT for state (${key}) ➔ Returned cached result ${ev.value} (pruned branch)`;
        break;
      }

      case 'DP_CACHE_MISS': {
        nextMetrics.cacheMisses++;
        const key = String(ev.stateKey ?? '');
        if (!nextAlgorithmState.memoEntries) nextAlgorithmState.memoEntries = [];
        nextAlgorithmState.memoEntries.push({ key, value: null, status: 'MISS' });
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[key] = 'CACHE_MISS';
        explanation = `Cache MISS for state (${key}) ➔ Computing subproblem...`;
        break;
      }

      case 'DP_RECONSTRUCTION_START': {
        nextAlgorithmState.reconstructionActive = true;
        nextAlgorithmState.reconstructionSequence = [];
        explanation = 'Starting optimal solution reconstruction (backtracking DP decisions)';
        break;
      }

      case 'DP_RECONSTRUCTION_STEP': {
        const idxStr = Array.isArray(ev.indices) ? ev.indices.join(',') : String(ev.indices ?? '');
        if (!nextAlgorithmState.reconstructionSequence) nextAlgorithmState.reconstructionSequence = [];
        nextAlgorithmState.reconstructionSequence.push({
          indices: ev.indices,
          value: ev.value,
          action: ev.detail,
        });
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[idxStr] = 'FINAL';
        explanation = `Reconstruction step at [${idxStr}] (${ev.value}): ${ev.detail || 'Chosen'}`;
        break;
      }

      case 'DP_RECONSTRUCTION_END': {
        nextAlgorithmState.reconstructionActive = false;
        nextAlgorithmState.reconstructionFinalResult = ev.reconstructionPath || ev.value;
        explanation = `Optimal solution reconstruction completed: ${JSON.stringify(ev.reconstructionPath || ev.value)}`;
        break;
      }

      case 'DP_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Dynamic Programming finished with optimal result: ${ev.value}`;
        break;
      }

      // --- 0/1 Knapsack ---
      case 'KNAPSACK_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = '0/1 Knapsack';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.knapsackCapacity = ev.capacity;
        nextAlgorithmState.knapsackItems = Array.isArray((ev as any).items) ? [...(ev as any).items] : [];
        nextAlgorithmState.dpType = 'TABULATION_2D';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(N × W)', space: 'O(N × W)' };
        explanation = `Started 0/1 Knapsack: Items = ${ev.size || (nextAlgorithmState.knapsackItems?.length ?? 0)}, Capacity = ${ev.capacity}`;
        break;
      }

      case 'KNAPSACK_ITEM_SELECT': {
        nextAlgorithmState.knapsackCurrentItem = ev.itemIndex;
        if (!nextAlgorithmState.knapsackItems) nextAlgorithmState.knapsackItems = [];
        const itemIdx = ev.itemIndex ?? nextAlgorithmState.knapsackItems.length;
        nextAlgorithmState.knapsackItems[itemIdx] = {
          weight: ev.weight ?? 0,
          value: ev.itemValue ?? ev.value ?? 0,
          name: `Item ${itemIdx}`,
        };
        explanation = `Evaluating Item ${ev.itemIndex}: Weight = ${ev.weight}, Value = ${ev.itemValue ?? ev.value}`;
        break;
      }

      case 'KNAPSACK_CAPACITY_SELECT': {
        nextAlgorithmState.knapsackCurrentCapacity = ev.capacity;
        explanation = `Considering knapsack capacity w = ${ev.capacity} for Item ${ev.itemIndex}`;
        break;
      }

      case 'KNAPSACK_FIT_CHECK': {
        nextAlgorithmState.knapsackFit = !!ev.fit;
        explanation = `Fit check: Item weight (${ev.weight}) ${ev.fit ? '<=' : '>'} current capacity (${ev.capacity}) ➔ ${ev.fit ? 'FITS' : 'DOES NOT FIT'}`;
        break;
      }

      case 'KNAPSACK_EXCLUDE': {
        nextAlgorithmState.knapsackExcludeVal = Number(ev.value);
        nextAlgorithmState.knapsackDecision = 'EXCLUDE';
        explanation = `Exclude option dp[${(ev.itemIndex || 1) - 1}][${ev.capacity}] = ${ev.value}`;
        break;
      }

      case 'KNAPSACK_INCLUDE': {
        nextAlgorithmState.knapsackIncludeVal = Number(ev.value);
        nextAlgorithmState.knapsackDecision = 'INCLUDE';
        explanation = `Include option (value + dp[${(ev.itemIndex || 1) - 1}][w - wt]) = ${ev.value}`;
        break;
      }

      case 'KNAPSACK_COMPARE': {
        nextMetrics.comparisons++;
        const ex = Number(ev.leftVal ?? 0);
        const inc = Number(ev.rightVal ?? 0);
        const chosen = Number(ev.value ?? ev.candidateValue ?? 0);
        nextComparison = {
          left: `Exclude: ${ex}`,
          right: `Include: ${inc}`,
          operator: 'max',
          result: chosen,
          explanation: `Max(exclude: ${ex}, include: ${inc}) = ${chosen}`,
        };
        nextAlgorithmState.knapsackDecision = (ev.status as any) || (chosen === inc ? 'INCLUDE' : 'EXCLUDE');
        explanation = `Comparing: Exclude (${ex}) vs Include (${inc}) ➔ Decision: ${nextAlgorithmState.knapsackDecision} (${chosen})`;
        break;
      }

      case 'KNAPSACK_STATE_UPDATE': {
        nextMetrics.assignments++;
        const i = ev.itemIndex ?? 0;
        const w = ev.capacity ?? 0;
        if (!nextAlgorithmState.dpTable2D) nextAlgorithmState.dpTable2D = [];
        while (nextAlgorithmState.dpTable2D.length <= i) nextAlgorithmState.dpTable2D.push([]);
        nextAlgorithmState.dpTable2D[i][w] = ev.newValue;
        nextAlgorithmState.dpCurrentCell = [i, w];
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${i},${w}`] = 'UPDATED';
        explanation = `dp[${i}][${w}] updated to ${ev.newValue}`;
        break;
      }

      case 'KNAPSACK_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `0/1 Knapsack completed. Maximum value achieved = ${ev.value}`;
        break;
      }

      // --- Unbounded Knapsack ---
      case 'UNBOUNDED_KNAPSACK_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = 'Unbounded Knapsack';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.knapsackCapacity = ev.capacity;
        nextAlgorithmState.dpType = 'TABULATION_1D';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(N × W)', space: 'O(W)' };
        explanation = `Started Unbounded Knapsack (items may be reused indefinitely): Capacity = ${ev.capacity}`;
        break;
      }

      case 'UNBOUNDED_ITEM_SELECT': {
        nextAlgorithmState.knapsackCurrentItem = ev.itemIndex;
        if (!nextAlgorithmState.knapsackItems) nextAlgorithmState.knapsackItems = [];
        nextAlgorithmState.knapsackItems[ev.itemIndex ?? 0] = {
          weight: ev.weight ?? 0,
          value: ev.itemValue ?? 0,
          name: `Item ${ev.itemIndex}`,
        };
        explanation = `Selecting Item ${ev.itemIndex}: Weight = ${ev.weight}, Value = ${ev.itemValue} (reusable)`;
        break;
      }

      case 'UNBOUNDED_CAPACITY_SELECT': {
        nextAlgorithmState.knapsackCurrentCapacity = ev.capacity;
        explanation = `Unbounded capacity iteration: w = ${ev.capacity}`;
        break;
      }

      case 'UNBOUNDED_FIT_CHECK': {
        nextAlgorithmState.knapsackFit = !!ev.fit;
        explanation = `Fit check: Weight ${ev.weight} ${ev.fit ? '<=' : '>'} Capacity ${ev.capacity}`;
        break;
      }

      case 'UNBOUNDED_INCLUDE': {
        nextAlgorithmState.knapsackIncludeVal = Number(ev.value);
        explanation = `Unbounded include transition: value + dp[w - weight] = ${ev.value}`;
        break;
      }

      case 'UNBOUNDED_EXCLUDE': {
        nextAlgorithmState.knapsackExcludeVal = Number(ev.value);
        explanation = `Unbounded retain previous: dp[w] = ${ev.value}`;
        break;
      }

      case 'UNBOUNDED_COMPARE': {
        nextMetrics.comparisons++;
        nextAlgorithmState.knapsackDecision = Number(ev.value) === Number(ev.rightVal) ? 'INCLUDE' : 'EXCLUDE';
        explanation = `Comparing unbounded options at w=${ev.capacity}: Keep (${ev.leftVal}) vs Reuse (${ev.rightVal}) ➔ ${ev.value}`;
        break;
      }

      case 'UNBOUNDED_STATE_UPDATE': {
        nextMetrics.assignments++;
        const w = ev.capacity ?? 0;
        if (!nextAlgorithmState.dpTable1D) nextAlgorithmState.dpTable1D = [];
        nextAlgorithmState.dpTable1D[w] = ev.newValue;
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${w}`] = 'UPDATED';
        explanation = `dp[${w}] updated to ${ev.newValue}`;
        break;
      }

      case 'UNBOUNDED_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Unbounded Knapsack completed. Maximum value = ${ev.value}`;
        break;
      }

      // --- Coin Change ---
      case 'COIN_CHANGE_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = ev.algorithmId || ev.algorithmName || 'Coin Change';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.coinAmount = ev.amount;
        nextAlgorithmState.coins = Array.isArray((ev as any).coins) ? [...(ev as any).coins] : [];
        nextAlgorithmState.dpType = 'TABULATION_1D';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(Coins × Amount)', space: 'O(Amount)' };
        explanation = `Started ${nextAlgorithmState.algorithmName} for Target Amount = ${ev.amount}`;
        break;
      }

      case 'COIN_SELECT': {
        nextAlgorithmState.currentCoin = ev.coin;
        if (!nextAlgorithmState.coins) nextAlgorithmState.coins = [];
        if (ev.coin !== undefined && !nextAlgorithmState.coins.includes(ev.coin)) {
          nextAlgorithmState.coins.push(ev.coin);
        }
        explanation = `Selected coin denomination = ${ev.coin}`;
        break;
      }

      case 'COIN_AMOUNT_SELECT': {
        nextAlgorithmState.coinAmount = ev.amount;
        explanation = `Evaluating target sub-amount = ${ev.amount} with coin = ${ev.coin}`;
        break;
      }

      case 'COIN_FIT_CHECK': {
        explanation = `Coin fit check: Coin ${ev.coin} ${ev.fit ? '<=' : '>'} Amount ${ev.amount} ➔ ${ev.fit ? 'Valid' : 'Skip'}`;
        break;
      }

      case 'COIN_CANDIDATE': {
        nextAlgorithmState.coinCandidate = ev.candidateValue;
        explanation = `Candidate value for amount ${ev.amount} using coin ${ev.coin}: ${ev.candidateValue}`;
        break;
      }

      case 'COIN_COMPARE': {
        nextMetrics.comparisons++;
        nextComparison = {
          left: `Previous: ${ev.leftVal}`,
          right: `New Candidate: ${ev.rightVal}`,
          operator: 'compare',
          result: ev.value,
          explanation: `Updated optimal answer for amount ${ev.amount} to ${ev.value}`,
        };
        explanation = `Comparing candidates for amount ${ev.amount}: (${ev.leftVal} vs ${ev.rightVal}) ➔ Optimal: ${ev.value}`;
        break;
      }

      case 'COIN_STATE_UPDATE': {
        nextMetrics.assignments++;
        const amt = ev.amount ?? 0;
        if (!nextAlgorithmState.dpTable1D) nextAlgorithmState.dpTable1D = [];
        nextAlgorithmState.dpTable1D[amt] = ev.newValue;
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${amt}`] = 'UPDATED';
        explanation = `dp[${amt}] updated to ${ev.newValue}`;
        break;
      }

      case 'COIN_CHANGE_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Coin Change completed. Result = ${ev.value ?? (ev as any).result}`;
        break;
      }

      // --- Subset Sum ---
      case 'SUBSET_SUM_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = 'Subset Sum';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.subsetTarget = ev.target;
        nextAlgorithmState.dpType = 'TABULATION_2D';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(N × Sum)', space: 'O(N × Sum)' };
        explanation = `Started Subset Sum: Array size = ${ev.size || ((ev as any).values?.length ?? 0)}, Target Sum = ${ev.target}`;
        break;
      }

      case 'SUBSET_ELEMENT_SELECT': {
        nextAlgorithmState.knapsackCurrentItem = ev.itemIndex;
        if (!nextAlgorithmState.knapsackItems) nextAlgorithmState.knapsackItems = [];
        const itemIdx = ev.itemIndex ?? 0;
        nextAlgorithmState.knapsackItems[itemIdx] = {
          weight: ev.itemValue ?? 0,
          value: ev.itemValue ?? 0,
          name: `Element ${itemIdx}`,
        };
        explanation = `Evaluating array element at index ${ev.itemIndex}: value = ${ev.itemValue}`;
        break;
      }

      case 'SUBSET_TARGET_SELECT': {
        nextAlgorithmState.knapsackCurrentCapacity = ev.target;
        explanation = `Checking if target sum ${ev.target} can be formed`;
        break;
      }

      case 'SUBSET_EXCLUDE': {
        explanation = `Exclude element: dp[${(ev.itemIndex || 1) - 1}][${ev.target}] = ${ev.conditionResult}`;
        break;
      }

      case 'SUBSET_INCLUDE': {
        explanation = `Include element: dp[${(ev.itemIndex || 1) - 1}][${ev.target} - val] = ${ev.conditionResult}`;
        break;
      }

      case 'SUBSET_COMPARE': {
        nextMetrics.comparisons++;
        explanation = `Boolean OR: Exclude || Include ➔ ${ev.conditionResult ? 'True' : 'False'}`;
        break;
      }

      case 'SUBSET_STATE_UPDATE': {
        nextMetrics.assignments++;
        const i = ev.itemIndex ?? 0;
        const s = ev.target ?? 0;
        if (!nextAlgorithmState.dpTable2D) nextAlgorithmState.dpTable2D = [];
        while (nextAlgorithmState.dpTable2D.length <= i) nextAlgorithmState.dpTable2D.push([]);
        nextAlgorithmState.dpTable2D[i][s] = ev.newValue ?? (ev.conditionResult ? 1 : 0);
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${i},${s}`] = 'UPDATED';
        explanation = `dp[${i}][${s}] = ${ev.conditionResult ? 'TRUE' : 'FALSE'}`;
        break;
      }

      case 'SUBSET_SUM_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Subset Sum finished. Target sum feasible: ${ev.conditionResult ? 'YES (TRUE)' : 'NO (FALSE)'}`;
        break;
      }

      // --- Longest Common Subsequence & Longest Common Substring ---
      case 'LCS_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = 'Longest Common Subsequence';
        nextAlgorithmState.status = 'Running';
        const parts = String(ev.detail || '').split('|');
        nextAlgorithmState.lcsStringA = (ev as any).a || parts[0] || '';
        nextAlgorithmState.lcsStringB = (ev as any).b || parts[1] || '';
        nextAlgorithmState.dpType = 'TABULATION_2D';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(M × N)', space: 'O(M × N)' };

        const structKey = ev.structureId || 'dp';
        const dpMat = nextStructures[structKey] || Object.values(nextStructures).find((s) => s.type === 'matrix');
        if (dpMat) {
          dpMat.rowLabels = ['Ø', ...(nextAlgorithmState.lcsStringA ? nextAlgorithmState.lcsStringA.split('') : [])];
          dpMat.colLabels = ['Ø', ...(nextAlgorithmState.lcsStringB ? nextAlgorithmState.lcsStringB.split('') : [])];
        }

        explanation = `Started LCS on strings "${nextAlgorithmState.lcsStringA}" and "${nextAlgorithmState.lcsStringB}"`;
        break;
      }

      case 'LCS_CHARACTER_COMPARE': {
        nextMetrics.comparisons++;
        nextMetrics.accesses += 2;
        nextAlgorithmState.lcsI = ev.row ?? (ev as any).i;
        nextAlgorithmState.lcsJ = ev.col ?? (ev as any).j;
        nextAlgorithmState.lcsCharA = ev.iChar;
        nextAlgorithmState.lcsCharB = ev.jChar;
        nextAlgorithmState.lcsMatched = ev.charMatched !== undefined ? !!ev.charMatched : (ev.iChar === ev.jChar);
        const r = nextAlgorithmState.lcsI ?? 1;
        const c = nextAlgorithmState.lcsJ ?? 1;

        const structKey = ev.structureId || 'dp';
        const dpMat = nextStructures[structKey] || Object.values(nextStructures).find((s) => s.type === 'matrix');
        if (dpMat) {
          dpMat.activeCell = [r, c];
          dpMat.dependencyCells = (r > 0 && c > 0) ? [[r - 1, c - 1], [r - 1, c], [r, c - 1]] : undefined;
          dpMat.cellExplanation = `Comparing A[${r - 1}] ('${ev.iChar}') with B[${c - 1}] ('${ev.jChar}') for dp[${r}][${c}]`;
        }

        nextComparison = {
          left: `A[${(nextAlgorithmState.lcsI || 1) - 1}]: '${ev.iChar}'`,
          right: `B[${(nextAlgorithmState.lcsJ || 1) - 1}]: '${ev.jChar}'`,
          operator: '==',
          result: nextAlgorithmState.lcsMatched,
          explanation: nextAlgorithmState.lcsMatched ? `Characters match ('${ev.iChar}' == '${ev.jChar}') ➔ Diagonal + 1` : `Characters mismatch ('${ev.iChar}' != '${ev.jChar}') ➔ Max(Top, Left)`,
        };
        explanation = `Comparing A[${(nextAlgorithmState.lcsI || 1) - 1}] ('${ev.iChar}') with B[${(nextAlgorithmState.lcsJ || 1) - 1}] ('${ev.jChar}') ➔ ${nextAlgorithmState.lcsMatched ? 'MATCH' : 'MISMATCH'}`;
        break;
      }

      case 'LCS_MATCH': {
        nextMetrics.comparisons++;
        const i = ev.row ?? (ev as any).i ?? 1;
        const j = ev.col ?? (ev as any).j ?? 1;
        nextAlgorithmState.lcsMatched = true;
        nextAlgorithmState.dpPreviousCells = [[i - 1, j - 1]];

        const structKey = ev.structureId || 'dp';
        const dpMat = nextStructures[structKey] || Object.values(nextStructures).find((s) => s.type === 'matrix');
        if (dpMat) {
          dpMat.activeCell = [i, j];
          dpMat.dependencyCells = [[i - 1, j - 1]];
          const cA = nextAlgorithmState.lcsStringA?.charAt(i - 1) || '';
          const cB = nextAlgorithmState.lcsStringB?.charAt(j - 1) || '';
          dpMat.cellExplanation = `Match ('${cA}' == '${cB}'): take diagonal cell dp[${i - 1}][${j - 1}] (${ev.oldValue}) + 1 = ${ev.newValue}`;
        }

        explanation = `Match: Take diagonal value dp[${i - 1}][${j - 1}] (${ev.oldValue}) + 1 = ${ev.newValue}`;
        break;
      }

      case 'LCS_MISMATCH': {
        nextMetrics.comparisons++;
        const i = ev.row ?? (ev as any).i ?? 1;
        const j = ev.col ?? (ev as any).j ?? 1;
        nextAlgorithmState.lcsMatched = false;
        nextAlgorithmState.dpPreviousCells = [[i - 1, j], [i, j - 1]];

        const structKey = ev.structureId || 'dp';
        const dpMat = nextStructures[structKey] || Object.values(nextStructures).find((s) => s.type === 'matrix');
        if (dpMat) {
          dpMat.activeCell = [i, j];
          dpMat.dependencyCells = [[i - 1, j], [i, j - 1]];
          const cA = nextAlgorithmState.lcsStringA?.charAt(i - 1) || '';
          const cB = nextAlgorithmState.lcsStringB?.charAt(j - 1) || '';
          dpMat.cellExplanation = `Mismatch ('${cA}' != '${cB}'): Max(Top dp[${i - 1}][${j}] = ${ev.leftVal}, Left dp[${i}][${j - 1}] = ${ev.rightVal}) = ${ev.value}`;
        }

        explanation = `Mismatch: Max(dp[${i - 1}][${j}] = ${ev.leftVal}, dp[${i}][${j - 1}] = ${ev.rightVal}) = ${ev.value}`;
        break;
      }

      case 'LCS_DEPENDENCY_SELECT': {
        explanation = `Selected dependency: ${ev.detail} for dp[${ev.row}][${ev.col}]`;
        break;
      }

      case 'LCS_STATE_UPDATE': {
        nextMetrics.assignments++;
        nextMetrics.accesses += 2;
        const r = ev.row ?? (ev as any).i ?? 0;
        const c = ev.col ?? (ev as any).j ?? 0;
        if (!nextAlgorithmState.dpTable2D) nextAlgorithmState.dpTable2D = [];
        while (nextAlgorithmState.dpTable2D.length <= r) nextAlgorithmState.dpTable2D.push([]);
        nextAlgorithmState.dpTable2D[r][c] = ev.newValue;
        nextAlgorithmState.dpCurrentCell = [r, c];
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${r},${c}`] = 'UPDATED';

        const structKey = ev.structureId || 'dp';
        const dpMat = nextStructures[structKey] || Object.values(nextStructures).find((s) => s.type === 'matrix');
        if (dpMat) {
          if (dpMat.matrixData) {
            if (!dpMat.matrixData[r]) dpMat.matrixData[r] = [];
            dpMat.matrixData[r][c] = ev.newValue;
          }
          dpMat.activeCell = [r, c];
          dpMat.lastUpdatedCell = [r, c];
          if (nextAlgorithmState.dpPreviousCells && nextAlgorithmState.dpPreviousCells.length > 0) {
            dpMat.dependencyCells = [...nextAlgorithmState.dpPreviousCells];
          } else if (r > 0 && c > 0) {
            dpMat.dependencyCells = [[r - 1, c - 1]];
          }
          if (nextAlgorithmState.lcsStringA && nextAlgorithmState.lcsStringB) {
            dpMat.rowLabels = ['Ø', ...nextAlgorithmState.lcsStringA.split('')];
            dpMat.colLabels = ['Ø', ...nextAlgorithmState.lcsStringB.split('')];
            const chA = nextAlgorithmState.lcsStringA.charAt(r - 1);
            const chB = nextAlgorithmState.lcsStringB.charAt(c - 1);
            if (chA === chB && r > 0 && c > 0) {
              dpMat.cellExplanation = `Match ('${chA}' == '${chB}'): dp[${r}][${c}] = diagonal dp[${r - 1}][${c - 1}] + 1 = ${ev.newValue}`;
            } else if (r > 0 && c > 0) {
              dpMat.cellExplanation = `Mismatch ('${chA}' != '${chB}'): dp[${r}][${c}] = Max(Top, Left) = ${ev.newValue}`;
            } else {
              dpMat.cellExplanation = `dp[${r}][${c}] = ${ev.newValue}`;
            }
          } else {
            dpMat.cellExplanation = `dp[${r}][${c}] = ${ev.newValue}`;
          }
        }

        explanation = `dp[${r}][${c}] = ${ev.newValue}`;
        break;
      }

      case 'LCS_RECONSTRUCTION_START': {
        nextAlgorithmState.reconstructionActive = true;
        nextAlgorithmState.lcsReconstructionPath = ev.row !== undefined ? [[ev.row ?? 0, ev.col ?? 0]] : [];

        const structKey = ev.structureId || 'dp';
        const dpMat = nextStructures[structKey] || Object.values(nextStructures).find((s) => s.type === 'matrix');
        if (dpMat) {
          dpMat.highlightedCells = ev.row !== undefined ? [[ev.row ?? 0, ev.col ?? 0]] : [];
          dpMat.activeCell = ev.row !== undefined ? [ev.row ?? 0, ev.col ?? 0] : undefined;
          dpMat.cellExplanation = `Starting traceback reconstruction from dp[${ev.row}][${ev.col}]`;
        }

        explanation = `Tracing back optimal subsequence from dp[${ev.row}][${ev.col}]`;
        break;
      }

      case 'LCS_RECONSTRUCTION_STEP': {
        nextMetrics.accesses += 2;
        if (!nextAlgorithmState.lcsReconstructionPath) nextAlgorithmState.lcsReconstructionPath = [];
        const r = ev.row ?? (ev as any).i ?? 0;
        const c = ev.col ?? (ev as any).j ?? 0;
        nextAlgorithmState.lcsReconstructionPath.push([r, c]);

        const structKey = ev.structureId || 'dp';
        const dpMat = nextStructures[structKey] || Object.values(nextStructures).find((s) => s.type === 'matrix');
        if (dpMat) {
          if (!dpMat.highlightedCells) dpMat.highlightedCells = [];
          if (!dpMat.highlightedCells.some(([hr, hc]) => hr === r && hc === c)) {
            dpMat.highlightedCells.push([r, c]);
          }
          dpMat.activeCell = [r, c];
          dpMat.cellExplanation = `Traceback path at [${r}][${c}]: ${ev.detail || `Included character '${ev.char || (ev as any).iChar}'`}`;
        }

        explanation = `Traceback at [${r}][${c}]: ${ev.detail || `Included character '${ev.char || (ev as any).iChar}'`}`;
        break;
      }

      case 'LCS_RECONSTRUCTION_END': {
        nextAlgorithmState.reconstructionActive = false;
        nextAlgorithmState.lcsResult = ev.word || (ev as any).result;

        const structKey = ev.structureId || 'dp';
        const dpMat = nextStructures[structKey] || Object.values(nextStructures).find((s) => s.type === 'matrix');
        if (dpMat) {
          dpMat.cellExplanation = `Reconstructed LCS Result: "${nextAlgorithmState.lcsResult}"`;
        }

        explanation = `LCS reconstruction complete. Subsequence = "${nextAlgorithmState.lcsResult}"`;
        break;
      }

      case 'LCS_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `LCS calculation finished. Max common subsequence length = ${ev.value ?? (ev as any).result}`;
        break;
      }

      case 'LCSTR_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = 'Longest Common Substring';
        nextAlgorithmState.status = 'Running';
        const parts = String(ev.detail || '').split('|');
        nextAlgorithmState.lcsStringA = (ev as any).a || parts[0] || '';
        nextAlgorithmState.lcsStringB = (ev as any).b || parts[1] || '';
        nextAlgorithmState.dpType = 'TABULATION_2D';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(M × N)', space: 'O(M × N)' };
        explanation = `Started Longest Common Substring on "${nextAlgorithmState.lcsStringA}" and "${nextAlgorithmState.lcsStringB}"`;
        break;
      }

      case 'LCSTR_CHARACTER_COMPARE': {
        nextMetrics.comparisons++;
        nextAlgorithmState.lcsI = ev.row ?? (ev as any).i;
        nextAlgorithmState.lcsJ = ev.col ?? (ev as any).j;
        nextAlgorithmState.lcsCharA = ev.iChar;
        nextAlgorithmState.lcsCharB = ev.jChar;
        nextAlgorithmState.lcsMatched = ev.charMatched !== undefined ? !!ev.charMatched : (ev.iChar === ev.jChar);
        explanation = `Substring compare: A[${(nextAlgorithmState.lcsI || 1) - 1}] ('${ev.iChar}') vs B[${(nextAlgorithmState.lcsJ || 1) - 1}] ('${ev.jChar}') ➔ ${nextAlgorithmState.lcsMatched ? 'MATCH' : 'MISMATCH (RESET TO 0)'}`;
        break;
      }

      case 'LCSTR_MATCH': {
        nextAlgorithmState.lcsMatched = true;
        explanation = `Characters match! dp[${ev.row}][${ev.col}] = dp[${(ev.row || 1) - 1}][${(ev.col || 1) - 1}] + 1 = ${ev.newValue}`;
        break;
      }

      case 'LCSTR_RESET': {
        nextAlgorithmState.lcsMatched = false;
        const r = ev.row ?? (ev as any).i ?? 0;
        const c = ev.col ?? (ev as any).j ?? 0;
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${r},${c}`] = 'UPDATED';
        explanation = `Characters do not match in contiguous substring. Resetting dp[${r}][${c}] = 0`;
        break;
      }

      case 'LCSTR_STATE_UPDATE': {
        nextMetrics.assignments++;
        const r = ev.row ?? (ev as any).i ?? 0;
        const c = ev.col ?? (ev as any).j ?? 0;
        if (!nextAlgorithmState.dpTable2D) nextAlgorithmState.dpTable2D = [];
        while (nextAlgorithmState.dpTable2D.length <= r) nextAlgorithmState.dpTable2D.push([]);
        nextAlgorithmState.dpTable2D[r][c] = ev.newValue;
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${r},${c}`] = 'UPDATED';
        explanation = `dp[${r}][${c}] = ${ev.newValue}`;
        break;
      }

      case 'LCSTR_MAX_UPDATE': {
        nextAlgorithmState.lcstrMaxLen = Number(ev.newValue ?? ev.value);
        explanation = `New maximum common substring length found = ${nextAlgorithmState.lcstrMaxLen}`;
        break;
      }

      case 'LCSTR_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Longest Common Substring completed. Maximum length = ${ev.value}`;
        break;
      }

      // --- Longest Increasing Subsequence (LIS) ---
      case 'LIS_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = 'Longest Increasing Subsequence';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.lisArray = Array.isArray((ev as any).values) ? [...(ev as any).values] : [];
        nextAlgorithmState.lisParents = new Array(ev.size ?? (nextAlgorithmState.lisArray?.length || 0)).fill(null);
        nextAlgorithmState.dpType = 'TABULATION_1D';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(N²)', space: 'O(N)' };
        explanation = `Started LIS for array of size ${ev.size || (nextAlgorithmState.lisArray?.length || 0)}`;
        break;
      }

      case 'LIS_INDEX_SELECT': {
        nextAlgorithmState.lisCurrentI = (ev as any).i ?? ev.index;
        nextAlgorithmState.lisCurrentJ = (ev as any).j ?? ev.toIndex;
        explanation = `Computing LIS ending at index i = ${nextAlgorithmState.lisCurrentI}`;
        break;
      }

      case 'LIS_COMPARE': {
        nextMetrics.comparisons++;
        nextAlgorithmState.lisCurrentJ = (ev as any).j ?? ev.toIndex;
        nextAlgorithmState.lisComparison = !!ev.conditionResult;
        nextComparison = {
          left: `arr[${nextAlgorithmState.lisCurrentJ}]: ${ev.rightVal}`,
          right: `arr[${nextAlgorithmState.lisCurrentI}]: ${ev.leftVal}`,
          operator: '<',
          result: !!ev.conditionResult,
          explanation: ev.conditionResult ? `arr[${nextAlgorithmState.lisCurrentJ}] < arr[${nextAlgorithmState.lisCurrentI}] (${ev.rightVal} < ${ev.leftVal}) ➔ Can extend subsequence` : `Not increasing (${ev.rightVal} >= ${ev.leftVal})`,
        };
        explanation = `Comparing arr[${nextAlgorithmState.lisCurrentJ}] < arr[${nextAlgorithmState.lisCurrentI}] ➔ ${ev.conditionResult ? 'TRUE (can extend)' : 'FALSE'}`;
        break;
      }

      case 'LIS_CANDIDATE': {
        explanation = `Candidate LIS length extending from index ${nextAlgorithmState.lisCurrentJ}: dp[${nextAlgorithmState.lisCurrentJ}] + 1 = ${ev.candidateValue}`;
        break;
      }

      case 'LIS_STATE_UPDATE': {
        nextMetrics.assignments++;
        const idx = (ev as any).i ?? ev.index ?? 0;
        if (!nextAlgorithmState.dpTable1D) nextAlgorithmState.dpTable1D = [];
        nextAlgorithmState.dpTable1D[idx] = ev.newValue;
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${idx}`] = 'UPDATED';
        explanation = `dp[${idx}] updated to ${ev.newValue}`;
        break;
      }

      case 'LIS_PARENT_UPDATE': {
        if (!nextAlgorithmState.lisParents) nextAlgorithmState.lisParents = [];
        const idx = (ev as any).i ?? ev.index ?? 0;
        nextAlgorithmState.lisParents[idx] = (ev as any).parentIndex ?? ev.toIndex ?? null;
        explanation = `Parent pointer updated: parent[${idx}] = ${nextAlgorithmState.lisParents[idx]}`;
        break;
      }

      case 'LIS_RECONSTRUCTION_START': {
        nextAlgorithmState.reconstructionActive = true;
        nextAlgorithmState.lisReconstructedIndices = [];
        explanation = `Starting LIS reconstruction starting from index ${ev.index}`;
        break;
      }

      case 'LIS_RECONSTRUCTION_STEP': {
        if (!nextAlgorithmState.lisReconstructedIndices) nextAlgorithmState.lisReconstructedIndices = [];
        const idx = (ev as any).i ?? ev.index ?? 0;
        if (!nextAlgorithmState.lisReconstructedIndices.includes(idx)) {
          nextAlgorithmState.lisReconstructedIndices.push(idx);
        }
        explanation = `Backtracking LIS chain: Included index ${idx} (value = ${ev.value})`;
        break;
      }

      case 'LIS_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `LIS completed. Longest increasing subsequence length = ${ev.value}`;
        break;
      }

      // --- Grid DP ---
      case 'GRID_DP_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = ev.algorithmName || 'Grid DP';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.gridRows = ev.row ?? (ev as any).rows;
        nextAlgorithmState.gridCols = ev.col ?? (ev as any).cols;
        nextAlgorithmState.gridObstacles = Array.isArray((ev as any).obstacles)
          ? (ev as any).obstacles.map((o: any) => typeof o === 'string' ? o.split(',').map(Number) as [number, number] : o)
          : [];
        nextAlgorithmState.dpType = 'TABULATION_2D';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(M × N)', space: 'O(M × N)' };
        explanation = `Started ${nextAlgorithmState.algorithmName} on ${nextAlgorithmState.gridRows} × ${nextAlgorithmState.gridCols} grid`;
        break;
      }

      case 'GRID_CELL_SELECT': {
        const r = ev.row ?? (ev as any).r ?? 0;
        const c = ev.col ?? (ev as any).c ?? 0;
        nextAlgorithmState.gridCurrentCell = [r, c];
        explanation = `Visiting grid cell (${r}, ${c})`;
        break;
      }

      case 'GRID_OBSTACLE_CHECK': {
        const r = ev.row ?? (ev as any).r ?? 0;
        const c = ev.col ?? (ev as any).c ?? 0;
        if (ev.conditionResult || (ev as any).obstacle) {
          if (!nextAlgorithmState.gridObstacles) nextAlgorithmState.gridObstacles = [];
          nextAlgorithmState.gridObstacles.push([r, c]);
        }
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${r},${c}`] = 'CURRENT';
        explanation = `Obstacle check at (${r}, ${c}) ➔ ${ev.conditionResult || (ev as any).obstacle ? 'OBSTACLE DETECTED' : 'CLEAR'}`;
        break;
      }

      case 'GRID_DEPENDENCY_ACCESS': {
        const deps = Array.isArray(ev.dependencies) ? ev.dependencies : [];
        nextAlgorithmState.dpDependencies = deps;
        explanation = `Grid cell dependencies: ${deps.map(d => Array.isArray(d) ? `(${d[0]},${d[1]})` : String(d)).join(' and ')}`;
        break;
      }

      case 'GRID_CANDIDATE': {
        explanation = `Top candidate = ${ev.leftVal ?? ev.candidateValue}, Left candidate = ${ev.rightVal}`;
        break;
      }

      case 'GRID_COMPARE': {
        nextMetrics.comparisons++;
        explanation = `Comparing grid paths: Top (${ev.leftVal}) vs Left (${ev.rightVal}) ➔ Optimal = ${ev.value}`;
        break;
      }

      case 'GRID_STATE_UPDATE': {
        nextMetrics.assignments++;
        const r = ev.row ?? (ev as any).r ?? 0;
        const c = ev.col ?? (ev as any).c ?? 0;
        if (!nextAlgorithmState.dpTable2D) nextAlgorithmState.dpTable2D = [];
        while (nextAlgorithmState.dpTable2D.length <= r) nextAlgorithmState.dpTable2D.push([]);
        nextAlgorithmState.dpTable2D[r][c] = ev.newValue;
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${r},${c}`] = 'UPDATED';
        explanation = `Grid dp[${r}][${c}] = ${ev.newValue}`;
        break;
      }

      case 'GRID_DP_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Grid DP completed with final result = ${ev.value ?? (ev as any).result}`;
        break;
      }

      // --- Interval DP ---
      case 'INTERVAL_DP_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = 'Interval DP';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.intervalLength = (ev as any).length ?? ev.size;
        nextAlgorithmState.dpType = 'TABULATION_2D';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(N³)', space: 'O(N²)' };
        explanation = `Started Interval DP for sequence of size ${nextAlgorithmState.intervalLength}`;
        break;
      }

      case 'INTERVAL_LENGTH_UPDATE': {
        nextAlgorithmState.intervalLength = (ev as any).length ?? ev.windowSize;
        explanation = `Considering interval length L = ${nextAlgorithmState.intervalLength}`;
        break;
      }

      case 'INTERVAL_SELECT': {
        nextAlgorithmState.intervalLeft = ev.leftIndex;
        nextAlgorithmState.intervalRight = ev.rightIndex;
        explanation = `Solving subproblem interval [${ev.leftIndex} ... ${ev.rightIndex}]`;
        break;
      }

      case 'INTERVAL_SPLIT_SELECT': {
        nextAlgorithmState.intervalSplit = ev.splitIndex;
        explanation = `Trying split point k = ${ev.splitIndex} ➔ [${ev.leftIndex}..${ev.splitIndex}] and [${(ev.splitIndex || 0) + 1}..${ev.rightIndex}]`;
        break;
      }

      case 'INTERVAL_LEFT_DEPENDENCY': {
        explanation = `Left subproblem dp[${ev.leftIndex}][${ev.splitIndex}] cost = ${ev.value}`;
        break;
      }

      case 'INTERVAL_RIGHT_DEPENDENCY': {
        explanation = `Right subproblem dp[${ev.splitIndex}][${ev.rightIndex}] cost = ${ev.value}`;
        break;
      }

      case 'INTERVAL_COMBINE': {
        explanation = `Combined interval cost with split k=${ev.splitIndex}: ${ev.candidateValue}`;
        break;
      }

      case 'INTERVAL_STATE_UPDATE': {
        nextMetrics.assignments++;
        const l = ev.leftIndex ?? 0;
        const r = ev.rightIndex ?? 0;
        if (!nextAlgorithmState.dpTable2D) nextAlgorithmState.dpTable2D = [];
        while (nextAlgorithmState.dpTable2D.length <= l) nextAlgorithmState.dpTable2D.push([]);
        nextAlgorithmState.dpTable2D[l][r] = ev.newValue;
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[`${l},${r}`] = 'UPDATED';
        explanation = `Optimal interval cost dp[${l}][${r}] = ${ev.newValue}`;
        break;
      }

      case 'INTERVAL_DP_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Interval DP completed. Optimal value = ${ev.value}`;
        break;
      }

      // --- Tree DP ---
      case 'TREE_DP_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = 'Tree DP';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.treeDpNodeStates = {};
        nextAlgorithmState.treeDpCurrentNode = (ev as any).rootNodeId ?? ev.nodeId;
        nextAlgorithmState.theoreticalComplexity = { time: 'O(N)', space: 'O(N)' };
        explanation = `Started Tree DP rooted at node ${nextAlgorithmState.treeDpCurrentNode}`;
        break;
      }

      case 'TREE_DP_NODE_ENTER': {
        nextAlgorithmState.treeDpCurrentNode = ev.nodeId;
        explanation = `Entered tree node ${ev.nodeId}`;
        break;
      }

      case 'TREE_DP_CHILD_PROCESS': {
        explanation = `Processing subtree child ${ev.childNodeId} of node ${ev.nodeId}`;
        break;
      }

      case 'TREE_DP_STATE_ACCESS': {
        nextMetrics.accesses++;
        explanation = `Accessed subtree DP state of child ${ev.childNodeId || ev.nodeId} = ${ev.value}`;
        break;
      }

      case 'TREE_DP_TRANSITION': {
        explanation = `Subtree transition formula at node ${ev.nodeId}: ${ev.detail || (ev as any).formula}`;
        break;
      }

      case 'TREE_DP_STATE_UPDATE': {
        nextMetrics.assignments++;
        if (!nextAlgorithmState.treeDpNodeStates) nextAlgorithmState.treeDpNodeStates = {};
        nextAlgorithmState.treeDpNodeStates[ev.nodeId || ''] = ev.newValue ?? ev.value;
        explanation = `Tree DP state for node ${ev.nodeId} updated = ${ev.newValue ?? ev.value}`;
        break;
      }

      case 'TREE_DP_NODE_COMPLETE': {
        explanation = `Subtree computation for node ${ev.nodeId} completed = ${ev.value}`;
        break;
      }

      case 'TREE_DP_RETURN': {
        explanation = `Returning DP state from node ${ev.nodeId}: ${ev.value ?? ev.returnValue}`;
        break;
      }

      case 'TREE_DP_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Tree DP completed. Root result = ${ev.value ?? (ev as any).result}`;
        break;
      }

      // --- Bitmask DP ---
      case 'BITMASK_DP_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = 'Bitmask DP';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.bitmask = 0;
        nextAlgorithmState.bitmaskLength = (ev as any).length ?? ev.size;
        nextAlgorithmState.bitmaskSelectedBits = [];
        nextAlgorithmState.dpType = 'TABULATION_1D';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(2^N × N)', space: 'O(2^N)' };
        explanation = `Started Bitmask DP for ${nextAlgorithmState.bitmaskLength} elements (2^${nextAlgorithmState.bitmaskLength} states)`;
        break;
      }

      case 'BITMASK_CREATE': {
        nextAlgorithmState.bitmask = ev.mask;
        const bLen = nextAlgorithmState.bitmaskLength || 4;
        const binStr = (ev.mask ?? 0).toString(2).padStart(bLen, '0');
        const sel: number[] = Array.isArray((ev as any).selectedBits) ? [...(ev as any).selectedBits] : [];
        if (sel.length === 0) {
          for (let b = 0; b < bLen; b++) {
            if ((ev.mask ?? 0) & (1 << b)) sel.push(b);
          }
        }
        nextAlgorithmState.bitmaskSelectedBits = sel;
        explanation = `Active mask: ${ev.mask} (binary: ${binStr}), Selected items: [${sel.join(', ')}]`;
        break;
      }

      case 'BITMASK_BIT_CHECK': {
        nextAlgorithmState.bitmaskBit = ev.bitIndex;
        nextAlgorithmState.bitmaskBitVal = !!ev.bitSet;
        explanation = `Bit check: mask & (1 << ${ev.bitIndex}) ➔ Bit is ${ev.bitSet ? 'SET (1)' : 'CLEAR (0)'}`;
        break;
      }

      case 'BITMASK_BIT_SET': {
        nextAlgorithmState.bitmask = (ev as any).newMask ?? ev.mask ?? Number(ev.value);
        if (!nextAlgorithmState.bitmaskSelectedBits) nextAlgorithmState.bitmaskSelectedBits = [];
        if (ev.bitIndex !== undefined && !nextAlgorithmState.bitmaskSelectedBits.includes(ev.bitIndex)) {
          nextAlgorithmState.bitmaskSelectedBits.push(ev.bitIndex);
        }
        explanation = `Set bit ${ev.bitIndex}: mask ${ev.mask} | (1 << ${ev.bitIndex}) ➔ New mask ${nextAlgorithmState.bitmask}`;
        break;
      }

      case 'BITMASK_BIT_CLEAR': {
        nextAlgorithmState.bitmask = Number(ev.value);
        if (nextAlgorithmState.bitmaskSelectedBits && ev.bitIndex !== undefined) {
          nextAlgorithmState.bitmaskSelectedBits = nextAlgorithmState.bitmaskSelectedBits.filter(b => b !== ev.bitIndex);
        }
        explanation = `Clear bit ${ev.bitIndex}: mask ${ev.mask} & ~(1 << ${ev.bitIndex}) ➔ New mask ${ev.value}`;
        break;
      }

      case 'BITMASK_STATE_ACCESS': {
        nextMetrics.accesses++;
        explanation = `Accessed dp[mask=${ev.mask}][item=${ev.index}] = ${ev.value}`;
        break;
      }

      case 'BITMASK_TRANSITION': {
        explanation = `Bitmask state transition: mask ${ev.mask} ➔ nextMask ${ev.value} (candidate = ${ev.candidateValue})`;
        break;
      }

      case 'BITMASK_STATE_UPDATE': {
        nextMetrics.assignments++;
        const m = ev.mask ?? 0;
        const sub = ev.bitIndex ?? (ev as any).itemIndex;
        const key = sub !== undefined ? `${m},${sub}` : `${m}`;
        if (!nextAlgorithmState.dpTable1D) nextAlgorithmState.dpTable1D = [];
        nextAlgorithmState.dpTable1D[m] = ev.newValue;
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[key] = 'UPDATED';
        explanation = `Updated dp[mask=${m}]: ${ev.oldValue} ➔ ${ev.newValue}`;
        break;
      }

      case 'BITMASK_DP_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Bitmask DP completed with result: ${ev.value}`;
        break;
      }

      // --- Digit DP ---
      case 'DIGIT_DP_START': {
        nextAlgorithmState.category = 'Dynamic Programming';
        nextAlgorithmState.algorithmName = 'Digit DP';
        nextAlgorithmState.status = 'Running';
        nextAlgorithmState.theoreticalComplexity = { time: 'O(Digits × Sum × Constraints)', space: 'O(Digits × Sum)' };
        explanation = `Started Digit DP for ${ev.size || (ev as any).target} digits`;
        break;
      }

      case 'DIGIT_POSITION': {
        nextAlgorithmState.digitPosition = ev.position;
        nextAlgorithmState.digitTight = !!ev.tight;
        nextAlgorithmState.digitStarted = !!ev.started;
        nextAlgorithmState.digitSum = ev.sum;
        nextAlgorithmState.digitRemainder = ev.remainder;
        explanation = `Digit DP state: pos = ${ev.position}, tight = ${ev.tight}, started = ${ev.started}, sum = ${ev.sum}`;
        break;
      }

      case 'DIGIT_OPTION_SELECT': {
        nextAlgorithmState.digitSelected = ev.digit;
        if (Array.isArray((ev as any).options)) nextAlgorithmState.digitOptions = [...(ev as any).options];
        explanation = `Selected digit ${ev.digit} at position ${ev.position}`;
        break;
      }

      case 'DIGIT_TIGHT_UPDATE': {
        nextAlgorithmState.digitTight = ev.tight !== undefined ? !!ev.tight : !!ev.conditionResult;
        explanation = `Tight constraint updated at position ${ev.position}: ${nextAlgorithmState.digitTight}`;
        break;
      }

      case 'DIGIT_STARTED_UPDATE': {
        nextAlgorithmState.digitStarted = !!ev.started;
        explanation = `Number formation started: ${ev.started}`;
        break;
      }

      case 'DIGIT_CACHE_LOOKUP': {
        explanation = `Checking memoized digit state (pos=${ev.position}, tight=${ev.tight}, sum=${ev.sum})`;
        break;
      }

      case 'DIGIT_CACHE_HIT': {
        nextMetrics.cacheHits++;
        explanation = `Digit DP Cache HIT at pos=${ev.position}, sum=${ev.sum} ➔ ${ev.value} (pruned)`;
        break;
      }

      case 'DIGIT_CACHE_MISS': {
        nextMetrics.cacheMisses++;
        explanation = `Digit DP Cache MISS at pos=${ev.position}, sum=${ev.sum} ➔ Computing branches...`;
        break;
      }

      case 'DIGIT_STATE_TRANSITION': {
        explanation = `Digit transition: placed digit ${ev.digit} ➔ New running sum = ${ev.sum}`;
        break;
      }

      case 'DIGIT_STATE_UPDATE': {
        nextMetrics.assignments++;
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[String(ev.position ?? 0)] = 'UPDATED';
        explanation = `Stored memoized count for (pos=${ev.position}, tight=${ev.tight}, sum=${ev.sum}) = ${ev.newValue}`;
        break;
      }

      case 'DIGIT_DP_END': {
        nextAlgorithmState.status = 'Completed';
        explanation = `Digit DP completed. Total valid numbers matching criteria = ${ev.value ?? (ev as any).result}`;
        break;
      }

      // --- Memoization ---
      case 'MEMO_LOOKUP': {
        const key = String(ev.key ?? '');
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[key] = (ev as any).hit ? 'CACHE_HIT' : 'CACHE_MISS';
        explanation = `Memoization lookup for key: ${JSON.stringify(ev.key)}`;
        break;
      }

      case 'MEMO_HIT': {
        nextMetrics.cacheHits++;
        const key = String(ev.key ?? '');
        if (!nextAlgorithmState.memoEntries) nextAlgorithmState.memoEntries = [];
        nextAlgorithmState.memoEntries.push({ key: ev.key, value: ev.value, status: 'HIT' });
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[key] = 'CACHE_HIT';
        explanation = `Memoization HIT: key ${JSON.stringify(ev.key)} ➔ Return cached ${ev.value}`;
        break;
      }

      case 'MEMO_MISS': {
        nextMetrics.cacheMisses++;
        const key = String(ev.key ?? '');
        if (!nextAlgorithmState.memoEntries) nextAlgorithmState.memoEntries = [];
        nextAlgorithmState.memoEntries.push({ key: ev.key, value: null, status: 'MISS' });
        if (!nextAlgorithmState.dpCellStatus) nextAlgorithmState.dpCellStatus = {};
        nextAlgorithmState.dpCellStatus[key] = 'CACHE_MISS';
        explanation = `Memoization MISS: key ${JSON.stringify(ev.key)} not yet in cache`;
        break;
      }

      case 'MEMO_COMPUTE': {
        explanation = `Computing state for key: ${JSON.stringify(ev.key)}`;
        break;
      }

      case 'MEMO_STORE': {
        nextMetrics.assignments++;
        if (!nextAlgorithmState.memoEntries) nextAlgorithmState.memoEntries = [];
        const existing = nextAlgorithmState.memoEntries.find(e => JSON.stringify(e.key) === JSON.stringify(ev.key));
        if (existing) {
          existing.value = ev.value;
        } else {
          nextAlgorithmState.memoEntries.push({ key: ev.key, value: ev.value, status: 'HIT' });
        }
        if (!nextAlgorithmState.dpSparseMap) nextAlgorithmState.dpSparseMap = {};
        nextAlgorithmState.dpSparseMap[String(ev.key)] = ev.value;
        explanation = `Stored in memoization cache: ${JSON.stringify(ev.key)} ➔ ${ev.value}`;
        break;
      }

      case 'MEMO_RETURN': {
        explanation = `Returning subproblem result: ${ev.value} for key ${JSON.stringify(ev.key)}`;
        break;
      }

      case 'CONSOLE_OUTPUT': {
        nextConsole.push(String(ev.message));
        explanation = `Console output: ${ev.message}`;
        break;
      }

      case 'EXCEPTION': {
        const exName = ev.detail ? ev.detail.split('.').pop() || 'RuntimeError' : 'RuntimeError';
        const knownTypes: ExecutionError['type'][] = [
          'NullPointerException',
          'ArrayIndexOutOfBoundsException',
          'ArithmeticException',
          'SyntaxError',
          'RuntimeError',
        ];
        const matchedType = knownTypes.find((t) => exName.includes(t)) || 'RuntimeError';
        let detail = ev.detail || 'Exception caught by runtime';
        if (matchedType === 'NullPointerException') {
          detail = 'NullPointerException: Attempted to access a member, method, or index through a null reference.';
        } else if (matchedType === 'ArrayIndexOutOfBoundsException') {
          detail = `ArrayIndexOutOfBoundsException: Attempted to access an array element outside valid bounds. Message: ${ev.message || ''}`;
        } else if (matchedType === 'ArithmeticException') {
          detail = `ArithmeticException: Arithmetic failure (e.g., division by zero). Message: ${ev.message || ''}`;
        }
        nextError = {
          type: matchedType,
          message: ev.message || exName,
          line: ev.line || currentLine,
          detail,
        };
        explanation = `Exception (${exName}) thrown on line ${ev.line}: ${ev.message}`;
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

    // Phase 10: Custom OOP Objects in Heap
    for (const obj of Object.values(nextCustomObjects)) {
      const refVars = Object.values(nextVariables)
        .filter(
          v =>
            v.refTargetId === obj.id ||
            v.value === obj.id ||
            (typeof v.value === 'string' &&
              (v.value.includes(`@${obj.id}`) ||
                v.value.includes(`${obj.className}@`) ||
                v.value.includes(`@${obj.id.replace(/\D/g, '')}`)))
        )
        .map(v => v.name);

      const estBytes = 24 + Object.keys(obj.fields).length * 8;
      heapBytes += estBytes;
      nextHeap.push({
        id: obj.id.startsWith('@') ? obj.id : `@${obj.id}`,
        type: obj.className,
        className: obj.className,
        label: `${obj.className}#${obj.id.replace(/\D/g, '') || '1'}`,
        fields: { ...obj.fields },
        estimatedBytes: estBytes,
        referencesTo: Object.values(obj.fields)
          .filter(v => typeof v === 'string' && (v.startsWith('obj-') || v.startsWith('@obj-') || v.startsWith('obj_')))
          .map(v => v.replace(/^@/, '')),
        referencesFrom: refVars,
        gcEligible: refVars.length === 0,
        creationStep: obj.creationStep,
        lifecycle: refVars.length === 0 ? 'GC_ELIGIBLE' : obj.lifecycle,
      });
    }

    // Ensure main thread's callStack mirrors nextCallStack
    if (nextThreads['main']) {
      nextThreads['main'].callStack = nextCallStack;
    }

    // Calculate educational delta: "Why did this change?" (Section 41)
    let changeTarget = '';
    let changeOldVal: any = undefined;
    let changeNewVal: any = undefined;
    let changeReason = explanation;

    if (ev.type === 'ARRAY_UPDATE') {
      const arrId = ev.structureId || ev.arrayId || 'arr';
      changeTarget = `${arrId}[${ev.index}]`;
      changeOldVal = ev.oldValue;
      changeNewVal = ev.newValue;
      changeReason = `Assignment at line ${ev.line}`;
    } else if (ev.type === 'VARIABLE_UPDATE') {
      changeTarget = ev.variable || 'var';
      changeOldVal = ev.oldValue;
      changeNewVal = ev.newValue;
      changeReason = `Assignment at line ${ev.line}`;
    } else if (ev.type.startsWith('QUEUE_') || ev.type.startsWith('STACK_') || ev.type.startsWith('DEQUE_')) {
      changeTarget = ev.structureId || ev.variable || 'collection';
      changeReason = `Collection operation (${ev.type.toLowerCase().replace('_', ' ')}) on line ${ev.line}`;
    } else if (ev.type === 'BIT_OP_EXECUTE' || ev.type === 'BIT_SHIFT') {
      changeTarget = ev.variable || 'bits';
      changeNewVal = ev.meta?.result;
      changeReason = `Bitwise ${ev.meta?.operator || 'operation'} on line ${ev.line}`;
    } else if (ev.type.startsWith('DSU_')) {
      changeTarget = 'DSU Partition';
      changeReason = `Disjoint set operation (${ev.type}) on line ${ev.line}`;
    } else if (ev.type === 'MATRIX_UPDATE') {
      changeTarget = `${ev.structureId || ev.variable || 'matrix'}[${ev.row}][${ev.col}]`;
      changeOldVal = ev.oldValue;
      changeNewVal = ev.newValue;
      changeReason = `Matrix update at line ${ev.line}`;
    }

    if (changeTarget) {
      nextAlgorithmState.whyChanged = {
        target: changeTarget,
        previousValue: changeOldVal !== undefined ? changeOldVal : 'initial',
        newValue: changeNewVal !== undefined ? changeNewVal : 'updated',
        reason: changeReason,
        sourceLine: currentLine,
      };
    }

    // Visualization Layers & Detection Confidence (Section 44, 50, 51)
    if (nextAlgorithmState.category) {
      nextAlgorithmState.detectionConfidence = 'CONCEPTUAL_VIEW';
      nextAlgorithmState.confidencePercent = 95;
    } else if (Object.keys(nextStructures).some(k => nextStructures[k].type === 'graph' && nextStructures[k].id.startsWith('graph_'))) {
      nextAlgorithmState.detectionConfidence = 'DERIVED_STRUCTURE';
      nextAlgorithmState.confidencePercent = 85;
      nextAlgorithmState.derivationLabel = 'Derived Graph View';
    } else if (Object.keys(nextStructures).length > 0 || Object.keys(nextVariables).length > 0 || Object.keys(nextCustomObjects).length > 0) {
      nextAlgorithmState.detectionConfidence = 'RUNTIME_STATE';
      nextAlgorithmState.confidencePercent = 100;
    } else {
      nextAlgorithmState.detectionConfidence = 'UNKNOWN';
      nextAlgorithmState.confidencePercent = 60;
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
    // Phase 10 JVM tracking
    currentStaticFields = nextStaticFields;
    currentThreads = nextThreads;
    currentLocks = nextLocks;
    currentDeadlock = nextDeadlock;
    currentActiveConcept = nextActiveConcept;
    currentCustomObjects = nextCustomObjects;
    currentStringPool = nextStringPool;

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
      // Phase 10: JVM & OOP State
      staticFields: nextStaticFields,
      threads: nextThreads,
      locks: nextLocks,
      deadlockDetected: nextDeadlock,
      activeJavaConcept: nextActiveConcept,
      stringPool: nextStringPool,
    });
  }

  return steps;
}
