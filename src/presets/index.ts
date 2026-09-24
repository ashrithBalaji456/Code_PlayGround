import { CodePreset } from '../types/execution';

export const CODE_PRESETS: CodePreset[] = [
  {
    id: 'mvp-array-doubling',
    title: 'Array In-Place Doubling (MVP)',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Demonstrates in-place iteration and array element mutation at highlighted source lines.',
    explanation: 'Iterates through an integer array and doubles each element in place. Watch the pointer `i` advance while `arr[i]` updates live in memory and visual blocks.',
    code: `// CodeFlow DSA Lab - In-Place Array Mutation
int[] arr = {10, 20, 30};

for (int i = 0; i < arr.length; i++) {
    arr[i] = arr[i] * 2;
}
`,
  },
  {
    id: 'multi-stacks',
    title: 'Multiple Independent Stacks',
    category: 'Stacks & Queues',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) push/pop',
    spaceComplexity: 'O(K)',
    description: 'Automatically provisions and visualizes 3 separate LIFO stacks side-by-side.',
    explanation: 'Creates three independent Stack instances `a`, `b`, and `c` on the JVM heap. Pushing elements animates each stack independently without hardcoding.',
    code: `// Multi-Stack independent instances
Stack<Integer> a = new Stack<>();
Stack<Integer> b = new Stack<>();
Stack<Integer> c = new Stack<>();

a.push(10);
a.push(20);

b.push(100);
b.push(200);
b.push(300);

c.push(999);

int val = b.pop();
`,
  },
  {
    id: 'bubble-sort',
    title: 'Bubble Sort with Swapping',
    category: 'Arrays & Sorting',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    description: 'Classic bubble sort illustrating inner loop comparisons and animated index swaps.',
    explanation: 'Adjacent elements are compared step-by-step. If out of order, values swap across indices. The active pointers `i` and `j` clearly show the nested loop progress.',
    code: `int[] arr = {64, 34, 25, 12, 22, 11, 90};

for (int i = 0; i < arr.length - 1; i++) {
    for (int j = 0; j < arr.length - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
            int temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
        }
    }
}
`,
  },
  {
    id: 'two-pointer-reverse',
    title: 'Two-Pointer Array Reversal',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Two pointers converging from opposite ends with element swapping.',
    explanation: 'Pointers `left` and `right` start at boundaries and move inward until they cross, swapping symmetric elements in O(N/2) steps.',
    code: `int[] arr = {1, 2, 3, 4, 5, 6};
int left = 0;
int right = arr.length - 1;

while (left < right) {
    int temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
    left++;
    right--;
}
`,
  },
  {
    id: 'binary-search',
    title: 'Binary Search Algorithm',
    category: 'Arrays & Sorting',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    description: 'Logarithmic search halving search bounds using left, right, and mid pointers.',
    explanation: 'Examines midpoint `mid = (left + right) / 2`. Discards the unneeded half dynamically at each comparison step until target 23 is found.',
    code: `int[] arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
int target = 23;
int left = 0;
int right = arr.length - 1;
int foundIndex = -1;

while (left <= right) {
    int mid = (left + right) / 2;
    if (arr[mid] == target) {
        foundIndex = mid;
        break;
    } else if (arr[mid] < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
`,
  },
  {
    id: 'queue-fifo',
    title: 'Queue FIFO Pipeline',
    category: 'Stacks & Queues',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'First-In-First-Out queue with animated enqueue from rear and dequeue from front.',
    explanation: 'Elements enter from the rear and leave in order from the front, maintaining strict FIFO order.',
    code: `Queue<Integer> q = new LinkedList<>();

q.offer(10);
q.offer(20);
q.offer(30);

int first = q.poll();
q.offer(40);
int second = q.poll();
`,
  },
  {
    id: 'linked-list-chain',
    title: 'Singly Linked List Chain & Traversal',
    category: 'Linked Lists',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Node creation on heap, pointer linking (.next), and step-by-step pointer traversal.',
    explanation: 'Creates individual Node objects on the Heap with simulated addresses. Links `node.next` and advances a `curr` pointer through the list to `null`.',
    code: `Node head = new Node(10);
head.next = new Node(20);
head.next.next = new Node(30);
head.next.next.next = new Node(40);

Node curr = head;
while (curr != null) {
    curr = curr.next;
}
`,
  },
  {
    id: 'bst-construction',
    title: 'Binary Tree Construction',
    category: 'Trees & Heaps',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Hierarchical tree nodes with left and right child pointers.',
    explanation: 'Constructs a binary tree on the heap. Visualizes parent-child relationships with SVG branches and node values.',
    code: `TreeNode root = new TreeNode(50);
root.left = new TreeNode(25);
root.right = new TreeNode(75);
root.left.left = new TreeNode(10);
root.left.right = new TreeNode(35);
`,
  },
  {
    id: 'hashmap-buckets',
    title: 'HashMap Hash Function & Buckets',
    category: 'Hash Tables',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1) avg',
    spaceComplexity: 'O(N)',
    description: 'Key hashing, bucket index calculation (hash % N), and entry mapping.',
    explanation: 'Calculates the hash code of string keys, selects bucket indices, and visualizes key-value pair insertions in bucket slots.',
    code: `Map<String, Integer> map = new HashMap<>();

map.put("Apple", 50);
map.put("Banana", 30);
map.put("Cherry", 85);
map.put("Date", 40);
`,
  },
  {
    id: 'recursion-factorial',
    title: 'Recursion & Call Stack (Factorial)',
    category: 'Recursion',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N) stack frames',
    description: 'Deep call stack growth, parameter binding, base-case condition, and frame returns.',
    explanation: 'Demonstrates stack frames stacking during recursive descent `factorial(4) -> factorial(3) ...` and unwinding upon reaching the base case.',
    code: `int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int result = factorial(4);
`,
  },
  {
    id: 'error-null-pointer',
    title: 'Visual NullPointerException Diagnostic',
    category: 'Error Diagnostics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'N/A',
    spaceComplexity: 'N/A',
    description: 'Visualizes broken references and provides clear root-cause memory diagnostics.',
    explanation: 'Shows what happens when dereferencing a null pointer: the visual pointer breaks and an actionable diagnostic panel details the exact variable and cause.',
    code: `// Demonstrating visual error diagnosis
Node node = null;

// Accessing field on null pointer:
int val = node.next.val;
`,
  },
  {
    id: 'error-out-of-bounds',
    title: 'ArrayIndexOutOfBounds Diagnostic',
    category: 'Error Diagnostics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'N/A',
    spaceComplexity: 'N/A',
    description: 'Shows out-of-range index access against the array bounds visually.',
    explanation: 'Highlights the target array and flags the illegal index access beyond array boundaries.',
    code: `int[] arr = {10, 20, 30};

// Array has indices 0, 1, 2. Index 5 is out of bounds!
int badAccess = arr[5];
`,
  },
  {
    id: 'python-array-doubling',
    title: 'Python List Transformation',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'python',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Python list in-place multiplication visualized in the unified execution pipeline.',
    explanation: 'Demonstrates that the normalized execution event model works seamlessly for Python syntax without changing the visualization engine.',
    code: `# CodeFlow DSA Lab - Python List In-Place Doubling
arr = [10, 20, 30]

for i in range(len(arr)):
    arr[i] = arr[i] * 2
`,
  },
  {
    id: 'python-stack',
    title: 'Python Stack (List append & pop)',
    category: 'Stacks & Queues',
    difficulty: 'Easy',
    language: 'python',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Python list used as a LIFO stack with append and pop methods.',
    explanation: 'Visualizes Python stack operations using the unified event model.',
    code: `# Python LIFO Stack
stack = []

stack.append(10)
stack.append(20)
stack.append(30)

top_item = stack.pop()
`,
  },
];
