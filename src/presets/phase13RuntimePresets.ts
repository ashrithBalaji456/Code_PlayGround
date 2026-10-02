import { CodePreset } from '../types/execution';

export const PHASE_13_RUNTIME_JAVA_PRESETS: CodePreset[] = [
  // ─── 01. Primitive Variables ───────────────────────────────────────────────
  {
    id: 'p13-01-primitive-variables',
    title: '01 — Primitive Variables',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing Java 8 primitive types directly allocated on the stack frame.',
    explanation: 'Primitive types (byte, short, int, long, float, double, char, boolean) store raw values directly within the method stack frame.',
    code: `public class Main {
    public static void main(String[] args) {
        int age = 22;
        long count = 100000L;
        double price = 99.5;
        float temperature = 25.5f;
        char grade = 'A';
        boolean active = true;
        byte x = 10;
        short y = 100;

        System.out.println("Age: " + age + ", Price: " + price + ", Grade: " + grade);
    }
}
`,
  },

  // ─── 02. Variable Assignment & Swap ─────────────────────────────────────────
  {
    id: 'p13-02-assignment-swap',
    title: '02 — Variable Assignment & Swap',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing variable assignment, reads, writes, and temporary variable swap.',
    explanation: 'Follows temp = a, a = b, b = temp with animated value transitions and exact line synchronization.',
    code: `public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        System.out.println("Before swap: a = " + a + ", b = " + b);

        int temp = a;
        a = b;
        b = temp;

        System.out.println("After swap: a = " + a + ", b = " + b);
    }
}
`,
  },

  // ─── 03. Variable Scope & Block Lifetime ────────────────────────────────────
  {
    id: 'p13-03-variable-scope',
    title: '03 — Variable Scope & Lifetime',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing nested block scopes and variables transitioning out of active scope.',
    explanation: 'When the if block ends, variable y transitions to VARIABLE NO LONGER IN ACTIVE SCOPE.',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 10;

        if (x > 5) {
            int y = 20;
            System.out.println("Inside if scope: y = " + y);
        }

        System.out.println("Outside if scope: x = " + x);
    }
}
`,
  },

  // ─── 04. Object Creation ────────────────────────────────────────────────────
  {
    id: 'p13-04-object-creation',
    title: '04 — Object Creation (new)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Instantiating a class on the Heap with stable friendly object IDs (object-1).',
    explanation: 'The new keyword allocates memory on the Heap, initializes default fields, and returns a reference stored on the Stack.',
    code: `class Student {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student();
        s.name = "Ashrith";
        s.age = 22;

        System.out.println("Student: " + s.name + " (" + s.age + ")");
    }
}
`,
  },

  // ─── 05. Object References & Aliasing ───────────────────────────────────────
  {
    id: 'p13-05-object-references',
    title: '05 — Object References & Aliasing',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Multiple reference variables pointing to the exact same Heap object.',
    explanation: 'Student s2 = s1 copies the reference address by value. Both s1 and s2 reference the SAME object in Heap memory.',
    code: `class Student {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Student s1 = new Student();
        s1.name = "Ashrith";
        s1.age = 22;

        Student s2 = s1; // Both reference the same Student object
        s2.age = 23;

        System.out.println("s1 age: " + s1.age + ", s2 age: " + s2.age);
    }
}
`,
  },

  // ─── 06. Reference Reassignment ─────────────────────────────────────────────
  {
    id: 'p13-06-reference-reassignment',
    title: '06 — Reference Reassignment',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Reassigning a reference pointer to point to a new independent object on the Heap.',
    explanation: 'When s2 = new Student() executes, s2 points to object-2 while s1 continues pointing to object-1.',
    code: `class Student {
    String name;
}

public class Main {
    public static void main(String[] args) {
        Student s1 = new Student();
        s1.name = "Object A";

        Student s2 = s1;
        System.out.println("s2 initially points to: " + s2.name);

        s2 = new Student(); // Reassigning reference to new object
        s2.name = "Object B";

        System.out.println("After reassignment: s1 = " + s1.name + ", s2 = " + s2.name);
    }
}
`,
  },

  // ─── 07. Null ───────────────────────────────────────────────────────────────
  {
    id: 'p13-07-null',
    title: '07 — Null Reference',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Explicit null representation distinct from 0, empty string, or false.',
    explanation: 'A null reference represents absence of any Heap object target.',
    code: `class Student {
    String name;
}

