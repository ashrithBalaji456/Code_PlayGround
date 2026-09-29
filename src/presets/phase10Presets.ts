import { CodePreset } from '../types/execution';

export const PHASE_10_JAVA_PRESETS: CodePreset[] = [
  {
    id: 'p10-01-variables',
    title: '01 — Java Variables & Primitives',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Primitive variable allocation on the JVM execution stack.',
    explanation: 'Allocates primitive variables on the current stack frame. Each variable stores its raw value directly.',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int sum = x + y;
        System.out.println("Sum: " + sum);
    }
}
`,
  },
  {
    id: 'p10-02-primitives',
    title: '02 — Primitive Data Types',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'JVM representations of int, double, boolean, and char on the stack.',
    explanation: 'Demonstrates distinct primitive byte allocations on the JVM stack frame.',
    code: `public class Main {
    public static void main(String[] args) {
        int count = 42;
        double ratio = 3.14159;
        boolean isActive = true;
        char grade = 'A';

        System.out.println("count=" + count + " ratio=" + ratio + " active=" + isActive);
    }
}
`,
  },
  {
    id: 'p10-03-references',
    title: '03 — Object References & Aliasing',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Demonstrating how references point to the same object on the Heap.',
    explanation: 'Variables a and b hold references pointing to the exact same Person instance on the heap. Mutating b.name mutates a.name!',
    code: `class Person {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Person a = new Person();
        a.name = "Ashrith";
        a.age = 22;

        Person b = a; // Reference copy (Aliasing)
        b.name = "John";

        System.out.println("a.name: " + a.name); // John
        System.out.println("b.name: " + b.name); // John
    }
}
`,
  },
  {
    id: 'p10-04-objects',
    title: '04 — Object Instantiation & Mutation',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Heap allocation with new and instance field modification.',
    explanation: 'new Student() allocates memory on the Heap. s.name and s.age modify instance fields.',
    code: `class Student {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student();
        s.name = "Ashrith";
        s.age = 22;

        s.age = 23; // Field update
        System.out.println(s.name + " is " + s.age);
    }
}
`,
  },
  {
    id: 'p10-05-constructors',
    title: '05 — Constructors & Initialization',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Object construction lifecycle: heap allocation, constructor stack frame, and initialization.',
    explanation: 'Invoking new Student("Ashrith", 22) creates a constructor stack frame where "this" points to the new heap instance.',
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
        Student s1 = new Student("Ashrith", 22);
        Student s2 = new Student("Balaji", 24);
        System.out.println(s1.name + " & " + s2.name);
    }
}
`,
  },
  {
    id: 'p10-06-this-keyword',
    title: '06 — The this Reference',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Differentiating method parameter names from instance fields using this.',
    explanation: 'this.name refers to the heap instance field, while name refers to the method parameter on the stack.',
    code: `class Car {
    String model;
    int speed;

    Car(String model, int speed) {
        this.model = model;
        this.speed = speed;
    }

    void accelerate(int speed) {
        this.speed = this.speed + speed;
    }
}

public class Main {
    public static void main(String[] args) {
        Car c = new Car("Tesla", 60);
        c.accelerate(30);
        System.out.println("Model: " + c.model + " Speed: " + c.speed);
    }
}
`,
  },
  {
    id: 'p10-07-static',
    title: '07 — Static Fields & Class Metaspace',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Class-level static variables stored in the Metaspace/Class Area vs instance heap fields.',
    explanation: 'Counter.count belongs to the Class Metaspace. Every new Counter instance increments this single shared counter.',
    code: `class Counter {
    static int count = 0;
    int id;

    Counter(int id) {
        this.id = id;
        count++;
    }
}

public class Main {
    public static void main(String[] args) {
        Counter c1 = new Counter(1);
        Counter c2 = new Counter(2);
        Counter c3 = new Counter(3);

        System.out.println("Total Counter.count = " + Counter.count);
    }
}
`,
  },
  {
    id: 'p10-08-final',
    title: '08 — The final Keyword',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Immutable constant bindings with final.',
    explanation: 'final prevents reassignment. The reference or primitive value is locked once assigned.',
    code: `public class Main {
    public static void main(String[] args) {
        final int MAX_USERS = 100;
        final String APP_NAME = "CodeFlow";

        System.out.println(APP_NAME + " Max: " + MAX_USERS);
    }
}
`,
  },
  {
    id: 'p10-09-inheritance',
    title: '09 — Class Inheritance (extends)',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Subclass extending superclass, inheriting state and behavior.',
    explanation: 'Dog inherits name and eat() from Animal, while introducing bark().',
    code: `class Animal {
    String name;

    void eat() {
        System.out.println(name + " is eating");
    }
}

class Dog extends Animal {
    void bark() {
        System.out.println(name + " barks!");
    }
}

public class Main {
    public static void main(String[] args) {
        Dog d = new Dog();
        d.name = "Buddy";
        d.eat();
        d.bark();
    }
}
`,
  },
  {
    id: 'p10-10-overriding',
    title: '10 — Method Overriding (@Override)',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Subclass providing a specific implementation of a superclass method.',
    explanation: 'Dog overrides sound() from Animal. Dynamic method dispatch resolves to Dog.sound().',
    code: `class Animal {
    void sound() {
        System.out.println("Animal sound");
    }
}

class Dog extends Animal {
    @Override
    void sound() {
        System.out.println("Woof woof!");
    }
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Dog();
        a.sound(); // Dispatches to Dog.sound()
    }
}
`,
  },
  {
    id: 'p10-11-overloading',
    title: '11 — Method Overloading',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Compile-time static polymorphism with multiple methods of same name.',
    explanation: 'The Java compiler resolves which add() overload to call based on argument types.',
    code: `class Calculator {
    int add(int a, int b) {
        return a + b;
    }

    double add(double a, double b) {
        return a + b;
    }

    int add(int a, int b, int c) {
        return a + b + c;
    }
}

public class Main {
    public static void main(String[] args) {
        Calculator calc = new Calculator();
        int r1 = calc.add(10, 20);
        double r2 = calc.add(2.5, 3.5);
        int r3 = calc.add(1, 2, 3);
        System.out.println(r1 + ", " + r2 + ", " + r3);
    }
}
`,
  },
  {
    id: 'p10-12-polymorphism',
    title: '12 — Runtime Polymorphism & Dynamic Dispatch',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Reference Type vs Actual Object Type vs Resolved Method in JVM vtable.',
    explanation: 'Declared reference is Animal, actual heap object is Dog/Cat. The JVM resolves method call at runtime.',
    code: `class Animal {
    void speak() {
        System.out.println("Generic animal sound");
    }
}

class Dog extends Animal {
    void speak() {
        System.out.println("Dog barks");
    }
}

class Cat extends Animal {
    void speak() {
        System.out.println("Cat meows");
    }
}

public class Main {
    public static void main(String[] args) {
        Animal a1 = new Dog();
        Animal a2 = new Cat();

        a1.speak(); // Dog.speak()
        a2.speak(); // Cat.speak()
    }
}
`,
  },
  {
    id: 'p10-13-abstract-classes',
    title: '13 — Abstract Classes',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Defining abstract blueprints that subclasses must implement.',
    explanation: 'Shape cannot be instantiated directly. Circle provides the concrete area() implementation.',
    code: `abstract class Shape {
    String color;

    abstract double area();
}

class Circle extends Shape {
    double radius;

    Circle(double radius) {
        this.radius = radius;
    }

    @Override
    double area() {
        return 3.14159 * radius * radius;
    }
}

public class Main {
    public static void main(String[] args) {
        Shape s = new Circle(5.0);
        double a = s.area();
        System.out.println("Circle area: " + a);
    }
}
`,
  },
  {
    id: 'p10-14-interfaces',
    title: '14 — Interfaces & Contracts',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Decoupling contract from implementation using interface.',
    explanation: 'UPI and CreditCard implement Payment. References of type Payment execute the concrete pay() method.',
    code: `interface Payment {
    void pay(int amount);
}

class UPI implements Payment {
    public void pay(int amount) {
        System.out.println("Paid " + amount + " via UPI");
    }
}

class Card implements Payment {
    public void pay(int amount) {
        System.out.println("Paid " + amount + " via Card");
    }
}

public class Main {
    public static void main(String[] args) {
        Payment p1 = new UPI();
        Payment p2 = new Card();

        p1.pay(500);
        p2.pay(1200);
    }
}
`,
  },
  {
    id: 'p10-15-super',
    title: '15 — The super Keyword',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Accessing superclass constructors and overridden methods.',
    explanation: 'super(name) calls the Animal constructor, and super.sound() invokes the superclass implementation.',
    code: `class Animal {
    String name;

    Animal(String name) {
        this.name = name;
    }

    void sound() {
        System.out.println("Base sound for " + name);
    }
}

class Dog extends Animal {
    Dog(String name) {
        super(name);
    }

    @Override
    void sound() {
        super.sound();
        System.out.println("Dog addition: Woof!");
    }
}

public class Main {
    public static void main(String[] args) {
        Dog d = new Dog("Max");
        d.sound();
    }
}
`,
  },
  {
    id: 'p10-16-null',
    title: '16 — Null References',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing null references on the stack without a heap object.',
    explanation: 'Person p = null assigns the variable on the stack with a null pointer, pointing to no heap object.',
    code: `class Person {
    String name;
}

public class Main {
    public static void main(String[] args) {
        Person p = null;
        if (p == null) {
            System.out.println("p is currently null");
        }

        p = new Person();
        p.name = "Ashrith";
        System.out.println("p is now initialized: " + p.name);
    }
}
`,
  },
  {
    id: 'p10-17-npe',
    title: '17 — NullPointerException Visualization',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Observing null dereference and NullPointerException stack trace.',
    explanation: 'Attempting to access p.name when p is null triggers a NullPointerException.',
    code: `class Person {
    String name;
}

public class Main {
    public static void main(String[] args) {
        Person p = null;
        try {
            System.out.println(p.name);
        } catch (NullPointerException e) {
            System.out.println("Caught NullPointerException safely!");
        }
    }
}
`,
  },
  {
    id: 'p10-18-exceptions',
    title: '18 — Exception Handling (try-catch-finally)',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'JVM try block monitoring, catch handler matching, and guaranteed finally execution.',
    explanation: 'ArithmeticException is thrown during division by zero, caught by catch, and finally always executes.',
    code: `public class Main {
    public static void main(String[] args) {
        try {
            int a = 10;
            int b = 0;
            int res = a / b;
            System.out.println("Result: " + res);
        } catch (ArithmeticException e) {
            System.out.println("Handled division by zero");
        } finally {
            System.out.println("finally block executed guaranteed");
        }
    }
}
`,
  },
  {
    id: 'p10-19-throw',
    title: '19 — Explicit throw',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Explicitly throwing an exception object on the heap.',
    explanation: 'throw new IllegalArgumentException creates an exception object and starts JVM stack unwinding.',
    code: `public class Main {
    static void checkAge(int age) {
        if (age < 18) {
            throw new IllegalArgumentException("Age must be >= 18");
        }
    }

    public static void main(String[] args) {
        try {
            checkAge(15);
        } catch (IllegalArgumentException e) {
            System.out.println("Caught: " + e.getMessage());
        }
    }
}
`,
  },
  {
    id: 'p10-20-stack-unwinding',
    title: '20 — Stack Unwinding Across Frames',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Observing stack frames pop during an uncaught exception until a matching handler is found.',
    explanation: 'methodC() throws an exception. Since methodB() and methodC() have no catch, frames unwind back to main().',
    code: `public class Main {
    static void methodC() {
        throw new RuntimeException("Error in methodC");
    }

    static void methodB() {
        methodC();
    }

    static void methodA() {
        methodB();
    }

    public static void main(String[] args) {
        try {
            methodA();
        } catch (RuntimeException e) {
            System.out.println("Caught in main: " + e.getMessage());
        }
    }
}
`,
  },
  {
    id: 'p10-21-finally',
    title: '21 — Guaranteed finally Execution',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Showing that finally executes even with return statements.',
    explanation: 'The finally block executes before the method frame is popped, even when a return statement is reached.',
    code: `public class Main {
    static int compute() {
        try {
            return 100;
        } finally {
            System.out.println("finally executed before method return!");
        }
    }

    public static void main(String[] args) {
        int val = compute();
        System.out.println("Returned value: " + val);
    }
}
`,
  },
  {
    id: 'p10-22-arraylist',
    title: '22 — ArrayList Operations',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Dynamic array resizing, add, remove, and get operations.',
    explanation: 'ArrayList encapsulates a resizable heap array, automatically expanding as elements are appended.',
    code: `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> fruits = new ArrayList<>();
        fruits.add("Apple");
        fruits.add("Banana");
        fruits.add("Cherry");

        fruits.remove("Banana");
        System.out.println("Size: " + fruits.size());
        System.out.println("First: " + fruits.get(0));
    }
}
`,
  },
  {
    id: 'p10-23-linkedlist',
    title: '23 — LinkedList Nodes & Pointers',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Node object allocation and pointer links on the heap.',
    explanation: 'LinkedList allocates individual Node objects on the heap, maintaining head, tail, and next/prev references.',
    code: `import java.util.LinkedList;

public class Main {
    public static void main(String[] args) {
        LinkedList<Integer> list = new LinkedList<>();
        list.add(10);
        list.add(20);
        list.add(30);

        list.addFirst(5);
        System.out.println("Head: " + list.getFirst() + " Tail: " + list.getLast());
    }
}
`,
  },
  {
    id: 'p10-24-hashmap',
    title: '24 — HashMap & Bucket Hashing',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Key hashing, bucket indexing, and Entry object storage.',
    explanation: 'Keys are hashed via hashCode() to locate the bucket array index. Key-value pairs form Map.Entry heap nodes.',
    code: `import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        HashMap<String, Integer> scores = new HashMap<>();
        scores.put("Alice", 95);
        scores.put("Bob", 88);
        scores.put("Charlie", 92);

        System.out.println("Alice's score: " + scores.get("Alice"));
    }
}
`,
  },
  {
    id: 'p10-25-hashset',
    title: '25 — HashSet Uniqueness',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Set uniqueness enforced via underlying hash map semantics.',
    explanation: 'Duplicate additions are rejected because their hash and equality match an existing bucket entry.',
    code: `import java.util.HashSet;

public class Main {
    public static void main(String[] args) {
        HashSet<String> tags = new HashSet<>();
        tags.add("java");
        tags.add("jvm");
        tags.add("java"); // Duplicate rejected

        System.out.println("Unique tags count: " + tags.size());
    }
}
`,
  },
  {
    id: 'p10-26-equals-hashcode',
    title: '26 — equals() and hashCode() Contract',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'How custom equals and hashCode affect hash collections.',
    explanation: 'Two distinct Person objects with the same id produce identical hashCodes and test equal, preventing duplicate keys.',
    code: `import java.util.Objects;
import java.util.HashSet;

class Person {
    int id;
    String name;

    Person(int id, String name) {
        this.id = id;
        this.name = name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Person)) return false;
        Person person = (Person) o;
        return id == person.id;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

public class Main {
    public static void main(String[] args) {
        HashSet<Person> set = new HashSet<>();
        Person p1 = new Person(101, "Ashrith");
        Person p2 = new Person(101, "Ashrith Copy");

        set.add(p1);
        set.add(p2); // Duplicate by equals/hashCode

        System.out.println("Set count (should be 1): " + set.size());
    }
}
`,
  },
  {
    id: 'p10-27-generics',
    title: '27 — Java Generics & Type Safety',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Compile-time type parameter constraints and runtime type erasure.',
    explanation: 'Generics enforce compile-time type safety. At runtime, the JVM erases generic parameters to Object.',
    code: `import java.util.ArrayList;

class Box<T> {
    T content;

    void set(T content) {
        this.content = content;
    }

    T get() {
        return this.content;
    }
}

public class Main {
    public static void main(String[] args) {
        Box<String> strBox = new Box<>();
        strBox.set("CodeFlow DSA");

        Box<Integer> intBox = new Box<>();
        intBox.set(2026);

        System.out.println(strBox.get() + " in " + intBox.get());
    }
}
`,
  },
  {
    id: 'p10-28-boxing',
    title: '28 — Autoboxing (Primitive ➔ Wrapper)',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Automatic boxing of primitive int into Integer object on the heap.',
    explanation: 'Integer num = 42 invokes Integer.valueOf(42), converting a primitive stack value into a heap wrapper object.',
    code: `public class Main {
    public static void main(String[] args) {
        int primitive = 100;
        Integer boxed = primitive; // Autoboxing

        System.out.println("Boxed Integer: " + boxed);
    }
}
`,
  },
  {
    id: 'p10-29-unboxing',
    title: '29 — Unboxing (Wrapper ➔ Primitive)',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Automatic extraction of primitive value from wrapper object.',
    explanation: 'int val = boxed invokes boxed.intValue(), transferring heap object value back to primitive stack register.',
    code: `public class Main {
    public static void main(String[] args) {
        Integer boxed = Integer.valueOf(250);
        int unboxed = boxed; // Unboxing

        int result = unboxed * 2;
        System.out.println("Unboxed result: " + result);
    }
}
`,
  },
  {
    id: 'p10-30-strings',
    title: '30 — String Immutability',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'String immutability and concatenation creating new String objects.',
    explanation: 'Strings in Java are immutable. s = s + " World" does not mutate "Hello", it allocates a new String instance on the heap.',
    code: `public class Main {
    public static void main(String[] args) {
        String a = "Hello";
        String b = a;

        a = a + " World"; // Creates new String

        System.out.println("a = " + a); // Hello World
        System.out.println("b = " + b); // Hello
    }
}
`,
  },
  {
    id: 'p10-31-lambdas',
    title: '31 — Lambda Expressions',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Functional interface implementation with lambda syntax.',
    explanation: 'Lambdas provide concise functional implementations bound to functional interface types.',
    code: `interface Operation {
    int apply(int a, int b);
}

public class Main {
    public static void main(String[] args) {
        Operation add = (x, y) -> x + y;
        Operation multiply = (x, y) -> x * y;

        System.out.println("Add: " + add.apply(10, 20));
        System.out.println("Multiply: " + multiply.apply(5, 6));
    }
}
`,
  },
  {
    id: 'p10-32-functional-interfaces',
    title: '32 — Standard Functional Interfaces',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Predicate, Function, and Consumer execution in Java.',
    explanation: 'Demonstrates java.util.function interfaces evaluating input and producing outputs.',
    code: `import java.util.function.Predicate;
import java.util.function.Function;

public class Main {
    public static void main(String[] args) {
        Predicate<Integer> isPositive = n -> n > 0;
        Function<String, Integer> lengthFunc = s -> s.length();

        System.out.println("Is 15 positive: " + isPositive.test(15));
        System.out.println("Length of CodeFlow: " + lengthFunc.apply("CodeFlow"));
    }
}
`,
  },
  {
    id: 'p10-33-streams',
    title: '33 — Java Streams Pipeline',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Stream filter, map, and collect transformation pipeline.',
    explanation: 'Visualizes data flowing through stream stages: [1,2,3,4,5] ➔ filter (even) ➔ [2,4] ➔ map (x*2) ➔ [4,8].',
    code: `import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5);

        List<Integer> result = numbers.stream()
                .filter(x -> x % 2 == 0)
                .map(x -> x * 2)
                .toList();

        System.out.println("Transformed: " + result);
    }
}
`,
  },
  {
    id: 'p10-34-optional',
    title: '34 — Optional Type',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Avoiding NullPointerException with java.util.Optional container.',
    explanation: 'Optional represents the presence or absence of a value without risking null dereference.',
    code: `import java.util.Optional;

public class Main {
    public static void main(String[] args) {
        Optional<String> present = Optional.of("Hello");
        Optional<String> empty = Optional.empty();

        System.out.println("present: " + present.orElse("Default"));
        System.out.println("empty: " + empty.orElse("Fallback"));
    }
}
`,
  },
  {
    id: 'p10-35-enums',
    title: '35 — Java Enums',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Type-safe enumerated constants in Java.',
    explanation: 'Enums are specialized classes with fixed static singleton instances in Metaspace.',
    code: `enum Day {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY
}

public class Main {
    public static void main(String[] args) {
        Day today = Day.WEDNESDAY;
        System.out.println("Today is: " + today);
        System.out.println("Ordinal: " + today.ordinal());
    }
}
`,
  },
  {
    id: 'p10-36-records',
    title: '36 — Java Records (Immutable Data Carriers)',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Concise immutable record classes with automatic getters, equals, and hashCode.',
    explanation: 'record Person(String name, int age) provides an immutable data container with built-in component fields.',
    code: `record Person(String name, int age) {}

public class Main {
    public static void main(String[] args) {
        Person p1 = new Person("Ashrith", 22);
        Person p2 = new Person("Balaji", 24);

        System.out.println("Name: " + p1.name() + " Age: " + p1.age());
    }
}
`,
  },
  {
    id: 'p10-37-threads',
    title: '37 — Multithreading (Thread & start)',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Creating an independent JVM execution thread with its own call stack.',
    explanation: 'thread.start() spawns a new thread with an independent call stack executing concurrently with main.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread worker = new Thread(() -> {
            System.out.println("Worker thread executing on independent stack!");
        });

        worker.start();
        System.out.println("Main thread continues execution.");
    }
}
`,
  },
  {
    id: 'p10-38-runnable',
    title: '38 — The Runnable Interface',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Separating the task definition (Runnable) from the thread of execution.',
    explanation: 'Runnable defines the unit of work to be executed on a separate thread.',
    code: `class Task implements Runnable {
    public void run() {
        System.out.println("Task running via Runnable");
    }
}

