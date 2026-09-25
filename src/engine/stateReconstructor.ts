import {
  ExecutionEvent,
  ExecutionStep,
  VariableInfo,
  CallFrame,
  DataStructureState,
  HeapObject,
  ComparisonInfo,
  ExecutionError,
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
  const currentHeap: HeapObject[] = [];

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
        activeIndices: [],
        comparingIndices: [],
        swappingIndices: undefined,
        pointers: st.pointers ? { ...st.pointers } : {},
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

    // Calculate memory stats
    let stackBytes = 0;
    for (const v of Object.values(nextVariables)) {
      stackBytes += v.estimatedBytes;
    }
    let heapBytes = 0;
    for (const st of Object.values(nextStructures)) {
      if (st.arrayData) heapBytes += 16 + st.arrayData.length * 4;
      if (st.stackData) heapBytes += 24 + st.stackData.length * 8;
      if (st.queueData) heapBytes += 24 + st.queueData.length * 8;
      if (st.dequeData) heapBytes += 24 + st.dequeData.length * 8;
      if (st.priorityQueueData) heapBytes += 32 + st.priorityQueueData.length * 8;
      if (st.linkedListData) heapBytes += 24 + Object.keys(st.linkedListData.nodes).length * 24;
      if (st.mapData) heapBytes += 48 + st.mapData.entries.length * 32;
      if (st.setData) heapBytes += 32 + st.setData.length * 8;
    }

    currentVariables = nextVariables;
    currentStructures = nextStructures;
    currentCallStack = nextCallStack;
    currentConsole = nextConsole;
    currentPointers = nextPointers;
    currentComparison = nextComparison;
    currentError = nextError;

    steps.push({
      stepIndex: i,
      totalSteps: events.length,
      line: currentLine,
      event: ev,
      explanation,
      variables: currentVariables,
      callStack: currentCallStack,
      structures: currentStructures,
      heap: currentHeap,
      consoleOutput: currentConsole,
      activePointers: currentPointers,
      comparison: currentComparison,
      error: currentError,
      memoryStats: {
        stackBytes,
        heapBytes,
        totalBytes: stackBytes + heapBytes,
      },
    });
  }

  return steps;
}