public class Main {
    public static void main(String[] args) {
        Student s = null;
        System.out.println("Reference s is null: " + (s == null));

        s = new Student();
        s.name = "Valid Student";
        System.out.println("Now referencing: " + s.name);
    }
}
`,
  },

  // ─── 08. NullPointerException ───────────────────────────────────────────────
  {
    id: 'p13-08-nullpointerexception',
    title: '08 — NullPointerException',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing attempt to dereference a null pointer with source line highlight and cause attribution.',
    explanation: 'Accessing s.name when s is null causes the JVM to throw NullPointerException with exact source line attribution.',
    code: `class Student {
    String name;
}

public class Main {
    public static void main(String[] args) {
        Student s = null;
        try {
            System.out.println(s.name);
        } catch (NullPointerException e) {
            System.out.println("Caught NullPointerException: Attempted to dereference null!");
        }
    }
}
`,
  },

  // ─── 09. Array References & Cloning ─────────────────────────────────────────
  {
    id: 'p13-09-array-references',
    title: '09 — Array References & Cloning',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Distinguishing shared array references from independent cloned arrays.',
    explanation: 'int[] b = a shares the same array, whereas int[] c = a.clone() allocates an independent array copy.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3};
        int[] b = a; // Shared reference
        int[] c = a.clone(); // Independent copy

        b[0] = 99;
        System.out.println("Shared a[0]: " + a[0] + ", Cloned c[0]: " + c[0]);
    }
}
`,
  },

  // ─── 10. String Operations & Index View ──────────────────────────────────────
  {
    id: 'p13-10-string-operations',
    title: '10 — String Operations & Character Cells',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing indexed character cells, length(), charAt(), and substring().',
    explanation: 'Strings are displayed as character arrays with 0-based indices and live operation outputs.',
    code: `public class Main {
    public static void main(String[] args) {
        String s = "Ashrith";
        int len = s.length();
        char ch = s.charAt(2); // 'h'
        String sub = s.substring(1, 4); // "shr"

        System.out.println("Length: " + len + ", charAt(2): " + ch + ", Substring: " + sub);
    }
}
`,
  },

  // ─── 11. StringBuilder Mutations ────────────────────────────────────────────
  {
    id: 'p13-11-stringbuilder',
    title: '11 — StringBuilder (Mutable String)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Visualizing in-place mutations inside a StringBuilder object on the Heap.',
    explanation: 'Unlike String, StringBuilder modifies its internal character buffer in place upon append().',
    code: `public class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hello");
        sb.append(" ");
        sb.append("World");

        System.out.println("StringBuilder content: " + sb.toString());
    }
}
`,
  },

  // ─── 12. Character Operations ───────────────────────────────────────────────
  {
    id: 'p13-12-character-operations',
    title: '12 — Character Operations & Unicode',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Character increments and 16-bit unsigned Unicode code point values.',
    explanation: 'char ch = \'A\' increments to \'B\', displaying its Unicode integer code point (65 ➔ 66).',
    code: `public class Main {
    public static void main(String[] args) {
        char ch = 'A';
        int codePoint = (int) ch;
        System.out.println("Initial char: " + ch + " (Unicode code point: " + codePoint + ")");

        ch++; // Character increment
        System.out.println("Incremented char: " + ch + " (New code point: " + ((int) ch) + ")");
    }
}
`,
  },

  // ─── 13. Type Casting ───────────────────────────────────────────────────────
  {
    id: 'p13-13-type-casting',
    title: '13 — Type Casting (Widening & Narrowing)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing implicit widening conversion (int ➔ double) and explicit narrowing cast (double ➔ int).',
    explanation: 'Widening (int ➔ double) is lossless; narrowing ((int) 10.8 ➔ 10) truncates fractional bits.',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 10;
        double y = x; // Widening conversion (int -> double)
        System.out.println("Widened double: " + y);

        double d = 10.8;
        int casted = (int) d; // Narrowing explicit cast (double -> int)
        System.out.println("Narrowed int: " + casted);
    }
}
`,
  },

  // ─── 14. Autoboxing ─────────────────────────────────────────────────────────
  {
    id: 'p13-14-autoboxing',
    title: '14 — Autoboxing (Primitive ➔ Wrapper)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Automatic boxing of primitive int into an Integer wrapper object on the Heap.',
    explanation: 'Integer.valueOf(10) is called automatically to wrap the primitive value into a heap object.',
    code: `public class Main {
    public static void main(String[] args) {
        int primitive = 10;
        Integer boxed = primitive; // Autoboxing: int -> Integer

        System.out.println("Primitive: " + primitive);
        System.out.println("Boxed Integer: " + boxed);
    }
}
`,
  },

  // ─── 15. Auto-Unboxing ──────────────────────────────────────────────────────
  {
    id: 'p13-15-unboxing',
    title: '15 — Auto-Unboxing (Wrapper ➔ Primitive)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Automatic unboxing of Integer wrapper object into scalar primitive int.',
    explanation: 'Extracts the underlying int value from the Integer object onto the stack.',
    code: `public class Main {
    public static void main(String[] args) {
        Integer boxed = 25;
        int unboxed = boxed; // Unboxing: Integer -> int

        int result = unboxed + 5;
        System.out.println("Result after unboxing arithmetic: " + result);
    }
}
`,
  },

  // ─── 16. Bitwise AND ────────────────────────────────────────────────────────
  {
    id: 'p13-16-bitwise-and',
    title: '16 — Bitwise AND (&)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing 32-bit binary representation and bitwise AND logic.',
    explanation: '5 (0101) & 3 (0011) results in 1 (0001). Each bit position is ANDed independently.',
    code: `public class Main {
    public static void main(String[] args) {
        int a = 5; // 0101
        int b = 3; // 0011
        int result = a & b; // 0001 = 1

        System.out.println(a + " & " + b + " = " + result);
    }
}
`,
  },

  // ─── 17. Bitwise OR ─────────────────────────────────────────────────────────
  {
    id: 'p13-17-bitwise-or',
    title: '17 — Bitwise OR (|)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing 32-bit binary representation and bitwise OR logic.',
    explanation: '5 (0101) | 3 (0011) results in 7 (0111).',
    code: `public class Main {
    public static void main(String[] args) {
        int a = 5; // 0101
        int b = 3; // 0011
        int result = a | b; // 0111 = 7

        System.out.println(a + " | " + b + " = " + result);
    }
}
`,
  },

  // ─── 18. Bitwise XOR ────────────────────────────────────────────────────────
  {
    id: 'p13-18-bitwise-xor',
    title: '18 — Bitwise XOR (^)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing 32-bit binary representation and bitwise XOR logic.',
    explanation: '5 (0101) ^ 3 (0011) results in 6 (0110). Identical bits produce 0, differing bits produce 1.',
    code: `public class Main {
    public static void main(String[] args) {
        int a = 5; // 0101
        int b = 3; // 0011
        int result = a ^ b; // 0110 = 6

        System.out.println(a + " ^ " + b + " = " + result);
    }
}
`,
  },

  // ─── 19. Bit Shifts ─────────────────────────────────────────────────────────
  {
    id: 'p13-19-bit-shifts',
    title: '19 — Bit Shifts (<<, >>, >>>)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Left shift (<<), signed right shift (>>), and unsigned right shift (>>>).',
    explanation: 'Left shift multiplies by powers of 2 (4 << 1 = 8); right shift divides by powers of 2.',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 4;
        int left = x << 1; // 8
        int right = x >> 1; // 2
        int unsignedRight = -8 >>> 1;

        System.out.println("4 << 1 = " + left + ", 4 >> 1 = " + right);
    }
}
`,
  },

  // ─── 20. Bit Masks (Set, Clear, Toggle) ──────────────────────────────────────
  {
    id: 'p13-20-bit-masks',
    title: '20 — Bit Masks (Set, Clear, Toggle)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Standard bitmask idioms: set bit (x | 1<<i), clear bit (x & ~(1<<i)), toggle bit (x ^ 1<<i).',
    explanation: 'Isolates and modifies individual bit positions using binary masks.',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 5; // 0101
        int setBit = x | (1 << 1); // Set bit 1 -> 0111 = 7
        int clearBit = setBit & ~(1 << 0); // Clear bit 0 -> 0110 = 6
        int toggleBit = clearBit ^ (1 << 2); // Toggle bit 2 -> 0010 = 2

        System.out.println("Set: " + setBit + ", Clear: " + clearBit + ", Toggle: " + toggleBit);
    }
}
`,
  },

  // ─── 21. Exception Handling ─────────────────────────────────────────────────
  {
    id: 'p13-21-exception-handling',
    title: '21 — Exception Handling (try-catch)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Catching runtime ArithmeticException and continuing normal program flow.',
    explanation: 'Division by zero triggers an ArithmeticException; control immediately jumps to the catch block.',
    code: `public class Main {
    public static void main(String[] args) {
        try {
            int a = 10;
            int b = 0;
            int c = a / b;
        } catch (ArithmeticException e) {
            System.out.println("Caught ArithmeticException: Division by zero!");
        }
        System.out.println("Program resumed execution safely.");
    }
}
`,
  },

  // ─── 22. Try / Catch / Finally ──────────────────────────────────────────────
  {
    id: 'p13-22-try-catch-finally',
    title: '22 — Try / Catch / Finally Control Flow',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Guaranteed cleanup execution through the finally block.',
    explanation: 'The finally block is guaranteed to execute whether an exception was thrown, caught, or not.',
    code: `public class Main {
    public static void main(String[] args) {
        try {
            System.out.println("In try block");
            int x = 10 / 0;
        } catch (ArithmeticException e) {
            System.out.println("In catch block: Handled / by zero");
        } finally {
            System.out.println("In finally block: Guaranteed cleanup execution");
        }
    }
}
`,
  },

  // ─── 23. Explicit Throw ─────────────────────────────────────────────────────
  {
    id: 'p13-23-throw',
    title: '23 — Explicit Exception Throw',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Throwing explicit exception instances and catching them on caller stack frames.',
    explanation: 'The throw statement interrupts linear execution and starts unwinding stack frames.',
    code: `public class Main {
    static void validate(int score) {
        if (score < 0) {
            throw new IllegalArgumentException("Score cannot be negative");
        }
        System.out.println("Valid score: " + score);
    }

    public static void main(String[] args) {
        try {
            validate(-5);
        } catch (IllegalArgumentException e) {
            System.out.println("Caught thrown exception: " + e.getMessage());
        }
    }
}
`,
  },

  // ─── 24. Method Parameters ──────────────────────────────────────────────────
  {
    id: 'p13-24-method-parameters',
    title: '24 — Method Parameters (Pass-by-Value)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Distinguishing caller variables from callee method parameter bindings.',
    explanation: 'Java copies parameter values by value into the new callee call stack frame.',
    code: `public class Main {
    static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int sum = add(x, y); // x and y passed by value to add(a, b)
        System.out.println("Sum = " + sum);
    }
}
`,
  },

  // ─── 25. Return Values ──────────────────────────────────────────────────────
  {
    id: 'p13-25-return-values',
    title: '25 — Return Values & Object Creation Factory',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Returning primitive values and heap object references to caller variables.',
    explanation: 'createStudent allocates a Student on the Heap and returns its reference to the caller variable.',
    code: `class Student {
    String name;
    Student(String name) {
        this.name = name;
    }
}

