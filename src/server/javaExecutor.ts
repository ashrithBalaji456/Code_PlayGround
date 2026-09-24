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

    // 3. Test compile the RAW user code first to catch genuine javac compilation errors
    const rawJavaFile = path.join(sandboxDir, `${className}.java`);
    fs.writeFileSync(rawJavaFile, userCode, 'utf8');

    const compileError = await new Promise<{ line: number; message: string; detail: string } | null>((resolve) => {
      exec(`javac "${rawJavaFile}"`, { timeout: 4000 }, (error, _stdout, stderr) => {
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
    await new Promise<void>((resolve, reject) => {
      exec(
        `javac -cp "${sandboxDir}" "${tracerFile}" "${instrumentedJavaFile}"`,
        { timeout: 4000 },
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
        return {
          success: true,
          status: 'COMPLETED',
          events,
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