public class Main {
    public static void main(String[] args) {
        Runnable task = new Task();
        Thread thread = new Thread(task);
        thread.start();
    }
}
`,
  },
  {
    id: 'p10-39-sleep',
    title: '39 — Thread.sleep (TIMED_WAITING)',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Thread state transition from RUNNING to TIMED_WAITING.',
    explanation: 'Thread.sleep transitions thread state into TIMED_WAITING without relinquishing acquired locks.',
    code: `public class Main {
    public static void main(String[] args) throws InterruptedException {
        System.out.println("Before sleep");
        Thread.sleep(50);
        System.out.println("After sleep");
    }
}
`,
  },
  {
    id: 'p10-40-join',
    title: '40 — thread.join (Thread Synchronization)',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Main thread waiting for worker thread completion.',
    explanation: 't.join() halts the calling thread until the target thread finishes execution and terminates.',
    code: `public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> {
            System.out.println("Worker performing computation...");
        });

        worker.start();
        worker.join(); // Main pauses until worker completes
        System.out.println("Main resumes after worker joined!");
    }
}
`,
  },
  {
    id: 'p10-41-synchronized',
    title: '41 — Synchronized Block & Intrinsic Monitor Lock',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Acquiring and releasing an intrinsic monitor lock to protect critical sections.',
    explanation: 'synchronized(lock) guarantees mutual exclusion: only one thread enters the critical section at a time.',
    code: `public class Main {
    private static int counter = 0;
    private static final Object lock = new Object();

    public static void main(String[] args) {
        synchronized(lock) {
            counter++;
            System.out.println("Counter inside synchronized: " + counter);
        }
    }
}
`,
  },
  {
    id: 'p10-42-locks',
    title: '42 — Lock Contention & Waiting',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Thread state BLOCKED when attempting to acquire a lock held by another thread.',
    explanation: 'When Thread A holds the monitor lock, Thread B transitions to BLOCKED state until Thread A releases it.',
    code: `public class Main {
    static final Object lock = new Object();

    public static void main(String[] args) {
        synchronized(lock) {
            System.out.println("Thread main owns the lock");
        }
    }
}
`,
  },
  {
    id: 'p10-43-race-condition',
    title: '43 — Race Condition Education',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Shared mutable state without synchronization leading to race conditions.',
    explanation: 'Demonstrates interleaving reads and writes across multiple threads accessing a shared counter.',
    code: `public class Main {
    static int counter = 0;

    public static void main(String[] args) {
        // Shared counter accessed without synchronization
        counter++;
        counter++;
        System.out.println("Final counter: " + counter);
    }
}
`,
  },
  {
    id: 'p10-44-deadlock',
    title: '44 — Deadlock Visualization',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Circular lock dependency between two threads.',
    explanation: 'Thread A holds Lock 1 and waits for Lock 2, while Thread B holds Lock 2 and waits for Lock 1.',
    code: `public class Main {
    static final Object lock1 = new Object();
    static final Object lock2 = new Object();

    public static void main(String[] args) {
        // Conceptual Deadlock demonstration
        synchronized(lock1) {
            System.out.println("Thread 1 acquired lock1");
            synchronized(lock2) {
                System.out.println("Thread 1 acquired lock2");
            }
        }
    }
}
`,
  },
  {
    id: 'p10-45-lifecycle',
    title: '45 — Object Lifecycle & GC Eligibility',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Object states: CREATED ➔ REFERENCED ➔ MUTATED ➔ GC_ELIGIBLE.',
    explanation: 'When reference p is set to null, Person#1 has 0 remaining references and becomes "Eligible for GC".',
    code: `class Person {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Person p = new Person(); // CREATED
        p.name = "Ashrith";      // MUTATED
        p.age = 22;

        p = null; // Reference severed ➔ Person#1 is now ELIGIBLE FOR GC!
        System.out.println("Reference severed, object eligible for GC");
    }
}
`,
  },
  {
    id: 'p10-88-final-demo',
    title: '88 — Final Comprehensive Java & JVM Demo',
    category: 'Java OOP & JVM Internals',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Grand unified demonstration: Class, Object, Constructor, Reference, Inheritance, Polymorphism, ArrayList, HashMap, Exception, Recursion, Thread, and Synchronized.',
    explanation: 'Executes a comprehensive real Java program testing every layer of JVM execution and DSA state.',
    code: `import java.util.ArrayList;
