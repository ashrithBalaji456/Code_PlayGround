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
  | 'MATRIX_CREATE'
  | 'MATRIX_UPDATE'
  | 'MATRIX_ACCESS'
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
  // Dynamic Programming & Phase 7 Advanced DP
  | 'DP_START'
  | 'DP_STATE_CREATE'
  | 'DP_STATE_ACCESS'
  | 'DP_STATE_COMPUTE'
  | 'DP_STATE_COMPARE'
  | 'DP_STATE_TRANSITION'
  | 'DP_TRANSITION'
  | 'DP_STATE_UPDATE'
  | 'DP_STATE_COMPLETE'
  | 'DP_CACHE_LOOKUP'
  | 'DP_CACHE_HIT'
  | 'DP_CACHE_MISS'
  | 'DP_BASE_CASE'
  | 'DP_TABLE_CREATE'
  | 'DP_TABLE_ACCESS'
  | 'DP_TABLE_UPDATE'
  | 'DP_RECONSTRUCTION_START'
  | 'DP_RECONSTRUCTION_STEP'
  | 'DP_RECONSTRUCTION_END'
  | 'DP_END'
  // 0/1 Knapsack
  | 'KNAPSACK_START'
  | 'KNAPSACK_ITEM_SELECT'
  | 'KNAPSACK_CAPACITY_SELECT'
  | 'KNAPSACK_FIT_CHECK'
  | 'KNAPSACK_EXCLUDE'
  | 'KNAPSACK_INCLUDE'
  | 'KNAPSACK_COMPARE'
  | 'KNAPSACK_STATE_UPDATE'
  | 'KNAPSACK_END'
  // Unbounded Knapsack
  | 'UNBOUNDED_KNAPSACK_START'
  | 'UNBOUNDED_ITEM_SELECT'
  | 'UNBOUNDED_CAPACITY_SELECT'
  | 'UNBOUNDED_FIT_CHECK'
  | 'UNBOUNDED_INCLUDE'
  | 'UNBOUNDED_EXCLUDE'
  | 'UNBOUNDED_COMPARE'
  | 'UNBOUNDED_STATE_UPDATE'
  | 'UNBOUNDED_END'
  // Coin Change
  | 'COIN_CHANGE_START'
  | 'COIN_SELECT'
  | 'COIN_AMOUNT_SELECT'
  | 'COIN_FIT_CHECK'
  | 'COIN_CANDIDATE'
  | 'COIN_COMPARE'
  | 'COIN_STATE_UPDATE'
  | 'COIN_CHANGE_END'
  // Subset Sum
  | 'SUBSET_SUM_START'
  | 'SUBSET_ELEMENT_SELECT'
  | 'SUBSET_TARGET_SELECT'
  | 'SUBSET_INCLUDE'
  | 'SUBSET_EXCLUDE'
  | 'SUBSET_COMPARE'
  | 'SUBSET_STATE_UPDATE'
  | 'SUBSET_SUM_END'
  // Longest Common Subsequence
  | 'LCS_START'
  | 'LCS_CHARACTER_COMPARE'
  | 'LCS_MATCH'
  | 'LCS_MISMATCH'
  | 'LCS_DEPENDENCY_SELECT'
  | 'LCS_STATE_UPDATE'
  | 'LCS_RECONSTRUCTION_START'
  | 'LCS_RECONSTRUCTION_STEP'
  | 'LCS_RECONSTRUCTION_END'
  | 'LCS_END'
  // Longest Common Substring
  | 'LCSTR_START'
  | 'LCSTR_CHARACTER_COMPARE'
  | 'LCSTR_MATCH'
  | 'LCSTR_RESET'
  | 'LCSTR_STATE_UPDATE'
  | 'LCSTR_MAX_UPDATE'
  | 'LCSTR_END'
  // Longest Increasing Subsequence
  | 'LIS_START'
  | 'LIS_INDEX_SELECT'
  | 'LIS_COMPARE'
  | 'LIS_CANDIDATE'
  | 'LIS_STATE_UPDATE'
  | 'LIS_PARENT_UPDATE'
  | 'LIS_RECONSTRUCTION_START'
  | 'LIS_RECONSTRUCTION_STEP'
  | 'LIS_END'
  // Grid DP
  | 'GRID_DP_START'
  | 'GRID_CELL_SELECT'
  | 'GRID_OBSTACLE_CHECK'
  | 'GRID_DEPENDENCY_ACCESS'
  | 'GRID_CANDIDATE'
  | 'GRID_COMPARE'
  | 'GRID_STATE_UPDATE'
  | 'GRID_DP_END'
  // Interval DP
  | 'INTERVAL_DP_START'
  | 'INTERVAL_SELECT'
  | 'INTERVAL_LENGTH_UPDATE'
  | 'INTERVAL_SPLIT_SELECT'
  | 'INTERVAL_LEFT_DEPENDENCY'
  | 'INTERVAL_RIGHT_DEPENDENCY'
  | 'INTERVAL_COMBINE'
  | 'INTERVAL_STATE_UPDATE'
  | 'INTERVAL_DP_END'
  // Tree DP
  | 'TREE_DP_START'
  | 'TREE_DP_NODE_ENTER'
  | 'TREE_DP_CHILD_PROCESS'
  | 'TREE_DP_STATE_ACCESS'
  | 'TREE_DP_TRANSITION'
  | 'TREE_DP_STATE_UPDATE'
  | 'TREE_DP_NODE_COMPLETE'
  | 'TREE_DP_RETURN'
  | 'TREE_DP_END'
  // Bitmask DP
  | 'BITMASK_DP_START'
  | 'BITMASK_CREATE'
  | 'BITMASK_BIT_CHECK'
  | 'BITMASK_BIT_SET'
  | 'BITMASK_BIT_CLEAR'
  | 'BITMASK_STATE_ACCESS'
  | 'BITMASK_TRANSITION'
  | 'BITMASK_STATE_UPDATE'
  | 'BITMASK_DP_END'
  // Digit DP
  | 'DIGIT_DP_START'
  | 'DIGIT_POSITION'
  | 'DIGIT_OPTION_SELECT'
  | 'DIGIT_STATE_TRANSITION'
  | 'DIGIT_TIGHT_UPDATE'
  | 'DIGIT_STARTED_UPDATE'
  | 'DIGIT_CACHE_LOOKUP'
  | 'DIGIT_CACHE_HIT'
  | 'DIGIT_CACHE_MISS'
  | 'DIGIT_STATE_UPDATE'
  | 'DIGIT_DP_END'
  // Memoization
  | 'MEMO_LOOKUP'
  | 'MEMO_HIT'
  | 'MEMO_MISS'
  | 'MEMO_COMPUTE'
  | 'MEMO_STORE'
  | 'MEMO_RETURN'
  // Phase 6 Advanced Algorithm Events
  // Bellman-Ford
  | 'BELLMAN_FORD_START'
  | 'BELLMAN_FORD_PASS_START'
  | 'BELLMAN_FORD_EDGE_RELAX'
  | 'BELLMAN_FORD_COMPARE'
  | 'BELLMAN_FORD_DISTANCE_UPDATE'
  | 'BELLMAN_FORD_PASS_END'
  | 'BELLMAN_FORD_NEGATIVE_CYCLE'
  | 'BELLMAN_FORD_END'
  // Floyd-Warshall
  | 'FLOYD_WARSHALL_START'
  | 'FLOYD_K_UPDATE'
  | 'FLOYD_DISTANCE_COMPARE'
  | 'FLOYD_DISTANCE_UPDATE'
  | 'FLOYD_WARSHALL_END'
  // Prim's Algorithm (MST)
  | 'PRIM_START'
  | 'PRIM_NODE_SELECT'
  | 'PRIM_EDGE_CONSIDER'
  | 'PRIM_EDGE_COMPARE'
  | 'PRIM_EDGE_ACCEPT'
  | 'PRIM_EDGE_REJECT'
  | 'PRIM_QUEUE_INSERT'
  | 'PRIM_QUEUE_REMOVE'
  | 'PRIM_END'
  // Kruskal's Algorithm (MST)
  | 'KRUSKAL_START'
  | 'KRUSKAL_EDGE_SELECT'
  | 'KRUSKAL_EDGE_COMPARE'
  | 'KRUSKAL_CYCLE_CHECK'
  | 'KRUSKAL_EDGE_ACCEPT'
  | 'KRUSKAL_EDGE_REJECT'
  | 'KRUSKAL_UNION'
  | 'KRUSKAL_FIND'
  | 'KRUSKAL_END'
  // Topological Sort
  | 'TOPOLOGICAL_SORT_START'
  | 'INDEGREE_INITIALIZE'
  | 'TOPOLOGICAL_NODE_ENQUEUE'
  | 'TOPOLOGICAL_NODE_DEQUEUE'
  | 'TOPOLOGICAL_EDGE_PROCESS'
  | 'INDEGREE_UPDATE'
  | 'TOPOLOGICAL_NODE_OUTPUT'
  | 'TOPOLOGICAL_CYCLE_DETECTED'
  | 'TOPOLOGICAL_SORT_END'
  // Strongly Connected Components: Kosaraju
  | 'KOSARAJU_START'
  | 'KOSARAJU_FIRST_DFS'
  | 'KOSARAJU_FINISH'
  | 'KOSARAJU_STACK_PUSH'
  | 'KOSARAJU_TRANSPOSE'
  | 'KOSARAJU_SECOND_DFS'
  | 'KOSARAJU_SCC_START'
  | 'KOSARAJU_SCC_NODE'
  | 'KOSARAJU_SCC_END'
  | 'KOSARAJU_END'
  // Strongly Connected Components: Tarjan
  | 'TARJAN_START'
  | 'TARJAN_DISCOVER'
  | 'TARJAN_LOWLINK_UPDATE'
  | 'TARJAN_STACK_PUSH'
  | 'TARJAN_EDGE_PROCESS'
  | 'TARJAN_SCC_START'
  | 'TARJAN_SCC_NODE'
  | 'TARJAN_STACK_POP'
  | 'TARJAN_SCC_END'
  | 'TARJAN_END'
  // AVL Tree
  | 'AVL_CREATE'
  | 'AVL_INSERT'
  | 'AVL_DELETE'
  | 'AVL_HEIGHT_UPDATE'
  | 'AVL_BALANCE_CHECK'
  | 'AVL_ROTATE_LEFT'
  | 'AVL_ROTATE_RIGHT'
  | 'AVL_ROTATE_LEFT_RIGHT'
  | 'AVL_ROTATE_RIGHT_LEFT'
  | 'AVL_ROOT_UPDATE'
  | 'AVL_END'
  // Binary Search on Answer
  | 'ANSWER_SEARCH_START'
  | 'ANSWER_SEARCH_RANGE'
  | 'ANSWER_SEARCH_MID'
  | 'ANSWER_SEARCH_FEASIBILITY_CHECK'
  | 'ANSWER_SEARCH_RANGE_UPDATE'
  | 'ANSWER_SEARCH_END'
  // Coordinate Compression
  | 'COORD_COMPRESS_START'
  | 'COORD_COMPRESS_MAP'
  | 'COORD_COMPRESS_APPLY'
  | 'COORD_COMPRESS_END'
  // Monotonic Stack
  | 'MONO_STACK_START'
  | 'MONO_STACK_COMPARE'
  | 'MONO_STACK_POP'
  | 'MONO_STACK_PUSH'
  | 'MONO_STACK_RESULT'
  | 'MONO_STACK_END'
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
  | 'EXCEPTION'
  // Universal Java Runtime Observation Events
  | 'NESTED_COLLECTION_UPDATE'
  | 'CUSTOM_OBJECT_UPDATE'
  | 'LINKED_LIST_UPDATE'
  | 'TREE_UPDATE';

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
  // Universal Object & Reference Observation
  objectId?: string;
  isReference?: boolean;
  refTargetId?: string;
  isGraph?: boolean;
  className?: string;
  fields?: Record<string, any>;
  headId?: string;
  nodes?: Record<string, any>;
  rootId?: string;
  entries?: Array<{ key: any; value: any; hash?: number; bucket?: number }>;
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
  // Phase 6 Advanced Algorithm fields
  pass?: number;
  totalPasses?: number;
  from?: string;
  to?: string;
  k?: string | number;
  iNode?: string | number;
  jNode?: string | number;
  candidateDistance?: number | string;
  componentId?: number | string;
  componentNodes?: string[];
  balanceFactor?: number;
  height?: number;
  rotationType?: 'LL' | 'RR' | 'LR' | 'RL';
  feasible?: boolean;
  monoType?: 'INCREASING' | 'DECREASING';
  // Phase 7 Advanced Dynamic Programming fields
  indices?: (number | string)[];
  candidateValue?: any;
  dependencies?: (number | [number, number] | string)[];
  capacity?: number;
  itemIndex?: number;
  itemValue?: any;
  fit?: boolean;
  coin?: number;
  amount?: number;
  iChar?: string;
  jChar?: string;
  charMatched?: boolean;
  leftIndex?: number;
  rightIndex?: number;
  splitIndex?: number;
  mask?: number;
  bitIndex?: number;
  bitSet?: boolean;
  position?: number;
  digit?: number;
  tight?: boolean;
  started?: boolean;
  sum?: number;
  remainder?: number;
  reconstructionPath?: any[];
  reconstructionResult?: any;
  status?: string;
  rowLabels?: string[];
  colLabels?: string[];
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
  height?: number;
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
  inDegree?: number;
  sccGroup?: number;
  lowLink?: number;
  discoveryIndex?: number;
  onStack?: boolean;
  inNeighbors?: string[];
  outNeighbors?: string[];
  metadata?: Record<string, any>;
}