public class Main {
    static Student createStudent(String name) {
        return new Student(name); // Returns reference to newly allocated Student
    }

    public static void main(String[] args) {
        Student s = createStudent("Ashrith");
        System.out.println("Received student reference: " + s.name);
    }
}
`,
  },

  // ─── 26. Static Class Variables ─────────────────────────────────────────────
  {
    id: 'p13-26-static-variables',
    title: '26 — Static Class Variables (Metaspace)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Static class variables residing in Class Metaspace shared across all instances.',
    explanation: 'Counter.globalCount belongs to the Class in Metaspace, incremented on every constructor call.',
    code: `class Counter {
    static int globalCount = 0;
    Counter() {
        globalCount++;
    }
}

public class Main {
    public static void main(String[] args) {
        Counter c1 = new Counter();
        Counter c2 = new Counter();
        System.out.println("Class Metaspace globalCount = " + Counter.globalCount);
    }
}
`,
  },

  // ─── 27. Instance Variables ─────────────────────────────────────────────────
  {
    id: 'p13-27-instance-variables',
    title: '27 — Instance Variables (Independent Heap State)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Instance variables residing within individual Heap objects.',
    explanation: 'c1 and c2 maintain completely independent field states in memory.',
    code: `class Counter {
    int count = 0;
}

