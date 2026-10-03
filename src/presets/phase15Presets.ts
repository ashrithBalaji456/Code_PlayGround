import { CodePreset } from '../types/execution';

export const PHASE15_PRESETS: CodePreset[] = [
  // 1. Grand OOP & Polymorphism Demo (Section 59)
  {
    id: 'java-phase15-grand-oop-demo',
    title: 'Phase 15 Grand OOP & Polymorphism Demo',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Hard',
    language: 'java',
    description:
      'The comprehensive Java OOP demonstration: Inheritance, Interfaces, Constructor Chaining, Dynamic Method Dispatch, instanceof, and Explicit Downcasting.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class Animal {
    String name;

    Animal(String name) {
        this.name = name;
    }

    void sound() {
        System.out.println("Animal sound");
    }
}

interface Pet {
    void play();
}

class Dog extends Animal implements Pet {
    Dog(String name) {
        super(name);
    }

    @Override
    void sound() {
        System.out.println("Bark");
    }

    @Override
    public void play() {
        System.out.println("Playing");
    }
}

public class Main {
    public static void main(String[] args) {
        Animal animal = new Dog("Bruno");
        System.out.println(animal.name);

        animal.sound();

        if (animal instanceof Dog) {
            Dog dog = (Dog) animal;
            dog.play();
        }
    }
}`,
    explanation:
      'Demonstrates the full OOP lifecycle: Dog object is allocated on the heap and referenced via an Animal declared reference (Upcasting). animal.sound() executes Dog.sound() via Dynamic Virtual Dispatch. The instanceof check evaluates to true, enabling a safe explicit downcast to Dog to invoke play().',
  },

  // 2. Reference Aliasing & Mutability (Section 40)
  {
    id: 'java-phase15-aliasing-mutability',
    title: 'Reference Aliasing & Object Mutability',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Demonstrates Java reference copy-by-value where two variables point to the exact same heap memory instance.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class Dog {
    String name;
    int age;

    Dog(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

public class Main {
    public static void main(String[] args) {
        Dog d1 = new Dog("Bruno", 3);
        Dog d2 = d1; // d2 aliases the exact same object

        boolean isSame = (d1 == d2);
        System.out.println(isSame);

        d1.name = "Max";
        System.out.println(d2.name); // Reflects "Max"
    }
}`,
    explanation:
      'Java passes and copies references by value. d2 receives a copy of the memory address pointing to Dog#1. When d1 modifies name, inspecting d2.name sees "Max" because only one object exists on the heap.',
  },

  // 3. Object Identity (==) vs Logical Equality (.equals) (Section 41)
  {
    id: 'java-phase15-identity-vs-equality',
    title: 'Object Identity (==) vs Logical Equality (.equals)',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Distinguishes between raw memory address pointer comparison (==) and semantic content equality (.equals()).',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class Point {
    int x;
    int y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Point)) return false;
        Point p = (Point) obj;
        return this.x == p.x && this.y == p.y;
    }
}

