import React, { useState, useEffect, useRef } from 'react';
import { SupportedLanguage } from '../types/execution';
import { wrapCodeIfNeeded } from '../utils/codeWrapper';
import {
  X,
  ClipboardPaste,
  Play,
  RotateCcw,
  Sparkles,
  FileCode,
  Layers,
  Check,
  Code2,
} from 'lucide-react';

interface PasteCodeModalProps {
  isOpen: boolean;
  currentLanguage: SupportedLanguage;
  onClose: () => void;
  onRunCode: (code: string, language: SupportedLanguage) => void;
}

interface CodeTemplate {
  name: string;
  category: string;
  language: SupportedLanguage;
  code: string;
}

const QUICK_TEMPLATES: CodeTemplate[] = [
  {
    name: 'Queue ➔ Stack Value Transfer',
    category: 'Transfer & Flow',
    language: 'java',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Queue<Integer> queue = new LinkedList<>();
        Stack<Integer> stack = new Stack<>();

        // Populate initial queue
        for (int i = 10; i <= 50; i += 10) {
            queue.add(i);
        }

        // Transfer elements from Queue to Stack
        while (!queue.isEmpty()) {
            int val = queue.poll();
            stack.push(val);
        }
    }
}
`,
  },
  {
    name: 'Entity Relations (Orders & Users)',
    category: 'SQL-Style Entities',
    language: 'java',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // User Entity Table
        Map<String, String> users = new HashMap<>();
        users.put("U1", "Alice");
        users.put("U2", "Bob");
        users.put("U3", "Charlie");

        // Order Entity Table referencing User IDs
        Map<String, String> orders = new HashMap<>();
        orders.put("ORD-101", "U1");
        orders.put("ORD-102", "U2");
        orders.put("ORD-103", "U1");
    }
}
`,
  },
  {
    name: 'Graph BFS with Visited Set',
    category: 'Graph & Sets',
    language: 'java',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false);
        graph.addEdge("A", "B");
        graph.addEdge("A", "C");
        graph.addEdge("B", "D");
        graph.addEdge("C", "E");

        Queue<String> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();

        queue.add("A");
        visited.add("A");

        while (!queue.isEmpty()) {
            String curr = queue.poll();
            for (String nbr : graph.getNeighbors(curr)) {
                if (!visited.contains(nbr)) {
                    visited.add(nbr);
                    queue.add(nbr);
                }
            }
        }
    }
}
`,
  },
  {
    name: 'Binary Search Tree Insertion',
    category: 'Trees',
    language: 'java',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        BST bst = new BST();
        int[] values = {50, 30, 70, 20, 40, 60, 80};

        for (int val : values) {
            bst.insert(val);
        }
    }
}
`,
  },
  {
    name: 'Python Two Pointers',
    category: 'Array / Two Pointers',
    language: 'python',
    code: `numbers = [2, 7, 11, 15, 19, 23]
target = 26

left = 0
right = len(numbers) - 1

while left < right:
    curr_sum = numbers[left] + numbers[right]
    if curr_sum == target:
        break
    elif curr_sum < target:
        left += 1
    else:
        right -= 1
`,
  },
];

