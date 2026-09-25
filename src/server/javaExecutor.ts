import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { CODE_FLOW_TRACER_JAVA } from './javaRuntime.ts';
import { instrumentJavaCode } from './instrumenter.ts';

export interface JavaExecutionResult {
  success: boolean;
  status: 'COMPLETED' | 'ERROR';
  events?: any[];
  consoleOutput?: string[];
  worker?: string;
  error?: {
    type: string;
    line: number;
    message: string;
    detail: string;
  };
}

// Security keyword check
const FORBIDDEN_PATTERNS = [
  /System\.exit/,
  /Runtime\.getRuntime/,
  /ProcessBuilder/,
  /java\.lang\.reflect/,
  /java\.net\./,
  /java\.io\.File/,
  /java\.nio\.file/,
];

export async function executeJavaWorker(userCode: string): Promise<JavaExecutionResult> {
  // 1. Security scan
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(userCode)) {
      return {
        success: false,
        status: 'ERROR',
        error: {
          type: 'SecurityException',
          line: 1,
          message: 'Access denied: Execution of host process, file I/O, or network operations is restricted in CodeFlow Lab.',
          detail: `Pattern matched: ${pattern.toString()}`,
        },
      };
    }
  }

  // 2. Setup temporary sandbox directory
  const sandboxDir = path.join(os.tmpdir(), `codeflow-exec-${randomUUID()}`);
  const pkgDir = path.join(sandboxDir, 'com', 'codeflow');

  try {
    fs.mkdirSync(pkgDir, { recursive: true });

    // Extract class name
    const classMatch = userCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
    const className = classMatch ? classMatch[1] : 'Main';

    // Provide built-in TreeNode, BST, Trie helpers if not declared in user code
    if (!userCode.includes('class TreeNode') && (userCode.includes('TreeNode') || userCode.includes('BinaryTree') || userCode.includes('BST'))) {
      const treeNodeSrc = `public class TreeNode {
    public int val;
    public TreeNode left;
    public TreeNode right;
    public TreeNode() {}
    public TreeNode(int val) { this.val = val; }
    public TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}`;
      fs.writeFileSync(path.join(sandboxDir, 'TreeNode.java'), treeNodeSrc, 'utf8');
      fs.writeFileSync(path.join(pkgDir, 'TreeNode.java'), `package com.codeflow;\n${treeNodeSrc}`, 'utf8');
    }

    if (!userCode.includes('class BST') && userCode.includes('BST')) {
      const bstSrc = `public class BST {
    public TreeNode root;
    public void insert(int val) {
        root = insertRec(root, val);
    }
    private TreeNode insertRec(TreeNode curr, int val) {
        if (curr == null) return new TreeNode(val);
        if (val < curr.val) curr.left = insertRec(curr.left, val);
        else if (val > curr.val) curr.right = insertRec(curr.right, val);
        return curr;
    }
    public boolean search(int val) {
        return searchRec(root, val);
    }
    private boolean searchRec(TreeNode curr, int val) {
        if (curr == null) return false;
        if (curr.val == val) return true;
        return val < curr.val ? searchRec(curr.left, val) : searchRec(curr.right, val);
    }
    public void delete(int val) {
        root = deleteRec(root, val);
    }
    private TreeNode deleteRec(TreeNode curr, int val) {
        if (curr == null) return null;
        if (val < curr.val) curr.left = deleteRec(curr.left, val);
        else if (val > curr.val) curr.right = deleteRec(curr.right, val);
        else {
            if (curr.left == null) return curr.right;
            if (curr.right == null) return curr.left;
            curr.val = minValue(curr.right);
            curr.right = deleteRec(curr.right, curr.val);
        }
        return curr;
    }
    private int minValue(TreeNode curr) {
        int min = curr.val;
        while (curr.left != null) {
            min = curr.left.val;
            curr = curr.left;
        }
        return min;
    }
}`;
      fs.writeFileSync(path.join(sandboxDir, 'BST.java'), bstSrc, 'utf8');
      fs.writeFileSync(path.join(pkgDir, 'BST.java'), `package com.codeflow;\n${bstSrc}`, 'utf8');
    }

    if (!userCode.includes('class Trie') && userCode.includes('Trie')) {
      const trieSrc = `import java.util.*;

public class Trie {
    public static class TrieNode {
        public Map<Character, TrieNode> children = new HashMap<>();
        public boolean isEndOfWord;
    }
    public TrieNode root = new TrieNode();
    public void insert(String word) {
        TrieNode curr = root;
        for (char ch : word.toCharArray()) {
            curr.children.putIfAbsent(ch, new TrieNode());
            curr = curr.children.get(ch);
        }
        curr.isEndOfWord = true;
    }
    public boolean search(String word) {
        TrieNode curr = root;
        for (char ch : word.toCharArray()) {
            if (!curr.children.containsKey(ch)) return false;
            curr = curr.children.get(ch);
        }
        return curr.isEndOfWord;
    }
    public boolean startsWith(String prefix) {
        TrieNode curr = root;
        for (char ch : prefix.toCharArray()) {
            if (!curr.children.containsKey(ch)) return false;
            curr = curr.children.get(ch);
        }
        return true;
    }
}`;
      fs.writeFileSync(path.join(sandboxDir, 'Trie.java'), trieSrc, 'utf8');
      fs.writeFileSync(path.join(pkgDir, 'Trie.java'), `package com.codeflow;\n${trieSrc}`, 'utf8');
    }

    if (!userCode.includes('class Graph') && userCode.includes('Graph')) {
      const graphSrc = `import java.util.*;

public class Graph {
    public static class Edge {
        public String id;
        public String source;
        public String target;
        public boolean directed;
        public boolean weighted;
        public double weight;
        public Edge(String id, String source, String target, boolean directed, boolean weighted, double weight) {
            this.id = id;
            this.source = source;
            this.target = target;
            this.directed = directed;
            this.weighted = weighted;
            this.weight = weight;
        }
    }
    public boolean directed = false;
    public boolean weighted = false;
    public Set<String> vertices = new LinkedHashSet<>();
    public List<Edge> edges = new ArrayList<>();
    public Map<String, List<Edge>> adj = new LinkedHashMap<>();

    public Graph() {}
    public Graph(boolean directed) { this.directed = directed; }
    public Graph(boolean directed, boolean weighted) {
        this.directed = directed;
        this.weighted = weighted;
    }

    public void addVertex(String v) {
        vertices.add(v);
        adj.putIfAbsent(v, new ArrayList<>());
    }

    public void addNode(String v) {
        addVertex(v);
    }

    public void addEdge(String src, String tgt) {
        addEdge(src, tgt, 1.0);
    }

    public void addEdge(String src, String tgt, double weight) {
        addVertex(src);
        addVertex(tgt);
        boolean isW = (weight != 1.0) || this.weighted;
        if (isW) this.weighted = true;
        String edgeId = "edge_" + src + "_" + tgt + "_" + edges.size();
        Edge e = new Edge(edgeId, src, tgt, directed, isW, weight);
        edges.add(e);
        adj.get(src).add(e);
        if (!directed) {
            Edge rev = new Edge(edgeId + "_rev", tgt, src, directed, isW, weight);
            adj.get(tgt).add(rev);
        }
    }

    public void removeEdge(String src, String tgt) {
        if (adj.containsKey(src)) {
            adj.get(src).removeIf(e -> e.target.equals(tgt));
        }
        if (!directed && adj.containsKey(tgt)) {
            adj.get(tgt).removeIf(e -> e.target.equals(src));
        }
        edges.removeIf(e -> (e.source.equals(src) && e.target.equals(tgt)) || (!directed && e.source.equals(tgt) && e.target.equals(src)));
    }

    public List<String> getNeighbors(String v) {
        List<String> neighbors = new ArrayList<>();
        if (adj.containsKey(v)) {
            for (Edge e : adj.get(v)) {
                neighbors.add(e.target);
            }
        }
        return neighbors;
    }

    public List<String> bfs(String start) {
        List<String> visitedOrder = new ArrayList<>();
        Set<String> visited = new LinkedHashSet<>();
        Queue<String> queue = new LinkedList<>();

        visited.add(start);
        visitedOrder.add(start);
        queue.add(start);

        while (!queue.isEmpty()) {
            String curr = queue.poll();
            for (String neighbor : getNeighbors(curr)) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    visitedOrder.add(neighbor);
                    queue.add(neighbor);
                }
            }
        }
        return visitedOrder;
    }

    public List<String> dfs(String start) {
        List<String> visitedOrder = new ArrayList<>();
        Set<String> visited = new LinkedHashSet<>();
        dfsRec(start, visited, visitedOrder);
        return visitedOrder;
    }

    private void dfsRec(String curr, Set<String> visited, List<String> order) {
        visited.add(curr);
        order.add(curr);
        for (String neighbor : getNeighbors(curr)) {
            if (!visited.contains(neighbor)) {
                dfsRec(neighbor, visited, order);
            }
        }
    }

    public Map<String, Double> dijkstra(String start) {
        Map<String, Double> distances = new LinkedHashMap<>();
        for (String v : vertices) distances.put(v, Double.POSITIVE_INFINITY);
        distances.put(start, 0.0);

        PriorityQueue<String[]> pq = new PriorityQueue<>(Comparator.comparingDouble(a -> Double.parseDouble(a[1])));
        pq.add(new String[]{start, "0.0"});

        while (!pq.isEmpty()) {
            String[] top = pq.poll();
            String u = top[0];
            double d = Double.parseDouble(top[1]);
            if (d > distances.get(u)) continue;

            if (adj.containsKey(u)) {
                for (Edge e : adj.get(u)) {
                    double newDist = distances.get(u) + e.weight;
                    if (newDist < distances.get(e.target)) {
                        distances.put(e.target, newDist);
                        pq.add(new String[]{e.target, String.valueOf(newDist)});
                    }
                }
            }
        }
        return distances;
    }
}`;
      fs.writeFileSync(path.join(sandboxDir, 'Graph.java'), graphSrc, 'utf8');
      fs.writeFileSync(path.join(pkgDir, 'Graph.java'), `package com.codeflow;\n${graphSrc}`, 'utf8');
    }

    // 3. Test compile the RAW user code first to catch genuine javac compilation errors
    const rawJavaFile = path.join(sandboxDir, `${className}.java`);
    fs.writeFileSync(rawJavaFile, userCode, 'utf8');

    const sandboxJavaFiles = fs
      .readdirSync(sandboxDir)
      .filter((f) => f.endsWith('.java'))
      .map((f) => `"${path.join(sandboxDir, f)}"`)
      .join(' ');

    const compileError = await new Promise<{ line: number; message: string; detail: string } | null>((resolve) => {
      exec(`javac -cp "${sandboxDir}" ${sandboxJavaFiles}`, { timeout: 4000, cwd: sandboxDir }, (error, _stdout, stderr) => {
        if (error) {
          const errText = stderr || error.message;
          // Parse javac format: e.g. Main.java:5: error: ';' expected
          const lineMatch = errText.match(/(?:Main|\w+)\.java:(\d+):\s*error:\s*(.+)/);
          const lineNum = lineMatch ? parseInt(lineMatch[1], 10) : 1;
          const msg = lineMatch ? lineMatch[2] : 'Compilation failed';
          resolve({
            line: lineNum,
            message: msg,
            detail: errText,
          });
        } else {
          resolve(null);
        }
      });
    });

    if (compileError) {
      return {
        success: false,
        status: 'ERROR',
        error: {
          type: 'Compilation Error',
          line: compileError.line,
          message: compileError.message,
          detail: compileError.detail,
        },
      };
    }

    // 4. Instrument code and write tracer runtime
    const tracerFile = path.join(pkgDir, 'CodeFlowTracer.java');
    fs.writeFileSync(tracerFile, CODE_FLOW_TRACER_JAVA, 'utf8');

    const { instrumentedCode } = instrumentJavaCode(userCode);
    const instrumentedJavaFile = path.join(pkgDir, `${className}.java`);
    fs.writeFileSync(instrumentedJavaFile, instrumentedCode, 'utf8');

    // 5. Compile instrumented package
    const pkgFiles = fs.readdirSync(pkgDir).filter((f) => f.endsWith('.java')).map((f) => `"${path.join(pkgDir, f)}"`).join(' ');
    await new Promise<void>((resolve, reject) => {
      exec(
        `javac -d "${sandboxDir}" -cp "${sandboxDir}" ${pkgFiles}`,
        { timeout: 4000, cwd: sandboxDir },
        (error, _stdout, stderr) => {
          if (error) {
            reject(new Error(`Failed to compile instrumented code: ${stderr || error.message}`));
          } else {
            resolve();
          }
        }
      );
    });

    // 6. Execute instrumented class with timeout and memory limits
    const executionOutput = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      const child = spawn(
        'java',
        ['-Xmx64m', '-XX:+UseSerialGC', '-cp', sandboxDir, `com.codeflow.${className}`],
        { timeout: 3500 }
      );

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code, signal) => {
        if (signal === 'SIGTERM' || signal === 'SIGKILL' || code === null) {
          reject(new Error('TIMEOUT'));
        } else {
          resolve({ stdout, stderr });
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });

    // 7. Parse execution events from output
    const stdout = executionOutput.stdout;
    const beginMarker = '__CODEFLOW_EVENTS_BEGIN__';
    const endMarker = '__CODEFLOW_EVENTS_END__';

    const beginIdx = stdout.indexOf(beginMarker);
    const endIdx = stdout.indexOf(endMarker);

    if (beginIdx !== -1 && endIdx !== -1) {
      const jsonStr = stdout.substring(beginIdx + beginMarker.length, endIdx).trim();
      try {
        const events = JSON.parse(jsonStr);
        const printEvents = events
          .filter((e: any) => e.type === 'PRINT' || e.type === 'CONSOLE_OUTPUT')
          .map((e: any) => String(e.value ?? e.message ?? ''));
        const userStdout = (stdout.substring(0, beginIdx) + stdout.substring(endIdx + endMarker.length)).trim();
        const consoleLines = printEvents.length > 0 ? printEvents : (userStdout ? userStdout.split(/\r?\n/) : []);
        return {
          success: true,
          status: 'COMPLETED',
          events,
          consoleOutput: consoleLines,
          worker: 'Java 22.0.1 (JVM Sandboxed)',
        };
      } catch (err: any) {
        return {
          success: false,
          status: 'ERROR',
          error: {
            type: 'TraceParseError',
            line: 1,
            message: 'Failed to parse execution trace',
            detail: err.message,
          },
        };
      }
    }

    // Check runtime stderr for exceptions like ArithmeticException or ArrayIndexOutOfBoundsException
    const stderr = executionOutput.stderr;
    if (stderr.includes('Exception in thread')) {
      const exMatch = stderr.match(/Exception in thread "main" ([a-zA-Z0-9_.]+)(?::\s*([^\r\n]+))?/);
      const exLineMatch = stderr.match(/at com\.codeflow\.\w+\.main\(.*:(\d+)\)/);
      const exName = exMatch ? exMatch[1].split('.').pop() || 'RuntimeError' : 'RuntimeError';
      const exDetail = exMatch && exMatch[2] ? exMatch[2] : exName;
      const exLine = exLineMatch ? parseInt(exLineMatch[1], 10) : 1;

      return {
        success: false,
        status: 'ERROR',
        error: {
          type: 'Runtime Error',
          line: exLine,
          message: `${exName}: ${exDetail}`,
          detail: stderr,
        },
      };
    }

    return {
      success: true,
      status: 'COMPLETED',
      events: [],
      worker: 'Java 22.0.1 (JVM Sandboxed)',
    };
  } catch (err: any) {
    if (err.message === 'TIMEOUT' || err.code === 'ETIMEDOUT') {
      return {
        success: false,
        status: 'ERROR',
        error: {
          type: 'Runtime Error',
          line: 1,
          message: 'TimeLimitExceeded: Execution exceeded 3.5s timeout. Possible infinite loop detected.',
          detail: 'Java execution worker terminated process.',
        },
      };
    }
    return {
      success: false,
      status: 'ERROR',
      error: {
        type: 'Execution Error',
        line: 1,
        message: err.message || 'Worker execution failed',
        detail: String(err),
      },
    };
  } finally {
    // 8. Sandbox cleanup
    try {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    } catch {}
  }
}