public class Main {
    public static void main(String[] args) {
        Counter c1 = new Counter();
        Counter c2 = new Counter();

        c1.count = 5;
        c2.count = 10;

        System.out.println("c1.count = " + c1.count + ", c2.count = " + c2.count);
    }
}
`,
  },

  // ─── 28. Constructors ───────────────────────────────────────────────────────
  {
    id: 'p13-28-constructors',
    title: '28 — Constructors & Field Initialization',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Constructor execution allocating and initializing object fields.',
    explanation: 'new Student("Ashrith", 22) creates the heap object, invokes the constructor, and assigns fields.',
    code: `class Student {
    String name;
    int age;

    Student(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student("Ashrith", 22);
        System.out.println("Student: " + s.name + " (" + s.age + ")");
    }
}
`,
  },

  // ─── 29. The 'this' Reference ───────────────────────────────────────────────
  {
    id: 'p13-29-this-reference',
    title: "29 — The 'this' Reference",
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Disambiguating instance field references from local parameter names using this.',
    explanation: 'this.name refers to the current heap object field, while name refers to the method parameter.',
    code: `class Student {
    String name;

    void setName(String name) {
        this.name = name; // 'this.name' refers to field, 'name' refers to parameter
    }
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student();
        s.setName("Ashrith");
        System.out.println("Student name: " + s.name);
    }
}
`,
  },

  // ─── 30. Object Reachability (GC Eligibility) ───────────────────────────────
  {
    id: 'p13-30-object-reachability',
    title: '30 — Object Reachability & GC Eligibility',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Tracking reference removal and objects transitioning to ELIGIBLE FOR GARBAGE COLLECTION.',
    explanation: 'When s = null executes, the heap object loses all active reference pointers and becomes eligible for GC.',
    code: `class Student {
    String name;
    Student(String name) {
        this.name = name;
    }
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student("Temporary Student");
        System.out.println("Referenced: " + s.name);

        s = null; // Object is no longer reachable from any reference -> Eligible for GC
        System.out.println("s is now null. Previous object is eligible for garbage collection.");
    }
}
`,
  },

  // ─── 31. Section 73 Final Grand Java Demo ──────────────────────────────────
  {
    id: 'p13-31-final-java-demo',
    title: '31 — Phase 13 Final Comprehensive Java Demo',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Comprehensive Java program demonstrating variables, objects, references, null, arrays, strings, methods, recursion, bit manipulation, and exception handling.',
    explanation: 'Complete program executing all Java runtime features under the unified architecture.',
    code: `import java.util.*;

