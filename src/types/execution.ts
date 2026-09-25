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
  | 'GRAPH_CREATE'
  | 'GRAPH_DELETE'
  | 'GRAPH_NODE_CREATE'
  | 'GRAPH_NODE_DELETE'
  | 'GRAPH_NODE_ACCESS'
  | 'GRAPH_EDGE_CREATE'
  | 'GRAPH_EDGE_DELETE'
  | 'GRAPH_EDGE_ACCESS'
  | 'GRAPH_EDGE_WEIGHT_UPDATE'
  | 'GRAPH_CLEAR'
  | 'GRAPH_ROOT_UPDATE'
  | 'GRAPH_NEIGHBORS_ACCESS'
  | 'GRAPH_NODE_VISIT'
  | 'GRAPH_EDGE_TRAVERSE'
  | 'GRAPH_VISIT'
  | 'BFS_START'
  | 'BFS_NODE_DISCOVER'
  | 'BFS_NODE_VISIT'
  | 'BFS_EDGE_TRAVERSE'
  | 'BFS_ENQUEUE'
  | 'BFS_DEQUEUE'
  | 'BFS_END'
  | 'DFS_START'
  | 'DFS_NODE_DISCOVER'
  | 'DFS_NODE_VISIT'
  | 'DFS_EDGE_TRAVERSE'
  | 'DFS_CALL'
  | 'DFS_RETURN'
  | 'DFS_BACKTRACK'
  | 'DFS_ALREADY_VISITED'
  | 'DFS_END'
  | 'DIJKSTRA_START'
  | 'DISTANCE_INITIALIZE'
  | 'DIJKSTRA_NODE_SELECT'
  | 'DIJKSTRA_EDGE_RELAX'
  | 'DISTANCE_UPDATE'
  | 'DIJKSTRA_QUEUE_INSERT'
  | 'DIJKSTRA_QUEUE_REMOVE'
  | 'DIJKSTRA_NODE_FINALIZE'
  | 'DIJKSTRA_END'
  // Phase 5 Algorithm & Pattern Events
  // Searching
  | 'LINEAR_SEARCH_START'
  | 'LINEAR_SEARCH_ACCESS'
  | 'LINEAR_SEARCH_COMPARE'
  | 'LINEAR_SEARCH_MATCH'
  | 'LINEAR_SEARCH_NOT_FOUND'
  | 'LINEAR_SEARCH_END'
  | 'BINARY_SEARCH_START'
  | 'BINARY_SEARCH_RANGE'
  | 'BINARY_SEARCH_MID'
  | 'BINARY_SEARCH_COMPARE'
  | 'BINARY_SEARCH_RANGE_UPDATE'
  | 'BINARY_SEARCH_FOUND'
  | 'BINARY_SEARCH_NOT_FOUND'
  | 'BINARY_SEARCH_END'
  // Sorting
  | 'SORT_START'
  | 'SORT_COMPARE'
  | 'SORT_SWAP'
  | 'SORT_ASSIGN'
  | 'SORT_RANGE'
  | 'SORT_PARTITION'
  | 'SORT_MERGE'
  | 'SORT_COMPLETE'
  | 'QUICK_SORT_START'
  | 'QUICK_SORT_RANGE'
  | 'QUICK_SORT_PIVOT'
  | 'QUICK_SORT_COMPARE'
  | 'QUICK_SORT_PARTITION'
  | 'QUICK_SORT_SWAP'
  | 'QUICK_SORT_RECURSE'
  | 'QUICK_SORT_RETURN'
  | 'QUICK_SORT_END'
  // Array Patterns
  | 'TWO_POINTER_START'
  | 'TWO_POINTER_COMPARE'
  | 'TWO_POINTER_MOVE_LEFT'
  | 'TWO_POINTER_MOVE_RIGHT'
  | 'TWO_POINTER_UPDATE'
  | 'TWO_POINTER_END'
  | 'WINDOW_START'
  | 'WINDOW_EXPAND'
  | 'WINDOW_SHRINK'
  | 'WINDOW_ACCESS'
  | 'WINDOW_UPDATE'
  | 'WINDOW_RESULT'
  | 'WINDOW_END'
  | 'PREFIX_SUM_START'
  | 'PREFIX_SUM_ACCESS'
  | 'PREFIX_SUM_UPDATE'
  | 'PREFIX_SUM_END'
  | 'DIFFERENCE_ARRAY_START'
  | 'DIFFERENCE_ARRAY_UPDATE'
  | 'DIFFERENCE_ARRAY_RECONSTRUCT'
  | 'DIFFERENCE_ARRAY_END'
  | 'KADANE_START'
  | 'KADANE_UPDATE'
  | 'KADANE_BEST_UPDATE'
  | 'KADANE_RANGE_UPDATE'
  | 'KADANE_END'
  // Recursion & Backtracking
  | 'RECURSION_START'
  | 'RECURSION_CALL'
  | 'RECURSION_BASE_CASE'
  | 'RECURSION_RETURN'
  | 'RECURSION_BACKTRACK'
  | 'RECURSION_END'
  | 'BACKTRACK_START'
  | 'BACKTRACK_CHOICE'
  | 'BACKTRACK_ENTER'
  | 'BACKTRACK_SUCCESS'
  | 'BACKTRACK_FAILURE'
  | 'BACKTRACK_UNDO'
  | 'BACKTRACK_RETURN'
  | 'BACKTRACK_END'
  // Dynamic Programming
  | 'DP_START'
  | 'DP_STATE_CREATE'
  | 'DP_STATE_ACCESS'
  | 'DP_STATE_UPDATE'
  | 'DP_TRANSITION'
  | 'DP_CACHE_HIT'
  | 'DP_CACHE_MISS'
  | 'DP_BASE_CASE'
  | 'DP_END'
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
  // Phase 4 Graph & Algorithm fields
  sourceNodeId?: string;
  targetNodeId?: string;
  edgeId?: string;
  directed?: boolean;
  weighted?: boolean;
  weight?: number;
  oldDistance?: number | string;
  newDistance?: number | string;
  distance?: number | string;
  path?: string[];
  neighbors?: string[];
  cycle?: boolean;
  startNodeId?: string;
  queueVar?: string;
  // Phase 5 Algorithm fields
  algorithmId?: string;
  algorithmName?: string;
  target?: any;
  low?: number;
  mid?: number;
  high?: number;
  rangeStart?: number;
  rangeEnd?: number;
  pivotIndex?: number;
  pivotValue?: any;
  pointerName?: string;
  pointerIndex?: number;
  windowStart?: number;
  windowEnd?: number;
  windowSize?: number;
  currentSum?: any;
  bestSum?: any;
  currentStart?: number;
  bestStart?: number;
  bestEnd?: number;
  callId?: string;
  depth?: number;
  choice?: string;
  stateValue?: any;
  dpId?: string;
  dpType?: 'MEMOIZATION' | 'TABULATION_1D' | 'TABULATION_2D';
  row?: number;
  col?: number;
  transitionFormula?: string;
  previousCells?: [number, number][];
  isHit?: boolean;
  candidates?: any[];
  found?: boolean;
  stateKey?: any;
  dimensions?: number[];
  args?: Record<string, any>;
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

