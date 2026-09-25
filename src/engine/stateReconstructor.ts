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
