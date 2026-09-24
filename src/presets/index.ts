import { CodePreset } from '../types/execution';

export const CODE_PRESETS: CodePreset[] = [
  {
    id: 'p1-ex3-loop',
    title: 'Example 3 — Loop (Core Demo)',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'In-place iteration and array element mutation: [10, 20, 30] ➔ [20, 40, 60].',
    explanation: 'Iterates through the integer array, updating each element while the pointer `i` advances across indices.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30};

        for (int i = 0; i < arr.length; i++) {
            arr[i] = arr[i] * 2;
        }
    }
}
`,
  },
  {
    id: 'p1-ex1-variables',
    title: 'Example 1 — Variables',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Variable declaration, arithmetic evaluation, and System.out.println console output.',
    explanation: 'Allocates variables `x` and `y`, calculates `sum = x + y`, and logs to the console panel.',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int sum = x + y;
        System.out.println(sum);
    }
}
`,
  },
  {
    id: 'p1-ex2-array',
    title: 'Example 2 — Array Update',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Array creation, indexed element assignment (20 ➔ 50), and console print.',
    explanation: 'Creates a 3-element integer array and updates index 1 from 20 to 50 with live cell animation.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30};

        arr[1] = 50;

        System.out.println(arr[1]);
    }
}
`,
  },
  {
    id: 'p1-ex4-method',
    title: 'Example 4 — Method & Call Stack',
    category: 'Recursion',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Function call with parameters, method stack frame, and return value passing.',
    explanation: 'Calls `add(10, 20)`, executes inside the method frame, and returns 30 to `main`.',
    code: `public class Main {

    static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        int result = add(10, 20);
        System.out.println(result);
    }
}
`,
  },
  {
    id: 'p1-multi-arrays',
    title: 'Multiple Independent Arrays',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(K)',
    description: 'Automatically provisions independent visual arrays for `a`, `b`, and `c`.',
    explanation: 'Demonstrates that the platform does NOT hard-code a fixed number of structures: creating three arrays renders three visual arrays.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2};
        int[] b = {3, 4, 5};
        int[] c = {6, 7, 8, 9};

        a[0] = 99;
        b[2] = b[2] * 10;
    }
}
`,
  },
  {
    id: 'p1-condition-branch',
    title: 'Condition Evaluation (if/else)',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visual condition evaluation showing 15 > 10 ➔ TRUE and branch execution.',
    explanation: 'Evaluates boolean comparison on the fly and highlights the executing code branch.',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 15;
        if (x > 10) {
            System.out.println("x is greater than 10");
        } else {
            System.out.println("x is 10 or less");
        }
    }
}
`,
  },
];
