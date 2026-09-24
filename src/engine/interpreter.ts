import {
  ExecutionEvent,
  ExecutionStep,
  VariableInfo,
  CallFrame,
  DataStructureState,
  HeapObject,
  ComparisonInfo,
  ExecutionError,
  LinkedListNode,
  TreeNodeData,
} from '../types/execution';

// Helper to estimate byte sizes in JVM
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
    case 'reference':
    case 'ref':
    case 'node':
    case 'treenode':
      return 8;
    case 'stack':
    case 'queue':
    case 'hashmap':
    case 'hashset':
      return 32 + (Array.isArray(val) ? val.length * 8 : 16);
    default:
      if (Array.isArray(val)) return 16 + val.length * 4;
      return 8;
  }
}

class Scope {
  variables: Record<string, VariableInfo> = {};
  parent: Scope | null = null;
  name: string;

  constructor(name: string, parent: Scope | null = null) {
    this.name = name;
    this.parent = parent;
  }

  get(name: string): VariableInfo | undefined {
    if (this.variables[name]) return this.variables[name];
    if (this.parent) return this.parent.get(name);
    return undefined;
  }

  set(name: string, info: VariableInfo) {
    if (this.variables[name]) {
      this.variables[name] = info;
      return;
    }
    if (this.parent && this.parent.get(name)) {
      this.parent.set(name, info);
      return;
    }
    this.variables[name] = info;
  }

  getAll(): Record<string, VariableInfo> {
    const result: Record<string, VariableInfo> = this.parent ? this.parent.getAll() : {};
    Object.assign(result, this.variables);
    return result;
  }
}

interface ParamDef {
  type: string;
  name: string;
}

interface FunctionDef {
  name: string;
  returnType: string;
  params: ParamDef[];
  body: string[];
  startLine: number;
}

export class ExecutionEngine {
  private steps: ExecutionStep[] = [];
  private structures: Record<string, DataStructureState> = {};
  private heap: HeapObject[] = [];
  private callStack: CallFrame[] = [];
  private consoleOutput: string[] = [];
  private heapCounter = 100;
  private maxSteps = 500;
  private currentScope: Scope = new Scope('main');
  private functions: Record<string, FunctionDef> = {};

