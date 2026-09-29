import { CodePreset } from '../types/execution';

export const PHASE_12_JAVA_PRESETS: CodePreset[] = [
  // ─── 1. Primitive Variables ────────────────────────────────────────────────
  {
    id: 'p12-01-primitive-variables',
    title: '01 — Primitive Variables',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Declares and stores Java 8 primitive types directly on the stack frame.',
    explanation: 'Primitive types (byte, short, int, long, float, double, char, boolean) store raw values directly within the method stack frame, not on the Heap.',
    code: `public class Main {
    public static void main(String[] args) {
        byte b = 10;
        short s = 100;
        int age = 20;
        long population = 8000000000L;
        float pi = 3.14f;
        double salary = 50000.5;
        char grade = 'A';
        boolean active = true;

        System.out.println("Age: " + age + ", Salary: " + salary + ", Active: " + active);
    }
}
`,
  },

  // ─── 2. Variable Reassignment ──────────────────────────────────────────────
  {
    id: 'p12-02-variable-reassignment',
    title: '02 — Variable Reassignment',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Demonstrating step-by-step variable mutation and backward time-travel restoration.',
    explanation: 'When age = 21 executes, the stack value updates from 20 to 21. Stepping backward exactly restores 20 without re-running.',
    code: `public class Main {
    public static void main(String[] args) {
        int age = 20;
        System.out.println("Initial age: " + age);

        age = 21;
        System.out.println("Updated age: " + age);

        age = age + 5;
        System.out.println("Final age: " + age);
    }
}
`,
  },

  // ─── 3. Object Creation ────────────────────────────────────────────────────
  {
    id: 'p12-03-object-creation',
    title: '03 — Object Creation (new)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Instantiating a class on the Heap with stable visual object IDs (object-1).',
    explanation: 'Executing new Student() allocates memory on the Heap, initializes fields to default values (0, null), and returns a reference stored in s on the Stack.',
    code: `class Student {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student();
        s.name = "Alex";
        s.age = 20;
        System.out.println("Student: " + s.name + " (" + s.age + ")");
    }
}
`,
  },

  // ─── 4. Object Mutation ────────────────────────────────────────────────────
  {
    id: 'p12-04-object-mutation',
    title: '04 — Object Mutation',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Mutating instance fields inside an existing Heap object without reallocating.',
    explanation: 'Updating s.age from 20 to 21 modifies the existing object on the Heap in place. The object ID remains identical.',
    code: `class Student {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student();
        s.name = "Alex";
        s.age = 20;
        System.out.println("Age before: " + s.age);

        s.age = 21;
        System.out.println("Age after: " + s.age);
    }
}
`,
  },

  // ─── 5. Reference Copy & Aliasing ──────────────────────────────────────────
  {
    id: 'p12-05-reference-copy',
    title: '05 — Reference Copy & Aliasing',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Two reference variables pointing to the exact same Heap object instance.',
    explanation: 'Student b = a copies the reference address value, not the object. Mutating b.age directly mutates the shared instance observed by a.',
    code: `class Student {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Student a = new Student();
        a.name = "Alex";
        a.age = 20;

        Student b = a; // Reference copy (Aliasing)
        b.age = 25;

        System.out.println("a.age: " + a.age); // 25
        System.out.println("b.age: " + b.age); // 25
    }
}
`,
  },

  // ─── 6. Reference Reassignment ─────────────────────────────────────────────
  {
    id: 'p12-06-reference-reassignment',
    title: '06 — Reference Reassignment',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Reassigning a reference variable to another object leaves the old object unreferenced.',
    explanation: 'When a = b executes, reference a redirects to Object B. Object A now has no active references and becomes eligible for Garbage Collection.',
    code: `class Student {
    String name;
    int age;
    Student(String n, int a) {
        this.name = n;
        this.age = a;
    }
}

public class Main {
    public static void main(String[] args) {
        Student a = new Student("Alex", 20);
        Student b = new Student("Bob", 22);

        System.out.println("Before: a=" + a.name + ", b=" + b.name);

        a = b; // Reassign reference: a now points to Object B

        System.out.println("After: a=" + a.name + ", b=" + b.name);
    }
}
`,
  },

  // ─── 7. Null Reference ─────────────────────────────────────────────────────
  {
    id: 'p12-07-null-reference',
    title: '07 — Null Reference',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'A reference variable holding null points to no location on the Heap.',
    explanation: 'In Java, null is a literal representing an unassigned or empty reference. Stack variable student points to NULL.',
    code: `class Student {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Student student = null;
        System.out.println("Reference student is: " + student);

        if (student == null) {
            System.out.println("Safe check: student is null!");
        }
    }
}
`,
  },

  // ─── 8. NullPointerException ───────────────────────────────────────────────
  {
    id: 'p12-08-null-pointer-exception',
    title: '08 — NullPointerException',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Attempting to access a field or method on a null reference triggers NullPointerException.',
    explanation: 'Java cannot dereference a null pointer. Attempting s.age when s is null triggers NullPointerException at runtime.',
    code: `class Student {
    int age = 20;
}

public class Main {
    public static void main(String[] args) {
        Student s = null;
        try {
            System.out.println("Accessing age: " + s.age);
        } catch (NullPointerException e) {
            System.out.println("Caught NullPointerException: cannot dereference null!");
        }
    }
}
`,
  },

  // ─── 9. Arrays ─────────────────────────────────────────────────────────────
  {
    id: 'p12-09-arrays',
    title: '09 — Arrays (Heap Allocation)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Arrays are objects stored on the Heap referenced by a stack variable.',
    explanation: 'In Java, arrays are true objects allocated on the Heap. The variable arr stores a reference pointing to the contiguous array object.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] numbers = {10, 20, 30, 40};
        System.out.println("Length: " + numbers.length);
        System.out.println("Element 0: " + numbers[0]);

        numbers[2] = 99;
        System.out.println("Element 2 updated: " + numbers[2]);
    }
}
`,
  },

  // ─── 10. Array Aliasing ────────────────────────────────────────────────────
  {
    id: 'p12-10-array-aliasing',
    title: '10 — Array Aliasing',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Two array reference variables pointing to the same Heap array.',
    explanation: 'int[] b = a copies the array reference. Mutating b[0] = 99 updates the shared array, so a[0] also evaluates to 99.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3};
        int[] b = a; // Array reference copy

        b[0] = 99; // Mutate through alias

        System.out.println("a[0] is: " + a[0]); // 99
        System.out.println("b[0] is: " + b[0]); // 99
    }
}
`,
  },

  // ─── 11. Strings ───────────────────────────────────────────────────────────
  {
    id: 'p12-11-strings',
    title: '11 — Strings & Immutability',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Strings in Java are immutable objects. Reassignment creates new String instances.',
    explanation: 'Executing s = s + " World" does not mutate the original "Hello" string; it creates a new "Hello World" instance and updates reference s.',
    code: `public class Main {
    public static void main(String[] args) {
        String s = "Hello";
        System.out.println("Initial: " + s);

        s = s + " World";
        System.out.println("Concatenated: " + s);
    }
}
`,
  },

  // ─── 12. String Operations ─────────────────────────────────────────────────
  {
    id: 'p12-12-string-operations',
    title: '12 — String Methods & Operations',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Common String operations: length, charAt, substring, indexOf, toUpperCase, equals.',
    explanation: 'Every String method returns a new value or primitive without mutating the source String object in memory.',
    code: `public class Main {
    public static void main(String[] args) {
        String text = "Java Runtime";
        int len = text.length();
        char firstChar = text.charAt(0);
        String sub = text.substring(0, 4);
        int idx = text.indexOf("Run");
        String upper = text.toUpperCase();
        boolean eq = text.equals("Java Runtime");

        System.out.println("Len: " + len + ", Sub: " + sub + ", Index: " + idx + ", Upper: " + upper);
    }
}
`,
  },

  // ─── 13. Method Calls & Stack Frames ───────────────────────────────────────
  {
    id: 'p12-13-method-calls',
    title: '13 — Method Calls & Call Stack',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Calling a method pushes a new stack frame; returning pops the frame and restores caller state.',
    explanation: 'Calling add(10, 20) pushes an isolated stack frame for add. When add completes, its frame is popped and the return value binds to result in main.',
    code: `public class Main {
    static int add(int a, int b) {
        int sum = a + b;
        return sum;
    }

    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int result = add(x, y);
        System.out.println("Result: " + result);
    }
}
`,
  },

  // ─── 14. Parameters: Pass-by-Value Semantics ───────────────────────────────
  {
    id: 'p12-14-parameters',
    title: '14 — Parameters & Pass-by-Value',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Java is strictly pass-by-value: primitives pass copied values; objects pass copied references.',
    explanation: 'Modifying a primitive parameter inside a method does NOT alter the caller variable. Modifying an object field alters the shared Heap instance.',
    code: `class Box {
    int value;
}

public class Main {
    static void modifyPrimitive(int x) {
        x = 99;
    }

    static void modifyObject(Box b) {
        b.value = 99;
    }

    public static void main(String[] args) {
        int num = 10;
        modifyPrimitive(num);
        System.out.println("num after (unchanged): " + num); // 10

        Box myBox = new Box();
        myBox.value = 10;
        modifyObject(myBox);
        System.out.println("box value after (mutated): " + myBox.value); // 99
    }
}
`,
  },

  // ─── 15. Return Values ─────────────────────────────────────────────────────
  {
    id: 'p12-15-return-values',
    title: '15 — Return Values',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Returning computed values from methods back to the caller frame.',
    explanation: 'A method return statement transfers the evaluated value to the caller and terminates the method frame.',
    code: `public class Main {
    static int multiply(int a, int b) {
        return a * b;
    }

    public static void main(String[] args) {
        int p = multiply(6, 7);
        System.out.println("Product: " + p);
    }
}
`,
  },

  // ─── 16. Local Block Scope ─────────────────────────────────────────────────
  {
    id: 'p12-16-scope',
    title: '16 — Local Block Scope',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Variables declared inside block scopes are not accessible outside their declaring block.',
    explanation: 'Variable y declared inside if (true) { int y = 20; } exists only while execution remains in that block scope.',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 10;
        System.out.println("Outer x: " + x);

        if (x > 5) {
            int y = 20; // Block-scoped variable
            System.out.println("Inside block: x=" + x + ", y=" + y);
        }

        // y is no longer in active scope here
        System.out.println("Back in main scope: x=" + x);
    }
}
`,
  },

  // ─── 17. Loops ─────────────────────────────────────────────────────────────
  {
    id: 'p12-17-loops',
    title: '17 — Loops & Counter Mutation',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Tracing loop execution: loop counter increments, conditions, and cumulative state.',
    explanation: 'In each iteration, the loop counter variable i increments and the condition i < 4 is evaluated.',
    code: `public class Main {
    public static void main(String[] args) {
        int sum = 0;
        for (int i = 0; i < 4; i++) {
            sum += i;
            System.out.println("i=" + i + ", sum=" + sum);
        }
        System.out.println("Final sum: " + sum);
    }
}
`,
  },

  // ─── 18. Conditions & Short-Circuit Evaluation ─────────────────────────────
  {
    id: 'p12-18-conditions',
    title: '18 — Conditions & Short-Circuiting',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Evaluating boolean expressions and logical operators with short-circuit behavior.',
    explanation: 'In false && expensive(), the false first operand prevents evaluation of the second operand (short-circuiting).',
    code: `public class Main {
    static boolean check(int n) {
        System.out.println("Called check(" + n + ")");
        return n > 0;
    }

    public static void main(String[] args) {
        int age = 20;
        if (age >= 18) {
            System.out.println("Adult condition met!");
        }

        // Short-circuit demonstration: false && check(5)
        boolean flag = false;
        if (flag && check(5)) {
            System.out.println("Won't print");
        } else {
            System.out.println("Short-circuited: check(5) was NOT executed!");
        }
    }
}
`,
  },

  // ─── 19. Static Variables ──────────────────────────────────────────────────
  {
    id: 'p12-19-static-variables',
    title: '19 — Static Class Variables',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Static variables belong to the Class in Metaspace, shared across all instances.',
    explanation: 'Counter.count is stored in the Class Metaspace. Creating c1 and c2 increments the single shared count variable.',
    code: `class Counter {
    static int count = 0;
    Counter() {
        count++;
    }
}

