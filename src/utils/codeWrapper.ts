import { SupportedLanguage } from '../types/execution';

/**
 * Intelligently wraps raw Java snippets into a valid, runnable public class Main
 * with main() method if class/main wrapper is missing.
 */
export function wrapCodeIfNeeded(rawCode: string, language: SupportedLanguage, autoWrap: boolean = true): string {
  if (!autoWrap) return rawCode;

  const trimmed = rawCode.trim();
  if (!trimmed) return rawCode;

  if (language === 'java') {
    const hasClassDeclaration = /\b(?:public\s+)?class\s+[A-Za-z0-9_]+/.test(trimmed);
    const hasMainMethod = /\bpublic\s+static\s+void\s+main\s*\(\s*String\s*(?:\[\s*\]|\.\.\.)/.test(trimmed);

    // Case 1: Raw statements only (e.g. `int[] arr = {1, 2}; Stack<Integer> s = new Stack<>();`)
    if (!hasClassDeclaration && !hasMainMethod) {
      // Indent user statements 8 spaces
      const indented = trimmed
        .split('\n')
        .map((line) => (line.trim().length > 0 ? `        ${line}` : ''))
        .join('\n');

      return `import java.util.*;

public class Main {
    public static void main(String[] args) {
${indented}
    }
}
`;
    }

    // Case 2: User wrote a method or main method without an enclosing class
    if (!hasClassDeclaration && hasMainMethod) {
      const indented = trimmed
        .split('\n')
        .map((line) => (line.trim().length > 0 ? `    ${line}` : ''))
        .join('\n');

      return `import java.util.*;

public class Main {
${indented}
}
`;
    }

    // Case 3: User wrote a class without imports
    if (hasClassDeclaration && !/import\s+java\.util\./.test(trimmed)) {
      return `import java.util.*;\n\n${trimmed}`;
    }
  }

  return rawCode;
}
