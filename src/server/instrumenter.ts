export interface InstrumentationResult {
  instrumentedCode: string;
  className: string;
}

export function instrumentJavaCode(sourceCode: string): InstrumentationResult {
  // Extract main class name
  const classMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
  const className = classMatch ? classMatch[1] : 'Main';

  const lines = sourceCode.split('\n');
  const outputLines: string[] = [
    'package com.codeflow;',
    'import com.codeflow.CodeFlowTracer;',
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

    // If we are in main, track braces
    if (inMainMethod) {
      // Count open and close braces on this line (simple heuristic ignoring strings)
      const openCount = (rawLine.match(/\{/g) || []).length;
      const closeCount = (rawLine.match(/\}/g) || []).length;

      // Check if this line closes main method
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

    // Check array declaration: int[] arr = {10, 20, 30}; or int[] a = new int[5];
    const arrayDeclMatch = trimmed.match(/^(?:int|long|double|float)\[\]\s+([a-zA-Z_0-9]+)\s*=\s*(.+);$/);
    if (arrayDeclMatch) {
      const arrName = arrayDeclMatch[1];
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(rawLine);
      outputLines.push(`    CodeFlowTracer.arrayCreate("${arrName}", ${arrName}, ${lineNum});`);
      continue;
    }

    // Check array assignment: arr[i] = arr[i] * 2; or arr[1] = 50;
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

    // Check variable declaration: int x = 10;
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

    // Check variable assignment: x = 20;
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

    // Check for loop: for (int i = 0; i < arr.length; i++) {
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

    // If condition: if (x > 10) {
    const ifMatch = trimmed.match(/^if\s*\((.+)\)\s*\{?$/);
    if (ifMatch && !trimmed.startsWith('else')) {
      const condExpr = ifMatch[1].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    boolean _cond_${lineNum} = (${condExpr});`);
      outputLines.push(`    CodeFlowTracer.condition("${condExpr.replace(/"/g, '\\"')}", _cond_${lineNum}, ${lineNum});`);
      outputLines.push(`    if (_cond_${lineNum}) {`);
      continue;
    }

    // Method declaration: static int add(int a, int b) {
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

    // Method return: return a + b;
    const returnMatch = trimmed.match(/^return\s+(.+);$/);
    if (returnMatch) {
      const retExpr = returnMatch[1].trim();
      outputLines.push(`    CodeFlowTracer.line(${lineNum});`);
      outputLines.push(`    var _retVal = (${retExpr});`);
      outputLines.push(`    CodeFlowTracer.funcReturn("method", _retVal, ${lineNum});`);
      outputLines.push(`    return _retVal;`);
      continue;
    }

    // System.out.println
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
