export interface InstrumentationResult {
  instrumentedCode: string;
  className: string;
}

export function instrumentJavaCode(sourceCode: string): InstrumentationResult {
  const classMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
  const className = classMatch ? classMatch[1] : 'Main';

  const lines = sourceCode.split('\n');
  const outputLines: string[] = [
    'package com.codeflow;',
    'import com.codeflow.CodeFlowTracer;',
    'import java.util.*;',
    ''
  ];

  const varTypes = new Map<string, string>();
  let inMainMethod = false;
  let mainMethodDepth = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    const lineNum = lineIdx + 1;
    const trimmed = rawLine.trim();

    // Check main method signature
    if (trimmed.includes('public static void main(String[] args)') || trimmed.includes('public static void main(String args[])')) {
      inMainMethod = true;
      outputLines.push(rawLine);
      if (rawLine.includes('{')) {
        mainMethodDepth = 1;
        outputLines.push(`    CodeFlowTracer.start();`);
        outputLines.push(`    try {`);
      }
      continue;
    }

    if (inMainMethod && mainMethodDepth === 0 && rawLine.includes('{')) {
      mainMethodDepth = 1;
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.start();`);
      outputLines.push(`    try {`);
      continue;
    }

    // If in main, track braces
    if (inMainMethod) {
      const openCount = (rawLine.match(/\{/g) || []).length;
      const closeCount = (rawLine.match(/\}/g) || []).length;

      if (closeCount > 0 && mainMethodDepth + openCount - closeCount === 0) {
        outputLines.push(`    } catch (Throwable _cf_err) {`);
        outputLines.push(`      CodeFlowTracer.exception(_cf_err, ${lineNum});`);
        outputLines.push(`      throw _cf_err;`);
        outputLines.push(`    } finally {`);
        outputLines.push(`      CodeFlowTracer.finish();`);
        outputLines.push(`    }`);
        outputLines.push(rawLine);
        inMainMethod = false;
        mainMethodDepth = 0;
        continue;
      }

      mainMethodDepth += openCount - closeCount;
    }

    // 1. DATA STRUCTURE DECLARATIONS
    // Stack<Integer> stack = new Stack<>();
    const stackDeclMatch = trimmed.match(/^(?:Stack|java\.util\.Stack)<([^>]+)>\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:Stack|java\.util\.Stack)<.*?>\(\);?$/);
    if (stackDeclMatch) {
      const varName = stackDeclMatch[2];
      varTypes.set(varName, 'Stack');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.stackCreate("${varName}", "Stack<${stackDeclMatch[1]}>", ${lineNum});`);
      continue;
    }

    // Queue<Integer> queue = new LinkedList<>() / new ArrayDeque<>();
    const queueDeclMatch = trimmed.match(/^(?:Queue|java\.util\.Queue)<([^>]+)>\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:LinkedList|ArrayDeque|java\.util\.LinkedList|java\.util\.ArrayDeque)<.*?>\(\);?$/);
    if (queueDeclMatch) {
      const varName = queueDeclMatch[2];
      varTypes.set(varName, 'Queue');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.queueCreate("${varName}", "Queue<${queueDeclMatch[1]}>", ${lineNum});`);
      continue;
    }

    // Deque<Integer> deque = new ArrayDeque<>() / new LinkedList<>();
    const dequeDeclMatch = trimmed.match(/^(?:Deque|java\.util\.Deque)<([^>]+)>\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:ArrayDeque|LinkedList|java\.util\.ArrayDeque|java\.util\.LinkedList)<.*?>\(\);?$/);
    if (dequeDeclMatch) {
      const varName = dequeDeclMatch[2];
      varTypes.set(varName, 'Deque');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.dequeCreate("${varName}", "Deque<${dequeDeclMatch[1]}>", ${lineNum});`);
      continue;
    }

    // LinkedList<Integer> list = new LinkedList<>();
    const listDeclMatch = trimmed.match(/^(?:LinkedList|java\.util\.LinkedList)<([^>]+)>\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:LinkedList|java\.util\.LinkedList)<.*?>\(\);?$/);
    if (listDeclMatch) {
      const varName = listDeclMatch[2];
      varTypes.set(varName, 'LinkedList');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.linkedListCreate("${varName}", "LinkedList<${listDeclMatch[1]}>", ${lineNum});`);
      continue;
    }

    // HashMap<String, Integer> map = new HashMap<>() or Map<...>
    const mapDeclMatch = trimmed.match(/^(?:HashMap|Map|java\.util\.HashMap|java\.util\.Map)<([^,]+),\s*([^>]+)>\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:HashMap|java\.util\.HashMap)<.*?>\(\);?$/);
    if (mapDeclMatch) {
      const varName = mapDeclMatch[3];
      varTypes.set(varName, 'HashMap');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.mapCreate("${varName}", "HashMap<${mapDeclMatch[1]}, ${mapDeclMatch[2]}>", ${lineNum});`);
      continue;
    }

    // HashSet<Integer> set = new HashSet<>() or Set<...>
    const setDeclMatch = trimmed.match(/^(?:HashSet|Set|java\.util\.HashSet|java\.util\.Set)<([^>]+)>\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:HashSet|java\.util\.HashSet)<.*?>\(\);?$/);
    if (setDeclMatch) {
      const varName = setDeclMatch[2];
      varTypes.set(varName, 'HashSet');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.setCreate("${varName}", "HashSet<${setDeclMatch[1]}>", ${lineNum});`);
      continue;
    }

    // PriorityQueue<Integer> pq = new PriorityQueue<>();
    const pqDeclMatch = trimmed.match(/^(?:PriorityQueue|java\.util\.PriorityQueue)<([^>]+)>\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:PriorityQueue|java\.util\.PriorityQueue)<.*?>\((.*?)\);?$/);
    if (pqDeclMatch) {
      const varName = pqDeclMatch[2];
      const isMin = !pqDeclMatch[3].includes('reverseOrder');
      varTypes.set(varName, 'PriorityQueue');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.priorityQueueCreate("${varName}", "PriorityQueue<${pqDeclMatch[1]}>", ${lineNum});`);
      outputLines.push(`    CodeFlowTracer.heapCreate("${varName}", "${varName}", "PriorityQueue<${pqDeclMatch[1]}>", ${isMin}, ${lineNum});`);
      continue;
    }

    // TreeNode root = new TreeNode(10); or Node root = new Node(10);
    const treeDeclMatch = trimmed.match(/^(?:TreeNode|Node)\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:TreeNode|Node)\((.+)\);?$/);
    if (treeDeclMatch) {
      const varName = treeDeclMatch[1];
      const valArg = treeDeclMatch[2].trim();
      varTypes.set(varName, 'Tree');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    {`);
      outputLines.push(`      String _nid = "Node#" + System.identityHashCode(${varName});`);
      outputLines.push(`      CodeFlowTracer.treeCreate("${varName}", "${varName}", "BinaryTree", ${lineNum});`);
      outputLines.push(`      CodeFlowTracer.treeNodeCreate("${varName}", _nid, (${valArg}), ${lineNum});`);
      outputLines.push(`      CodeFlowTracer.treeRootUpdate("${varName}", _nid, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // BST bst = new BST();
    const bstDeclMatch = trimmed.match(/^(?:BST)\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:BST)\(\);?$/);
    if (bstDeclMatch) {
      const varName = bstDeclMatch[1];
      varTypes.set(varName, 'BST');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.bstCreate("${varName}", "${varName}", "BST", ${lineNum});`);
      continue;
    }

    // Trie trie = new Trie();
    const trieDeclMatch = trimmed.match(/^(?:Trie)\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:Trie)\(\);?$/);
    if (trieDeclMatch) {
      const varName = trieDeclMatch[1];
      varTypes.set(varName, 'Trie');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.trieCreate("${varName}", "${varName}", ${lineNum});`);
      continue;
    }

    // Graph graph = new Graph();
    const graphDeclMatch = trimmed.match(/^(?:Graph)\s+([a-zA-Z_0-9]+)\s*=\s*new\s+(?:Graph)\((.*?)\);?$/);
    if (graphDeclMatch) {
      const varName = graphDeclMatch[1];
      const rawArgs = graphDeclMatch[2].split(',').map((s) => s.trim());
      const isDirected = rawArgs[0] === 'true';
      const isWeighted = rawArgs[1] === 'true';
      varTypes.set(varName, 'Graph');
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.graphCreate("${varName}", "${varName}", ${isDirected}, ${isWeighted}, ${lineNum});`);
      continue;
    }

    // 2. DATA STRUCTURE OPERATIONS
    // Stack .push(val);
    const pushMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.push\((.+)\);?$/);
    if (pushMatch) {
      const varName = pushMatch[1];
      const arg = pushMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _val = (${arg});`);
      outputLines.push(`      ${varName}.push(_val);`);
      outputLines.push(`      CodeFlowTracer.stackPush("${varName}", _val, ${varName}.size(), ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // Stack .pop();
    const popMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.pop\(\);?$/);
    if (popMatch) {
      const varName = popMatch[1];
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _val = ${varName}.pop();`);
      outputLines.push(`      CodeFlowTracer.stackPop("${varName}", _val, ${varName}.size(), ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // .peek();
    const peekMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.peek\(\);?$/);
    if (peekMatch) {
      const varName = peekMatch[1];
      const stType = varTypes.get(varName);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _val = ${varName}.peek();`);
      if (stType === 'Stack') {
        outputLines.push(`      CodeFlowTracer.stackPeek("${varName}", _val, ${varName}.size(), ${lineNum});`);
      } else if (stType === 'PriorityQueue') {
        outputLines.push(`      CodeFlowTracer.priorityQueuePeek("${varName}", _val, ${varName}.size(), ${lineNum});`);
      } else {
        outputLines.push(`      CodeFlowTracer.queuePeek("${varName}", _val, ${varName}.size(), ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    // .poll();
    const pollMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.poll\(\);?$/);
    if (pollMatch) {
      const varName = pollMatch[1];
      const stType = varTypes.get(varName);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _val = ${varName}.poll();`);
      if (stType === 'PriorityQueue') {
        outputLines.push(`      CodeFlowTracer.priorityQueuePoll("${varName}", _val, new ArrayList<>(${varName}), ${varName}.size(), ${lineNum});`);
        outputLines.push(`      CodeFlowTracer.heapRemove("${varName}", _val, new ArrayList<>(${varName}), ${lineNum});`);
        outputLines.push(`      CodeFlowTracer.heapifyDown("${varName}", 0, _val, ${lineNum});`);
      } else if (stType === 'Deque') {
        outputLines.push(`      CodeFlowTracer.dequeRemoveFirst("${varName}", _val, ${varName}.size(), ${lineNum});`);
      } else {
        outputLines.push(`      CodeFlowTracer.queueDequeue("${varName}", _val, ${varName}.size(), ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    // .addFirst(val) / .addLast(val)
    const addFirstMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.addFirst\((.+)\);?$/);
    if (addFirstMatch) {
      const varName = addFirstMatch[1];
      const arg = addFirstMatch[2].trim();
      const stType = varTypes.get(varName);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _val = (${arg});`);
      outputLines.push(`      ${varName}.addFirst(_val);`);
      if (stType === 'LinkedList') {
        outputLines.push(`      CodeFlowTracer.linkedListAddFirst("${varName}", _val, ${varName}.size(), ${lineNum});`);
      } else {
        outputLines.push(`      CodeFlowTracer.dequeAddFirst("${varName}", _val, ${varName}.size(), ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    const addLastMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.addLast\((.+)\);?$/);
    if (addLastMatch) {
      const varName = addLastMatch[1];
      const arg = addLastMatch[2].trim();
      const stType = varTypes.get(varName);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _val = (${arg});`);
      outputLines.push(`      ${varName}.addLast(_val);`);
      if (stType === 'LinkedList') {
        outputLines.push(`      CodeFlowTracer.linkedListAddLast("${varName}", _val, ${varName}.size(), ${lineNum});`);
      } else {
        outputLines.push(`      CodeFlowTracer.dequeAddLast("${varName}", _val, ${varName}.size(), ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    // .removeFirst() / .removeLast()
    const removeFirstMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.removeFirst\(\);?$/);
    if (removeFirstMatch) {
      const varName = removeFirstMatch[1];
      const stType = varTypes.get(varName);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _val = ${varName}.removeFirst();`);
      if (stType === 'LinkedList') {
        outputLines.push(`      CodeFlowTracer.linkedListRemoveFirst("${varName}", _val, ${varName}.size(), ${lineNum});`);
      } else {
        outputLines.push(`      CodeFlowTracer.dequeRemoveFirst("${varName}", _val, ${varName}.size(), ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    const removeLastMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.removeLast\(\);?$/);
    if (removeLastMatch) {
      const varName = removeLastMatch[1];
      const stType = varTypes.get(varName);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _val = ${varName}.removeLast();`);
      if (stType === 'LinkedList') {
        outputLines.push(`      CodeFlowTracer.linkedListRemoveLast("${varName}", _val, ${varName}.size(), ${lineNum});`);
      } else {
        outputLines.push(`      CodeFlowTracer.dequeRemoveLast("${varName}", _val, ${varName}.size(), ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    // .put(k, v) for HashMap
    const putMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.put\((.+),\s*(.+)\);?$/);
    if (putMatch) {
      const varName = putMatch[1];
      const keyArg = putMatch[2].trim();
      const valArg = putMatch[3].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _k = (${keyArg});`);
      outputLines.push(`      var _v = (${valArg});`);
      outputLines.push(`      var _old = ${varName}.put(_k, _v);`);
      outputLines.push(`      int _h = Objects.hashCode(_k);`);
      outputLines.push(`      int _b = Math.abs(_h % 8);`);
      outputLines.push(`      CodeFlowTracer.mapPut("${varName}", _k, _v, _old, _h, _b, ${varName}.size(), ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // .add(idx, val) for LinkedList with 2 arguments: list.add(1, 15);
    const addIndexedMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.add\((\d+|[a-zA-Z_0-9]+),\s*(.+)\);?$/);
    if (addIndexedMatch && varTypes.get(addIndexedMatch[1]) === 'LinkedList') {
      const varName = addIndexedMatch[1];
      const idxArg = addIndexedMatch[2].trim();
      const valArg = addIndexedMatch[3].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      int _idx = (${idxArg});`);
      outputLines.push(`      var _v = (${valArg});`);
      outputLines.push(`      ${varName}.add(_idx, _v);`);
      outputLines.push(`      CodeFlowTracer.linkedListAdd("${varName}", _v, _idx, ${varName}.size(), ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // General .add(val) or .offer(val)
    const addMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.(?:add|offer)\((.+)\);?$/);
    if (addMatch) {
      const varName = addMatch[1];
      const arg = addMatch[2].trim();
      const stType = varTypes.get(varName);

      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _v = (${arg});`);
      if (stType === 'HashSet') {
        outputLines.push(`      boolean _added = ${varName}.add(_v);`);
        outputLines.push(`      CodeFlowTracer.setAdd("${varName}", _v, _added, ${varName}.size(), ${lineNum});`);
      } else if (stType === 'PriorityQueue') {
        outputLines.push(`      ${varName}.add(_v);`);
        outputLines.push(`      CodeFlowTracer.priorityQueueAdd("${varName}", _v, new ArrayList<>(${varName}), ${varName}.size(), ${lineNum});`);
        outputLines.push(`      CodeFlowTracer.heapInsert("${varName}", _v, new ArrayList<>(${varName}), ${lineNum});`);
        outputLines.push(`      CodeFlowTracer.heapifyUp("${varName}", ${varName}.size() - 1, _v, ${lineNum});`);
      } else if (stType === 'LinkedList') {
        outputLines.push(`      ${varName}.add(_v);`);
        outputLines.push(`      CodeFlowTracer.linkedListAdd("${varName}", _v, ${varName}.size() - 1, ${varName}.size(), ${lineNum});`);
      } else if (stType === 'Deque') {
        outputLines.push(`      ${varName}.addLast(_v);`);
        outputLines.push(`      CodeFlowTracer.dequeAddLast("${varName}", _v, ${varName}.size(), ${lineNum});`);
      } else {
        // Queue default
        outputLines.push(`      ${varName}.add(_v);`);
        outputLines.push(`      CodeFlowTracer.queueEnqueue("${varName}", _v, ${varName}.size(), ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    // .remove(arg)
    const removeMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.remove\((.+)\);?$/);
    if (removeMatch) {
      const varName = removeMatch[1];
      const arg = removeMatch[2].trim();
      const stType = varTypes.get(varName);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      if (stType === 'HashSet') {
        outputLines.push(`      var _arg = (${arg});`);
        outputLines.push(`      boolean _rem = ${varName}.remove(_arg);`);
        outputLines.push(`      CodeFlowTracer.setRemove("${varName}", _arg, _rem, ${varName}.size(), ${lineNum});`);
      } else if (stType === 'HashMap') {
        outputLines.push(`      var _k = (${arg});`);
        outputLines.push(`      var _old = ${varName}.remove(_k);`);
        outputLines.push(`      int _h = Objects.hashCode(_k);`);
        outputLines.push(`      int _b = Math.abs(_h % 8);`);
        outputLines.push(`      CodeFlowTracer.mapRemove("${varName}", _k, _old, _h, _b, ${varName}.size(), ${lineNum});`);
      } else if (stType === 'LinkedList') {
        outputLines.push(`      int _idx = (${arg});`);
        outputLines.push(`      var _old = ${varName}.remove(_idx);`);
        outputLines.push(`      CodeFlowTracer.linkedListRemove("${varName}", _old, _idx, ${varName}.size(), ${lineNum});`);
      } else {
        outputLines.push(`      var _arg = (${arg});`);
        outputLines.push(`      ${varName}.remove(_arg);`);
      }
      outputLines.push(`    }`);
      continue;
    }

    // .contains(arg) / .containsKey(arg) standalone
    const containsMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.(?:contains|containsKey)\((.+)\);?$/);
    if (containsMatch) {
      const varName = containsMatch[1];
      const arg = containsMatch[2].trim();
      const stType = varTypes.get(varName);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _arg = (${arg});`);
      if (stType === 'HashSet') {
        outputLines.push(`      boolean _found = ${varName}.contains(_arg);`);
        outputLines.push(`      CodeFlowTracer.setContains("${varName}", _arg, _found, ${lineNum});`);
      } else if (stType === 'HashMap') {
        outputLines.push(`      boolean _found = ${varName}.containsKey(_arg);`);
        outputLines.push(`      int _h = Objects.hashCode(_arg);`);
        outputLines.push(`      int _b = Math.abs(_h % 8);`);
        outputLines.push(`      CodeFlowTracer.mapGet("${varName}", _arg, _found, _h, _b, ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    // .get(arg) standalone
    const getMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.get\((.+)\);?$/);
    if (getMatch) {
      const varName = getMatch[1];
      const arg = getMatch[2].trim();
      const stType = varTypes.get(varName);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      if (stType === 'HashMap') {
        outputLines.push(`      var _k = (${arg});`);
        outputLines.push(`      var _v = ${varName}.get(_k);`);
        outputLines.push(`      int _h = Objects.hashCode(_k);`);
        outputLines.push(`      int _b = Math.abs(_h % 8);`);
        outputLines.push(`      CodeFlowTracer.mapGet("${varName}", _k, _v, _h, _b, ${lineNum});`);
      } else if (stType === 'LinkedList') {
        outputLines.push(`      int _idx = (${arg});`);
        outputLines.push(`      var _v = ${varName}.get(_idx);`);
        outputLines.push(`      CodeFlowTracer.linkedListGet("${varName}", _idx, _v, ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    // .clear()
    const clearMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.clear\(\);?$/);
    if (clearMatch) {
      const varName = clearMatch[1];
      const stType = varTypes.get(varName);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    ${varName}.clear();`);
      if (stType === 'Stack') outputLines.push(`    CodeFlowTracer.stackClear("${varName}", ${lineNum});`);
      else if (stType === 'Queue') outputLines.push(`    CodeFlowTracer.queueClear("${varName}", ${lineNum});`);
      else if (stType === 'LinkedList') outputLines.push(`    CodeFlowTracer.linkedListClear("${varName}", ${lineNum});`);
      else if (stType === 'HashMap') outputLines.push(`    CodeFlowTracer.mapClear("${varName}", ${lineNum});`);
      else if (stType === 'HashSet') outputLines.push(`    CodeFlowTracer.setClear("${varName}", ${lineNum});`);
      continue;
    }

    // 2.5 TREE LINKING, BST & TRIE OPERATIONS (Phase 3)
    // root.left = new TreeNode(20); or root.left.left = new TreeNode(40);
    const treeLinkNewMatch = trimmed.match(/^((?:[a-zA-Z_0-9]+(?:\.[a-zA-Z_0-9]+)*))\.(left|right)\s*=\s*new\s+(?:TreeNode|Node)\((.+)\);?$/);
    if (treeLinkNewMatch) {
      const parentExpr = treeLinkNewMatch[1];
      const dir = treeLinkNewMatch[2];
      const valArg = treeLinkNewMatch[3].trim();
      const rootVar = parentExpr.split('.')[0];
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _child = new TreeNode(${valArg});`);
      outputLines.push(`      ${parentExpr}.${dir} = _child;`);
      outputLines.push(`      String _pId = "Node#" + System.identityHashCode(${parentExpr});`);
      outputLines.push(`      String _cId = "Node#" + System.identityHashCode(_child);`);
      outputLines.push(`      CodeFlowTracer.treeNodeCreate("${rootVar}", _cId, (${valArg}), ${lineNum});`);
      if (dir === 'left') {
        outputLines.push(`      CodeFlowTracer.treeLinkLeft("${rootVar}", _pId, _cId, ${lineNum});`);
      } else {
        outputLines.push(`      CodeFlowTracer.treeLinkRight("${rootVar}", _pId, _cId, ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    // root.left = child; or root.right = child;
    const treeLinkVarMatch = trimmed.match(/^((?:[a-zA-Z_0-9]+(?:\.[a-zA-Z_0-9]+)*))\.(left|right)\s*=\s*([a-zA-Z_0-9]+);?$/);
    if (treeLinkVarMatch && treeLinkVarMatch[3] !== 'null') {
      const parentExpr = treeLinkVarMatch[1];
      const dir = treeLinkVarMatch[2];
      const childVar = treeLinkVarMatch[3];
      const rootVar = parentExpr.split('.')[0];
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    ${rawLine}`);
      outputLines.push(`    {`);
      outputLines.push(`      if (${childVar} != null) {`);
      outputLines.push(`        String _pId = "Node#" + System.identityHashCode(${parentExpr});`);
      outputLines.push(`        String _cId = "Node#" + System.identityHashCode(${childVar});`);
      if (dir === 'left') {
        outputLines.push(`        CodeFlowTracer.treeLinkLeft("${rootVar}", _pId, _cId, ${lineNum});`);
      } else {
        outputLines.push(`        CodeFlowTracer.treeLinkRight("${rootVar}", _pId, _cId, ${lineNum});`);
      }
      outputLines.push(`      }`);
      outputLines.push(`    }`);
      continue;
    }

    // root.left = null; or root.right = null;
    const treeUnlinkMatch = trimmed.match(/^((?:[a-zA-Z_0-9]+(?:\.[a-zA-Z_0-9]+)*))\.(left|right)\s*=\s*null;?$/);
    if (treeUnlinkMatch) {
      const parentExpr = treeUnlinkMatch[1];
      const dir = treeUnlinkMatch[2];
      const rootVar = parentExpr.split('.')[0];
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    ${rawLine}`);
      outputLines.push(`    {`);
      outputLines.push(`      String _pId = "Node#" + System.identityHashCode(${parentExpr});`);
      if (dir === 'left') {
        outputLines.push(`      CodeFlowTracer.treeUnlinkLeft("${rootVar}", _pId, ${lineNum});`);
      } else {
        outputLines.push(`      CodeFlowTracer.treeUnlinkRight("${rootVar}", _pId, ${lineNum});`);
      }
      outputLines.push(`    }`);
      continue;
    }

    // bst.insert(val)
    const bstInsertMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.insert\((\d+|[a-zA-Z_0-9]+)\);?$/);
    if (bstInsertMatch && varTypes.get(bstInsertMatch[1]) === 'BST') {
      const varName = bstInsertMatch[1];
      const valArg = bstInsertMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _v = (${valArg});`);
      outputLines.push(`      ${varName}.insert(_v);`);
      outputLines.push(`      CodeFlowTracer.bstInsert("${varName}", "Node#" + _v, _v, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // bst.search(val)
    const bstSearchMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.search\((\d+|[a-zA-Z_0-9]+)\);?$/);
    if (bstSearchMatch && varTypes.get(bstSearchMatch[1]) === 'BST') {
      const varName = bstSearchMatch[1];
      const valArg = bstSearchMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _v = (${valArg});`);
      outputLines.push(`      boolean _found = ${varName}.search(_v);`);
      outputLines.push(`      CodeFlowTracer.bstSearchStart("${varName}", _v, ${lineNum});`);
      outputLines.push(`      CodeFlowTracer.bstSearchEnd("${varName}", _v, _found, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // bst.delete(val)
    const bstDeleteMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.delete\((\d+|[a-zA-Z_0-9]+)\);?$/);
    if (bstDeleteMatch && varTypes.get(bstDeleteMatch[1]) === 'BST') {
      const varName = bstDeleteMatch[1];
      const valArg = bstDeleteMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      var _v = (${valArg});`);
      outputLines.push(`      ${varName}.delete(_v);`);
      outputLines.push(`      CodeFlowTracer.bstDelete("${varName}", "Node#" + _v, _v, "Deleted " + _v, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // trie.insert("word")
    const trieInsertMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.insert\((.+)\);?$/);
    if (trieInsertMatch && varTypes.get(trieInsertMatch[1]) === 'Trie') {
      const varName = trieInsertMatch[1];
      const wordArg = trieInsertMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      String _w = String.valueOf(${wordArg}).replace("\\"", "");`);
      outputLines.push(`      ${varName}.insert(_w);`);
      outputLines.push(`      String _curr = "root";`);
      outputLines.push(`      for (int _ci = 0; _ci < _w.length(); _ci++) {`);
      outputLines.push(`        String _ch = String.valueOf(_w.charAt(_ci));`);
      outputLines.push(`        String _nid = "node_" + _w.substring(0, _ci + 1);`);
      outputLines.push(`        CodeFlowTracer.trieNodeCreate("${varName}", _nid, _ch, _curr, ${lineNum});`);
      outputLines.push(`        _curr = _nid;`);
      outputLines.push(`      }`);
      outputLines.push(`      CodeFlowTracer.trieWordComplete("${varName}", _curr, _w, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // trie.search("word")
    const trieSearchMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.search\((.+)\);?$/);
    if (trieSearchMatch && varTypes.get(trieSearchMatch[1]) === 'Trie') {
      const varName = trieSearchMatch[1];
      const wordArg = trieSearchMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      String _w = String.valueOf(${wordArg}).replace("\\"", "");`);
      outputLines.push(`      boolean _found = ${varName}.search(_w);`);
      outputLines.push(`      CodeFlowTracer.trieSearchStart("${varName}", _w, ${lineNum});`);
      outputLines.push(`      for (int _ci = 0; _ci < _w.length(); _ci++) {`);
      outputLines.push(`        String _ch = String.valueOf(_w.charAt(_ci));`);
      outputLines.push(`        String _nid = "node_" + _w.substring(0, _ci + 1);`);
      outputLines.push(`        CodeFlowTracer.trieSearchStep("${varName}", _nid, _ch, ${lineNum});`);
      outputLines.push(`      }`);
      outputLines.push(`      CodeFlowTracer.trieWordFound("${varName}", _w, _found, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // trie.startsWith("prefix")
    const trieStartsMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.startsWith\((.+)\);?$/);
    if (trieStartsMatch && varTypes.get(trieStartsMatch[1]) === 'Trie') {
      const varName = trieStartsMatch[1];
      const wordArg = trieStartsMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      String _w = String.valueOf(${wordArg}).replace("\\"", "");`);
      outputLines.push(`      boolean _found = ${varName}.startsWith(_w);`);
      outputLines.push(`      CodeFlowTracer.trieSearchStart("${varName}", _w, ${lineNum});`);
      outputLines.push(`      for (int _ci = 0; _ci < _w.length(); _ci++) {`);
      outputLines.push(`        String _ch = String.valueOf(_w.charAt(_ci));`);
      outputLines.push(`        String _nid = "node_" + _w.substring(0, _ci + 1);`);
      outputLines.push(`        CodeFlowTracer.trieSearchStep("${varName}", _nid, _ch, ${lineNum});`);
      outputLines.push(`      }`);
      outputLines.push(`      CodeFlowTracer.trieWordFound("${varName}", _w, _found, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // 2.6 GRAPH OPERATIONS (Phase 4)
    // graph.addVertex("A") or graph.addNode("A")
    const graphVertexMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.(?:addVertex|addNode)\((.+)\);?$/);
    if (graphVertexMatch && varTypes.get(graphVertexMatch[1]) === 'Graph') {
      const varName = graphVertexMatch[1];
      const arg = graphVertexMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      String _v = String.valueOf(${arg}).replace("\\"", "");`);
      outputLines.push(`      ${varName}.addVertex(_v);`);
      outputLines.push(`      CodeFlowTracer.graphNodeCreate("${varName}", _v, _v, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // graph.addEdge("A", "B") or graph.addEdge("A", "B", 5.0)
    const graphEdgeMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.addEdge\((.+)\);?$/);
    if (graphEdgeMatch && varTypes.get(graphEdgeMatch[1]) === 'Graph') {
      const varName = graphEdgeMatch[1];
      const rawArgs = graphEdgeMatch[2].split(',').map((s) => s.trim());
      const srcArg = rawArgs[0];
      const tgtArg = rawArgs[1];
      const weightArg = rawArgs[2] || '1.0';
      const hasWeight = rawArgs.length >= 3;
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      String _s = String.valueOf(${srcArg}).replace("\\"", "");`);
      outputLines.push(`      String _t = String.valueOf(${tgtArg}).replace("\\"", "");`);
      outputLines.push(`      double _w = (double)(${weightArg});`);
      outputLines.push(`      boolean _hasW = ${hasWeight};`);
      outputLines.push(`      ${varName}.addEdge(_s, _t, _w);`);
      outputLines.push(`      String _eId = "edge_" + _s + "_" + _t;`);
      outputLines.push(`      CodeFlowTracer.graphEdgeCreate("${varName}", _eId, _s, _t, ${varName}.directed, _hasW, _w, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // graph.removeEdge("A", "B")
    const graphRemEdgeMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.removeEdge\((.+)\);?$/);
    if (graphRemEdgeMatch && varTypes.get(graphRemEdgeMatch[1]) === 'Graph') {
      const varName = graphRemEdgeMatch[1];
      const rawArgs = graphRemEdgeMatch[2].split(',').map((s) => s.trim());
      const srcArg = rawArgs[0];
      const tgtArg = rawArgs[1];
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      String _s = String.valueOf(${srcArg}).replace("\\"", "");`);
      outputLines.push(`      String _t = String.valueOf(${tgtArg}).replace("\\"", "");`);
      outputLines.push(`      ${varName}.removeEdge(_s, _t);`);
      outputLines.push(`      CodeFlowTracer.graphEdgeDelete("${varName}", "edge_" + _s + "_" + _t, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // graph.getNeighbors("A")
    const graphNbrMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.getNeighbors\((.+)\);?$/);
    if (graphNbrMatch && varTypes.get(graphNbrMatch[1]) === 'Graph') {
      const varName = graphNbrMatch[1];
      const arg = graphNbrMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      String _v = String.valueOf(${arg}).replace("\\"", "");`);
      outputLines.push(`      var _nbrs = ${varName}.getNeighbors(_v);`);
      outputLines.push(`      CodeFlowTracer.graphNeighborsAccess("${varName}", _v, _nbrs, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // graph.bfs("A")
    const graphBfsMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.bfs\((.+)\);?$/);
    if (graphBfsMatch && varTypes.get(graphBfsMatch[1]) === 'Graph') {
      const varName = graphBfsMatch[1];
      const startArg = graphBfsMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      String _start = String.valueOf(${startArg}).replace("\\"", "");`);
      outputLines.push(`      CodeFlowTracer.bfsStart("${varName}", _start, ${lineNum});`);
      outputLines.push(`      Set<String> _bfsVisited = new LinkedHashSet<>();`);
      outputLines.push(`      Queue<String> _bfsQueue = new LinkedList<>();`);
      outputLines.push(`      _bfsVisited.add(_start);`);
      outputLines.push(`      _bfsQueue.add(_start);`);
      outputLines.push(`      CodeFlowTracer.bfsNodeDiscover("${varName}", _start, ${lineNum});`);
      outputLines.push(`      CodeFlowTracer.bfsEnqueue("${varName}", "queue", _start, ${lineNum});`);
      outputLines.push(`      while (!_bfsQueue.isEmpty()) {`);
      outputLines.push(`        String _u = _bfsQueue.poll();`);
      outputLines.push(`        CodeFlowTracer.bfsDequeue("${varName}", "queue", _u, ${lineNum});`);
      outputLines.push(`        CodeFlowTracer.bfsNodeVisit("${varName}", _u, ${lineNum});`);
      outputLines.push(`        for (String _nbr : ${varName}.getNeighbors(_u)) {`);
      outputLines.push(`          String _eId = "edge_" + _u + "_" + _nbr;`);
      outputLines.push(`          CodeFlowTracer.bfsEdgeTraverse("${varName}", _eId, _u, _nbr, ${lineNum});`);
      outputLines.push(`          if (!_bfsVisited.contains(_nbr)) {`);
      outputLines.push(`            _bfsVisited.add(_nbr);`);
      outputLines.push(`            _bfsQueue.add(_nbr);`);
      outputLines.push(`            CodeFlowTracer.bfsNodeDiscover("${varName}", _nbr, ${lineNum});`);
      outputLines.push(`            CodeFlowTracer.bfsEnqueue("${varName}", "queue", _nbr, ${lineNum});`);
      outputLines.push(`          }`);
      outputLines.push(`        }`);
      outputLines.push(`      }`);
      outputLines.push(`      CodeFlowTracer.bfsEnd("${varName}", ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // graph.dfs("A")
    const graphDfsMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.dfs\((.+)\);?$/);
    if (graphDfsMatch && varTypes.get(graphDfsMatch[1]) === 'Graph') {
      const varName = graphDfsMatch[1];
      const startArg = graphDfsMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      String _start = String.valueOf(${startArg}).replace("\\"", "");`);
      outputLines.push(`      CodeFlowTracer.dfsStart("${varName}", _start, ${lineNum});`);
      outputLines.push(`      Set<String> _dfsVisited = new LinkedHashSet<>();`);
      outputLines.push(`      Stack<String> _dfsStack = new Stack<>();`);
      outputLines.push(`      _dfsStack.push(_start);`);
      outputLines.push(`      while (!_dfsStack.isEmpty()) {`);
      outputLines.push(`        String _u = _dfsStack.pop();`);
      outputLines.push(`        if (!_dfsVisited.contains(_u)) {`);
      outputLines.push(`          _dfsVisited.add(_u);`);
      outputLines.push(`          CodeFlowTracer.dfsNodeVisit("${varName}", _u, ${lineNum});`);
      outputLines.push(`          for (String _nbr : ${varName}.getNeighbors(_u)) {`);
      outputLines.push(`            String _eId = "edge_" + _u + "_" + _nbr;`);
      outputLines.push(`            CodeFlowTracer.dfsEdgeTraverse("${varName}", _eId, _u, _nbr, ${lineNum});`);
      outputLines.push(`            if (!_dfsVisited.contains(_nbr)) {`);
      outputLines.push(`              CodeFlowTracer.dfsNodeDiscover("${varName}", _nbr, ${lineNum});`);
      outputLines.push(`              _dfsStack.push(_nbr);`);
      outputLines.push(`            } else {`);
      outputLines.push(`              CodeFlowTracer.dfsAlreadyVisited("${varName}", _nbr, ${lineNum});`);
      outputLines.push(`            }`);
      outputLines.push(`          }`);
      outputLines.push(`        }`);
      outputLines.push(`      }`);
      outputLines.push(`      CodeFlowTracer.dfsEnd("${varName}", ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // graph.dijkstra("A")
    const graphDijkstraMatch = trimmed.match(/^([a-zA-Z_0-9]+)\.dijkstra\((.+)\);?$/);
    if (graphDijkstraMatch && varTypes.get(graphDijkstraMatch[1]) === 'Graph') {
      const varName = graphDijkstraMatch[1];
      const startArg = graphDijkstraMatch[2].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      String _start = String.valueOf(${startArg}).replace("\\"", "");`);
      outputLines.push(`      CodeFlowTracer.dijkstraStart("${varName}", _start, ${lineNum});`);
      outputLines.push(`      Map<String, Double> _dist = new LinkedHashMap<>();`);
      outputLines.push(`      for (String _v : ${varName}.vertices) {`);
      outputLines.push(`        _dist.put(_v, Double.POSITIVE_INFINITY);`);
      outputLines.push(`        CodeFlowTracer.distanceInitialize("${varName}", _v, "Infinity", ${lineNum});`);
      outputLines.push(`      }`);
      outputLines.push(`      _dist.put(_start, 0.0);`);
      outputLines.push(`      CodeFlowTracer.distanceUpdate("${varName}", _start, "Infinity", 0.0, ${lineNum});`);
      outputLines.push(`      PriorityQueue<String[]> _pq = new PriorityQueue<>(Comparator.comparingDouble(a -> Double.parseDouble(a[1])));`);
      outputLines.push(`      _pq.add(new String[]{_start, "0.0"});`);
      outputLines.push(`      CodeFlowTracer.dijkstraQueueInsert("${varName}", _start, 0.0, ${lineNum});`);
      outputLines.push(`      Set<String> _finalized = new HashSet<>();`);
      outputLines.push(`      while (!_pq.isEmpty()) {`);
      outputLines.push(`        String[] _top = _pq.poll();`);
      outputLines.push(`        String _u = _top[0];`);
      outputLines.push(`        double _d = Double.parseDouble(_top[1]);`);
      outputLines.push(`        CodeFlowTracer.dijkstraQueueRemove("${varName}", _u, _d, ${lineNum});`);
      outputLines.push(`        if (_finalized.contains(_u)) continue;`);
      outputLines.push(`        _finalized.add(_u);`);
      outputLines.push(`        CodeFlowTracer.dijkstraNodeSelect("${varName}", _u, _d, ${lineNum});`);
      outputLines.push(`        CodeFlowTracer.dijkstraNodeFinalize("${varName}", _u, _d, ${lineNum});`);
      outputLines.push(`        if (${varName}.adj.containsKey(_u)) {`);
      outputLines.push(`          for (var _e : ${varName}.adj.get(_u)) {`);
      outputLines.push(`            String _v = _e.target;`);
      outputLines.push(`            double _w = _e.weight;`);
      outputLines.push(`            double _newD = _d + _w;`);
      outputLines.push(`            double _currD = _dist.getOrDefault(_v, Double.POSITIVE_INFINITY);`);
      outputLines.push(`            boolean _willRelax = _newD < _currD;`);
      outputLines.push(`            CodeFlowTracer.dijkstraEdgeRelax("${varName}", _e.id, _u, _v, _d, _w, Double.isInfinite(_currD) ? "Infinity" : _currD, _willRelax, ${lineNum});`);
      outputLines.push(`            if (_willRelax) {`);
      outputLines.push(`              _dist.put(_v, _newD);`);
      outputLines.push(`              CodeFlowTracer.distanceUpdate("${varName}", _v, Double.isInfinite(_currD) ? "Infinity" : _currD, _newD, ${lineNum});`);
      outputLines.push(`              _pq.add(new String[]{_v, String.valueOf(_newD)});`);
      outputLines.push(`              CodeFlowTracer.dijkstraQueueInsert("${varName}", _v, _newD, ${lineNum});`);
      outputLines.push(`            }`);
      outputLines.push(`          }`);
      outputLines.push(`        }`);
      outputLines.push(`      }`);
      outputLines.push(`      List<String> _shortestPath = new ArrayList<>(_dist.keySet());`);
      outputLines.push(`      CodeFlowTracer.dijkstraEnd("${varName}", _shortestPath, 0.0, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // Traversals: inorder(root); preorder(root); postorder(root);
    const travMatch = trimmed.match(/^(inorder|preorder|postorder|levelOrder)\(([a-zA-Z_0-9]+)\);?$/);
    if (travMatch) {
      const travName = travMatch[1].toUpperCase();
      const rootArg = travMatch[2];
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    CodeFlowTracer.funcCall("${travName}", "{root:'${rootArg}'}", ${lineNum});`);
      outputLines.push(`    ${rawLine}`);
      continue;
    }

    // 3. PRIMITIVE ARRAYS (Phase 1)
    const arrayDeclMatch = trimmed.match(/^(?:int|long|double|float)\[\]\s+([a-zA-Z_0-9]+)\s*=\s*(.+);$/);
    if (arrayDeclMatch) {
      const arrName = arrayDeclMatch[1];
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.arrayCreate("${arrName}", ${arrName}, ${lineNum});`);
      continue;
    }

    const arrayAssignMatch = trimmed.match(/^([a-zA-Z_0-9]+)\[([^\]]+)\]\s*=\s*(.+);$/);
    if (arrayAssignMatch) {
      const arrName = arrayAssignMatch[1];
      const idxExpr = arrayAssignMatch[2].trim();
      const valExpr = arrayAssignMatch[3].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      int _idx = (${idxExpr});`);
      outputLines.push(`      int _oldVal = ${arrName}[_idx];`);
      outputLines.push(`      ${arrName}[_idx] = (${valExpr});`);
      outputLines.push(`      CodeFlowTracer.arrayUpdate("${arrName}", _idx, _oldVal, ${arrName}[_idx], ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // 4. PRIMITIVE VARIABLES (Phase 1)
    const varDeclMatch = trimmed.match(/^(int|long|double|float|boolean|char|String)\s+([a-zA-Z_0-9]+)\s*=\s*(.+);$/);
    if (varDeclMatch) {
      const type = varDeclMatch[1];
      const varName = varDeclMatch[2];
      varTypes.set(varName, type);
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.varCreate("${varName}", "${type}", ${varName}, ${lineNum});`);
      continue;
    }

    const varAssignMatch = trimmed.match(/^([a-zA-Z_0-9]+)\s*=\s*(.+);$/);
    if (varAssignMatch && !trimmed.startsWith('return') && !trimmed.startsWith('int') && !trimmed.startsWith('double')) {
      const varName = varAssignMatch[1];
      const type = varTypes.get(varName) || 'int';
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    {`);
      outputLines.push(`      ${type} _old = ${varName};`);
      outputLines.push(`      ${varName} = (${varAssignMatch[2]});`);
      outputLines.push(`      CodeFlowTracer.varUpdate("${varName}", "${type}", _old, ${varName}, ${lineNum});`);
      outputLines.push(`    }`);
      continue;
    }

    // 5. LOOPS (Phase 1)
    const forLoopMatch = trimmed.match(/^for\s*\(\s*(?:int\s+)?([a-zA-Z_0-9]+)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\)\s*\{?$/);
    if (forLoopMatch) {
      const iterVar = forLoopMatch[1];
      const initVal = forLoopMatch[2].trim();
      const condExpr = forLoopMatch[3].trim();
      const stepExpr = forLoopMatch[4].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    CodeFlowTracer.loopStart(${lineNum});`);
      outputLines.push(`    for (int ${iterVar} = ${initVal}; ; ${stepExpr}) {`);
      outputLines.push(`      boolean _cond = (${condExpr});`);
      outputLines.push(`      CodeFlowTracer.condition("${condExpr.replace(/"/g, '\\"')}", _cond, ${lineNum});`);
      outputLines.push(`      if (!_cond) {`);
      outputLines.push(`        CodeFlowTracer.loopEnd(${lineNum});`);
      outputLines.push(`        break;`);
      outputLines.push(`      }`);
      outputLines.push(`      CodeFlowTracer.loopIter("${iterVar}", ${iterVar}, ${lineNum});`);
      continue;
    }

    // 6. IF CONDITIONS (Phase 1)
    const ifMatch = trimmed.match(/^if\s*\((.+)\)\s*\{?$/);
    if (ifMatch && !trimmed.startsWith('else')) {
      const condExpr = ifMatch[1].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    boolean _cond_${lineNum} = (${condExpr});`);
      outputLines.push(`    CodeFlowTracer.condition("${condExpr.replace(/"/g, '\\"')}", _cond_${lineNum}, ${lineNum});`);
      outputLines.push(`    if (_cond_${lineNum}) {`);
      continue;
    }

    // 7. METHODS (Phase 1)
    const methodMatch = trimmed.match(/^static\s+(int|long|double|float|boolean|char|String|void)\s+([a-zA-Z_0-9]+)\s*\(([^)]*)\)\s*\{?$/);
    if (methodMatch) {
      const fnName = methodMatch[2];
      const paramsStr = methodMatch[3].trim();
      outputLines.push(rawLine);
      if (paramsStr.length > 0) {
        const paramPairs = paramsStr.split(',').map((p) => {
          const parts = p.trim().split(/\s+/);
          return parts[parts.length - 1];
        });
        const argsJsonExpr = paramPairs.map((p) => `\\"${p}\\":\" + ${p} + \"`).join(',');
        outputLines.push(`    CodeFlowTracer.funcCall("${fnName}", "{" + "${argsJsonExpr}" + "}", ${lineNum});`);
      } else {
        outputLines.push(`    CodeFlowTracer.funcCall("${fnName}", "{}", ${lineNum});`);
      }
      continue;
    }

    const returnMatch = trimmed.match(/^return\s+(.+);$/);
    if (returnMatch) {
      const retExpr = returnMatch[1].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    var _retVal = (${retExpr});`);
      outputLines.push(`    CodeFlowTracer.funcReturn("method", _retVal, ${lineNum});`);
      outputLines.push(`    return _retVal;`);
      continue;
    }

    // 8. PRINT STATEMENTS
    if (trimmed.startsWith('System.out.print')) {
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      continue;
    }

    outputLines.push(rawLine);
  }

  return {
    instrumentedCode: outputLines.join('\n'),
    className,
  };
}
