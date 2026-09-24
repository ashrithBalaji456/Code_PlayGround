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
  GraphNodeData,
  GraphEdgeData,
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
      return 8;
    case 'node':
    case 'treenode':
      return 24;
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
    // If it exists in parent or current, update it
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

export class ExecutionEngine {
  private steps: ExecutionStep[] = [];
  private structures: Record<string, DataStructureState> = {};
  private heap: HeapObject[] = [];
  private callStack: CallFrame[] = [];
  private consoleOutput: string[] = [];
  private heapCounter = 100;
  private maxSteps = 400;
  private currentScope: Scope = new Scope('main');
  private functions: Record<string, { params: string[]; body: string[]; startLine: number }> = {};

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
    // Calculate memory stats
    const allVars = this.currentScope.getAll();
    let stackBytes = 0;
    for (const v of Object.values(allVars)) {
      stackBytes += v.estimatedBytes;
    }
    let heapBytes = 0;
    for (const h of this.heap) {
      heapBytes += h.estimatedBytes;
    }

    // Extract active pointers
    const activePointers: Record<string, any> = {};
    for (const [vName, vInfo] of Object.entries(allVars)) {
      if (typeof vInfo.value === 'number' && (vName === 'i' || vName === 'j' || vName === 'k' || vName === 'left' || vName === 'right' || vName === 'mid' || vName === 'low' || vName === 'high' || vName === 'top' || vName === 'front' || vName === 'rear')) {
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
      // Match function: e.g. int factorial(int n) { or def factorial(n):
      const funcMatchJava = line.match(/^(?:public\s+|private\s+|static\s+)*(?:void|int|double|boolean|String|Node|TreeNode)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{?$/);
      const funcMatchPy = line.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:/);

      if (funcMatchJava && !line.includes('main')) {
        const funcName = funcMatchJava[1];
        const rawParams = funcMatchJava[2].split(',').map((p) => p.trim().split(/\s+/).pop() || '').filter(Boolean);
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
        this.functions[funcName] = { params: rawParams, body: bodyLines, startLine: i + 1 };
      } else if (funcMatchPy) {
        const funcName = funcMatchPy[1];
        const rawParams = funcMatchPy[2].split(',').map((p) => p.trim()).filter(Boolean);
        const bodyLines: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const l = lines[j];
          if (l.trim() && !l.startsWith('  ') && !l.startsWith('\t')) break;
          bodyLines.push(l);
          j++;
        }
        this.functions[funcName] = { params: rawParams, body: bodyLines, startLine: i + 1 };
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

    // Node property: node.val or node.next
    const nodeProp = expr.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)$/);
    if (nodeProp) {
      const varName = nodeProp[1];
      const prop = nodeProp[2];
      const v = this.currentScope.get(varName);
      if (v && v.value === null) {
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
        if (heapObj && heapObj.fields && prop in heapObj.fields) {
          return heapObj.fields[prop];
        }
      }
    }

    // Identifier lookup
    const v = this.currentScope.get(expr);
    if (v !== undefined) return v.value;