import java.util.HashMap;

// 1. Inheritance & Polymorphism
abstract class Entity {
    String id;
    Entity(String id) { this.id = id; }
    abstract void process();
}

class User extends Entity {
    String name;
    int score;

    User(String id, String name, int score) {
        super(id);
        this.name = name;
        this.score = score;
    }

    @Override
    void process() {
        this.score += 10;
        System.out.println("User " + name + " processed, new score: " + score);
    }
}

public class Main {
    static int sharedCounter = 0;
    static final Object lock = new Object();

    // 2. Recursion
    static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        // 3. Object Creation, Constructor & Reference Aliasing
        User u1 = new User("u101", "Ashrith", 90);
        User u2 = u1; // Reference copy
        u2.score = 95; // Mutates heap object through alias

        // 4. Polymorphic Call
        Entity e = u1;
        e.process(); // Dispatches dynamically to User.process()

        // 5. Collections (ArrayList & HashMap)
        ArrayList<String> log = new ArrayList<>();
        log.add("Initialized");
        log.add("Processed");

        HashMap<String, Integer> map = new HashMap<>();
        map.put("Ashrith", u1.score);

        // 6. Recursion Execution
        int fact5 = factorial(5);
        System.out.println("Factorial 5 = " + fact5);

        // 7. Synchronization & Thread
        synchronized(lock) {
            sharedCounter++;
        }

        // 8. Exception Handling
        try {
            int div = 10 / 0;
        } catch (ArithmeticException ex) {
            System.out.println("Handled division exception safely: " + ex.getMessage());
        } finally {
            System.out.println("Demo completed successfully!");
        }
    }
}
`,
  },
];