export type GraphNodeState = 'UNVISITED' | 'DISCOVERED' | 'PROCESSING' | 'VISITED' | 'FINALIZED';

export interface GraphNodeData {
  id: string;
  label: string;
  value?: any;
  state?: GraphNodeState;
  distance?: number | string;
  x?: number;
  y?: number;
  visited?: boolean;
  highlighted?: boolean;
  color?: string;
  degree?: number;
  inNeighbors?: string[];
  outNeighbors?: string[];
  metadata?: Record<string, any>;
}

export type GraphEdgeState = 'NORMAL' | 'ACTIVE' | 'TRAVERSED' | 'SELECTED' | 'RELAXED' | 'REJECTED' | 'CYCLE' | 'PATH';

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  directed: boolean;
  weighted?: boolean;
  weight?: number;
  state?: GraphEdgeState;
  highlighted?: boolean;
  color?: string;
  metadata?: Record<string, any>;
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
    directed: boolean;
    weighted: boolean;
    nodes: Record<string, GraphNodeData>;
    nodeList: GraphNodeData[];
    edges: Record<string, GraphEdgeData>;
    edgeList: GraphEdgeData[];
    startNodeId?: string | null;
    currentNodeId?: string | null;
    activeEdgeId?: string | null;
    selectedNodeId?: string | null;
    selectedEdgeId?: string | null;
    algorithm?: 'BFS' | 'DFS' | 'DIJKSTRA' | null;
    algorithmPhase?: string;
    visitedOrder?: string[];
    queueState?: string[];
    distances?: Record<string, number | string>;
    shortestPath?: string[];
    cycleDetected?: boolean;
    cycleEdges?: string[];
  };
  metadata?: Record<string, any>;
  // Visual indicators
  activeIndices?: number[];
  comparingIndices?: number[];
  swappingIndices?: [number, number];
  pointers?: Record<string, number | string>; // e.g. { i: 2, top: 1, head: "node-1" }
  pointerBadges?: Record<number, string[]>; // e.g. { 0: ['L', 'start'], 4: ['R', 'end'] }
  windowRange?: [number, number]; // [start, end] for sliding window
  searchRange?: [number, number]; // [low, high] for binary search
  pivotIndex?: number; // for quicksort partition
  sortedIndices?: number[]; // indices guaranteed sorted
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

