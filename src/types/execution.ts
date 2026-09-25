export type ExecutionStatus =
  | 'IDLE'
  | 'COMPILING'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ERROR'
  | 'STOPPED';

export type EventType =
  | 'PROGRAM_START'
  | 'PROGRAM_END'
  | 'LINE_EXECUTE'
  | 'VARIABLE_CREATE'
  | 'VARIABLE_UPDATE'
  | 'VARIABLE_DELETE'
  | 'ARRAY_CREATE'
  | 'ARRAY_ACCESS'
  | 'ARRAY_UPDATE'
  | 'ARRAY_SWAP'
  | 'ARRAY_HIGHLIGHT'
  | 'CONSOLE_OUTPUT'
  | 'REFERENCE_CREATE'
  | 'REFERENCE_UPDATE'
  | 'REFERENCE_NULL'
  | 'STACK_CREATE'
  | 'STACK_PUSH'
  | 'STACK_POP'
  | 'STACK_PEEK'
  | 'STACK_CLEAR'
  | 'STACK_ACCESS'
  | 'QUEUE_CREATE'
  | 'QUEUE_ENQUEUE'
  | 'QUEUE_DEQUEUE'
  | 'QUEUE_PEEK'
  | 'QUEUE_CLEAR'
  | 'QUEUE_ACCESS'
  | 'DEQUE_CREATE'
  | 'DEQUE_ADD_FIRST'
  | 'DEQUE_ADD_LAST'
  | 'DEQUE_REMOVE_FIRST'
  | 'DEQUE_REMOVE_LAST'
  | 'DEQUE_PEEK_FIRST'
  | 'DEQUE_PEEK_LAST'
  | 'DEQUE_CLEAR'
  | 'LINKEDLIST_CREATE'
  | 'LINKEDLIST_ADD'
  | 'LINKEDLIST_ADD_FIRST'
  | 'LINKEDLIST_ADD_LAST'
  | 'LINKEDLIST_REMOVE'
  | 'LINKEDLIST_REMOVE_FIRST'
  | 'LINKEDLIST_REMOVE_LAST'
  | 'LINKEDLIST_SET'
  | 'LINKEDLIST_GET'
  | 'LINKEDLIST_CLEAR'
  | 'NODE_CREATE'
  | 'NODE_LINK'
  | 'NODE_UNLINK'
  | 'TREE_NODE_CREATE'
  | 'TREE_LINK'
  | 'TREE_UNLINK'
  | 'TREE_ROTATE'
  | 'MAP_CREATE'
  | 'MAP_INSERT'
  | 'MAP_LOOKUP'
  | 'MAP_UPDATE'
  | 'MAP_DELETE'
  | 'MAP_CLEAR'
  | 'MAP_ACCESS'
  | 'HASH_CALCULATE'
  | 'BUCKET_SELECT'
  | 'SET_CREATE'
  | 'SET_ADD'
  | 'SET_REMOVE'
  | 'SET_LOOKUP'
  | 'SET_CLEAR'
  | 'SET_ACCESS'
  | 'PRIORITYQUEUE_CREATE'
  | 'PRIORITYQUEUE_ADD'
  | 'PRIORITYQUEUE_POLL'
  | 'PRIORITYQUEUE_PEEK'
  | 'PRIORITYQUEUE_CLEAR'
  | 'GRAPH_NODE_CREATE'
  | 'GRAPH_EDGE_CREATE'
  | 'GRAPH_EDGE_DELETE'
  | 'GRAPH_VISIT'
  | 'FUNCTION_CALL'
  | 'FUNCTION_RETURN'
  | 'LOOP_START'
  | 'LOOP_ITERATION'
  | 'LOOP_END'
  | 'CONDITION_EVALUATE'
  | 'COMPARE'
  | 'SWAP'
  | 'OUTPUT'
  | 'MEMORY_ALLOCATE'
  | 'MEMORY_FREE'
  | 'EXCEPTION';

