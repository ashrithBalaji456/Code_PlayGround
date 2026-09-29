import { CodePreset } from '../types/execution';

export const PHASE_11_JAVA_PRESETS: CodePreset[] = [
  // ─── 1. Classes ─────────────────────────────────────────────────────────────
  {
    id: 'p11-01-simple-class',
    title: '01 — Simple Class & Object',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Declaring a class blueprint, creating an object instance with new, and accessing fields.',
    explanation: 'A class is a blueprint; no object exists in the heap until `new Student()` executes. The reference variable `s` on the stack connects to the newly allocated Student object in the heap.',
    code: `class Student {
    int age;
    String name;
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student();
        s.age = 20;
        s.name = "Ashrith";
        System.out.println("Student: " + s.name + ", age=" + s.age);
    }
}
`,
  },
  {
    id: 'p11-02-multiple-objects',
    title: '02 — Multiple Independent Objects',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Creating multiple object instances from the same class blueprint with independent fields.',
    explanation: 'Each `new Student()` call allocates a distinct object in heap memory with unique identity (object-1, object-2). Mutating s1 does not affect s2.',
    code: `class Student {
    int age;
    String name;
}

public class Main {
    public static void main(String[] args) {
        Student s1 = new Student();
        s1.age = 20;
        s1.name = "Alice";

        Student s2 = new Student();
        s2.age = 22;
        s2.name = "Bob";

        System.out.println(s1.name + ": " + s1.age);
        System.out.println(s2.name + ": " + s2.age);
    }
}
`,
  },
  {
    id: 'p11-03-instance-variables',
    title: '03 — Instance Variables',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Examining per-instance fields and default values allocated inside heap objects.',
    explanation: 'Instance variables belong to the individual object instance on the heap. Default values (0, null, false) are initialized at allocation before any explicit assignment.',
    code: `class Car {
    String model;
    int speed;
    boolean isRunning;
}

public class Main {
    public static void main(String[] args) {
        Car car1 = new Car();
        car1.model = "Sedan";
        car1.speed = 60;
        car1.isRunning = true;

        Car car2 = new Car();
        car2.model = "SUV";
        car2.speed = 0;
        car2.isRunning = false;

        System.out.println(car1.model + " speed: " + car1.speed);
        System.out.println(car2.model + " speed: " + car2.speed);
    }
}
`,
  },
  {
    id: 'p11-04-instance-methods',
    title: '04 — Instance Methods & this Access',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Executing instance methods where `this` binds to the target object receiver on the heap.',
    explanation: 'Calling `c.increment()` pushes a stack frame with an implicit `this` reference pointing to `c` on the heap, allowing the method to read and write instance state.',
    code: `class Counter {
    int count = 0;

    void increment() {
        count++;
    }

    void add(int value) {
        count += value;
    }
}

public class Main {
    public static void main(String[] args) {
        Counter c = new Counter();
        c.increment();
        c.increment();
        c.add(5);
        System.out.println("Final count: " + c.count);
    }
}
`,
  },

  // ─── 2. Constructors ────────────────────────────────────────────────────────
  {
    id: 'p11-05-default-constructor',
    title: '05 — Default Constructor',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Object initialization via zero-argument constructor.',
    explanation: 'When `new Book()` is invoked, the default constructor initializes instance fields before the reference is returned to the stack variable.',
    code: `class Book {
    String title;
    int pages;

    Book() {
        title = "Java Fundamentals";
        pages = 100;
    }
}

public class Main {
    public static void main(String[] args) {
        Book b = new Book();
        System.out.println(b.title + " has " + b.pages + " pages");
    }
}
`,
  },
  {
    id: 'p11-06-parameterized-constructor',
    title: '06 — Parameterized Constructor & this',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Passing arguments to constructors and disambiguating parameters with `this.field = param`.',
    explanation: 'Constructor parameters exist on the constructor stack frame. The `this` keyword distinguishes the heap object fields (`this.age`) from incoming parameters (`age`).',
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
        Student s = new Student("Ashrith", 20);
        System.out.println("Student: " + s.name + " (" + s.age + ")");
    }
}
`,
  },
  {
    id: 'p11-07-constructor-chaining',
    title: '07 — Constructor Chaining with this()',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Chaining constructors using `this(...)` to reuse initialization logic.',
    explanation: '`this(owner, 100.0)` delegates from the one-arg constructor to the two-arg constructor, demonstrating constructor call ordering.',
    code: `class Account {
    String owner;
    double balance;

    Account(String owner) {
        this(owner, 100.0);
    }

    Account(String owner, double balance) {
        this.owner = owner;
        this.balance = balance;
    }
}