export type GraphEdgeState = 'NORMAL' | 'ACTIVE' | 'TRAVERSED' | 'SELECTED' | 'RELAXED' | 'REJECTED' | 'CYCLE' | 'PATH' | 'MST';

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
  inMST?: boolean;
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
  createdAtStep?: number;
  lastUpdatedStep?: number;
  stateCategory?: 'RUNTIME_STATE' | 'CONCEPTUAL_VIEW';
  // Visual indicators
  activeIndices?: number[];
  comparingIndices?: number[];
  highlightedIndices?: any[];
  swappingIndices?: [number, number];
  pointers?: Record<string, number | string>; // e.g. { i: 2, top: 1, head: "node-1" }
  pointerBadges?: Record<number, string[]>; // e.g. { 0: ['L', 'start'], 4: ['R', 'end'] }
  windowRange?: [number, number]; // [start, end] for sliding window
  searchRange?: [number, number]; // [low, high] for binary search
  pivotIndex?: number; // for quicksort partition
  sortedIndices?: number[]; // indices guaranteed sorted
  lastOperation?: string;
  // 2D Matrix / Grid visual indicators & reference cells
  activeCell?: [number, number]; // Currently updating cell [row, col]
  dependencyCells?: [number, number][]; // Reference cells that activeCell depends on
  highlightedCells?: [number, number][]; // Reconstructed path or highlighted cells
  lastUpdatedCell?: [number, number]; // Cell updated in current step
  rowLabels?: string[];
  colLabels?: string[];
  cellExplanation?: string; // Descriptive reference info for current cell update
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
  | 'Dynamic Programming'
  | 'Advanced Graph'
  | 'Advanced Tree'
  | 'Advanced Search / Optimization';

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
  // Phase 7 DP Core & Reusable Table Engine
  dpCellStatus?: Record<string, 'UNVISITED' | 'CURRENT' | 'DEPENDENCY' | 'COMPUTING' | 'UPDATED' | 'CACHE_HIT' | 'CACHE_MISS' | 'FINAL'>;
  dpDimensions?: number[];
  dpRowLabels?: (string | number)[];
  dpColLabels?: (string | number)[];
  dpDependencies?: (number | [number, number] | string)[];
  dpCandidateValues?: { label: string; value: any; selected?: boolean }[];
  dpSparseMap?: Record<string, any>;
  dpExplanation?: string;
  dpActiveViewMode?: 'TABLE' | 'DEPENDENCY' | 'RECURSION';
  // Phase 7 Specific DP State
  knapsackItems?: { weight: number; value: number; name?: string }[];
  knapsackCapacity?: number;
  knapsackCurrentItem?: number;
  knapsackCurrentCapacity?: number;
  knapsackFit?: boolean;
  knapsackIncludeVal?: number;
  knapsackExcludeVal?: number;
  knapsackDecision?: 'INCLUDE' | 'EXCLUDE' | 'CANNOT_FIT' | 'PENDING';
  coins?: number[];
  coinAmount?: number;
  currentCoin?: number;
  coinCandidate?: any;
  subsetTarget?: number;
  lcsStringA?: string;
  lcsStringB?: string;
  lcsI?: number;
  lcsJ?: number;
  lcsCharA?: string;
  lcsCharB?: string;
  lcsMatched?: boolean;
  lcsReconstructionPath?: [number, number][];
  lcsResult?: string;
  lcstrMaxLen?: number;
  lisArray?: number[];
  lisCurrentI?: number;
  lisCurrentJ?: number;
  lisComparison?: boolean;
  lisParents?: (number | null)[];
  lisReconstructedIndices?: number[];
  gridRows?: number;
  gridCols?: number;
  gridObstacles?: [number, number][];
  gridCurrentCell?: [number, number];
  intervalLeft?: number;
  intervalRight?: number;
  intervalLength?: number;
  intervalSplit?: number;
  treeDpNodeStates?: Record<string, any>;
  treeDpCurrentNode?: string;
  bitmask?: number;
  bitmaskLength?: number;
  bitmaskBit?: number;
  bitmaskBitVal?: boolean;
  bitmaskSelectedBits?: number[];
  digitPosition?: number;
  digitTight?: boolean;
  digitStarted?: boolean;
  digitSum?: number;
  digitRemainder?: number;
  digitOptions?: number[];
  digitSelected?: number;
  reconstructionActive?: boolean;
  reconstructionSequence?: any[];
  reconstructionFinalResult?: any;
  // Greedy
  candidates?: any[];
  chosenCandidate?: any;
  greedyDecision?: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  // Phase 6 Advanced Graph
  // Bellman-Ford
  bellmanPass?: number;
  bellmanTotalPasses?: number;
  bellmanDistances?: Record<string, number | string>;
  bellmanCurrentEdge?: { from: string; to: string; weight: number };
  negativeCycleDetected?: boolean;
  negativeCycleEdges?: string[];
  // Floyd-Warshall
  floydK?: string | number;
  floydI?: string | number;
  floydJ?: string | number;
  floydMatrix?: (number | string)[][];
  floydLabels?: string[];
  floydOldDistance?: number | string;
  floydCandidateDistance?: number | string;
  // Minimum Spanning Tree (Prim & Kruskal)
  mstEdges?: { from: string; to: string; weight: number }[];
  mstTotalWeight?: number;
  primCurrentNode?: string;
  kruskalSortedEdges?: { from: string; to: string; weight: number; status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' }[];
  disjointSetParents?: Record<string, string>;
  disjointSetRanks?: Record<string, number>;
  // Topological Sort
  indegrees?: Record<string, number>;
  topologicalQueue?: string[];
  topologicalOrder?: string[];
  topologicalCycle?: boolean;
  // Strongly Connected Components (Kosaraju & Tarjan)
  sccComponents?: string[][];
  currentSCC?: string[];
  tarjanDiscoveryIndex?: Record<string, number>;
  tarjanLowLink?: Record<string, number>;
  tarjanStack?: string[];
  kosarajuFinishStack?: string[];
  isTransposePhase?: boolean;
  // Phase 6 Advanced Tree: AVL
  avlRotationsCount?: number;
  lastRotationType?: 'LL' | 'RR' | 'LR' | 'RL';
  nodeHeights?: Record<string, number>;
  balanceFactors?: Record<string, number>;
  // Phase 6 Advanced Search & Patterns
  answerFeasibility?: boolean;
  coordMapping?: Record<string | number, number>;
  monoStackType?: 'INCREASING' | 'DECREASING';
  monoStackElements?: any[];
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