    // Arithmetic / binary operations with basic precedence
    // We safely parse arithmetic expressions with identifiers replaced
    try {
      const sanitized = expr.replace(/[a-zA-Z_]\w*(?:\[[^\]]+\]|\.[a-zA-Z_]\w*)?/g, (token) => {
        const val = this.evaluateExpr(token);
        return typeof val === 'number' || typeof val === 'boolean' ? String(val) : JSON.stringify(val);
      });
      // Evaluate basic arithmetic safely
      // eslint-disable-next-line no-eval
      return Function(`"use strict"; return (${sanitized});`)();
    } catch {
      return undefined;
    }
  }

  // Parse condition: e.g. "i < arr.length" or "arr[j] > arr[j + 1]"
  private evaluateCondition(condStr: string, line: number): { result: boolean; comparison: ComparisonInfo } {
    const operators = ['<=', '>=', '==', '!=', '<', '>'];
    for (const op of operators) {
      const parts = condStr.split(op);
      if (parts.length === 2) {
        const leftVal = this.evaluateExpr(parts[0]);
        const rightVal = this.evaluateExpr(parts[1]);
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
          explanation: `Evaluated: (${parts[0].trim()} [${leftVal}] ${op} ${parts[1].trim()} [${rightVal}]) ➔ ${res ? 'TRUE' : 'FALSE'}`,
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
  public execute(code: string, language: 'java' | 'python'): ExecutionStep[] {
    this.steps = [];
    this.structures = {};
    this.heap = [];
    this.callStack = [];
    this.consoleOutput = [];
    this.heapCounter = 100;
    this.currentScope = new Scope('main');

    const rawLines = code.split('\n');
    const cleanedLines = rawLines.map((l) => l.replace(/[\r]/g, ''));

    // Push initial main frame
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

    try {
      this.executeBlock(cleanedLines, 0, cleanedLines.length, 1);
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

    // Set totalSteps on every step
    const total = this.steps.length;
    this.steps.forEach((s) => (s.totalSteps = total));

    return this.steps;
  }

  private executeBlock(lines: string[], startIdx: number, endIdx: number, baseLineOffset: number) {
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
        trimmed.startsWith('class Main') ||
        trimmed === '{' ||
        trimmed === '}'
      ) {
        i++;
        continue;
      }

      // Check if it's the start of a function definition - skip execution here as it is executed on call
      if (
        trimmed.match(/^(?:public\s+|private\s+|static\s+)*(?:void|int|double|boolean|String|Node|TreeNode)\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*\{?$/) &&
        !trimmed.includes('main(')
      ) {
        // Skip function block
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

      // 1. FOR LOOP
      // e.g. for (int i = 0; i < arr.length; i++) or for (int i = 0; i < 5; i++)
      const forMatch = trimmed.match(/^for\s*\(\s*(?:int\s+)?([a-zA-Z_]\w*)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\)\s*\{?$/);
      if (forMatch) {
        const iterVar = forMatch[1];
        const initValExpr = forMatch[2];
        const condExpr = forMatch[3];
        const stepExpr = forMatch[4];

        // Locate loop body
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
          // single line body
          bodyLines.push(lines[loopEndIdx]);
        }

        // Initialize loop variable
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

        // Loop iterations with safety counter
        let loopSafety = 0;
        while (loopSafety < 150) {
          loopSafety++;
          // Evaluate condition
          const { result, comparison } = this.evaluateCondition(condExpr, currentLineNum);
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

          // Execute loop body
          this.executeBlock(bodyLines, 0, bodyLines.length, i + 1 + baseLineOffset);

          // Perform step increment: e.g. i++ or i += 1 or i--
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
      // e.g. while (left < right)
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
          const { result, comparison } = this.evaluateCondition(condExpr, currentLineNum);
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

          this.executeBlock(bodyLines, 0, bodyLines.length, i + 1 + baseLineOffset);
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

        // Check if next is else
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

        const { result, comparison } = this.evaluateCondition(condExpr, currentLineNum);
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
          this.executeBlock(thenLines, 0, thenLines.length, i + 1 + baseLineOffset);
        } else if (elseLines.length > 0) {
          this.executeBlock(elseLines, 0, elseLines.length, idx - elseLines.length + baseLineOffset);
        }

        i = idx;
        continue;
      }

      // 4. ARRAY INITIALIZATION
      // e.g. int[] arr = {10, 20, 30}; or int[] arr = new int[5]; or arr = [10, 20, 30]
      const arrayInitMatch =
        trimmed.match(/^(?:int|double|String|char|long)\[\]\s+([a-zA-Z_]\w*)\s*=\s*\{([^}]*)\};?$/) ||
        trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*\[([^\]]*)\];?$/);

      if (arrayInitMatch) {
        const arrName = arrayInitMatch[1];
        const rawVals = arrayInitMatch[2].split(',').map((v) => v.trim()).filter((v) => v.length > 0);
        const parsedVals = rawVals.map((v) => this.evaluateExpr(v) ?? 0);
        const heapId = this.allocateHeapId('Array');

        const arrayState: DataStructureState = {
          id: heapId,
          name: arrName,
          type: 'array',
          dataType: 'int[]',
          arrayData: [...parsedVals],
          activeIndices: [],
          pointers: {},
          lastOperation: 'Created array',
        };
        this.structures[arrName] = arrayState;

        const heapObj: HeapObject = {
          id: heapId,
          type: 'int[]',
          label: `${arrName} (length: ${parsedVals.length})`,
          fields: { length: parsedVals.length, values: [...parsedVals] },
          estimatedBytes: 16 + parsedVals.length * 4,
          referencesTo: [],
        };
        this.heap.push(heapObj);

        const varInfo: VariableInfo = {
          name: arrName,
          type: 'int[]',
          value: `ref -> ${heapId}`,
          scope: this.currentScope.name,
          isReference: true,
          refTargetId: heapId,
          estimatedBytes: 8,
        };
        this.currentScope.set(arrName, varInfo);

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

      // 4b. 2D ARRAY (MATRIX)
      // e.g. int[][] matrix = {{1, 2}, {3, 4}};
      const matrixInitMatch = trimmed.match(/^(?:int|double)\[\]\[\]\s+([a-zA-Z_]\w*)\s*=\s*\{\s*\{([^}]*)\}\s*,\s*\{([^}]*)\}\s*\};?$/);
      if (matrixInitMatch) {
        const matName = matrixInitMatch[1];
        const row1 = matrixInitMatch[2].split(',').map((x) => this.evaluateExpr(x.trim()));
        const row2 = matrixInitMatch[3].split(',').map((x) => this.evaluateExpr(x.trim()));
        const heapId = this.allocateHeapId('Matrix');

        this.structures[matName] = {
          id: heapId,
          name: matName,
          type: 'matrix',
          dataType: 'int[][]',
          matrixData: [row1, row2],
          lastOperation: 'Created 2D matrix',
        };

        this.recordStep(
          currentLineNum,
          {
            type: 'ARRAY_CREATE',
            line: currentLineNum,
            variable: matName,
            structureId: heapId,
            structureType: 'matrix',
          },
          `▦ Initialized 2D Matrix \`${matName}\` with dimensions 2x${row1.length}`
        );

        i++;
        continue;
      }

      // 5. ARRAY ELEMENT UPDATE
      // e.g. arr[i] = arr[i] * 2; or arr[1] = 50;
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

          // Update heap object as well
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
      // e.g. Stack<Integer> a = new Stack<>(); or st = Stack()
      const stackCreateMatch =
        trimmed.match(/^Stack(?:<[^>]+>)?\s+([a-zA-Z_]\w*)\s*=\s*new\s+Stack(?:<[^>]*>)?\(\);?$/) ||
        trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*\[\];?\s*(?:#.*stack.*)?$/i);

      if (stackCreateMatch) {
        const stackName = stackCreateMatch[1];
        const heapId = this.allocateHeapId('Stack');

        const stackState: DataStructureState = {
          id: heapId,
          name: stackName,
          type: 'stack',
          dataType: 'Stack<Integer>',
          stackData: [],
          pointers: { top: -1 },
          lastOperation: 'Created Stack',
        };
        this.structures[stackName] = stackState;

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

      // 7. STACK OPERATIONS: push, pop, peek
      const stackPushMatch =
        trimmed.match(/^([a-zA-Z_]\w*)\.push\(([^)]+)\);?$/) ||
        trimmed.match(/^([a-zA-Z_]\w*)\.append\(([^)]+)\);?$/);

      if (stackPushMatch) {
        const stackName = stackPushMatch[1];
        const valExpr = stackPushMatch[2];
        const val = this.evaluateExpr(valExpr);
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
            `⬇️ Pushed element \`${val}\` onto stack \`${stackName}\`. Stack height is now ${st.stackData.length}.`
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

      // 8. QUEUE CREATION & OPS: offer/poll
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
            `👉 Enqueued \`${val}\` to the rear of queue \`${queueName}\`. Total items: ${st.queueData.length}.`
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

      // 9. LINKED LIST NODE CREATION & ASSIGNMENT
      // e.g. Node head = new Node(10); or head.next = new Node(20); or Node node = null;
      const nodeNullMatch = trimmed.match(/^Node\s+([a-zA-Z_]\w*)\s*=\s*null;?$/);
      if (nodeNullMatch) {
        const nodeName = nodeNullMatch[1];
        this.currentScope.set(nodeName, {
          name: nodeName,
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
            variable: nodeName,
          },
          `⚪ Assigned \`${nodeName} ➔ null\`. The pointer holds no object address.`
        );

        i++;
        continue;
      }

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

        const heapObj: HeapObject = {
          id: nodeId,
          type: 'Node',
          label: `Node(${nodeVal})`,
          fields: { val: nodeVal, next: null },
          estimatedBytes: 24,
          referencesTo: [],
        };
        this.heap.push(heapObj);

        // Ensure a linked list structure exists
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
          // Setting head or new pointer
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

      // Pointer traversal: e.g. curr = curr.next; or head = head.next;
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

      // 10. BINARY TREE / BST NODE CREATION & LINK
      // e.g. TreeNode root = new TreeNode(50); or root.left = new TreeNode(30);
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

      // 11. HASHMAP CREATION & OPS: map.put(k, v), map.get(k)
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
          // Simple hash calculation
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
            `🗝️ Hashed key \`"${key}"\` ➔ hash: ${hash} ➔ Bucket #${bucket} ➔ Stored value \`${val}\``
          );
        }

        i++;
        continue;
      }

      // 12. GRAPH CREATION & OPS: Graph g = new Graph(); g.addEdge(0, 1);
      const graphCreateMatch = trimmed.match(/^Graph\s+([a-zA-Z_]\w*)\s*=\s*new\s+Graph\(\);?$/);
      if (graphCreateMatch) {
        const gName = graphCreateMatch[1];
        const heapId = this.allocateHeapId('Graph');

        this.structures[gName] = {
          id: heapId,
          name: gName,
          type: 'graph',
          dataType: 'Graph',
          graphData: { nodes: [], edges: [] },
          lastOperation: 'Created Graph',
        };

        this.recordStep(
          currentLineNum,
          {
            type: 'GRAPH_NODE_CREATE',
            line: currentLineNum,
            variable: gName,
            structureId: heapId,
            structureType: 'graph',
          },
          `🕸️ Created directed graph structure \`${gName}\``
        );

        i++;
        continue;
      }

      const graphEdgeMatch = trimmed.match(/^([a-zA-Z_]\w*)\.addEdge\(([^,]+),\s*([^)]+)\);?$/);
      if (graphEdgeMatch) {
        const gName = graphEdgeMatch[1];
        const u = String(this.evaluateExpr(graphEdgeMatch[2]));
        const v = String(this.evaluateExpr(graphEdgeMatch[3]));
        const st = this.structures[gName];

        if (st && st.graphData) {
          if (!st.graphData.nodes.find((n) => n.id === u)) {
            st.graphData.nodes.push({ id: u, label: u });
          }
          if (!st.graphData.nodes.find((n) => n.id === v)) {
            st.graphData.nodes.push({ id: v, label: v });
          }
          st.graphData.edges.push({ source: u, target: v, directed: true });

          this.recordStep(
            currentLineNum,
            {
              type: 'GRAPH_EDGE_CREATE',
              line: currentLineNum,
              variable: gName,
              values: { from: u, to: v },
            },
            `🔗 Added directed edge from node \`${u}\` ➔ \`${v}\``
          );
        }

        i++;
        continue;
      }

      // 13. PRINT / CONSOLE OUTPUT
      // e.g. System.out.println("Hello"); or print("Hello")
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
          `📢 Printed output to console: "${outText}"`
        );

        i++;
        continue;
      }

      // 14. FUNCTION CALL & RECURSION
      // e.g. int result = factorial(4); or factorial(n - 1)
      const funcCallAssignMatch = trimmed.match(/^(?:(?:int|double|String|var)\s+)?([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)\(([^)]*)\);?$/);
      if (funcCallAssignMatch && this.functions[funcCallAssignMatch[2]]) {
        const destVar = funcCallAssignMatch[1];
        const funcName = funcCallAssignMatch[2];
        const argStrings = funcCallAssignMatch[3].split(',').map((a) => a.trim()).filter(Boolean);
        const funcDef = this.functions[funcName];

        const evaluatedArgs: Record<string, any> = {};
        funcDef.params.forEach((paramName, idx) => {
          evaluatedArgs[paramName] = this.evaluateExpr(argStrings[idx]) ?? 0;
        });

        // Depth check
        if (this.callStack.length > 30) {
          throw {
            type: 'RuntimeError',
            message: 'StackOverflowError: Maximum recursive call stack depth of 30 exceeded',
            detail: `Recursive function '${funcName}' did not reach a terminating base case.`,
          };
        }

        const newFrame: CallFrame = {
          id: `frame-${this.callStack.length + 1}`,
          functionName: `${funcName}(${Object.values(evaluatedArgs).join(', ')})`,
          arguments: evaluatedArgs,
          localVariables: {},
          line: funcDef.startLine,
          depth: this.callStack.length + 1,
        };

        this.callStack.push(newFrame);

        // Create scope for function
        const parentScope = this.currentScope;
        this.currentScope = new Scope(funcName, parentScope);
        for (const [pName, pVal] of Object.entries(evaluatedArgs)) {
          this.currentScope.set(pName, {
            name: pName,
            type: typeof pVal === 'number' ? 'int' : 'Object',
            value: pVal,
            scope: funcName,
            isReference: false,
            estimatedBytes: 4,
          });
        }

        this.recordStep(
          currentLineNum,
          {
            type: 'FUNCTION_CALL',
            line: currentLineNum,
            functionName: funcName,
            arguments: evaluatedArgs,
          },
          `📞 Call \`${funcName}(${Object.entries(evaluatedArgs).map(([k, v]) => `${k}=${v}`).join(', ')})\` (Call stack depth: ${this.callStack.length})`
        );

        // Execute function body
        const returnVal = this.executeFunctionBody(funcDef.body, funcDef.startLine);

        // Pop frame & revert scope
        this.callStack.pop();
        this.currentScope = parentScope;

        if (destVar) {
          this.currentScope.set(destVar, {
            name: destVar,
            type: typeof returnVal === 'number' ? 'int' : 'Object',
            value: returnVal,
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
            returnValue: returnVal,
          },
          `🔙 \`${funcName}\` returned \`${returnVal}\`. Popped stack frame.`
        );

        i++;
        continue;
      }

      // 15. PRIMITIVE VARIABLE DECLARATION / UPDATE
      // e.g. int temp = arr[i]; or left++; or x = 10;
      const primDeclMatch = trimmed.match(/^(?:int|double|boolean|char|String|long)\s+([a-zA-Z_]\w*)\s*=\s*([^;]+);?$/);
      if (primDeclMatch) {
        const vName = primDeclMatch[1];
        const vExpr = primDeclMatch[2];
        const val = this.evaluateExpr(vExpr);
        const vType = typeof val === 'number' ? 'int' : typeof val === 'boolean' ? 'boolean' : 'String';

        const varInfo: VariableInfo = {
          name: vName,
          type: vType,
          value: val,
          scope: this.currentScope.name,
          isReference: false,
          estimatedBytes: estimateSize(vType, val),
        };
        this.currentScope.set(vName, varInfo);

        this.recordStep(
          currentLineNum,
          {
            type: 'VARIABLE_CREATE',
            line: currentLineNum,
            variable: vName,
            dataType: vType,
            value: val,
          },
          `Declared variable \`${vName}\` = ${val}`
        );

        i++;
        continue;
      }

      // Simple assignment: x = y; or x++; or x--;
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

      // Default: move to next line
      i++;
    }
  }

  private executeFunctionBody(lines: string[], startLine: number): any {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const currentLineNum = startLine + i + 1;

      // Handle return
      const retMatch = line.match(/^return(?:\s+([^;]+))?;?$/);
      if (retMatch) {
        const retExpr = retMatch[1];
        // Recursive call in return: e.g. return n * factorial(n - 1);
        const recCallMatch = retExpr ? retExpr.match(/([a-zA-Z_]\w*)\(([^)]*)\)/) : null;
        if (recCallMatch && this.functions[recCallMatch[1]]) {
          const recFuncName = recCallMatch[1];
          const recArgStr = recCallMatch[2];
          const recArgVal = this.evaluateExpr(recArgStr);

          // Recursively invoke
          const newFrame: CallFrame = {
            id: `frame-${this.callStack.length + 1}`,
            functionName: `${recFuncName}(${recArgVal})`,
            arguments: { [this.functions[recFuncName].params[0] || 'n']: recArgVal },
            localVariables: {},
            line: this.functions[recFuncName].startLine,
            depth: this.callStack.length + 1,
          };
          this.callStack.push(newFrame);

          const childScope = new Scope(recFuncName, this.currentScope);
          childScope.set(this.functions[recFuncName].params[0] || 'n', {
            name: this.functions[recFuncName].params[0] || 'n',
            type: 'int',
            value: recArgVal,
            scope: recFuncName,
            isReference: false,
            estimatedBytes: 4,
          });

          const prevScope = this.currentScope;
          this.currentScope = childScope;

          this.recordStep(
            currentLineNum,
            {
              type: 'FUNCTION_CALL',
              line: currentLineNum,
              functionName: recFuncName,
              arguments: { n: recArgVal },
            },
            `📞 Recursive call: \`${recFuncName}(${recArgVal})\``
          );

          const subResult = this.executeFunctionBody(this.functions[recFuncName].body, this.functions[recFuncName].startLine);

          this.callStack.pop();
          this.currentScope = prevScope;

          // Replace recursive call in expression
          const combinedExpr = retExpr.replace(recCallMatch[0], String(subResult));
          const finalVal = this.evaluateExpr(combinedExpr);
          return finalVal;
        }

        const evaluated = retExpr ? this.evaluateExpr(retExpr) : undefined;
        return evaluated;
      }

      // If condition inside function
      const ifMatch = line.match(/^if\s*\(([^)]+)\)\s*\{?([^}]*)\}?$/);
      if (ifMatch) {
        const cond = ifMatch[1];
        const inlineBody = ifMatch[2].trim();
        const { result, comparison } = this.evaluateCondition(cond, currentLineNum);

        this.recordStep(
          currentLineNum,
          {
            type: 'CONDITION_EVALUATE',
            line: currentLineNum,
            condition: cond,
            conditionResult: result,
          },
          comparison.explanation,
          comparison
        );

        if (result) {
          if (inlineBody.startsWith('return')) {
            const valExpr = inlineBody.replace(/^return\s*/, '').replace(/;$/, '');
            return this.evaluateExpr(valExpr);
          }
        }
      }
    }
    return undefined;
  }
}