public class Main {
    public static void main(String[] args) {
        Account a = new Account("Ashrith");
        System.out.println(a.owner + " balance: " + a.balance);
    }
}
`,
  },

  // ─── 3. References ──────────────────────────────────────────────────────────
  {
    id: 'p11-08-reference-assignment',
    title: '08 — Reference Assignment & Aliasing',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Copying reference pointers so multiple variables address the exact same heap instance.',
    explanation: '`Node n2 = n1` copies the reference value, not the object. Both n1 and n2 now point to the identical heap instance. Modifying n2.value is directly observed via n1.value.',
    code: `class Node {
    int value;
}

public class Main {
    public static void main(String[] args) {
        Node n1 = new Node();
        n1.value = 10;

        Node n2 = n1;
        n2.value = 20;

        System.out.println("n1 value: " + n1.value);
        System.out.println("n2 value: " + n2.value);
    }
}
`,
  },
  {
    id: 'p11-09-shared-object',
    title: '09 — Shared Object Observation',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Demonstrating that two references to the same object see live field modifications.',
    explanation: 's1 and s2 are two independent references on the stack targeting the same heap object. When s1 updates `age` to 25, s2 observes 25.',
    code: `class Student {
    int age;
}

public class Main {
    public static void main(String[] args) {
        Student s1 = new Student();
        s1.age = 20;

        Student s2 = s1;
        s1.age = 25;

        System.out.println("s1.age = " + s1.age);
        System.out.println("s2.age = " + s2.age);
    }
}
`,
  },
  {
    id: 'p11-10-null-reference',
    title: '10 — Null Reference & GC Eligibility',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Tracking null references, object allocation, and transition to garbage collection eligibility.',
    explanation: 'A variable with value `null` points to no heap object. When s is reassigned to null, the previously created Student object loses all incoming references and becomes eligible for Garbage Collection.',
    code: `class Student {
    int age = 18;
}

public class Main {
    public static void main(String[] args) {
        Student s = null;
        System.out.println("s is null");

        s = new Student();
        System.out.println("s is now created with age: " + s.age);

        s = null;
        System.out.println("s is null again; object is now eligible for GC");
    }
}
`,
  },

  // ─── 4. OOP ─────────────────────────────────────────────────────────────────
  {
    id: 'p11-11-inheritance',
    title: '11 — Class Inheritance & Extends',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Inheriting parent state and methods via the `extends` keyword.',
    explanation: '`Dog extends Animal` inherits fields (`name`) and methods (`eat()`). The Dog object in heap memory encapsulates both inherited parent fields and child-specific fields.',
    code: `class Animal {
    String name;

    void eat() {
        System.out.println(name + " is eating");
    }
}

class Dog extends Animal {
    String breed;

    void bark() {
        System.out.println(name + " barks");
    }
}