  private allocateHeapId(prefix: string): string {
    this.heapCounter++;
    return `${prefix}#${this.heapCounter}`;
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private recordStep(
    line: number,
    event: ExecutionEvent,
    explanation: string,
    comparison: ComparisonInfo | null = null,
    error: ExecutionError | null = null
  ) {
    const allVars = this.currentScope.getAll();
    let stackBytes = 0;
    for (const v of Object.values(allVars)) {
      stackBytes += v.estimatedBytes;
    }
    let heapBytes = 0;
    for (const h of this.heap) {
      heapBytes += h.estimatedBytes;
    }

    const activePointers: Record<string, any> = {};
    for (const [vName, vInfo] of Object.entries(allVars)) {
      if (
        typeof vInfo.value === 'number' &&
        (vName === 'i' ||
          vName === 'j' ||
          vName === 'k' ||
          vName === 'left' ||
          vName === 'right' ||
          vName === 'mid' ||
          vName === 'low' ||
          vName === 'high' ||
          vName === 'top' ||
          vName === 'front' ||
          vName === 'rear' ||
          vName.startsWith('count'))
      ) {
        activePointers[vName] = vInfo.value;
      } else if (vInfo.isReference) {
        activePointers[vName] = vInfo.refTargetId || vInfo.value;
      }
    }

    const step: ExecutionStep = {
      stepIndex: this.steps.length,
      line,
      event,
      explanation,
      variables: this.deepClone(allVars),
      callStack: this.deepClone(this.callStack),
      structures: this.deepClone(this.structures),
      heap: this.deepClone(this.heap),
      consoleOutput: [...this.consoleOutput],
      activePointers,
      comparison,
      error,
      memoryStats: {
        stackBytes,
        heapBytes,
        totalBytes: stackBytes + heapBytes,
      },
    };

    this.steps.push(step);
  }

  // Pre-process and extract functions
  private extractFunctions(lines: string[]) {
    this.functions = {};
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const funcMatchJava = line.match(
        /^(?:public\s+|private\s+|protected\s+|static\s+)*(void|int|double|boolean|String|Node|ListNode|TreeNode)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{?$/
      );
      const funcMatchPy = line.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:/);

      if (funcMatchJava && !line.includes('main(')) {
        const returnType = funcMatchJava[1];
        const funcName = funcMatchJava[2];
        const rawParamStrings = funcMatchJava[3].split(',').map((p) => p.trim()).filter(Boolean);

        const params: ParamDef[] = rawParamStrings.map((p) => {
          const parts = p.split(/\s+/);
          const pName = parts[parts.length - 1];
          const pType = parts.length > 1 ? parts[0] : 'Object';
          return { type: pType, name: pName };
        });

        const bodyLines: string[] = [];
        let braceCount = line.includes('{') ? 1 : 0;
        let j = i + 1;
        while (j < lines.length) {
          const l = lines[j];
          if (l.includes('{')) braceCount++;
          if (l.includes('}')) {
            braceCount--;
            if (braceCount <= 0) break;
          }
          bodyLines.push(l);
          j++;
        }
        this.functions[funcName] = {
          name: funcName,
          returnType,
          params,
          body: bodyLines,
          startLine: i + 1,
        };
      } else if (funcMatchPy) {
        const funcName = funcMatchPy[1];
        const rawParamStrings = funcMatchPy[2].split(',').map((p) => p.trim()).filter(Boolean);
        const params: ParamDef[] = rawParamStrings.map((p) => ({ type: 'any', name: p }));
        const bodyLines: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const l = lines[j];
          if (l.trim() && !l.startsWith('  ') && !l.startsWith('\t')) break;
          bodyLines.push(l);
          j++;
        }
        this.functions[funcName] = {
          name: funcName,
          returnType: 'any',
          params,
          body: bodyLines,
          startLine: i + 1,
        };
      }
    }
  }

  // Evaluate simple expressions with current scope
  private evaluateExpr(expr: string): any {
    expr = expr.trim();
    if (!expr) return undefined;

    // String literal
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }
    // Numbers
    if (/^-?\d+$/.test(expr)) return parseInt(expr, 10);
    if (/^-?\d+\.\d+$/.test(expr)) return parseFloat(expr);
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null' || expr === 'None') return null;

    // Array length: arr.length or len(arr)
    const lenMatchJava = expr.match(/^([a-zA-Z_]\w*)\.length$/);
    if (lenMatchJava) {
      const arr = this.structures[lenMatchJava[1]];
      if (arr && arr.arrayData) return arr.arrayData.length;
    }
    const lenMatchPy = expr.match(/^len\(([a-zA-Z_]\w*)\)$/);
    if (lenMatchPy) {
      const arr = this.structures[lenMatchPy[1]];
      if (arr && arr.arrayData) return arr.arrayData.length;
    }

    // Array access: arr[i] or arr[0]
    const arrAccessMatch = expr.match(/^([a-zA-Z_]\w*)\[([^\]]+)\]$/);
    if (arrAccessMatch) {
      const varName = arrAccessMatch[1];
      const idxExpr = arrAccessMatch[2];
      const idx = this.evaluateExpr(idxExpr);
      const st = this.structures[varName];
      if (st && st.arrayData) {
        return st.arrayData[idx];
      }
    }

    // Stack peek or isEmpty or size
    const stackPeek = expr.match(/^([a-zA-Z_]\w*)\.peek\(\)$/);
    if (stackPeek) {
      const st = this.structures[stackPeek[1]];
      if (st && st.stackData && st.stackData.length > 0) {
        return st.stackData[st.stackData.length - 1];
      }
    }
    const stackEmpty = expr.match(/^([a-zA-Z_]\w*)\.isEmpty\(\)$/);
    if (stackEmpty) {
      const st = this.structures[stackEmpty[1]];
      return st && st.stackData ? st.stackData.length === 0 : true;
    }

    // Node property: node.val, node.data, or node.next
    const nodeProp = expr.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)$/);
    if (nodeProp) {
      const varName = nodeProp[1];
      const prop = nodeProp[2];
      const v = this.currentScope.get(varName);
      if (v && (v.value === null || v.refTargetId === undefined)) {
        throw {
          type: 'NullPointerException',
          message: `Attempted to access field '${prop}' on null reference '${varName}'`,
          variableName: varName,
          detail: `Variable '${varName}' currently points to null. There is no object in memory to access.`,
          brokenReference: { source: varName, target: null },
        };
      }
      if (v && v.refTargetId) {
        const heapObj = this.heap.find((h) => h.id === v.refTargetId);
        if (heapObj && heapObj.fields) {
          if (prop === 'data' && 'val' in heapObj.fields) return heapObj.fields.val;
          if (prop === 'val' && 'data' in heapObj.fields) return heapObj.fields.data;
          if (prop in heapObj.fields) return heapObj.fields[prop];
        }
      }
    }

    // Identifier lookup
    const v = this.currentScope.get(expr);
    if (v !== undefined) {
      return v.value;
    }

    // Arithmetic / binary operations with basic precedence
    try {
      const sanitized = expr.replace(/[a-zA-Z_]\w*(?:\[[^\]]+\]|\.[a-zA-Z_]\w*)?/g, (token) => {
        const val = this.evaluateExpr(token);
        return typeof val === 'number' || typeof val === 'boolean' ? String(val) : JSON.stringify(val);
      });
      // eslint-disable-next-line no-eval
      return Function(`"use strict"; return (${sanitized});`)();
    } catch {
      return undefined;
    }
  }

  // Parse condition: e.g. "curr != null" or "count2 + K == count"
  private evaluateCondition(condStr: string): { result: boolean; comparison: ComparisonInfo } {
    const operators = ['<=', '>=', '==', '!=', '<', '>'];
    for (const op of operators) {
      const parts = condStr.split(op);
      if (parts.length === 2) {
        const leftExpr = parts[0].trim();
        const rightExpr = parts[1].trim();
        const leftVal = this.evaluateExpr(leftExpr);
        const rightVal = this.evaluateExpr(rightExpr);

        let res = false;
        switch (op) {
          case '<':
            res = leftVal < rightVal;
            break;
          case '>':
            res = leftVal > rightVal;
            break;
          case '<=':
            res = leftVal <= rightVal;
            break;
          case '>=':
            res = leftVal >= rightVal;
            break;
          case '==':
            res = leftVal === rightVal;
            break;
          case '!=':
            res = leftVal !== rightVal;
            break;
        }

        const comparison: ComparisonInfo = {
          left: leftVal,
          right: rightVal,
          operator: op,
          result: res,
          explanation: `Evaluated (${leftExpr} [${leftVal}] ${op} ${rightExpr} [${rightVal}]) ➔ ${res ? 'TRUE' : 'FALSE'}`,
        };

        return { result: res, comparison };
      }
    }

    const val = Boolean(this.evaluateExpr(condStr));
    return {
      result: val,
      comparison: {
        left: condStr,
        right: '',
        operator: 'isTruthy',
        result: val,
        explanation: `Condition evaluated to ${val ? 'TRUE' : 'FALSE'}`,
      },
    };
  }

  // Main runner
  public execute(code: string, _language: 'java' | 'python'): ExecutionStep[] {
    this.steps = [];
    this.structures = {};
    this.heap = [];
    this.callStack = [];
    this.consoleOutput = [];
    this.heapCounter = 100;
    this.currentScope = new Scope('main');

    const rawLines = code.split('\n');
    const cleanedLines = rawLines.map((l) => l.replace(/[\r]/g, ''));

    this.callStack.push({
      id: 'frame-main',
      functionName: 'main()',
      arguments: {},
      localVariables: {},
      line: 1,
      depth: 1,
    });

    this.recordStep(
      1,
      { type: 'PROGRAM_START', line: 1, message: 'Program execution started' },
      '🚀 Initialized execution context and allocated main stack frame.'
    );

    this.extractFunctions(cleanedLines);

    // Determine if user code has top-level executable statements outside function/class declarations
    let hasTopLevelCode = false;
    for (let i = 0; i < cleanedLines.length; i++) {
      const trimmed = cleanedLines[i].trim();
      if (
        !trimmed ||
        trimmed.startsWith('//') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('package ') ||
        trimmed.startsWith('import ') ||
        trimmed.startsWith('public class ') ||
        trimmed.startsWith('class ') ||
        trimmed.startsWith('interface ') ||
        trimmed === '{' ||
        trimmed === '}'
      ) {
        continue;
      }
      // Check if it's the start of a function definition
      if (
        trimmed.match(
          /^(?:public\s+|private\s+|protected\s+|static\s+)*(?:void|int|double|boolean|String|Node|ListNode|TreeNode)\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*\{?$/
        ) ||
        trimmed.startsWith('def ')
      ) {
        let depth = trimmed.includes('{') ? 1 : 0;
        i++;
        while (i < cleanedLines.length && depth > 0) {
          if (cleanedLines[i].includes('{')) depth++;
          if (cleanedLines[i].includes('}')) depth--;
          i++;
        }
        continue;
      }

      hasTopLevelCode = true;
      break;
    }

    try {
      if (!hasTopLevelCode && Object.keys(this.functions).length > 0) {
        // Auto-harness: The user pasted a standalone method (e.g. LeetCode / GeeksForGeeks style)
        const primaryFuncName = Object.keys(this.functions)[0];
        const primaryFunc = this.functions[primaryFuncName];

        this.synthesizeTestInputAndExecute(primaryFunc);
      } else {
        // Normal top-level execution
        this.executeBlock(cleanedLines, 0, cleanedLines.length, 1);
      }
    } catch (err: any) {
      const errLine = err.line || 1;
      const errorObj: ExecutionError = {
        type: err.type || 'RuntimeError',
        message: err.message || String(err),
        line: errLine,
        variableName: err.variableName,
        detail: err.detail || 'An unhandled exception halted program execution.',
        brokenReference: err.brokenReference,
      };

      this.recordStep(
        errLine,
        {
          type: 'EXCEPTION',
          line: errLine,
          message: errorObj.message,
          meta: { error: errorObj },
        },
        `❌ ${errorObj.type}: ${errorObj.message}`,
        null,
        errorObj
      );
    }

    if (this.steps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1];
      if (lastStep.event.type !== 'EXCEPTION') {
        this.recordStep(
          cleanedLines.length,
          { type: 'PROGRAM_END', line: cleanedLines.length, message: 'Program finished execution successfully' },
          '✅ Program execution finished successfully.'
        );
      }
    }

    const total = this.steps.length;
    this.steps.forEach((s) => (s.totalSteps = total));

    return this.steps;
  }

  // Auto-synthesize mock inputs for standalone methods
  private synthesizeTestInputAndExecute(funcDef: FunctionDef) {
    const evaluatedArgs: Record<string, any> = {};
    const inputDescriptions: string[] = [];

    funcDef.params.forEach((param) => {
      const pType = param.type.toLowerCase();
      const pName = param.name;

      if (pType.includes('node') || pType.includes('listnode')) {
        // Construct Linked List 10 -> 20 -> 30 -> 40 -> 50
        const values = [10, 20, 30, 40, 50];
        let headId: string | null = null;
        let prevNode: LinkedListNode | null = null;
        const nodesMap: Record<string, LinkedListNode> = {};

        values.forEach((v) => {
          const nId = this.allocateHeapId('Node');
          if (!headId) headId = nId;
          const node: LinkedListNode = { id: nId, value: v, nextId: null };
          nodesMap[nId] = node;

          this.heap.push({
            id: nId,
            type: 'Node',
            label: `Node(${v})`,
            fields: { val: v, data: v, next: null },
            estimatedBytes: 24,
            referencesTo: [],
          });

          if (prevNode) {
            prevNode.nextId = nId;
            const prevHeap = this.heap.find((h) => h.id === prevNode!.id);
            if (prevHeap) prevHeap.fields.next = nId;
          }
          prevNode = node;
        });

        this.structures['LinkedList'] = {
          id: 'll-harness',
          name: 'LinkedList (Input)',
          type: 'linkedlist',
          dataType: 'Node',
          linkedListData: { headId, nodes: nodesMap },
          pointers: { head: headId! },
          lastOperation: 'Synthesized 5-node test input',
        };

        evaluatedArgs[pName] = `ref -> ${headId}`;
        this.currentScope.set(pName, {
          name: pName,
          type: 'Node',
          value: `ref -> ${headId}`,
          scope: 'main',
          isReference: true,
          refTargetId: headId!,
          estimatedBytes: 8,
        });

        inputDescriptions.push(`${pName} = [10 ➔ 20 ➔ 30 ➔ 40 ➔ 50]`);
      } else if (pType.includes('tree') || pType.includes('treenode')) {
        // Construct 5-node BST
        const rootId = this.allocateHeapId('TreeNode');
        const lId = this.allocateHeapId('TreeNode');
        const rId = this.allocateHeapId('TreeNode');

        this.heap.push(
          { id: rootId, type: 'TreeNode', label: 'TreeNode(50)', fields: { val: 50, left: lId, right: rId }, estimatedBytes: 24, referencesTo: [lId, rId] },
          { id: lId, type: 'TreeNode', label: 'TreeNode(25)', fields: { val: 25, left: null, right: null }, estimatedBytes: 24, referencesTo: [] },
          { id: rId, type: 'TreeNode', label: 'TreeNode(75)', fields: { val: 75, left: null, right: null }, estimatedBytes: 24, referencesTo: [] }
        );

        this.structures['BinaryTree'] = {
          id: 'tree-harness',
          name: 'BinaryTree (Input)',
          type: 'tree',
          dataType: 'TreeNode',
          treeData: {
            rootId,
            nodes: {
              [rootId]: { id: rootId, value: 50, leftId: lId, rightId: rId },
              [lId]: { id: lId, value: 25, leftId: null, rightId: null },
              [rId]: { id: rId, value: 75, leftId: null, rightId: null },
            },
          },
          lastOperation: 'Synthesized test BST',
        };

        evaluatedArgs[pName] = `ref -> ${rootId}`;
        this.currentScope.set(pName, {
          name: pName,
          type: 'TreeNode',
          value: `ref -> ${rootId}`,
          scope: 'main',
          isReference: true,
          refTargetId: rootId,
          estimatedBytes: 8,
        });

        inputDescriptions.push(`${pName} = BST(50)`);
      } else if (pType.includes('[]')) {
        const arrVals = [10, 20, 30, 40, 50];
        const hId = this.allocateHeapId('Array');
        this.structures[pName] = {
          id: hId,
          name: pName,
          type: 'array',
          dataType: 'int[]',
          arrayData: [...arrVals],
          lastOperation: 'Synthesized array input',
        };
        this.heap.push({
          id: hId,
          type: 'int[]',
          label: `${pName} (5 elements)`,
          fields: { length: 5, values: [...arrVals] },
          estimatedBytes: 36,
          referencesTo: [],
        });
        evaluatedArgs[pName] = `ref -> ${hId}`;
        this.currentScope.set(pName, {
          name: pName,
          type: 'int[]',
          value: `ref -> ${hId}`,
          scope: 'main',
          isReference: true,
          refTargetId: hId,
          estimatedBytes: 8,
        });
        inputDescriptions.push(`${pName} = [10, 20, 30, 40, 50]`);
      } else if (pType === 'int' && /^k$/i.test(pName)) {
        evaluatedArgs[pName] = 2;
        this.currentScope.set(pName, {
          name: pName,
          type: 'int',
          value: 2,
          scope: 'main',
          isReference: false,
          estimatedBytes: 4,
        });
        inputDescriptions.push(`${pName} = 2`);
      } else if (pType === 'int' && /target/i.test(pName)) {
        evaluatedArgs[pName] = 30;
        this.currentScope.set(pName, {
          name: pName,
          type: 'int',
          value: 30,
          scope: 'main',
          isReference: false,
          estimatedBytes: 4,
        });
        inputDescriptions.push(`${pName} = 30`);
      } else if (pType === 'int') {
        evaluatedArgs[pName] = 4;
        this.currentScope.set(pName, {
          name: pName,
          type: 'int',
          value: 4,
          scope: 'main',
          isReference: false,
          estimatedBytes: 4,
        });
        inputDescriptions.push(`${pName} = 4`);
      } else {
        evaluatedArgs[pName] = 0;
        this.currentScope.set(pName, {
          name: pName,
          type: 'int',
          value: 0,
          scope: 'main',
          isReference: false,
          estimatedBytes: 4,
        });
        inputDescriptions.push(`${pName} = 0`);
      }
    });

    this.recordStep(
      funcDef.startLine,
      {
        type: 'FUNCTION_CALL',
        line: funcDef.startLine,
        functionName: funcDef.name,
        arguments: evaluatedArgs,
      },
      `⚡ Auto-harness initialized test inputs: ${inputDescriptions.join(', ')} and invoked \`${funcDef.name}()\`.`
    );

    // Call frame
    this.callStack.push({
      id: `frame-${this.callStack.length + 1}`,
      functionName: `${funcDef.name}(${Object.values(evaluatedArgs).join(', ')})`,
      arguments: evaluatedArgs,
      localVariables: {},
      line: funcDef.startLine,
      depth: this.callStack.length + 1,
    });

    const funcScope = new Scope(funcDef.name, this.currentScope);
    for (const [k, v] of Object.entries(evaluatedArgs)) {
      const existing = this.currentScope.get(k);
      if (existing) {
        funcScope.set(k, { ...existing, scope: funcDef.name });
      } else {
        funcScope.set(k, {
          name: k,
          type: 'Object',
          value: v,
          scope: funcDef.name,
          isReference: false,
          estimatedBytes: 4,
        });
      }
    }

    const prevScope = this.currentScope;
    this.currentScope = funcScope;

    const res = this.executeBlock(funcDef.body, 0, funcDef.body.length, funcDef.startLine);

    this.callStack.pop();
    this.currentScope = prevScope;

    if (res.returned) {
      this.recordStep(
        funcDef.startLine + funcDef.body.length,
        {
          type: 'FUNCTION_RETURN',
          line: funcDef.startLine + funcDef.body.length,
          functionName: funcDef.name,
          returnValue: res.value,
        },
        `🏁 \`${funcDef.name}\` finished and returned: \`${res.value !== undefined ? (typeof res.value === 'object' ? JSON.stringify(res.value) : res.value) : 'void'}\`.`
      );
    }
  }

  // Execute a block of statements line by line
  private executeBlock(
    lines: string[],
    startIdx: number,
    endIdx: number,
    baseLineOffset: number
  ): { returned: boolean; value: any } {
    let i = startIdx;
    while (i < endIdx) {
      if (this.steps.length >= this.maxSteps) {
        this.recordStep(
          i + baseLineOffset,
          { type: 'PROGRAM_END', line: i + baseLineOffset, message: 'Execution quota limit reached (max steps exceeded)' },
          '⚠️ Step limit reached to prevent infinite execution.'
        );
        break;
      }

      const rawLine = lines[i];
      const trimmed = rawLine.trim();
      const currentLineNum = i + baseLineOffset;

      // Skip comments, empty lines, imports, package, class wrappers
      if (
        !trimmed ||
        trimmed.startsWith('//') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('package ') ||
        trimmed.startsWith('import ') ||
        trimmed.startsWith('public class ') ||
        trimmed.startsWith('class ') ||
        trimmed.startsWith('interface ') ||
        trimmed === '{' ||
        trimmed === '}'
      ) {
        i++;
        continue;
      }

      // Check if it's the start of a function definition - skip execution here as it is executed on call
      if (
        trimmed.match(
          /^(?:public\s+|private\s+|protected\s+|static\s+)*(?:void|int|double|boolean|String|Node|ListNode|TreeNode)\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*\{?$/
        ) &&
        !trimmed.includes('main(')
      ) {
        let depth = trimmed.includes('{') ? 1 : 0;
        i++;
        while (i < endIdx && depth > 0) {
          if (lines[i].includes('{')) depth++;
          if (lines[i].includes('}')) depth--;
          i++;
        }
        continue;
      }
      if (trimmed.startsWith('def ')) {
        i++;
        while (i < endIdx && (lines[i].startsWith('  ') || lines[i].startsWith('\t') || !lines[i].trim())) {
          i++;
        }
        continue;
      }

      // 0. RETURN STATEMENT
      const retMatch = trimmed.match(/^return(?:\s+([^;]+))?;?$/);
      if (retMatch) {
        const retExpr = retMatch[1];
        const retVal = retExpr ? this.evaluateExpr(retExpr) : undefined;
        this.recordStep(
          currentLineNum,
          {
            type: 'FUNCTION_RETURN',
            line: currentLineNum,
            returnValue: retVal,
          },
          `🔙 Return executed: \`${retExpr || ''}\` ➔ ${retVal !== undefined ? retVal : 'void'}`
        );
        return { returned: true, value: retVal };
      }

      // 1. FOR LOOP
      const forMatch = trimmed.match(/^for\s*\(\s*(?:int\s+)?([a-zA-Z_]\w*)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\)\s*\{?$/);
      if (forMatch) {
        const iterVar = forMatch[1];
        const initValExpr = forMatch[2];
        const condExpr = forMatch[3];
        const stepExpr = forMatch[4];

        let bodyLines: string[] = [];
        let loopEndIdx = i + 1;
        let braceCount = trimmed.includes('{') ? 1 : 0;

        if (braceCount > 0) {
          while (loopEndIdx < endIdx) {
            const l = lines[loopEndIdx];
            if (l.includes('{')) braceCount++;
            if (l.includes('}')) {
              braceCount--;
              if (braceCount <= 0) break;
            }
            bodyLines.push(l);
            loopEndIdx++;
          }
        } else {
          bodyLines.push(lines[loopEndIdx]);
        }

        const initVal = this.evaluateExpr(initValExpr);
        const iterVarInfo: VariableInfo = {
          name: iterVar,
          type: 'int',
          value: initVal,
          scope: this.currentScope.name,
          isReference: false,
          estimatedBytes: 4,
        };
        this.currentScope.set(iterVar, iterVarInfo);

        this.recordStep(
          currentLineNum,
          {
            type: 'LOOP_START',
            line: currentLineNum,
            variable: iterVar,
            value: initVal,
            meta: { loopVar: iterVar, initialValue: initVal },
          },
          `🔁 Initialized loop iterator \`${iterVar} = ${initVal}\``
        );

        let loopSafety = 0;
        while (loopSafety < 150) {
          loopSafety++;
          const { result, comparison } = this.evaluateCondition(condExpr);
          this.recordStep(
            currentLineNum,
            {
              type: 'CONDITION_EVALUATE',
              line: currentLineNum,
              condition: condExpr,
              conditionResult: result,
            },
            comparison.explanation,
            comparison
          );

          if (!result) {
            this.recordStep(
              currentLineNum,
              { type: 'LOOP_END', line: currentLineNum, variable: iterVar },
              `⏹️ Loop condition \`${condExpr}\` is FALSE. Exited loop.`
            );
            break;
          }

          const bodyRes = this.executeBlock(bodyLines, 0, bodyLines.length, i + 1 + baseLineOffset);
          if (bodyRes.returned) {
            return bodyRes;
          }

          const currVal = this.currentScope.get(iterVar)?.value || 0;
          let nextVal = currVal;
          if (stepExpr.includes('++')) nextVal = currVal + 1;
          else if (stepExpr.includes('--')) nextVal = currVal - 1;
          else if (stepExpr.includes('+=')) {
            const addVal = parseInt(stepExpr.split('+=')[1].trim(), 10) || 1;
            nextVal = currVal + addVal;
          } else {
            nextVal = this.evaluateExpr(stepExpr) ?? (currVal + 1);
          }

          this.currentScope.set(iterVar, {
            ...iterVarInfo,
            value: nextVal,
          });

          this.recordStep(
            currentLineNum,
            {
              type: 'LOOP_ITERATION',
              line: currentLineNum,
              variable: iterVar,
              oldValue: currVal,
              newValue: nextVal,
            },
            `🔄 Increment loop variable \`${iterVar}\`: ${currVal} ➔ ${nextVal}`
          );
        }

        i = loopEndIdx + 1;
        continue;
      }

      // 2. WHILE LOOP
      const whileMatch = trimmed.match(/^while\s*\(([^)]+)\)\s*\{?$/);
      if (whileMatch) {
        const condExpr = whileMatch[1];
        let bodyLines: string[] = [];
        let loopEndIdx = i + 1;
        let braceCount = trimmed.includes('{') ? 1 : 0;
        if (braceCount > 0) {
          while (loopEndIdx < endIdx) {
            const l = lines[loopEndIdx];
            if (l.includes('{')) braceCount++;
            if (l.includes('}')) {
              braceCount--;
              if (braceCount <= 0) break;
            }
            bodyLines.push(l);
            loopEndIdx++;
          }
        } else {
          bodyLines.push(lines[loopEndIdx]);
        }

        let loopSafety = 0;
        while (loopSafety < 150) {
          loopSafety++;
          const { result, comparison } = this.evaluateCondition(condExpr);
          this.recordStep(
            currentLineNum,
            {
              type: 'CONDITION_EVALUATE',
              line: currentLineNum,
              condition: condExpr,
              conditionResult: result,
            },
            comparison.explanation,
            comparison
          );

          if (!result) {
            this.recordStep(
              currentLineNum,
              { type: 'LOOP_END', line: currentLineNum },
              `⏹️ While condition \`${condExpr}\` evaluated to FALSE. Exited loop.`
            );
            break;
          }

          const bodyRes = this.executeBlock(bodyLines, 0, bodyLines.length, i + 1 + baseLineOffset);
          if (bodyRes.returned) {
            return bodyRes;
          }
        }

        i = loopEndIdx + 1;
        continue;
      }

      // 3. IF / ELSE STATEMENT
      const ifMatch = trimmed.match(/^if\s*\(([^)]+)\)\s*\{?$/);
      if (ifMatch) {
        const condExpr = ifMatch[1];
        let thenLines: string[] = [];
        let elseLines: string[] = [];
        let idx = i + 1;
        let braceCount = trimmed.includes('{') ? 1 : 0;
        if (braceCount > 0) {
          while (idx < endIdx) {
            const l = lines[idx];
            if (l.includes('{')) braceCount++;
            if (l.includes('}')) {
              braceCount--;
              if (braceCount <= 0) break;
            }
            thenLines.push(l);
            idx++;
          }
        } else {
          thenLines.push(lines[idx]);
        }

        idx++;
        if (idx < endIdx && lines[idx].trim().startsWith('else')) {
          const elseLine = lines[idx].trim();
          idx++;
          let elseBraces = elseLine.includes('{') ? 1 : 0;
          if (elseBraces > 0) {
            while (idx < endIdx) {
              const l = lines[idx];
              if (l.includes('{')) elseBraces++;
              if (l.includes('}')) {
                elseBraces--;
                if (elseBraces <= 0) break;
              }
              elseLines.push(l);
              idx++;
            }
          } else {
            elseLines.push(lines[idx]);
          }
        }

        const { result, comparison } = this.evaluateCondition(condExpr);
        this.recordStep(
          currentLineNum,
          {
            type: 'CONDITION_EVALUATE',
            line: currentLineNum,
            condition: condExpr,
            conditionResult: result,
          },
          comparison.explanation,
          comparison
        );

        if (result) {
          const res = this.executeBlock(thenLines, 0, thenLines.length, i + 1 + baseLineOffset);
          if (res.returned) return res;
        } else if (elseLines.length > 0) {
          const res = this.executeBlock(elseLines, 0, elseLines.length, idx - elseLines.length + baseLineOffset);
          if (res.returned) return res;
        }

        i = idx;
        continue;
      }

      // 4. ARRAY INITIALIZATION
      const arrayInitMatch =
        trimmed.match(/^(?:int|double|String|char|long)\[\]\s+([a-zA-Z_]\w*)\s*=\s*\{([^}]*)\};?$/) ||
        trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*\[([^\]]*)\];?$/);

      if (arrayInitMatch) {
        const arrName = arrayInitMatch[1];
        const rawVals = arrayInitMatch[2].split(',').map((v) => v.trim()).filter((v) => v.length > 0);
        const parsedVals = rawVals.map((v) => this.evaluateExpr(v) ?? 0);
        const heapId = this.allocateHeapId('Array');

        this.structures[arrName] = {
          id: heapId,
          name: arrName,
          type: 'array',
          dataType: 'int[]',
          arrayData: [...parsedVals],
          activeIndices: [],
          pointers: {},
          lastOperation: 'Created array',
        };

        this.heap.push({
          id: heapId,
          type: 'int[]',
          label: `${arrName} (length: ${parsedVals.length})`,
          fields: { length: parsedVals.length, values: [...parsedVals] },
          estimatedBytes: 16 + parsedVals.length * 4,
          referencesTo: [],
        });

        this.currentScope.set(arrName, {
          name: arrName,
          type: 'int[]',
          value: `ref -> ${heapId}`,
          scope: this.currentScope.name,
          isReference: true,
          refTargetId: heapId,
          estimatedBytes: 8,
        });

        this.recordStep(
          currentLineNum,
          {
            type: 'ARRAY_CREATE',
            line: currentLineNum,
            variable: arrName,
            structureId: heapId,
            structureType: 'array',
            values: [...parsedVals],
          },
          `📦 Initialized array \`${arrName}\` on Heap (${heapId}) with values: [${parsedVals.join(', ')}]`
        );

        i++;
        continue;
      }

      // 5. ARRAY ELEMENT UPDATE: arr[i] = ...
      const arrayUpdateMatch = trimmed.match(/^([a-zA-Z_]\w*)\[([^\]]+)\]\s*=\s*([^;]+);?$/);
      if (arrayUpdateMatch) {
        const arrName = arrayUpdateMatch[1];
        const idxExpr = arrayUpdateMatch[2];
        const valExpr = arrayUpdateMatch[3];

        const idx = this.evaluateExpr(idxExpr);
        const newVal = this.evaluateExpr(valExpr);
        const st = this.structures[arrName];

        if (st && st.arrayData) {
          if (idx < 0 || idx >= st.arrayData.length) {
            throw {
              type: 'ArrayIndexOutOfBoundsException',
              message: `Index ${idx} out of bounds for array '${arrName}' of length ${st.arrayData.length}`,
              variableName: arrName,
              detail: `Tried to access index ${idx}, but valid indices are [0 .. ${st.arrayData.length - 1}].`,
            };
          }

          const oldVal = st.arrayData[idx];
          st.arrayData[idx] = newVal;
          st.activeIndices = [idx];
          st.lastOperation = `Updated arr[${idx}] = ${newVal}`;

          const heapObj = this.heap.find((h) => h.id === st.id);
          if (heapObj) {
            heapObj.fields.values = [...st.arrayData];
          }

          this.recordStep(
            currentLineNum,
            {
              type: 'ARRAY_UPDATE',
              line: currentLineNum,
              variable: arrName,
              structureId: st.id,
              index: idx,
              oldValue: oldVal,
              newValue: newVal,
            },
            `✏️ Assigned \`${arrName}[${idx}] = ${newVal}\` (previous value was ${oldVal})`
          );
        }

        i++;
        continue;
      }

      // 6. STACK CREATION
      const stackCreateMatch =
        trimmed.match(/^Stack(?:<[^>]+>)?\s+([a-zA-Z_]\w*)\s*=\s*new\s+Stack(?:<[^>]*>)?\(\);?$/) ||
        trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*\[\];?\s*(?:#.*stack.*)?$/i);

      if (stackCreateMatch) {
        const stackName = stackCreateMatch[1];
        const heapId = this.allocateHeapId('Stack');

        this.structures[stackName] = {
          id: heapId,
          name: stackName,
          type: 'stack',
          dataType: 'Stack<Integer>',
          stackData: [],
          pointers: { top: -1 },
          lastOperation: 'Created Stack',
        };

        this.heap.push({
          id: heapId,
          type: 'Stack<Integer>',
          label: `Stack: ${stackName}`,
          fields: { size: 0, elements: [] },
          estimatedBytes: 32,
          referencesTo: [],
        });

        this.currentScope.set(stackName, {
          name: stackName,
          type: 'Stack<Integer>',
          value: `ref -> ${heapId}`,
          scope: this.currentScope.name,
          isReference: true,
          refTargetId: heapId,
          estimatedBytes: 8,
        });

        this.recordStep(
          currentLineNum,
          {
            type: 'STACK_CREATE',
            line: currentLineNum,
            variable: stackName,
            structureId: heapId,
            structureType: 'stack',
          },
          `🥞 Created empty Stack \`${stackName}\` on Heap (${heapId})`
        );

        i++;
        continue;
      }

      // 7. STACK OPS: push, pop
      const stackPushMatch =
        trimmed.match(/^([a-zA-Z_]\w*)\.push\(([^)]+)\);?$/) ||
        trimmed.match(/^([a-zA-Z_]\w*)\.append\(([^)]+)\);?$/);

      if (stackPushMatch) {
        const stackName = stackPushMatch[1];
        const val = this.evaluateExpr(stackPushMatch[2]);
        const st = this.structures[stackName];

        if (st && st.type === 'stack' && st.stackData) {
          st.stackData.push(val);
          st.pointers = { top: st.stackData.length - 1 };
          st.lastOperation = `push(${val})`;

          const heapObj = this.heap.find((h) => h.id === st.id);
          if (heapObj) {
            heapObj.fields.size = st.stackData.length;
            heapObj.fields.elements = [...st.stackData];
            heapObj.estimatedBytes = 32 + st.stackData.length * 8;
          }

          this.recordStep(
            currentLineNum,
            {
              type: 'STACK_PUSH',
              line: currentLineNum,
              variable: stackName,
              structureId: st.id,
              value: val,
            },
            `⬇️ Pushed element \`${val}\` onto stack \`${stackName}\`. Height: ${st.stackData.length}.`
          );
        }

        i++;
        continue;
      }

      const stackPopMatch = trimmed.match(/^(?:(?:int|Integer|var)\s+([a-zA-Z_]\w*)\s*=\s*)?([a-zA-Z_]\w*)\.pop\(\);?$/);
      if (stackPopMatch) {
        const destVar = stackPopMatch[1];
        const stackName = stackPopMatch[2];
        const st = this.structures[stackName];

        if (st && st.type === 'stack' && st.stackData) {
          if (st.stackData.length === 0) {
            throw {
              type: 'RuntimeError',
              message: `EmptyStackException: Cannot pop from empty stack '${stackName}'`,
              variableName: stackName,
              detail: `The stack has no elements to pop.`,
            };
          }
          const popped = st.stackData.pop();
          st.pointers = { top: st.stackData.length - 1 };
          st.lastOperation = `pop() -> ${popped}`;

          if (destVar) {
            this.currentScope.set(destVar, {
              name: destVar,
              type: 'int',
              value: popped,
              scope: this.currentScope.name,
              isReference: false,
              estimatedBytes: 4,
            });
          }

          this.recordStep(
            currentLineNum,
            {
              type: 'STACK_POP',
              line: currentLineNum,
              variable: stackName,
              structureId: st.id,
              value: popped,
            },
            `⬆️ Popped \`${popped}\` from top of stack \`${stackName}\`. Remaining height: ${st.stackData.length}.`
          );
        }

        i++;
        continue;
      }

      // 8. QUEUE CREATION & OPS
      const queueCreateMatch = trimmed.match(/^Queue(?:<[^>]+>)?\s+([a-zA-Z_]\w*)\s*=\s*new\s+LinkedList(?:<[^>]*>)?\(\);?$/);
      if (queueCreateMatch) {
        const queueName = queueCreateMatch[1];
        const heapId = this.allocateHeapId('Queue');

        this.structures[queueName] = {
          id: heapId,
          name: queueName,
          type: 'queue',
          dataType: 'Queue<Integer>',
          queueData: [],
          pointers: { front: 0, rear: -1 },
          lastOperation: 'Created Queue',
        };

        this.heap.push({
          id: heapId,
          type: 'Queue<Integer>',
          label: `Queue: ${queueName}`,
          fields: { size: 0, items: [] },
          estimatedBytes: 32,
          referencesTo: [],
        });

        this.currentScope.set(queueName, {
          name: queueName,
          type: 'Queue<Integer>',
          value: `ref -> ${heapId}`,
          scope: this.currentScope.name,
          isReference: true,
          refTargetId: heapId,
          estimatedBytes: 8,
        });

        this.recordStep(
          currentLineNum,
          {
            type: 'QUEUE_CREATE',
            line: currentLineNum,
            variable: queueName,
            structureId: heapId,
            structureType: 'queue',
          },
          `🚶 Created FIFO Queue \`${queueName}\` on Heap (${heapId})`
        );

        i++;
        continue;
      }

      const queueOfferMatch = trimmed.match(/^([a-zA-Z_]\w*)\.(?:offer|add)\(([^)]+)\);?$/);
      if (queueOfferMatch) {
        const queueName = queueOfferMatch[1];
        const val = this.evaluateExpr(queueOfferMatch[2]);
        const st = this.structures[queueName];

        if (st && st.type === 'queue' && st.queueData) {
          st.queueData.push(val);
          st.pointers = { front: 0, rear: st.queueData.length - 1 };
          st.lastOperation = `offer(${val})`;

          this.recordStep(
            currentLineNum,
            {
              type: 'QUEUE_ENQUEUE',
              line: currentLineNum,
              variable: queueName,
              structureId: st.id,
              value: val,
            },
            `👉 Enqueued \`${val}\` to rear of queue \`${queueName}\`.`
          );
        }

        i++;
        continue;
      }

      const queuePollMatch = trimmed.match(/^(?:(?:int|Integer|var)\s+([a-zA-Z_]\w*)\s*=\s*)?([a-zA-Z_]\w*)\.(?:poll|remove)\(\);?$/);
      if (queuePollMatch) {
        const destVar = queuePollMatch[1];
        const queueName = queuePollMatch[2];
        const st = this.structures[queueName];

        if (st && st.type === 'queue' && st.queueData) {
          const item = st.queueData.shift();
          st.pointers = { front: 0, rear: Math.max(-1, st.queueData.length - 1) };
          st.lastOperation = `poll() -> ${item}`;

          if (destVar) {
            this.currentScope.set(destVar, {
              name: destVar,
              type: 'int',
              value: item,
              scope: this.currentScope.name,
              isReference: false,
              estimatedBytes: 4,
            });
          }

          this.recordStep(
            currentLineNum,
            {
              type: 'QUEUE_DEQUEUE',
              line: currentLineNum,
              variable: queueName,
              structureId: st.id,
              value: item,
            },
            `👈 Dequeued front item \`${item}\` from \`${queueName}\`.`
          );
        }

        i++;
        continue;
      }

      // 9. LINKED LIST NODE CREATION & REFERENCE ASSIGNMENTS
      // 9a. new Node(val) instantiation: Node head = new Node(10); or ans = new Node(curr2.data);
      const nodeNewMatch = trimmed.match(/^(?:Node\s+)?([a-zA-Z_]\w*(?:\.next)?)\s*=\s*new\s+Node\(([^)]*)\);?$/);
      if (nodeNewMatch) {
        const targetRef = nodeNewMatch[1];
        const nodeVal = this.evaluateExpr(nodeNewMatch[2]) ?? 0;
        const nodeId = this.allocateHeapId('Node');

        const newNode: LinkedListNode = {
          id: nodeId,
          value: nodeVal,
          nextId: null,
        };

        this.heap.push({
          id: nodeId,
          type: 'Node',
          label: `Node(${nodeVal})`,
          fields: { val: nodeVal, data: nodeVal, next: null },
          estimatedBytes: 24,
          referencesTo: [],
        });

        let llState = Object.values(this.structures).find((s) => s.type === 'linkedlist');
        if (!llState) {
          llState = {
            id: 'll-main',
            name: 'LinkedList',
            type: 'linkedlist',
            dataType: 'Node',
            linkedListData: { headId: null, nodes: {} },
            pointers: {},
            lastOperation: 'Created Node',
          };
          this.structures['LinkedList'] = llState;
        }

        if (llState.linkedListData) {
          llState.linkedListData.nodes[nodeId] = newNode;
        }

        if (targetRef.includes('.next')) {
          const parentName = targetRef.split('.next')[0];
          const parentVar = this.currentScope.get(parentName);
          if (!parentVar || !parentVar.refTargetId) {
            throw {
              type: 'NullPointerException',
              message: `Cannot assign .next because '${parentName}' is null`,
              variableName: parentName,
              detail: `Target variable '${parentName}' holds null address.`,
              brokenReference: { source: parentName, target: null },
            };
          }

          const parentNode = llState.linkedListData?.nodes[parentVar.refTargetId];
          if (parentNode) {
            parentNode.nextId = nodeId;
          }
          const parentHeap = this.heap.find((h) => h.id === parentVar.refTargetId);
          if (parentHeap) {
            parentHeap.fields.next = nodeId;
            parentHeap.referencesTo.push(nodeId);
          }

          this.recordStep(
            currentLineNum,
            {
              type: 'NODE_LINK',
              line: currentLineNum,
              variable: targetRef,
              value: nodeVal,
            },
            `🔗 Linked \`${parentName}.next ➔ ${nodeId} [val: ${nodeVal}]\``
          );
        } else {
          if (llState.linkedListData && !llState.linkedListData.headId) {
            llState.linkedListData.headId = nodeId;
          }
          this.currentScope.set(targetRef, {
            name: targetRef,
            type: 'Node',
            value: `ref -> ${nodeId}`,
            scope: this.currentScope.name,
            isReference: true,
            refTargetId: nodeId,
            estimatedBytes: 8,
          });

          this.recordStep(
            currentLineNum,
            {
              type: 'NODE_CREATE',
              line: currentLineNum,
              variable: targetRef,
              value: nodeVal,
            },
            `✨ Created \`Node(${nodeVal})\` on Heap (${nodeId}) and pointed \`${targetRef}\` to it`
          );
        }

        i++;
        continue;
      }

      // 9b. Pointer traversal: curr = curr.next; or head = head.next;
      const pointerAdvanceMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)\.next;?$/);
      if (pointerAdvanceMatch) {
        const destPtr = pointerAdvanceMatch[1];
        const srcPtr = pointerAdvanceMatch[2];
        const srcVar = this.currentScope.get(srcPtr);

        if (!srcVar || srcVar.value === null || !srcVar.refTargetId) {
          throw {
            type: 'NullPointerException',
            message: `NullPointerException: Cannot read field 'next' because '${srcPtr}' is null`,
            variableName: srcPtr,
            detail: `'${srcPtr}' is null. There is no object to access.`,
            brokenReference: { source: srcPtr, target: null },
          };
        }

        const llState = Object.values(this.structures).find((s) => s.type === 'linkedlist');
        const currNode = llState?.linkedListData?.nodes[srcVar.refTargetId];
        const nextId = currNode?.nextId || null;

        this.currentScope.set(destPtr, {
          name: destPtr,
          type: 'Node',
          value: nextId ? `ref -> ${nextId}` : null,
          scope: this.currentScope.name,
          isReference: true,
          refTargetId: nextId || undefined,
          estimatedBytes: 8,
        });

        this.recordStep(
          currentLineNum,
          {
            type: 'REFERENCE_UPDATE',
            line: currentLineNum,
            variable: destPtr,
            value: nextId,
          },
          `➡️ Advanced pointer: \`${destPtr} = ${srcPtr}.next\` (now points to ${nextId ? nextId : 'null'})`
        );

        i++;
        continue;
      }

      // 9c. Reference Assignment / null pointer: Node curr = head; or Node ans = null; or curr2 = head;
      const refAssignMatch = trimmed.match(/^(?:Node\s+)?([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*);?$/);
      if (refAssignMatch && !trimmed.startsWith('int ') && !trimmed.startsWith('return ')) {
        const destVar = refAssignMatch[1];
        const srcExpr = refAssignMatch[2];

        if (srcExpr === 'null') {
          this.currentScope.set(destVar, {
            name: destVar,
            type: 'Node',
            value: null,
            scope: this.currentScope.name,
            isReference: true,
            refTargetId: undefined,
            estimatedBytes: 8,
          });

          this.recordStep(
            currentLineNum,
            {
              type: 'REFERENCE_NULL',
              line: currentLineNum,
              variable: destVar,
            },
            `⚪ Pointed \`${destVar} ➔ null\``
          );

          i++;
          continue;
        }

        const srcVar = this.currentScope.get(srcExpr);
        if (srcVar && srcVar.isReference) {
          this.currentScope.set(destVar, {
            name: destVar,
            type: srcVar.type,
            value: srcVar.value,
            scope: this.currentScope.name,
            isReference: true,
            refTargetId: srcVar.refTargetId,
            estimatedBytes: 8,
          });

          this.recordStep(
            currentLineNum,
            {
              type: 'REFERENCE_CREATE',
              line: currentLineNum,
              variable: destVar,
              value: srcVar.refTargetId,
            },
            `👉 Pointed reference \`${destVar}\` to \`${srcExpr}\` (${srcVar.refTargetId || 'null'})`
          );

          i++;
          continue;
        }
      }

      // 10. BINARY TREE CREATION & LINK
      const treeNodeMatch = trimmed.match(/^(?:TreeNode\s+)?([a-zA-Z_]\w*(?:\.(?:left|right))?)\s*=\s*new\s+TreeNode\(([^)]*)\);?$/);
      if (treeNodeMatch) {
        const targetRef = treeNodeMatch[1];
        const val = this.evaluateExpr(treeNodeMatch[2]) ?? 0;
        const treeId = this.allocateHeapId('TreeNode');

        const newTreeNode: TreeNodeData = {
          id: treeId,
          value: val,
          leftId: null,
          rightId: null,
        };

        this.heap.push({
          id: treeId,
          type: 'TreeNode',
          label: `TreeNode(${val})`,
          fields: { val, left: null, right: null },
          estimatedBytes: 24,
          referencesTo: [],
        });

        let treeState = Object.values(this.structures).find((s) => s.type === 'tree');
        if (!treeState) {
          treeState = {
            id: 'tree-main',
            name: 'BinaryTree',
            type: 'tree',
            dataType: 'TreeNode',
            treeData: { rootId: null, nodes: {} },
            pointers: {},
            lastOperation: 'Created TreeNode',
          };
          this.structures['BinaryTree'] = treeState;
        }

        if (treeState.treeData) {
          treeState.treeData.nodes[treeId] = newTreeNode;
        }

        if (targetRef.includes('.left') || targetRef.includes('.right')) {
          const [parentName, branch] = targetRef.split('.');
          const parentVar = this.currentScope.get(parentName);
          if (!parentVar || !parentVar.refTargetId) {
            throw {
              type: 'NullPointerException',
              message: `Cannot assign .${branch} because '${parentName}' is null`,
              variableName: parentName,
              detail: `Parent tree node reference is null.`,
              brokenReference: { source: parentName, target: null },
            };
          }

          const parentNode = treeState.treeData?.nodes[parentVar.refTargetId];
          if (parentNode) {
            if (branch === 'left') parentNode.leftId = treeId;
            else parentNode.rightId = treeId;
          }

          this.recordStep(
            currentLineNum,
            {
              type: 'TREE_LINK',
              line: currentLineNum,
              variable: targetRef,
              value: val,
            },
            `🌿 Attached child \`${treeId} [${val}]\` to \`${parentName}.${branch}\``
          );
        } else {
          if (treeState.treeData && !treeState.treeData.rootId) {
            treeState.treeData.rootId = treeId;
          }
          this.currentScope.set(targetRef, {
            name: targetRef,
            type: 'TreeNode',
            value: `ref -> ${treeId}`,
            scope: this.currentScope.name,
            isReference: true,
            refTargetId: treeId,
            estimatedBytes: 8,
          });

          this.recordStep(
            currentLineNum,
            {
              type: 'TREE_NODE_CREATE',
              line: currentLineNum,
              variable: targetRef,
              value: val,
            },
            `🌳 Created root \`TreeNode(${val})\` on Heap (${treeId})`
          );
        }

        i++;
        continue;
      }

      // 11. HASHMAP
      const mapCreateMatch = trimmed.match(/^Map(?:<[^>]+>)?\s+([a-zA-Z_]\w*)\s*=\s*new\s+HashMap(?:<[^>]*>)?\(\);?$/);
      if (mapCreateMatch) {
        const mapName = mapCreateMatch[1];
        const heapId = this.allocateHeapId('HashMap');

        this.structures[mapName] = {
          id: heapId,
          name: mapName,
          type: 'map',
          dataType: 'HashMap<String, Object>',
          mapData: { entries: [], bucketCount: 8 },
          lastOperation: 'Created HashMap',
        };

        this.heap.push({
          id: heapId,
          type: 'HashMap',
          label: `HashMap: ${mapName}`,
          fields: { size: 0, buckets: 8 },
          estimatedBytes: 48,
          referencesTo: [],
        });

        this.currentScope.set(mapName, {
          name: mapName,
          type: 'HashMap',
          value: `ref -> ${heapId}`,
          scope: this.currentScope.name,
          isReference: true,
          refTargetId: heapId,
          estimatedBytes: 8,
        });

        this.recordStep(
          currentLineNum,
          {
            type: 'MAP_CREATE',
            line: currentLineNum,
            variable: mapName,
            structureId: heapId,
            structureType: 'map',
          },
          `🗂️ Created HashMap \`${mapName}\` with initial capacity 8 buckets.`
        );

        i++;
        continue;
      }

      const mapPutMatch = trimmed.match(/^([a-zA-Z_]\w*)\.put\(([^,]+),\s*([^)]+)\);?$/);
      if (mapPutMatch) {
        const mapName = mapPutMatch[1];
        const key = this.evaluateExpr(mapPutMatch[2]);
        const val = this.evaluateExpr(mapPutMatch[3]);
        const st = this.structures[mapName];

        if (st && st.type === 'map' && st.mapData) {
          const hash = String(key)
            .split('')
            .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000, 0);
          const bucket = Math.abs(hash) % st.mapData.bucketCount;

          const existingIdx = st.mapData.entries.findIndex((e) => e.key === key);
          if (existingIdx >= 0) {
            st.mapData.entries[existingIdx].value = val;
          } else {
            st.mapData.entries.push({ key, value: val, hash, bucket });
          }

          st.lastOperation = `put("${key}", ${val})`;

          this.recordStep(
            currentLineNum,
            {
              type: 'MAP_INSERT',
              line: currentLineNum,
              variable: mapName,
              structureId: st.id,
              values: { key, value: val, hash, bucket },
            },
            `🗝️ Hashed key \`"${key}"\` ➔ Bucket #${bucket} ➔ Stored value \`${val}\``
          );
        }

        i++;
        continue;
      }

      // 12. PRINT / CONSOLE
      const printMatch = trimmed.match(/^(?:System\.out\.println|System\.out\.print|print)\s*\((.*)\);?$/);
      if (printMatch) {
        const printExpr = printMatch[1];
        const evaluated = this.evaluateExpr(printExpr);
        const outText = evaluated !== undefined ? String(evaluated) : printExpr;
        this.consoleOutput.push(outText);

        this.recordStep(
          currentLineNum,
          {
            type: 'OUTPUT',
            line: currentLineNum,
            message: outText,
          },
          `📢 Printed output: "${outText}"`
        );

        i++;
        continue;
      }

      // 13. FUNCTION CALL
      const funcCallAssignMatch = trimmed.match(/^(?:(?:int|double|String|var|Node)\s+)?([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)\(([^)]*)\);?$/);
      if (funcCallAssignMatch && this.functions[funcCallAssignMatch[2]]) {
        const destVar = funcCallAssignMatch[1];
        const funcName = funcCallAssignMatch[2];
        const argStrings = funcCallAssignMatch[3].split(',').map((a) => a.trim()).filter(Boolean);
        const funcDef = this.functions[funcName];

        const evaluatedArgs: Record<string, any> = {};
        funcDef.params.forEach((param, pIdx) => {
          evaluatedArgs[param.name] = this.evaluateExpr(argStrings[pIdx]) ?? 0;
        });

        if (this.callStack.length > 30) {
          throw {
            type: 'RuntimeError',
            message: 'StackOverflowError: Maximum recursive call stack depth of 30 exceeded',
            detail: `Recursive function '${funcName}' did not reach a terminating base case.`,
          };
        }

        this.callStack.push({
          id: `frame-${this.callStack.length + 1}`,
          functionName: `${funcName}(${Object.values(evaluatedArgs).join(', ')})`,
          arguments: evaluatedArgs,
          localVariables: {},
          line: funcDef.startLine,
          depth: this.callStack.length + 1,
        });

        const childScope = new Scope(funcName, this.currentScope);
        for (const [pName, pVal] of Object.entries(evaluatedArgs)) {
          childScope.set(pName, {
            name: pName,
            type: typeof pVal === 'number' ? 'int' : 'Object',
            value: pVal,
            scope: funcName,
            isReference: false,
            estimatedBytes: 4,
          });
        }

        const parentScope = this.currentScope;
        this.currentScope = childScope;

        this.recordStep(
          currentLineNum,
          {
            type: 'FUNCTION_CALL',
            line: currentLineNum,
            functionName: funcName,
            arguments: evaluatedArgs,
          },
          `📞 Call \`${funcName}(${Object.entries(evaluatedArgs).map(([k, v]) => `${k}=${v}`).join(', ')})\``
        );

        const subRes = this.executeBlock(funcDef.body, 0, funcDef.body.length, funcDef.startLine);

        this.callStack.pop();
        this.currentScope = parentScope;

        if (destVar && subRes.value !== undefined) {
          this.currentScope.set(destVar, {
            name: destVar,
            type: typeof subRes.value === 'number' ? 'int' : 'Object',
            value: subRes.value,
            scope: this.currentScope.name,
            isReference: false,
            estimatedBytes: 4,
          });
        }

        this.recordStep(
          currentLineNum,
          {
            type: 'FUNCTION_RETURN',
            line: currentLineNum,
            functionName: funcName,
            returnValue: subRes.value,
          },
          `🔙 \`${funcName}\` returned \`${subRes.value}\`.`
        );

        i++;
        continue;
      }

      // 14. PRIMITIVE VARIABLE DECLARATION: int count = 0; or int count=0;
      const primDeclMatch = trimmed.match(/^(?:int|double|boolean|char|String|long)\s+([a-zA-Z_]\w*)\s*=\s*([^;]+);?$/);
      if (primDeclMatch) {
        const vName = primDeclMatch[1];
        const vExpr = primDeclMatch[2];
        const val = this.evaluateExpr(vExpr);
        const vType = typeof val === 'number' ? 'int' : typeof val === 'boolean' ? 'boolean' : 'String';

        this.currentScope.set(vName, {
          name: vName,
          type: vType,
          value: val,
          scope: this.currentScope.name,
          isReference: false,
          estimatedBytes: estimateSize(vType, val),
        });

        this.recordStep(
          currentLineNum,
          {
            type: 'VARIABLE_CREATE',
            line: currentLineNum,
            variable: vName,
            dataType: vType,
            value: val,
          },
          `Declared \`${vName} = ${val}\``
        );

        i++;
        continue;
      }

      // 15. SIMPLE ASSIGNMENT OR INCREMENT / DECREMENT
      const incDecMatch = trimmed.match(/^([a-zA-Z_]\w*)(\+\+|--);?$/);
      if (incDecMatch) {
        const vName = incDecMatch[1];
        const op = incDecMatch[2];
        const existing = this.currentScope.get(vName);
        if (existing) {
          const oldVal = existing.value;
          const newVal = op === '++' ? oldVal + 1 : oldVal - 1;
          this.currentScope.set(vName, { ...existing, value: newVal });

          this.recordStep(
            currentLineNum,
            {
              type: 'VARIABLE_UPDATE',
              line: currentLineNum,
              variable: vName,
              oldValue: oldVal,
              newValue: newVal,
            },
            `Incremented \`${vName}\`: ${oldVal} ➔ ${newVal}`
          );
        }

        i++;
        continue;
      }

      const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*([^;]+);?$/);
      if (assignMatch) {
        const vName = assignMatch[1];
        const vExpr = assignMatch[2];
        const val = this.evaluateExpr(vExpr);
        const existing = this.currentScope.get(vName);

        if (existing) {
          const oldVal = existing.value;
          this.currentScope.set(vName, { ...existing, value: val });

          this.recordStep(
            currentLineNum,
            {
              type: 'VARIABLE_UPDATE',
              line: currentLineNum,
              variable: vName,
              oldValue: oldVal,
              newValue: val,
            },
            `Updated \`${vName}\`: ${oldVal} ➔ ${val}`
          );
        } else {
          this.currentScope.set(vName, {
            name: vName,
            type: typeof val === 'number' ? 'int' : 'var',
            value: val,
            scope: this.currentScope.name,
            isReference: false,
            estimatedBytes: 4,
          });

          this.recordStep(
            currentLineNum,
            {
              type: 'VARIABLE_CREATE',
              line: currentLineNum,
              variable: vName,
              value: val,
            },
            `Set \`${vName}\` = ${val}`
          );
        }

        i++;
        continue;
      }

      // Default: advance to next line
      i++;
    }

    return { returned: false, value: undefined };
  }
}