export interface RecursionTreeNode {
  id: string;
  parentId: string | null;
  fnName: string;
  args: Record<string, any>;
  depth: number;
  status: 'CALLING' | 'BASE_CASE' | 'RETURNED' | 'BACKTRACKED';
  returnValue?: any;
  children: string[];
}

export interface AlgorithmMetrics {
  comparisons: number;
  swaps: number;
  accesses: number;
  assignments: number;
  functionCalls: number;
  recursiveCalls: number;
  cacheHits: number;
  cacheMisses: number;
}

export type AlgorithmCategory =
  | 'Searching'
  | 'Sorting'
  | 'Array Patterns'
  | 'Recursion'
  | 'Backtracking'
  | 'Divide & Conquer'
  | 'Greedy'
  | 'Dynamic Programming';

export interface AlgorithmState {
  algorithmName?: string;
  category?: AlgorithmCategory;
  status?: string;
  phase?: string;
  // Searching
  target?: any;
  searchLow?: number;
  searchMid?: number;
  searchHigh?: number;
  searchResult?: 'SEARCHING' | 'FOUND' | 'NOT_FOUND';
  foundIndex?: number;
  // Sorting
  sortRange?: [number, number];
  pivotIndex?: number;
  pivotValue?: any;
  sortedIndices?: number[];
  partitionLeft?: number;
  partitionRight?: number;
  currentMinIndex?: number;
  currentMinValue?: any;
  passNumber?: number;
  // Array Patterns
  leftPointer?: number;
  rightPointer?: number;
  windowStart?: number;
  windowEnd?: number;
  windowSize?: number;
  windowSum?: any;
  windowBest?: any;
  kadaneCurrentSum?: number;
  kadaneBestSum?: number;
  kadaneCurrentStart?: number;
  kadaneBestStart?: number;
  kadaneBestEnd?: number;
  // Difference Array
  differenceArray?: number[];
  reconstructedArray?: number[];
  // Recursion & Backtracking
  recursionRootId?: string | null;
  activeCallId?: string | null;
  recursionTree?: Record<string, RecursionTreeNode>;
  currentChoice?: string;
  choicesHistory?: string[];
  // Dynamic Programming
  dpType?: 'MEMOIZATION' | 'TABULATION_1D' | 'TABULATION_2D';
  dpTable1D?: any[];
  dpTable2D?: any[][];
  dpCurrentCell?: [number, number];
  dpTransitionFormula?: string;
  dpPreviousCells?: [number, number][];
  memoEntries?: { key: any; value: any; status: 'HIT' | 'MISS' }[];
  // Greedy
  candidates?: any[];
  chosenCandidate?: any;
  greedyDecision?: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  // Metrics & Complexity
  metrics: AlgorithmMetrics;
  theoreticalComplexity?: {
    time: string;
    space: string;
    best?: string;
    average?: string;
    worst?: string;
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
  algorithmState?: AlgorithmState;
}

export type SupportedLanguage = 'java' | 'python';

export interface CodePreset {
  id: string;
  title: string;
  category: 'Arrays & Sorting' | 'Stacks & Queues' | 'Linked Lists' | 'Trees & Heaps' | 'Graphs & Algorithms' | 'Hash Tables' | 'Recursion' | 'Bitwise' | 'Error Diagnostics' | 'Algorithms';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: SupportedLanguage;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  explanation: string;
}