export interface ExecutionEvent {
  type: EventType;
  line: number;
  variable?: string;
  structureId?: string;
  structureType?: 'array' | 'matrix' | 'stack' | 'queue' | 'linkedlist' | 'tree' | 'map' | 'set' | 'graph';
  dataType?: string;
  values?: any;
  value?: any;
  oldValue?: any;
  newValue?: any;
  index?: number | [number, number];
  fromIndex?: number;
  toIndex?: number;
  functionName?: string;
  arguments?: Record<string, any>;
  returnValue?: any;
  condition?: string;
  conditionResult?: boolean;
  message?: string;
  arrayId?: string;
  step?: number;
  key?: any;
  hash?: number;
  bucket?: number;
  size?: number;
  detail?: string;
  meta?: Record<string, any>;
}

export interface VariableInfo {
  name: string;
  type: string;
  value: any;
  scope: string; // e.g., 'main' or function name
  isReference: boolean;
  refTargetId?: string;
  estimatedBytes: number;
}

export interface CallFrame {
  id: string;
  functionName: string;
  arguments: Record<string, any>;
  localVariables: Record<string, VariableInfo>;
  line: number;
  returnValue?: any;
  depth: number;
}

export interface LinkedListNode {
  id: string;
  value: any;
  nextId: string | null;
  prevId?: string | null;
  highlighted?: boolean;
}

export interface TreeNodeData {
  id: string;
  value: any;
  leftId: string | null;
  rightId: string | null;
  highlighted?: boolean;
  color?: string;
}

export interface GraphNodeData {
  id: string;
  label: string;
  x?: number;
  y?: number;
  visited?: boolean;
  highlighted?: boolean;
  color?: string;
}

export interface GraphEdgeData {
  source: string;
  target: string;
  weight?: number;
  highlighted?: boolean;
  directed?: boolean;
}

export interface DataStructureState {
  id: string;
  name: string;
  type: 'array' | 'matrix' | 'stack' | 'queue' | 'deque' | 'linkedlist' | 'tree' | 'map' | 'set' | 'graph' | 'priorityqueue';
  dataType: string;
  size?: number;
  elements?: any[];
  // Specific data representations:
  arrayData?: any[];
  matrixData?: any[][];
  stackData?: any[];
  queueData?: any[];
  dequeData?: any[];
  priorityQueueData?: any[];
  linkedListData?: {
    headId: string | null;
    nodes: Record<string, LinkedListNode>;
  };
  treeData?: {
    rootId: string | null;
    nodes: Record<string, TreeNodeData>;
  };
  mapData?: {
    entries: { key: any; value: any; hash: number; bucket: number }[];
    bucketCount: number;
  };
  setData?: any[];
  graphData?: {
    nodes: GraphNodeData[];
    edges: GraphEdgeData[];
  };
  metadata?: Record<string, any>;
  // Visual indicators
  activeIndices?: number[];
  comparingIndices?: number[];
  swappingIndices?: [number, number];
  pointers?: Record<string, number | string>; // e.g. { i: 2, top: 1, head: "node-1" }
  lastOperation?: string;
}

export interface HeapObject {
  id: string;
  type: string;
  label: string;
  fields: Record<string, any>;
  estimatedBytes: number;
  referencesTo: string[];
}

export interface ComparisonInfo {
  left: string | number;
  right: string | number;
  operator: string;
  result: boolean | number;
  explanation: string;
}

export interface ExecutionError {
  type: 'NullPointerException' | 'ArrayIndexOutOfBoundsException' | 'ArithmeticException' | 'SyntaxError' | 'RuntimeError';
  message: string;
  line: number;
  variableName?: string;
  detail: string;
  brokenReference?: {
    source: string;
    target: string | null;
  };
}

export interface ExecutionStep {
  stepIndex: number;
  totalSteps?: number;
  line: number;
  event: ExecutionEvent;
  explanation: string;
  variables: Record<string, VariableInfo>;
  callStack: CallFrame[];
  structures: Record<string, DataStructureState>;
  heap: HeapObject[];
  consoleOutput: string[];
  activePointers: Record<string, any>;
  comparison: ComparisonInfo | null;
  error: ExecutionError | null;
  memoryStats: {
    stackBytes: number;
    heapBytes: number;
    totalBytes: number;
  };
}

export type SupportedLanguage = 'java' | 'python';

export interface CodePreset {
  id: string;
  title: string;
  category: 'Arrays & Sorting' | 'Stacks & Queues' | 'Linked Lists' | 'Trees & Heaps' | 'Hash Tables' | 'Recursion' | 'Bitwise' | 'Error Diagnostics';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: SupportedLanguage;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  explanation: string;
}
