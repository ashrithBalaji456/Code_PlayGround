import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { SupportedLanguage } from '../types/execution';
import { RotateCcw, Sparkles } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  language: SupportedLanguage;
  currentLine: number | null;
  breakpoints: number[];
  onChange: (value: string) => void;
  onToggleBreakpoint: (line: number) => void;
  onReset: () => void;
  onFormat: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  currentLine,
  breakpoints,
  onChange,
  onToggleBreakpoint,
  onReset,
  onFormat,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any[]>([]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom VS Code dark theme for IDE
    monaco.editor.defineTheme('codeflow-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72', fontStyle: 'bold' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#f0f6fc',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#58a6ff',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#161b22',
        'editorGutter.background': '#0d1117',
      },
    });

    monaco.editor.setTheme('codeflow-dark');

    // Handle gutter click for breakpoints
    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
          e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        const line = e.target.position?.lineNumber;
        if (line) {
          onToggleBreakpoint(line);
        }
      }
    });
  };

  // Update line highlighting and breakpoints
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    const newDecorations: any[] = [];

    // Highlight currently executing line
    if (currentLine && currentLine > 0) {
      newDecorations.push({
        range: new monaco.Range(currentLine, 1, currentLine, 1),
        options: {
          isWholeLine: true,
          className: 'bg-[#58a6ff]/20 border-l-4 border-[#58a6ff]',
          glyphMarginClassName: 'text-[#58a6ff] font-bold',
        },
      });

      // Scroll into view if needed
      editor.revealLineInCenterIfOutsideViewport(currentLine);
    }

    // Render breakpoints
    breakpoints.forEach((line) => {
      newDecorations.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'bg-[#f85149] rounded-full w-2.5 h-2.5 my-auto ml-1',
        },
      });
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [currentLine, breakpoints]);

  return (
    <div className="h-full flex flex-col bg-[#0d1117] border-r border-[#30363d] overflow-hidden">
      {/* Editor Sub-header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[#f0f6fc]">
            {language === 'java' ? 'Solution.java' : 'solution.py'}
          </span>
          <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded uppercase">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onFormat}
            className="flex items-center gap-1 text-[11px] text-[#8b949e] hover:text-[#f0f6fc] px-2 py-0.5 rounded hover:bg-[#21262d] transition-colors"
            title="Format Code"
          >
            <Sparkles className="w-3 h-3 text-[#58a6ff]" />
            <span>Format</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] text-[#8b949e] hover:text-[#f85149] px-2 py-0.5 rounded hover:bg-[#21262d] transition-colors"
            title="Reset to Starter Code"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language === 'java' ? 'java' : 'python'}
          value={code}
          theme="vs-dark"
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            lineNumbers: 'on',
            glyphMargin: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            bracketPairColorization: { enabled: true },
            cursorBlinking: 'smooth',
            lineDecorationsWidth: 6,
          }}
        />
      </div>
    </div>
  );
};
