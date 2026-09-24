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

      case 'ARRAY_CREATE': {
        const arrId = ev.structureId || ev.arrayId || 'arr';
        const arrVals = Array.isArray(ev.values) ? [...ev.values] : [];
        nextStructures[arrId] = {
          id: arrId,
          name: ev.arrayId || arrId,
          type: 'array',
          dataType: ev.dataType || 'int[]',
          arrayData: arrVals,
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
