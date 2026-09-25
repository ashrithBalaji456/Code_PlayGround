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
  | 'TREE_CREATE'
  | 'TREE_NODE_CREATE'
  | 'TREE_NODE_DELETE'
  | 'TREE_LINK'
  | 'TREE_LINK_LEFT'
  | 'TREE_LINK_RIGHT'
  | 'TREE_UNLINK_LEFT'
  | 'TREE_UNLINK_RIGHT'
  | 'TREE_NODE_ACCESS'
  | 'TREE_TRAVERSE'
  | 'TREE_CLEAR'
  | 'TREE_ROOT_UPDATE'
  | 'TREE_TRAVERSAL_START'
  | 'TREE_NODE_VISIT'
  | 'TREE_TRAVERSAL_END'
  | 'TREE_ROTATE_LEFT'
  | 'TREE_ROTATE_RIGHT'
  | 'TREE_REBALANCE'
  | 'BST_CREATE'
  | 'BST_INSERT'
  | 'BST_SEARCH'
  | 'BST_DELETE'
  | 'BST_COMPARE'
  | 'BST_TRAVERSE'
  | 'BST_NODE_VISIT'
  | 'BST_ROTATE'
  | 'BST_ROOT_UPDATE'
  | 'BST_SEARCH_START'
  | 'BST_MOVE_LEFT'
  | 'BST_MOVE_RIGHT'
  | 'BST_NODE_FOUND'
  | 'BST_SEARCH_END'
  | 'HEAP_CREATE'
  | 'HEAP_INSERT'
  | 'HEAP_REMOVE'
  | 'HEAP_PEEK'
  | 'HEAP_COMPARE'
  | 'HEAP_SWAP'
  | 'HEAPIFY_UP'
  | 'HEAPIFY_DOWN'
  | 'HEAP_CLEAR'
  | 'TRIE_CREATE'
  | 'TRIE_NODE_CREATE'
  | 'TRIE_NODE_ACCESS'
  | 'TRIE_EDGE_CREATE'
  | 'TRIE_WORD_COMPLETE'
  | 'TRIE_SEARCH_START'
  | 'TRIE_SEARCH_STEP'
  | 'TRIE_WORD_FOUND'
  | 'TRIE_WORD_NOT_FOUND'
  | 'TRIE_REMOVE'
  | 'TRIE_CLEAR'
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
  structureType?: 'array' | 'matrix' | 'stack' | 'queue' | 'deque' | 'linkedlist' | 'tree' | 'bst' | 'heap' | 'trie' | 'map' | 'set' | 'graph' | 'priorityqueue';
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
  // Phase 3 Hierarchical fields
  nodeId?: string;
  parentNodeId?: string;
  childNodeId?: string;
  traversal?: string;
  char?: string;
  isWord?: boolean;
  word?: string;
  heapType?: 'MIN' | 'MAX';
  leftVal?: any;
  rightVal?: any;
  operator?: string;
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
  parentId?: string | null;
  isLeft?: boolean;
  highlighted?: boolean;
  color?: string;
  balanceFactor?: number;
}

export interface TrieNodeData {
  id: string;
  char: string;
  isWord: boolean;
  children: Record<string, string>; // char -> childNodeId
  parentId?: string | null;
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
  type: 'array' | 'matrix' | 'stack' | 'queue' | 'deque' | 'linkedlist' | 'tree' | 'bst' | 'heap' | 'trie' | 'map' | 'set' | 'graph' | 'priorityqueue';
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
    traversalOrder?: any[];
    activeTraversalNodeId?: string | null;
    traversalType?: string;
    comparisonStep?: string;
    selectedNodeId?: string | null;
  };
  heapData?: {
    array: any[];
    isMinHeap: boolean;
    comparingIndices?: [number, number];
    swappingIndices?: [number, number];
    lastAction?: string;
  };
  trieData?: {
    rootId: string;
    nodes: Record<string, TrieNodeData>;
    wordsCount: number;
    words: string[];
    activeSearchWord?: string;
    activeSearchPath?: string[];
    searchResult?: 'FOUND' | 'NOT_FOUND' | null;
    selectedNodeId?: string | null;
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