public class Main {
    public static void main(String[] args) {
        Counter c1 = new Counter();
        System.out.println("Count after c1: " + Counter.count);

        Counter c2 = new Counter();
        System.out.println("Count after c2: " + Counter.count);
    }
}
`,
  },

  // ─── 20. Instance Variables ────────────────────────────────────────────────
  {
    id: 'p12-20-instance-variables',
    title: '20 — Instance Variables',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Each object on the Heap maintains its own independent set of instance variables.',
    explanation: 'Object A has age = 20; Object B has age = 30. Mutating one instance has zero effect on the other.',
    code: `class Student {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Student s1 = new Student();
        s1.name = "Alex";
        s1.age = 20;

        Student s2 = new Student();
        s2.name = "Bob";
        s2.age = 30;

        System.out.println(s1.name + ": " + s1.age);
        System.out.println(s2.name + ": " + s2.age);
    }
}
`,
  },

  // ─── 21. Constructors ──────────────────────────────────────────────────────
  {
    id: 'p12-21-constructors',
    title: '21 — Constructors & Initialization',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Constructors initialize object fields at allocation time before reference assignment.',
    explanation: 'new Student("Alex", 20) calls the constructor, pushes a constructor frame, binds fields, and returns the reference.',
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
        Student s = new Student("Alex", 20);
        System.out.println("Student created: " + s.name + ", " + s.age);
    }
}
`,
  },

  // ─── 22. 'this' Keyword ────────────────────────────────────────────────────
  {
    id: 'p12-22-this-keyword',
    title: '22 — The \'this\' Reference',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Using this to disambiguate instance fields from method parameters.',
    explanation: 'this.name refers to the instance field on the Heap object; name refers to the parameter in the current stack frame.',
    code: `class Student {
    String name;
    void setName(String name) {
        this.name = name; // this.name = field, name = parameter
    }
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student();
        s.setName("Ashrith");
        System.out.println("Name set via this: " + s.name);
    }
}
`,
  },

  // ─── 23. Inheritance ───────────────────────────────────────────────────────
  {
    id: 'p12-23-inheritance',
    title: '23 — Inheritance (extends)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Subclasses inherit state and behavior from superclasses with super() constructor chaining.',
    explanation: 'Dog extends Animal. Instantiating Dog chains constructor execution to Animal first, then initializes Dog fields.',
    code: `class Animal {
    String species;
    Animal(String species) {
        this.species = species;
    }
}

class Dog extends Animal {
    String breed;
    Dog(String species, String breed) {
        super(species);
        this.breed = breed;
    }
}

public class Main {
    public static void main(String[] args) {
        Dog d = new Dog("Canine", "Golden Retriever");
        System.out.println(d.species + " - " + d.breed);
    }
}
`,
  },

  // ─── 24. Method Overriding & Polymorphism ──────────────────────────────────
  {
    id: 'p12-24-method-overriding',
    title: '24 — Method Overriding & Dynamic Dispatch',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Polymorphic reference invoking an overridden method resolved at runtime via dynamic dispatch.',
    explanation: 'Reference Animal a has declared type Animal, but actual object is Dog. Calling a.sound() executes Dog.sound() via Dynamic Method Dispatch.',
    code: `class Animal {
    void sound() {
        System.out.println("Animal makes a sound");
    }
}

class Dog extends Animal {
    void sound() {
        System.out.println("Dog barks: Woof!");
    }
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Dog(); // Polymorphic reference
        a.sound(); // Dynamically dispatches to Dog.sound()
    }
}
`,
  },

  // ─── 25. Method Overloading ────────────────────────────────────────────────
  {
    id: 'p12-25-method-overloading',
    title: '25 — Method Overloading',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Static compile-time method selection based on argument types and arity.',
    explanation: 'add(int, int) vs add(double, double) are resolved at compile time based on parameter types.',
    code: `class Calculator {
    static int add(int a, int b) {
        return a + b;
    }
    static double add(double a, double b) {
        return a + b;
    }
}

public class Main {
    public static void main(String[] args) {
        int sumInt = Calculator.add(10, 20);
        double sumDouble = Calculator.add(5.5, 4.5);
        System.out.println("Int sum: " + sumInt + ", Double sum: " + sumDouble);
    }
}
`,
  },

  // ─── 26. Interfaces ────────────────────────────────────────────────────────
  {
    id: 'p12-26-interfaces',
    title: '26 — Interfaces (implements)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Interface contract implementation and polymorphic interface references.',
    explanation: 'Car implements Drivable interface. Variable Drivable d holds a reference pointing to Car instance.',
    code: `interface Drivable {
    void drive();
}

class Car implements Drivable {
    public void drive() {
        System.out.println("Car is driving smoothly");
    }
}

public class Main {
    public static void main(String[] args) {
        Drivable d = new Car();
        d.drive();
    }
}
`,
  },

  // ─── 27. Abstract Classes ──────────────────────────────────────────────────
  {
    id: 'p12-27-abstract-classes',
    title: '27 — Abstract Classes',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Abstract class defining abstract contract methods implemented by concrete subclasses.',
    explanation: 'Shape is abstract and cannot be instantiated directly. Circle extends Shape and implements calculateArea().',
    code: `abstract class Shape {
    abstract double area();
}

class Circle extends Shape {
    double radius;
    Circle(double r) {
        this.radius = r;
    }
    double area() {
        return 3.14 * radius * radius;
    }
}

public class Main {
    public static void main(String[] args) {
        Shape s = new Circle(5.0);
        System.out.println("Circle area: " + s.area());
    }
}
`,
  },

  // ─── 28. Collections (ArrayList) ───────────────────────────────────────────
  {
    id: 'p12-28-collections',
    title: '28 — Collections (ArrayList Operations)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Visualizing standard Java Collections: add, remove, get, and live size updates.',
    explanation: 'List<Integer> list = new ArrayList<>() creates a resizable collection on the Heap. Operations add(10), add(20), and remove(0) are visualized live.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.add(30);
        System.out.println("List: " + list);

        list.remove(0);
        System.out.println("After remove(0): " + list);
    }
}
`,
  },

  // ─── 29. Generics ──────────────────────────────────────────────────────────
  {
    id: 'p12-29-generics',
    title: '29 — Generics (Type Safety)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Generic collections and parameterized types providing compile-time type safety.',
    explanation: 'Map<String, Integer> defines String keys and Integer values, preventing incorrect types at compile time.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> scores = new HashMap<>();
        scores.put("Alex", 95);
        scores.put("Bob", 88);

        System.out.println("Alex score: " + scores.get("Alex"));
        System.out.println("Scores map size: " + scores.size());
    }
}
`,
  },

  // ─── 30. Boxing (Autoboxing) ───────────────────────────────────────────────
  {
    id: 'p12-30-boxing',
    title: '30 — Autoboxing (Primitive ➔ Object)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Java compiler automatically boxing primitive int to Integer wrapper object on the Heap.',
    explanation: 'Integer x = 10 automatically transforms to Integer.valueOf(10), creating a wrapper object on the Heap.',
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

  // ─── 31. Unboxing ──────────────────────────────────────────────────────────
  {
    id: 'p12-31-unboxing',
    title: '31 — Auto-Unboxing (Object ➔ Primitive)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Extracting primitive value from Integer wrapper object automatically.',
    explanation: 'int y = boxed automatically transforms to boxed.intValue(), extracting the primitive scalar value onto the stack.',
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

  // ─── 32. Try / Catch ───────────────────────────────────────────────────────
  {
    id: 'p12-32-try-catch',
    title: '32 — Exception Handling (try-catch)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Catching runtime ArithmeticException (division by zero) and continuing normal flow.',
    explanation: 'When 10 / 0 throws ArithmeticException, normal flow halts and jumps directly to matching catch block.',
    code: `public class Main {
    public static void main(String[] args) {
        try {
            int a = 10;
            int b = 0;
            int result = a / b; // Division by zero
            System.out.println("Result: " + result);
        } catch (ArithmeticException e) {
            System.out.println("Caught ArithmeticException: Division by zero is prohibited!");
        }
        System.out.println("Program resumed safely.");
    }
}
`,
  },

  // ─── 33. Explicit Throw ────────────────────────────────────────────────────
  {
    id: 'p12-33-throw',
    title: '33 — Explicit Exception Throw',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Instantiating and throwing custom exceptions to signal error states.',
    explanation: 'The throw statement explicitly interrupts execution and starts stack unwinding until caught.',
    code: `public class Main {
    static void checkAge(int age) {
        if (age < 18) {
            throw new IllegalArgumentException("Age must be 18 or above");
        }
        System.out.println("Access granted!");
    }

    public static void main(String[] args) {
        try {
            checkAge(15);
        } catch (IllegalArgumentException e) {
            System.out.println("Caught thrown exception: " + e.getMessage());
        }
    }
}
`,
  },

  // ─── 34. Finally Block Execution ───────────────────────────────────────────
  {
    id: 'p12-34-finally',
    title: '34 — Guaranteed Cleanup (finally)',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Finally blocks are guaranteed to execute whether an exception was thrown, caught, or not.',
    explanation: 'Java guarantees finally block execution regardless of try block outcome for reliable cleanup.',
    code: `public class Main {
    public static void main(String[] args) {
        try {
            System.out.println("In try block");
            int x = 10 / 0;
        } catch (ArithmeticException e) {
            System.out.println("In catch block");
        } finally {
            System.out.println("In finally block (Guaranteed execution)");
        }
    }
}
`,
  },

  // ─── 35. Exception Propagation ─────────────────────────────────────────────
  {
    id: 'p12-35-exception-propagation',
    title: '35 — Exception Propagation Across Stack Frames',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Uncaught exceptions unwind the call stack through nested methods until caught.',
    explanation: 'main() -> methodA() -> methodB() -> throw. The JVM unwinds methodB and methodA frames back to main catch handler.',
    code: `public class Main {
    static void methodB() {
        throw new RuntimeException("Failure in methodB");
    }

    static void methodA() {
        methodB();
    }

    public static void main(String[] args) {
        try {
            methodA();
        } catch (RuntimeException e) {
            System.out.println("Caught propagated exception in main: " + e.getMessage());
        }
    }
}
`,
  },

  // ─── 36. Object Graphs (Nested References) ─────────────────────────────────
  {
    id: 'p12-36-object-graphs',
    title: '36 — Object Graph & Nested References',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Heap objects referencing other Heap objects forming directed runtime object graphs.',
    explanation: 's points to Student object; Student.address points to Address object on the Heap. The Object Graph visualizes this pointer relationship.',
    code: `class Address {
    String city;
    int zip;
    Address(String city, int zip) {
        this.city = city;
        this.zip = zip;
    }
}

class Student {
    String name;
    Address address;
    Student(String name, Address address) {
        this.name = name;
        this.address = address;
    }
}

public class Main {
    public static void main(String[] args) {
        Address addr = new Address("Bengaluru", 560001);
        Student s = new Student("Ashrith", addr);

        System.out.println(s.name + " lives in " + s.address.city);
    }
}
`,
  },

  // ─── 37. Grand Integration Demo (Section 41) ────────────────────────────────
  {
    id: 'p12-37-grand-integration-demo',
    title: '37 — Phase 12 Grand Integration Demo',
    category: 'Java Runtime & Memory Execution',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Comprehensive runtime demo combining primitives, objects, aliasing, arrays, collections, static state, exceptions, and methods.',
    explanation: 'Demonstrates the complete visual flow: Primitive ➔ Object Creation ➔ Reference ➔ Alias ➔ Mutation ➔ Collection ➔ Method Call ➔ Return.',
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
    static void printStudent(Student s) {
        if (s != null) {
            System.out.println("Student: " + s.name + ", age=" + s.age);
        }
    }

    public static void main(String[] args) {
        // 1. Primitive variable
        int age = 20;

        // 2. Object creation & Heap allocation
        Student s1 = new Student("Alex", age);

        // 3. Reference Copy & Aliasing
        Student s2 = s1;

        // 4. Object mutation through reference
        s1.age = 21;

        // 5. Array allocation
        int[] scores = {90, 95, 100};

        // 6. Generic Collection
        List<Integer> numbers = new ArrayList<>();
        numbers.add(10);
        numbers.add(20);

        // 7. Method call with object reference parameter
        printStudent(s2);

        // 8. Null handling & Exception resilience
        Student emptyStudent = null;
        try {
            if (emptyStudent == null) {
                System.out.println("Safe null verification passed!");
            }
        } catch (Exception e) {
            System.out.println("Caught exception: " + e.getMessage());
        }

        System.out.println("Total students registered: " + Student.studentCount);
        System.out.println("Scores length: " + scores.length + ", Numbers size: " + numbers.size());
    }
}
`,
  },
];
