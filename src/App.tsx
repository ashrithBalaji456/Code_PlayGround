import { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ExecutionControls } from './components/ExecutionControls';
import { CodeEditor } from './components/CodeEditor';
import { VisualizationCanvas } from './components/VisualizationCanvas';
import { VariablesPanel } from './components/panels/VariablesPanel';
import { MemoryPanel } from './components/panels/MemoryPanel';
import { CallStackPanel } from './components/panels/CallStackPanel';
import { ConsolePanel } from './components/panels/ConsolePanel';
import { LearningModePanel } from './components/panels/LearningModePanel';
import { HelpModal } from './components/HelpModal';
import { CODE_PRESETS } from './presets';
import { CodePreset, SupportedLanguage, ExecutionStep, ExecutionStatus } from './types/execution';
import { ExecutionEngine } from './engine/interpreter';
import { reconstructExecutionSteps } from './engine/stateReconstructor';
import { Variable, Cpu, Layers, Terminal } from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
  const [selectedPreset, setSelectedPreset] = useState<CodePreset>(CODE_PRESETS[0]);
  const [language, setLanguage] = useState<SupportedLanguage>('java');
  const [code, setCode] = useState<string>(CODE_PRESETS[0].code);

  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('IDLE');
  const [workerName, setWorkerName] = useState<string>('Java 22.0.1 (JVM Sandboxed)');
  const [compilationError, setCompilationError] = useState<{ line: number; message: string; detail: string } | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);

  const [activeBottomTab, setActiveBottomTab] = useState<'variables' | 'memory' | 'callstack' | 'console'>('variables');
  const [isLearningMode, setIsLearningMode] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  const playTimerRef = useRef<any>(null);

  // Active step
  const currentStep: ExecutionStep | null =
    steps.length > 0 && currentStepIndex >= 0 && currentStepIndex < steps.length
      ? steps[currentStepIndex]
      : null;

  // Active line
  const activeLine: number | null = currentStep ? currentStep.line : (compilationError ? compilationError.line : null);

  // Run via real Java execution worker with graceful client fallback
  const handleRun = useCallback(async () => {
    setExecutionStatus('COMPILING');
    setCompilationError(null);
    setIsRunning(true);
    setIsPaused(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.events)) {
        const recordedSteps = reconstructExecutionSteps(result.events, code);
        setSteps(recordedSteps);
        setWorkerName(result.worker || 'Java 22.0.1 (JVM Sandboxed)');
        setExecutionStatus('RUNNING');

        if (recordedSteps.length > 0) {
          setCurrentStepIndex(0);
          setConsoleOutput(recordedSteps[0].consoleOutput || []);
        } else {
          setCurrentStepIndex(-1);
          setExecutionStatus('COMPLETED');
          setIsRunning(false);
        }
      } else if (result.error) {
        // Genuine compilation or runtime error from javac / java
        setExecutionStatus('ERROR');
        setIsRunning(false);
        setIsPaused(false);
        setCompilationError({
          line: result.error.line || 1,
          message: result.error.message || 'Execution error',
          detail: result.error.detail || '',
        });

        const errorStep: ExecutionStep = {
          stepIndex: 0,
          totalSteps: 1,
          line: result.error.line || 1,
          event: {
            type: 'EXCEPTION',
            line: result.error.line || 1,
            message: result.error.message,
            detail: result.error.detail,
          },
          explanation: `${result.error.type || 'Error'} on Line ${result.error.line}: ${result.error.message}`,
          variables: {},
          callStack: [],
          structures: {},
          heap: [],
          consoleOutput: [result.error.detail || result.error.message],
          activePointers: {},
          comparison: null,
          error: {
            type: result.error.type?.includes('Compilation') ? 'SyntaxError' : 'RuntimeError',
            line: result.error.line || 1,
            message: result.error.message,
            detail: result.error.detail,
          },
          memoryStats: { stackBytes: 0, heapBytes: 0, totalBytes: 0 },
        };
        setSteps([errorStep]);
        setCurrentStepIndex(0);
        setConsoleOutput([result.error.detail || result.error.message]);
      } else {
        throw new Error('Unknown response structure');
      }
    } catch (err: any) {
      // Offline fallback: Use client-side ExecutionEngine
      console.warn('Backend unavailable, using client-side execution engine fallback:', err);
      const engine = new ExecutionEngine();
      const recordedSteps = engine.execute(code, language);
      setSteps(recordedSteps);
      setWorkerName('Client Engine Fallback');
      setExecutionStatus('RUNNING');

      if (recordedSteps.length > 0) {
        setCurrentStepIndex(0);
        setConsoleOutput(recordedSteps[0].consoleOutput || []);
      }
    }
  }, [code, language]);

  // Stepping actions
  const handleNextStep = useCallback(() => {
    if (steps.length === 0) {
      handleRun();
      return;
    }
    setCurrentStepIndex((prev) => {
      const next = Math.min(steps.length - 1, prev + 1);
      if (next === steps.length - 1) {
        setIsRunning(false);
        setIsPaused(false);
        setExecutionStatus('COMPLETED');
        if (steps[next].event.type !== 'EXCEPTION') {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
        }
      }
      return next;
    });
  }, [steps, handleRun]);

  const handlePrevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    setExecutionStatus('PAUSED');
    if (playTimerRef.current) clearInterval(playTimerRef.current);
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    setExecutionStatus('RUNNING');
  }, []);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setExecutionStatus('STOPPED');
    if (playTimerRef.current) clearInterval(playTimerRef.current);
  }, []);

  const handleRestart = useCallback(() => {
    if (steps.length > 0) {
      setCurrentStepIndex(0);
      setIsRunning(false);
      setIsPaused(false);
      setExecutionStatus('IDLE');
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
  }, [steps]);

  const handleScrub = useCallback((stepIdx: number) => {
    setCurrentStepIndex(stepIdx);
  }, []);

  const handleToggleBreakpoint = useCallback((line: number) => {
    setBreakpoints((prev) =>
      prev.includes(line) ? prev.filter((l) => l !== line) : [...prev, line]
    );
  }, []);

  // Preset selection
  const handleSelectPreset = useCallback((preset: CodePreset) => {
    setSelectedPreset(preset);
    setLanguage(preset.language);
    setCode(preset.code);
    setSteps([]);
    setCurrentStepIndex(-1);
    setIsRunning(false);
    setIsPaused(false);
    setExecutionStatus('IDLE');
    setCompilationError(null);
    setConsoleOutput([]);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
  }, []);

  const handleLanguageChange = useCallback((newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const match = CODE_PRESETS.find((p) => p.language === newLang);
    if (match) {
      handleSelectPreset(match);
    }
  }, [handleSelectPreset]);

  // Synchronize console output with active step
  useEffect(() => {
    if (currentStep) {
      setConsoleOutput(currentStep.consoleOutput || []);
    }
  }, [currentStep]);

  // Playback timer loop
  useEffect(() => {
    if (isRunning && !isPaused && steps.length > 0) {
      const intervalMs = Math.max(120, Math.floor(800 / speed));

      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          const next = prev + 1;
          if (next >= steps.length) {
            setIsRunning(false);
            setIsPaused(false);
            if (steps[steps.length - 1].event.type !== 'EXCEPTION') {
              confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
            }
            return prev;
          }

          // Check if next step hits a breakpoint
          const nextStep = steps[next];
          if (breakpoints.includes(nextStep.line)) {
            setIsPaused(true);
          }

          return next;
        });
      }, intervalMs);

      return () => {
        if (playTimerRef.current) clearInterval(playTimerRef.current);
      };
    }
  }, [isRunning, isPaused, steps, speed, breakpoints]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isRunning) {
          if (isPaused) handleResume();
          else handlePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, handleNextStep, handlePrevStep, isRunning, isPaused, handleResume, handlePause]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0e14] text-[#f0f6fc] overflow-hidden select-none font-sans">
      {/* Top Navbar */}
      <Navbar
        language={language}
        selectedPresetId={selectedPreset.id}
        isLearningMode={isLearningMode}
        onLanguageChange={handleLanguageChange}
        onSelectPreset={handleSelectPreset}
        onToggleLearningMode={() => setIsLearningMode((prev) => !prev)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Execution Controls Toolbar */}
      <ExecutionControls
        isRunning={isRunning}
        isPaused={isPaused}
        executionStatus={executionStatus}
        currentLine={activeLine}
        workerName={workerName}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        speed={speed}
        onRun={handleRun}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onRestart={handleRestart}
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
        onStepOver={handleNextStep}
        onStepInto={handleNextStep}
        onStepOut={handleNextStep}
        onSpeedChange={setSpeed}
        onScrub={handleScrub}
      />

      {/* Main Workspace Split */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Code Editor (40% width) */}
        <section aria-label="Source Code Editor" className="w-2/5 flex flex-col h-full border-r border-[#30363d] overflow-hidden">
          <CodeEditor
            code={code}
            language={language}
            currentLine={activeLine}
            breakpoints={breakpoints}
            onChange={setCode}
            onToggleBreakpoint={handleToggleBreakpoint}
            onReset={() => setCode(selectedPreset.code)}
            onFormat={() => {
              // Basic trim formatting
              setCode(code.trim());
            }}
          />
        </section>

        {/* Right Side: Visual Canvas & Bottom Inspection Panels (60% width) */}
        <section aria-label="Visual Canvas and Inspection" className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Upper Half: Live Visualization Canvas */}
          <div className="flex-1 h-3/5 overflow-hidden border-b border-[#30363d]">
            <VisualizationCanvas
              currentStep={currentStep}
              isRunning={isRunning}
            />
          </div>

          {/* Lower Half: Debug Panels or Learning Mode (2/5 height) */}
          <div className="h-2/5 flex flex-col bg-[#161b22] overflow-hidden">
            {isLearningMode ? (
              <LearningModePanel
                preset={selectedPreset}
                onRunPreset={() => {
                  handleSelectPreset(selectedPreset);
                  setTimeout(handleRun, 150);
                }}
              />
            ) : (
              <div className="h-full flex flex-col overflow-hidden">
                {/* Panel Tab Navigation Bar */}
                <div className="flex items-center justify-between px-3 bg-[#0d1117] border-b border-[#30363d] h-9">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveBottomTab('variables')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t border-b-2 transition-colors ${
                        activeBottomTab === 'variables'
                          ? 'border-[#58a6ff] text-[#58a6ff] bg-[#161b22]'
                          : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
                      }`}
                    >
                      <Variable className="w-3.5 h-3.5" />
                      <span>Variables</span>
                      {currentStep && (
                        <span className="text-[10px] bg-[#21262d] px-1.5 rounded-full">
                          {Object.keys(currentStep.variables).length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveBottomTab('memory')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t border-b-2 transition-colors ${
                        activeBottomTab === 'memory'
                          ? 'border-[#3fb950] text-[#3fb950] bg-[#161b22]'
                          : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Stack vs Heap</span>
                      {currentStep && (
                        <span className="text-[10px] text-[#3fb950] font-mono">
                          ~{currentStep.memoryStats.totalBytes}B
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveBottomTab('callstack')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t border-b-2 transition-colors ${
                        activeBottomTab === 'callstack'
                          ? 'border-[#bc8cff] text-[#bc8cff] bg-[#161b22]'
                          : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Call Stack</span>
                      {currentStep && currentStep.callStack.length > 1 && (
                        <span className="text-[10px] bg-[#bc8cff]/20 text-[#bc8cff] px-1.5 rounded-full font-bold">
                          {currentStep.callStack.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveBottomTab('console')}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t border-b-2 transition-colors ${
                        activeBottomTab === 'console'
                          ? 'border-[#39c5cf] text-[#39c5cf] bg-[#161b22]'
                          : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Console</span>
                      {consoleOutput.length > 0 && (
                        <span className="text-[10px] bg-[#39c5cf]/20 text-[#39c5cf] px-1.5 rounded-full">
                          {consoleOutput.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Panel Tab View */}
                <div className="flex-1 overflow-hidden p-2 bg-[#0d1117]/60">
                  {activeBottomTab === 'variables' && (
                    <VariablesPanel
                      variables={currentStep?.variables || {}}
                      lastEvent={currentStep?.event}
                    />
                  )}
                  {activeBottomTab === 'memory' && (
                    <MemoryPanel
                      variables={currentStep?.variables || {}}
                      heap={currentStep?.heap || []}
                      memoryStats={
                        currentStep?.memoryStats || {
                          stackBytes: 0,
                          heapBytes: 0,
                          totalBytes: 0,
                        }
                      }
                    />
                  )}
                  {activeBottomTab === 'callstack' && (
                    <CallStackPanel callStack={currentStep?.callStack || []} />
                  )}
                  {activeBottomTab === 'console' && (
                    <ConsolePanel
                      output={consoleOutput}
                      onClear={() => setConsoleOutput([])}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Documentation / Shortcuts Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

export default App;