export const PasteCodeModal: React.FC<PasteCodeModalProps> = ({
  isOpen,
  currentLanguage,
  onClose,
  onRunCode,
}) => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<SupportedLanguage>(currentLanguage);
  const [autoWrap, setAutoWrap] = useState<boolean>(true);
  const [clipboardPasted, setClipboardPasted] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync language with parent on open
  useEffect(() => {
    if (isOpen) {
      setLanguage(currentLanguage);
      setClipboardPasted(false);
      // Auto-focus textarea
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, currentLanguage]);

  if (!isOpen) return null;

  // Handle direct paste from clipboard API
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setCode(text);
          setClipboardPasted(true);
          setTimeout(() => setClipboardPasted(false), 2000);
        }
      } else {
        textareaRef.current?.focus();
      }
    } catch {
      textareaRef.current?.focus();
    }
  };

  // Handle Tab key in textarea to insert 4 spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Submit and run code
  const handleSubmit = () => {
    const raw = code.trim();
    if (!raw) return;

    // Apply auto-wrapping if requested
    const finalCode = wrapCodeIfNeeded(raw, language, autoWrap);
    onRunCode(finalCode, language);
    onClose();
  };

  const lineCount = code.split('\n').length;
  const isCodeEmpty = code.trim().length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#f0f6fc]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/15 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
              <ClipboardPaste className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#f0f6fc]">
                Paste Custom Code & Run
              </h2>
              <p className="text-[11px] text-[#8b949e]">
                Execute your own code and visualize memory, data structures, and algorithms live
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#f0f6fc] p-1.5 rounded-lg hover:bg-[#21262d] transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Language, Clipboard & Templates */}
        <div className="px-5 py-2.5 bg-[#161b22] border-b border-[#30363d] flex flex-wrap items-center justify-between gap-2.5">
          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b949e] font-mono">Language:</span>
            <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
              <button
                type="button"
                onClick={() => setLanguage('java')}
                className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold transition-all ${
                  language === 'java'
                    ? 'bg-[#58a6ff] text-black shadow'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                Java
              </button>
              <button
                type="button"
                onClick={() => setLanguage('python')}
                className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold transition-all ${
                  language === 'python'
                    ? 'bg-[#3fb950] text-black shadow'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                Python
              </button>
            </div>
          </div>

          {/* Clipboard & Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white border border-[#30363d] px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all"
              title="Paste directly from system clipboard"
            >
              {clipboardPasted ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                  <span className="text-[#3fb950]">Pasted!</span>
                </>
              ) : (
                <>
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste from Clipboard</span>
                </>
              )}
            </button>

            {code.length > 0 && (
              <button
                type="button"
                onClick={() => setCode('')}
                className="flex items-center gap-1 text-[11px] text-[#8b949e] hover:text-[#f85149] px-2 py-1 rounded hover:bg-[#21262d] transition-colors"
                title="Clear code input"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Sample Presets Bar */}
        <div className="px-5 py-2 bg-[#0d1117]/60 border-b border-[#30363d]/60 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] text-[#8b949e] font-mono whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#e3b341]" />
            Templates:
          </span>
          {QUICK_TEMPLATES.filter((t) => t.language === language).map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setCode(t.code)}
              className="bg-[#21262d]/80 hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap transition-colors flex-shrink-0"
              title={`Load sample: ${t.name}`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Code Input Area */}
        <div className="p-4 flex-1 flex flex-col min-h-[260px] bg-[#0d1117] relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'java'
                ? `// Paste any Java code or snippet here...\n// You can paste complete classes OR raw statements:\n\nint[] arr = {10, 20, 30, 40};\nStack<Integer> stack = new Stack<>();\nfor (int x : arr) {\n    stack.push(x);\n}\n`
                : `# Paste any Python code here...\n\nitems = [10, 20, 30]\nstack = []\nfor x in items:\n    stack.append(x)\n`
            }
            className="w-full flex-1 bg-transparent font-mono text-xs text-[#f0f6fc] placeholder-[#484f58] focus:outline-none resize-none leading-relaxed selection:bg-[#264f78]"
            spellCheck={false}
          />

          {/* Bottom Editor Status Bar */}
          <div className="pt-2 border-t border-[#30363d]/40 flex items-center justify-between text-[11px] text-[#8b949e] font-mono">
            <div className="flex items-center gap-3">
              <span>{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
              <span>{code.length} characters</span>
            </div>
            <span className="hidden sm:inline text-[10px]">
              Tip: Press <kbd className="px-1 py-0.5 bg-[#21262d] rounded text-[#f0f6fc]">Ctrl+Enter</kbd> to Run
            </span>
          </div>
        </div>

        {/* Options & Footer Actions */}
        <div className="px-5 py-3 border-t border-[#30363d] bg-[#161b22] flex flex-wrap items-center justify-between gap-3">
          {/* Auto-wrap Toggle for Java */}
          {language === 'java' ? (
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#8b949e] hover:text-[#f0f6fc]">
              <input
                type="checkbox"
                checked={autoWrap}
                onChange={(e) => setAutoWrap(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#0d1117] border-[#30363d] text-[#58a6ff] accent-[#58a6ff] cursor-pointer"
              />
              <span>Auto-wrap raw snippets in <code className="text-[#58a6ff]">public class Main</code></span>
            </label>
          ) : (
            <span className="text-xs text-[#8b949e]">Python executes top-level code directly</span>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isCodeEmpty}
              className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 disabled:hover:bg-[#238636] text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg transition-all transform active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run & Visualize Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