class Student {
    static int studentCount = 0;
    String name;
    int age;

    Student(String name, int age) {
        this.name = name;
        this.age = age;
        Student.studentCount++;
    }
}

public class Main {
    // Recursion
    static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        // 1. Primitive variables & Lifecycle
        int a = 10;
        int b = 20;
        int sum = a + b;

        // 2. Objects, Heap allocation & References
        Student s1 = new Student("Ashrith", 22);
        Student s2 = s1; // Aliasing
        s2.age = 23;

        // 3. Null reference & Exception Handling
        Student emptyStudent = null;
        try {
            if (emptyStudent == null) {
                System.out.println("Safe null check passed");
            }
            int invalid = 10 / 0;
        } catch (ArithmeticException e) {
            System.out.println("Handled ArithmeticException gracefully: " + e.getMessage());
        }

        // 4. Arrays
        int[] numbers = {1, 2, 3, 4, 5};

        // 5. Strings & Immutability
        String greeting = "Hello";
        greeting = greeting + " World";

        // 6. Bit manipulation
        int bitResult = (5 & 3) | (1 << 2);

        // 7. Methods & Recursion
        int fact5 = factorial(5);

        System.out.println("Student: " + s1.name + ", age=" + s1.age);
        System.out.println("Factorial 5: " + fact5 + ", Bit result: " + bitResult);
        System.out.println("Total students registered: " + Student.studentCount);
    }
}
`,
  },
];