public class Main {
    public static void main(String[] args) {
        Point p1 = new Point(10, 20);
        Point p2 = new Point(10, 20);
        Point p3 = p1;

        boolean identityP1P2 = (p1 == p2);      // false (distinct heap objects)
        boolean equalityP1P2 = p1.equals(p2);   // true (matching fields)
        boolean identityP1P3 = (p1 == p3);      // true (same heap address)

        System.out.println(identityP1P2);
        System.out.println(equalityP1P2);
        System.out.println(identityP1P3);
    }
}`,
    explanation:
      'p1 and p2 hold distinct heap memory addresses, so p1 == p2 is FALSE. However, Point overrides .equals() to compare field values, so p1.equals(p2) is TRUE. p1 == p3 is TRUE because p3 aliases p1.',
  },

  // 4. Method Overloading vs Method Overriding (Section 10 & 12)
  {
    id: 'java-phase15-overloading-vs-overriding',
    title: 'Compile-Time Overloading vs Runtime Overriding',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Visualizes static early binding of overloaded method signatures at compile time versus dynamic late binding of overridden methods at runtime.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class Printer {
    void print(int val) {
        System.out.println("Integer: " + val);
    }

    void print(String text) {
        System.out.println("String: " + text);
    }
}

class Shape {
    void draw() {
        System.out.println("Generic Shape");
    }
}

class Circle extends Shape {
    @Override
    void draw() {
        System.out.println("Circle Drawing");
    }
}

public class Main {
    public static void main(String[] args) {
        Printer p = new Printer();
        p.print(42);           // Overload selected: print(int)
        p.print("CodeFlow");   // Overload selected: print(String)

        Shape s = new Circle(); // Upcast
        s.draw();               // Override selected: Circle.draw() at runtime
    }
}`,
    explanation:
      'Method overloading is resolved statically at compile time based on parameter types. Method overriding is resolved dynamically at runtime by inspecting the heap object header.',
  },

  // 5. Upcasting and Downcasting with Type Checks (Section 13, 14, 15)
  {
    id: 'java-phase15-casting-and-instanceof',
    title: 'Polymorphic Upcasting, Downcasting & instanceof',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Demonstrates safe reference widening, narrowing, and runtime type inspection before downcasting.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class Vehicle {
    int speed = 60;

    void drive() {
        System.out.println("Driving at " + speed);
    }
}

class Car extends Vehicle {
    int airbags = 6;

    @Override
    void drive() {
        System.out.println("Driving Car with " + airbags + " airbags");
    }

    void turboBoost() {
        System.out.println("Turbo engaged!");
    }
}

public class Main {
    public static void main(String[] args) {
        Car c = new Car();
        Vehicle v = c; // Implicit upcasting (widening)
        v.drive();     // Dispatches to Car.drive()

        if (v instanceof Car) {
            Car downcasted = (Car) v; // Explicit downcasting (narrowing)
            downcasted.turboBoost();
        }
    }
}`,
    explanation:
      'Upcasting Vehicle v = c is safe and implicit. Calling v.turboBoost() is illegal at compile time because Vehicle has no such method. After verifying v instanceof Car, explicit downcasting (Car) v enables calling turboBoost().',
  },

  // 6. Super Field Access & Method Bypassing (Section 7)
  {
    id: 'java-phase15-super-field-and-method',
    title: 'Super Keyword Field Shadowing & Method Resolution',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Shows how super.field accesses shadowed parent fields and super.method() invokes parent class logic.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class Parent {
    int value = 100;

    void display() {
        System.out.println("Parent display: " + value);
    }
}

class Child extends Parent {
    int value = 200; // Shadows Parent.value

    @Override
    void display() {
        super.display(); // Calls Parent.display()
        System.out.println("Child display: " + value + " (Parent was: " + super.value + ")");
    }
}

public class Main {
    public static void main(String[] args) {
        Child c = new Child();
        c.display();
    }
}`,
    explanation:
      'Child declares a field value that shadows Parent.value. The super keyword allows explicit access to Parent.value (100) and executes Parent.display() before child customizations.',
  },

  // 7. Constructor Chaining with this() and super() (Section 6 & 8)
  {
    id: 'java-phase15-constructor-chaining',
    title: 'Constructor Chaining: this(...) and super(...)',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Visualizes constructor chaining across overloaded constructors in the same class and into the superclass hierarchy.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class Appliance {
    String brand;

    Appliance(String brand) {
        this.brand = brand;
        System.out.println("Appliance brand initialized: " + brand);
    }
}

class Refrigerator extends Appliance {
    int capacity;

    Refrigerator() {
        this("Samsung", 500); // Calls overloaded constructor
    }

    Refrigerator(String brand, int capacity) {
        super(brand); // Calls superclass constructor Appliance(String)
        this.capacity = capacity;
        System.out.println("Refrigerator ready: " + capacity + "L");
    }
}

public class Main {
    public static void main(String[] args) {
        Refrigerator r = new Refrigerator();
        System.out.println(r.brand + " " + r.capacity + "L");
    }
}`,
    explanation:
      'new Refrigerator() invokes Refrigerator(), which delegates via this("Samsung", 500), which in turn delegates to super(brand) before initializing capacity.',
  },

  // 8. Abstract Classes and Method Contracts (Section 16)
  {
    id: 'java-phase15-abstract-classes',
    title: 'Abstract Classes & Abstract Method Contracts',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Demonstrates abstract base classes enforcing method implementation contracts on concrete subclasses.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `abstract class Account {
    String owner;
    double balance;

    Account(String owner, double balance) {
        this.owner = owner;
        this.balance = balance;
    }

    abstract void applyInterest();

    void printBalance() {
        System.out.println(owner + " Balance: $" + balance);
    }
}

class SavingsAccount extends Account {
    double interestRate;

    SavingsAccount(String owner, double balance, double rate) {
        super(owner, balance);
        this.interestRate = rate;
    }

    @Override
    void applyInterest() {
        balance += balance * interestRate;
    }
}

public class Main {
    public static void main(String[] args) {
        Account acc = new SavingsAccount("Alice", 1000.0, 0.05);
        acc.applyInterest();
        acc.printBalance();
    }
}`,
    explanation:
      'Account is abstract and cannot be directly instantiated. SavingsAccount provides the concrete implementation of applyInterest(). The variable acc has declared type Account, demonstrating polymorphism with abstract types.',
  },

  // 9. Multiple Interfaces & Default Methods (Section 17, 18, 19)
  {
    id: 'java-phase15-multiple-interfaces',
    title: 'Multiple Interfaces & Default Methods',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Shows a class implementing multiple interfaces and utilizing default interface method implementations.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `interface Flyable {
    void fly();

    default void cruise() {
        System.out.println("Cruising at standard altitude");
    }
}

interface Swimmable {
    void swim();
}

class Duck implements Flyable, Swimmable {
    @Override
    public void fly() {
        System.out.println("Duck flying");
    }

    @Override
    public void swim() {
        System.out.println("Duck swimming");
    }
}

public class Main {
    public static void main(String[] args) {
        Duck duck = new Duck();
        duck.fly();
        duck.cruise(); // Default interface method
        duck.swim();

        Flyable f = duck;
        f.fly();
    }
}`,
    explanation:
      'Duck implements both Flyable and Swimmable. It inherits the default method cruise() without needing to override it, and can be referenced via interface reference Flyable f.',
  },

  // 10. Static Members vs Instance Members (Section 20 & 21)
  {
    id: 'java-phase15-static-vs-instance',
    title: 'Static Members vs Instance Members',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Compares class-level static state shared across all instances versus per-object heap instance state.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class Counter {
    static int globalCount = 0; // Class-level shared state
    int instanceCount = 0;      // Per-object heap state

    Counter() {
        globalCount++;
        instanceCount++;
    }
}

public class Main {
    public static void main(String[] args) {
        Counter c1 = new Counter();
        Counter c2 = new Counter();
        Counter c3 = new Counter();

        System.out.println("c1 instance: " + c1.instanceCount);
        System.out.println("c2 instance: " + c2.instanceCount);
        System.out.println("Global count: " + Counter.globalCount);
    }
}`,
    explanation:
      'globalCount belongs to the Counter class metadata area and increments with each constructor invocation (reaching 3). In contrast, each instance has its own isolated instanceCount initialized to 1.',
  },

  // 11. Final Keyword: Variables, Methods & Classes (Section 22, 23, 24)
  {
    id: 'java-phase15-final-keyword',
    title: 'Final Keyword: Constants, Immutability & Locking',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Shows how the final keyword prevents variable reassignment, method overriding, and class inheritance.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class MathConstants {
    final double PI = 3.14159; // Constant field
    final int maxCapacity;     // Blank final initialized in constructor

    MathConstants(int cap) {
        this.maxCapacity = cap;
    }

    final void lockConfig() {
        System.out.println("Configuration locked");
    }
}

public class Main {
    public static void main(String[] args) {
        final int x = 10;
        MathConstants mc = new MathConstants(100);

        System.out.println("PI: " + mc.PI);
        System.out.println("Max: " + mc.maxCapacity);
        System.out.println("x: " + x);
        mc.lockConfig();
    }
}`,
    explanation:
      'A final variable or field cannot be reassigned once initialized. A final method cannot be overridden by subclasses, and a final class cannot be extended.',
  },

  // 12. Enums with Fields, Methods and Constructors (Section 31 & 32)
  {
    id: 'java-phase15-enums-advanced',
    title: 'Enums with Custom Fields, Methods & Constructors',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Demonstrates Java enums as type-safe class instances with custom fields, constructor initialization, and helper methods.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `enum Priority {
    LOW(1, "Low Priority"),
    MEDIUM(2, "Normal Priority"),
    HIGH(3, "Critical Priority");

    final int level;
    final String description;

    Priority(int level, String description) {
        this.level = level;
        this.description = description;
    }

    boolean isUrgent() {
        return level >= 3;
    }
}

public class Main {
    public static void main(String[] args) {
        Priority p = Priority.HIGH;

        System.out.println(p.name());
        System.out.println(p.ordinal());
        System.out.println(p.description);
        System.out.println("Is Urgent: " + p.isUrgent());
    }
}`,
    explanation:
      'Java enums are full-featured classes inheriting from java.lang.Enum. Each enum constant is a type-safe singleton instance initialized at class load time.',
  },

  // 13. Generics: Generic Class & Method (Section 33, 34, 35)
  {
    id: 'java-phase15-generics-and-bounds',
    title: 'Generic Classes, Generic Methods & Type Bounds',
    category: 'Java OOP, Polymorphism & Type System',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Shows compile-time type-safe containers, bounded type parameters, and type erasure.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class Box<T> {
    T value;

    void set(T value) {
        this.value = value;
    }

    T get() {
        return value;
    }
}

class Utility {
    static <T extends Number> double toDouble(T num) {
        return num.doubleValue();
    }
}

public class Main {
    public static void main(String[] args) {
        Box<String> strBox = new Box<>();
        strBox.set("Java OOP");

        Box<Integer> intBox = new Box<>();
        intBox.set(100);

        double val = Utility.toDouble(intBox.get());

        System.out.println(strBox.get());
        System.out.println(intBox.get());
        System.out.println("As Double: " + val);
    }
}`,
    explanation:
      'Box<T> provides type safety for heterogeneous types at compile time. Utility.toDouble() uses a bounded generic <T extends Number>, guaranteeing doubleValue() exists on T.',
  },
];