public class Main {
    public static void main(String[] args) {
        Dog d = new Dog();
        d.name = "Buddy";
        d.breed = "Golden Retriever";
        d.eat();
        d.bark();
    }
}
`,
  },
  {
    id: 'p11-12-method-overloading',
    title: '12 — Method Overloading',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Static polymorphism resolving method calls by parameter signature at compile-time.',
    explanation: 'The JVM matches method signatures `add(int, int)`, `add(double, double)`, and `add(int, int, int)` based on argument counts and types.',
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
        int sum2 = calc.add(10, 20);
        double sumDouble = calc.add(2.5, 3.5);
        int sum3 = calc.add(1, 2, 3);
        System.out.println("Sums: " + sum2 + ", " + sumDouble + ", " + sum3);
    }
}
`,
  },
  {
    id: 'p11-13-method-overriding',
    title: '13 — Method Overriding',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Dynamic method dispatch invoking the subclass implementation at runtime.',
    explanation: 'The reference type is `Animal`, but the actual runtime object is `Dog`. Dynamic dispatch executes `Dog.sound()` rather than `Animal.sound()`.',
    code: `class Animal {
    void sound() {
        System.out.println("Animal makes a sound");
    }
}

class Dog extends Animal {
    @Override
    void sound() {
        System.out.println("Dog barks");
    }
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Dog();
        a.sound();
    }
}
`,
  },
  {
    id: 'p11-14-polymorphism',
    title: '14 — Polymorphism in Action',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Using common superclass references to invoke specialized subclass behaviors.',
    explanation: 'Both Circle and Square are treated as Shape references, yet each invokes its own overridden `draw()` method according to its actual heap type.',
    code: `class Shape {
    void draw() {
        System.out.println("Drawing generic shape");
    }
}

class Circle extends Shape {
    @Override
    void draw() {
        System.out.println("Drawing circle");
    }
}

class Square extends Shape {
    @Override
    void draw() {
        System.out.println("Drawing square");
    }
}

public class Main {
    public static void main(String[] args) {
        Shape s1 = new Circle();
        Shape s2 = new Square();
        s1.draw();
        s2.draw();
    }
}
`,
  },
  {
    id: 'p11-15-abstract-class',
    title: '15 — Abstract Class & Hierarchy',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Abstract classes defining contracts and concrete subclasses fulfilling them.',
    explanation: 'An abstract class cannot be directly instantiated (`new Vehicle()` is prohibited). Concrete subclass `Car` implements the abstract `drive()` method.',
    code: `abstract class Vehicle {
    String brand;

    abstract void drive();

    void stop() {
        System.out.println("Vehicle stopped");
    }
}

class Car extends Vehicle {
    @Override
    void drive() {
        System.out.println("Car driving on 4 wheels");
    }
}

public class Main {
    public static void main(String[] args) {
        Vehicle v = new Car();
        v.brand = "Toyota";
        v.drive();
        v.stop();
    }
}
`,
  },
  {
    id: 'p11-16-interface',
    title: '16 — Interface & Implementation',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Contract definition with interfaces and implementation in classes.',
    explanation: '`Bird implements Flyable` satisfies the interface contract. The reference variable `f` has interface type `Flyable` and targets a Bird heap instance.',
    code: `interface Flyable {
    void fly();
}

class Bird implements Flyable {
    @Override
    public void fly() {
        System.out.println("Bird flies in the sky");
    }
}

public class Main {
    public static void main(String[] args) {
        Flyable f = new Bird();
        f.fly();
    }
}
`,
  },
  {
    id: 'p11-17-encapsulation',
    title: '17 — Encapsulation & Access Boundary',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Protecting object internal state with private fields and public getters/setters.',
    explanation: 'Private fields `age` and `name` are shielded from direct outside mutation. Access occurs only through verified setter and getter methods.',
    code: `class Student {
    private int age;
    private String name;

    public void setAge(int age) {
        if (age > 0) {
            this.age = age;
        }
    }

    public int getAge() {
        return this.age;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return this.name;
    }
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student();
        s.setName("Ashrith");
        s.setAge(21);
        System.out.println(s.getName() + " is " + s.getAge() + " years old");
    }
}
`,
  },

  // ─── 5. Java Memory ─────────────────────────────────────────────────────────
  {
    id: 'p11-18-primitive-variables',
    title: '18 — Primitive Variables on Stack',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing primitive allocations (int, double, boolean, char) stored directly inside the stack frame.',
    explanation: 'Primitive variables hold their raw binary values directly on the stack frame rather than referencing an object on the heap.',
    code: `public class Main {
    public static void main(String[] args) {
        int age = 20;
        double salary = 50000.50;
        boolean active = true;
        char grade = 'A';

        age = 25;
        salary = 60000.75;
        active = false;
        grade = 'S';

        System.out.println("age=" + age + " salary=" + salary);
    }
}
`,
  },
  {
    id: 'p11-19-object-references',
    title: '19 — Object References & Heap Model',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Differentiating stack references from heap object data.',
    explanation: 'p1 and p2 reside on the call stack, holding reference addresses to a Point object residing in heap memory.',
    code: `class Point {
    int x;
    int y;
}

public class Main {
    public static void main(String[] args) {
        Point p1 = new Point();
        p1.x = 10;
        p1.y = 20;

        Point p2 = p1;
        p2.x = 99;

        System.out.println("p1.x = " + p1.x);
        System.out.println("p2.x = " + p2.x);
    }
}
`,
  },
  {
    id: 'p11-20-object-reachability',
    title: '20 — Object Reachability & GC Lifecycle',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Tracing how losing all references transitions heap objects to GC eligibility.',
    explanation: 'When d1 and d2 are set to null, their corresponding heap objects no longer have any active incoming reference pointers and become eligible for Garbage Collection.',
    code: `class Data {
    int id;
}

public class Main {
    public static void main(String[] args) {
        Data d1 = new Data();
        d1.id = 1;

        Data d2 = new Data();
        d2.id = 2;

        d1 = null; // d1 object now eligible for GC
        d2 = null; // d2 object now eligible for GC

        System.out.println("Both objects eligible for GC");
    }
}
`,
  },
  {
    id: 'p11-21-pass-by-value',
    title: '21 — Pass by Value (Primitives)',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Proving that Java passes primitive values by copying bits, leaving caller variables unchanged.',
    explanation: 'The argument `a` is copied into parameter `x` on `change()` stack frame. Reassigning `x = 100` modifies only the local frame; `a` in `main()` remains 10.',
    code: `public class Main {
    static void change(int x) {
        x = 100;
        System.out.println("Inside change: x = " + x);
    }

    public static void main(String[] args) {
        int a = 10;
        change(a);
        System.out.println("In main: a = " + a);
    }
}
`,
  },
  {
    id: 'p11-22-reference-value-passing',
    title: '22 — Reference Value Passing',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Understanding that references are passed by value: fields can be mutated, but caller reference is not reassigned.',
    explanation: 'Java passes the reference pointer by value. Method `modifyField(s)` follows the reference to mutate `s.age`. However, `reassignReference(s)` reassigns only the local parameter `s`, leaving caller `student` pointing to the original object.',
    code: `class Student {
    int age;
}

public class Main {
    static void modifyField(Student s) {
        s.age = 100;
    }

    static void reassignReference(Student s) {
        s = new Student();
        s.age = 500;
    }

    public static void main(String[] args) {
        Student student = new Student();
        student.age = 20;

        modifyField(student);
        System.out.println("After modifyField: " + student.age);

        reassignReference(student);
        System.out.println("After reassignReference: " + student.age);
    }
}
`,
  },

  // ─── 6. Strings ─────────────────────────────────────────────────────────────
  {
    id: 'p11-23-string-pool',
    title: '23 — String Pool & == vs equals()',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Comparing String constant pool interning against explicit new String() heap objects.',
    explanation: 'Literals `a` and `b` share the same interned String in the String Pool (`a == b` is true). `new String("hello")` forces a distinct heap instance (`a == c` is false, but `a.equals(c)` is true).',
    code: `public class Main {
    public static void main(String[] args) {
        String a = "hello";
        String b = "hello";
        String c = new String("hello");

        System.out.println("a == b: " + (a == b));
        System.out.println("a == c: " + (a == c));
        System.out.println("a.equals(c): " + a.equals(c));
    }
}
`,
  },
  {
    id: 'p11-24-string-immutability',
    title: '24 — String Immutability',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Showing how string concatenation creates a brand new String object rather than mutating in place.',
    explanation: 'String objects are immutable. The expression `s + " World"` creates a completely new String object on the heap, reassigning `s` to point to it while leaving the original "Hello" intact.',
    code: `public class Main {
    public static void main(String[] args) {
        String s = "Hello";
        System.out.println("Initial s: " + s);

        s = s + " World";
        System.out.println("New s object: " + s);
    }
}
`,
  },
  {
    id: 'p11-25-stringbuilder',
    title: '25 — StringBuilder In-Place Mutation',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Mutating internal buffer in-place without creating intermediate String objects.',
    explanation: 'Unlike String, StringBuilder modifies its internal character buffer in-place on the heap during `append()`, avoiding unnecessary object allocations.',
    code: `public class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("Hello");
        sb.append(" World");
        sb.append("!");
        System.out.println("StringBuilder: " + sb.toString());
    }
}
`,
  },

  // ─── 7. Exceptions ──────────────────────────────────────────────────────────
  {
    id: 'p11-26-try-catch',
    title: '26 — try / catch Handling',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Catching runtime exceptions and preventing JVM termination.',
    explanation: 'When `10 / 0` occurs, an ArithmeticException is thrown. The JVM diverts execution flow into the matching `catch` block.',
    code: `public class Main {
    public static void main(String[] args) {
        try {
            int a = 10;
            int b = 0;
            int result = a / b;
            System.out.println(result);
        } catch (ArithmeticException e) {
            System.out.println("Caught exception: Division by zero");
        }
    }
}
`,
  },
  {
    id: 'p11-27-finally',
    title: '27 — finally Block Execution',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Guaranteed execution of cleanup logic in finally blocks.',
    explanation: 'The `finally` block is guaranteed to execute whether the `try` block completes normally or throws an exception.',
    code: `public class Main {
    public static void main(String[] args) {
        try {
            System.out.println("Inside try block");
            int x = 10 / 2;
            System.out.println("Result: " + x);
        } catch (Exception e) {
            System.out.println("Inside catch block");
        } finally {
            System.out.println("Finally block always executes!");
        }
    }
}
`,
  },
  {
    id: 'p11-28-throw',
    title: '28 — Explicit throw Statement',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Creating and throwing custom or standard exception instances.',
    explanation: 'The `throw` keyword creates an exception object on the heap and initiates exception propagation up the call stack.',
    code: `public class Main {
    static void checkAge(int age) {
        if (age < 18) {
            throw new IllegalArgumentException("Age must be >= 18");
        }
        System.out.println("Access granted");
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
    id: 'p11-29-throws',
    title: '29 — Method throws Declaration',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Declaring checked or unchecked exceptions on method signatures.',
    explanation: 'The `throws` clause alerts calling code that the method may raise an exception that must be caught or propagated.',
    code: `public class Main {
    static void validate(int score) throws Exception {
        if (score < 0) {
            throw new Exception("Score cannot be negative");
        }
        System.out.println("Valid score: " + score);
    }

    public static void main(String[] args) {
        try {
            validate(-5);
        } catch (Exception e) {
            System.out.println("Handled: " + e.getMessage());
        }
    }
}
`,
  },
  {
    id: 'p11-30-exception-propagation',
    title: '30 — Exception Propagation & Stack Unwinding',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Observing stack frames unwind through nested method calls until a catch block is found.',
    explanation: 'When an exception occurs in `methodC()`, the JVM unwinds through `methodB()`, then `methodA()`, and catches it in `main()` call stack.',
    code: `public class Main {
    static void methodC() {
        int x = 10 / 0;
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
        } catch (ArithmeticException e) {
            System.out.println("Exception propagated to main and caught!");
        }
    }
}
`,
  },

  // ─── 8. Generics ────────────────────────────────────────────────────────────
  {
    id: 'p11-31-generic-list',
    title: '31 — Generic Collection (List<Integer>)',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Compile-time type safety with generic ArrayList and automatic unboxing in enhanced for-loop.',
    explanation: 'Generics enforce that only Integer elements can be stored in the List, eliminating explicit type casts during iteration.',
    code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>();
        numbers.add(10);
        numbers.add(20);
        numbers.add(30);

        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        System.out.println("Sum of list: " + sum);
    }
}
`,
  },
  {
    id: 'p11-32-generic-class',
    title: '32 — Generic Class (Box<T>)',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Creating parameterized classes with type parameter <T>.',
    explanation: '`Box<T>` works uniformly with Integer, String, or any custom class. The type parameter is checked at compile-time.',
    code: `class Box<T> {
    private T value;

    public void set(T value) {
        this.value = value;
    }

    public T get() {
        return this.value;
    }
}

public class Main {
    public static void main(String[] args) {
        Box<Integer> intBox = new Box<>();
        intBox.set(42);

        Box<String> strBox = new Box<>();
        strBox.set("Hello Generics");

        System.out.println("intBox: " + intBox.get());
        System.out.println("strBox: " + strBox.get());
    }
}
`,
  },
  {
    id: 'p11-33-generic-method',
    title: '33 — Generic Method (<T> void)',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Defining generic methods with type inference.',
    explanation: 'The type parameter `<T>` is inferred from the argument passed to `printElement(...)`, allowing one method to accept any type safely.',
    code: `public class Main {
    static <T> void printElement(T element) {
        System.out.println("Element: " + element);
    }

    public static void main(String[] args) {
        printElement(100);
        printElement("Java OOP");
        printElement(3.14);
    }
}
`,
  },

  // ─── 9. Combined Java + DSA ─────────────────────────────────────────────────
  {
    id: 'p11-34-combined-oop-dsa',
    title: '34 — Combined Java OOP + DSA Demo',
    category: 'Java OOP & Language Fundamentals',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Combined demonstration of Java OOP, Objects, References, Arrays, Methods, Loops, and DSA Memory coexisting seamlessly.',
    explanation: 'Demonstrates a Student class holding an internal `int[] marks` array reference on the heap. Calling `student.findMax()` pushes a stack frame, binds `this`, loops through the array, updates the maximum value, and returns it to `main()`.',
    code: `class Student {
    String name;
    int[] marks;

    Student(String name, int[] marks) {
        this.name = name;
        this.marks = marks;
    }

    int findMax() {
        int max = marks[0];
        for (int i = 1; i < marks.length; i++) {
            if (marks[i] > max) {
                max = marks[i];
            }
        }
        return max;
    }
}

public class Main {
    public static void main(String[] args) {
        int[] marks = {80, 95, 70, 90};
        Student student = new Student("Ashrith", marks);
        int max = student.findMax();
        System.out.println("Highest mark for " + student.name + ": " + max);
    }
}
`,
  },
];
