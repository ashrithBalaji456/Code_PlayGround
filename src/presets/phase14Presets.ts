import { CodePreset } from '../types/execution';

export const PHASE14_PRESETS: CodePreset[] = [
  // 1. Classes and Objects
  {
    id: 'java-oop-classes-objects',
    title: 'Java OOP: Classes and Objects',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Declaring a class blueprint and instantiating multiple distinct objects in the JVM Heap.',
    explanation: 'Each `new Car()` invocation allocates a separate object block on the Java Heap with its own field storage.',
    code: `public class Main {
    static class Car {
        String model;
        int year;
    }

    public static void main(String[] args) {
        Car car1 = new Car();
        car1.model = "Tesla";
        car1.year = 2024;

        Car car2 = new Car();
        car2.model = "Ford";
        car2.year = 2022;

        System.out.println("Car 1: " + car1.model);
        System.out.println("Car 2: " + car2.model);
    }
}`,
  },

  // 2. Instance Variables
  {
    id: 'java-oop-instance-variables',
    title: 'Java OOP: Instance Variables',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Each object instantiated on the Heap maintains its own independent copy of instance variables.',
    explanation: 'Mutating s1.score updates only the field stored in object-1; object-2 maintains its separate score value.',
    code: `public class Main {
    static class Student {
        String name;
        int score;
    }

    public static void main(String[] args) {
        Student s1 = new Student();
        s1.name = "Alice";
        s1.score = 95;

        Student s2 = new Student();
        s2.name = "Bob";
        s2.score = 88;

        s1.score = 98; // Mutates s1 score only
        System.out.println(s1.name + ": " + s1.score);
        System.out.println(s2.name + ": " + s2.score);
    }
}`,
  },

  // 3. Instance Methods
  {
    id: 'java-oop-instance-methods',
    title: 'Java OOP: Instance Methods',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Instance methods operate on the state of the specific calling instance (using the implicit this reference).',
    explanation: 'When acc.deposit() is called, the implicit `this` parameter points to `acc` on the heap to modify its balance.',
    code: `public class Main {
    static class BankAccount {
        String owner;
        int balance;

        void deposit(int amount) {
            this.balance += amount;
            System.out.println(this.owner + " deposited " + amount + ", new balance: " + this.balance);
        }
    }

    public static void main(String[] args) {
        BankAccount acc = new BankAccount();
        acc.owner = "Alice";
        acc.balance = 1000;

        acc.deposit(500);
        acc.deposit(250);
    }
}`,
  },

  // 4. Static Variables & Methods
  {
    id: 'java-oop-static-members',
    title: 'Java OOP: Static Variables & Methods',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Static members belong to the Class in the Metaspace/Class Area, shared across all instances.',
    explanation: '`totalCount` is stored once on the `Counter` class metadata rather than per-instance on the heap.',
    code: `public class Main {
    static class Counter {
        static int totalCount = 0;
        int instanceId;

        Counter(int id) {
            this.instanceId = id;
            totalCount++;
        }

        static int getTotalCount() {
            return totalCount;
        }
    }

    public static void main(String[] args) {
        Counter c1 = new Counter(1);
        Counter c2 = new Counter(2);
        Counter c3 = new Counter(3);

        System.out.println("Total instances created: " + Counter.getTotalCount());
    }
}`,
  },

  // 5. Constructors & Constructor Overloading
  {
    id: 'java-oop-constructors-overloading',
    title: 'Java OOP: Constructor Overloading',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Multiple constructors in the same class with different parameter signatures initialize objects with varying default values.',
    explanation: 'The JVM matches constructor invocations at compile time using static method signature overload resolution.',
    code: `public class Main {
    static class Rectangle {
        int width;
        int height;

        Rectangle() {
            this.width = 1;
            this.height = 1;
        }

        Rectangle(int side) {
            this.width = side;
            this.height = side;
        }

        Rectangle(int w, int h) {
            this.width = w;
            this.height = h;
        }
    }

    public static void main(String[] args) {
        Rectangle r1 = new Rectangle();
        Rectangle r2 = new Rectangle(5);
        Rectangle r3 = new Rectangle(4, 8);

        System.out.println("Default: " + r1.width + "x" + r1.height);
        System.out.println("Square: " + r2.width + "x" + r2.height);
        System.out.println("Custom: " + r3.width + "x" + r3.height);
    }
}`,
  },

  // 6. Constructor Chaining (this(...) and super(...))
  {
    id: 'java-oop-constructor-chaining',
    title: 'Java OOP: Constructor Chaining (this & super)',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Chaining constructors using this(...) delegates initialization within the class, while super(...) calls parent constructors.',
    explanation: '`this("Generic Brand", 120)` delegates to the parameterized Car constructor, which in turn invokes `super("Automobile")`.',
    code: `public class Main {
    static class Vehicle {
        String type;

        Vehicle(String type) {
            this.type = type;
            System.out.println("Vehicle initialized: " + type);
        }
    }

    static class Car extends Vehicle {
        String brand;
        int maxSpeed;

        Car() {
            this("Generic Brand", 120);
        }

        Car(String brand, int maxSpeed) {
            super("Automobile");
            this.brand = brand;
            this.maxSpeed = maxSpeed;
            System.out.println("Car initialized: " + brand);
        }
    }

    public static void main(String[] args) {
        Car car = new Car();
        System.out.println("Created: " + car.brand + " (" + car.type + ")");
    }
}`,
  },

  // 7. Inheritance & super Keyword
  {
    id: 'java-oop-inheritance-super',
    title: 'Java OOP: Single & Multilevel Inheritance',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Subclasses inherit parent fields and methods. The super keyword accesses overridden members.',
    explanation: 'Dog inherits `warmBlooded` from Mammal and `name` from Animal; `super.speak()` calls Animal.speak().',
    code: `public class Main {
    static class Animal {
        String name;

        void speak() {
            System.out.println("Animal makes a sound");
        }
    }

    static class Mammal extends Animal {
        boolean warmBlooded = true;
    }

    static class Dog extends Mammal {
        void speak() {
            super.speak();
            System.out.println("Dog barks: Woof woof!");
        }
    }

    public static void main(String[] args) {
        Dog dog = new Dog();
        dog.name = "Buddy";
        dog.speak();
        System.out.println(dog.name + " warm blooded: " + dog.warmBlooded);
    }
}`,
  },

  // 8. Dynamic Method Dispatch & Polymorphism
  {
    id: 'java-oop-polymorphism-dispatch',
    title: 'Java OOP: Dynamic Method Dispatch',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Polymorphic reference of parent type resolved at runtime to the subclass implementation on the Heap.',
    explanation: 'Although s1 and s2 have declared type Shape, dynamic dispatch inspects the actual object type in the Heap.',
    code: `public class Main {
    static class Shape {
        void draw() {
            System.out.println("Drawing generic shape");
        }
    }

    static class Circle extends Shape {
        void draw() {
            System.out.println("Drawing Circle with radius");
        }
    }

    static class Square extends Shape {
        void draw() {
            System.out.println("Drawing Square with 4 equal sides");
        }
    }

    public static void main(String[] args) {
        Shape s1 = new Circle();
        Shape s2 = new Square();

        // Runtime dynamic dispatch
        s1.draw();
        s2.draw();
    }
}`,
  },

  // 9. Upcasting, Downcasting & instanceof
  {
    id: 'java-oop-casting-instanceof',
    title: 'Java OOP: Upcasting, Downcasting & instanceof',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Safe type conversion using instanceof check before downcasting from superclass to subclass.',
    explanation: '`instanceof` inspects the object header class metadata on the heap to ensure type safety before downcasting.',
    code: `public class Main {
    static class Animal {
        void sound() { System.out.println("Generic sound"); }
    }

    static class Dog extends Animal {
        void fetch() { System.out.println("Dog fetches ball!"); }
    }

    public static void main(String[] args) {
        Animal a = new Dog(); // Upcasting
        a.sound();

        boolean isDog = a instanceof Dog;
        System.out.println("Is instance of Dog: " + isDog);

        if (isDog) {
            Dog d = (Dog) a; // Downcasting
            d.fetch();
        }
    }
}`,
  },

  // 10. Abstract Classes & Abstract Methods
  {
    id: 'java-oop-abstract-classes',
    title: 'Java OOP: Abstract Classes & Methods',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Abstract classes define common contracts with abstract methods that concrete subclasses must implement.',
    explanation: '`Employee` cannot be instantiated directly; Developer provides concrete implementation for `calculateSalary()`.',
    code: `public class Main {
    static abstract class Employee {
        String name;
        Employee(String name) { this.name = name; }
        abstract int calculateSalary();
    }

    static class Developer extends Employee {
        int baseSalary;
        int bonus;

        Developer(String name, int base, int bonus) {
            super(name);
            this.baseSalary = base;
            this.bonus = bonus;
        }

        int calculateSalary() {
            return this.baseSalary + this.bonus;
        }
    }

    public static void main(String[] args) {
        Employee emp = new Developer("Alice", 8000, 2000);
        int salary = emp.calculateSalary();
        System.out.println(emp.name + " total salary: $" + salary);
    }
}`,
  },

  // 11. Interfaces & Multiple Interfaces
  {
    id: 'java-oop-interfaces-multiple',
    title: 'Java OOP: Interfaces & Multiple Interfaces',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Java supports multiple interface inheritance where a single class implements multiple orthogonal capabilities.',
    explanation: '`Duck` implements both Flyable and Swimmable, satisfying contracts for both interfaces.',
    code: `public class Main {
    interface Flyable {
        void fly();
    }

    interface Swimmable {
        void swim();
    }

    static class Duck implements Flyable, Swimmable {
        public void fly() {
            System.out.println("Duck is flying in the sky");
        }

        public void swim() {
            System.out.println("Duck is swimming in the pond");
        }
    }

    public static void main(String[] args) {
        Duck duck = new Duck();
        duck.fly();
        duck.swim();
    }
}`,
  },

  // 12. Encapsulation & Access Modifiers
  {
    id: 'java-oop-encapsulation',
    title: 'Java OOP: Encapsulation & Getters/Setters',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Data hiding with private fields and controlled access via public getters and validation setters.',
    explanation: 'The `balance` field is marked private to prevent arbitrary external modifications; only validated deposits are permitted.',
    code: `public class Main {
    static class Account {
        private String id;
        private int balance;

        Account(String id, int initialBalance) {
            this.id = id;
            if (initialBalance >= 0) {
                this.balance = initialBalance;
            }
        }

        public int getBalance() {
            return this.balance;
        }

        public void deposit(int amount) {
            if (amount > 0) {
                this.balance += amount;
            }
        }
    }

    public static void main(String[] args) {
        Account acc = new Account("ACC-101", 500);
        acc.deposit(300);
        System.out.println("Current balance: $" + acc.getBalance());
    }
}`,
  },

  // 13. Composition & Aggregation
  {
    id: 'java-oop-composition-aggregation',
    title: 'Java OOP: Composition vs Aggregation (has-a)',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Composition binds part lifecycle to whole, while Aggregation connects independently existing objects.',
    explanation: 'Car creates and owns its Engine (Composition); Professor references an independently instantiated Department (Aggregation).',
    code: `public class Main {
    static class Engine {
        int horsepower;
        Engine(int hp) { this.horsepower = hp; }
    }

    static class Car {
        Engine engine; // Composition: Car owns its Engine
        Car(int hp) {
            this.engine = new Engine(hp);
        }
    }

    static class Department {
        String deptName;
        Department(String name) { this.deptName = name; }
    }

    static class Professor {
        String name;
        Department dept; // Aggregation: Professor references existing Department
        Professor(String name, Department dept) {
            this.name = name;
            this.dept = dept;
        }
    }

    public static void main(String[] args) {
        Car car = new Car(450);
        System.out.println("Car engine horsepower: " + car.engine.horsepower);

        Department cs = new Department("Computer Science");
        Professor prof = new Professor("Dr. Turing", cs);
        System.out.println(prof.name + " teaches in " + prof.dept.deptName);
    }
}`,
  },

  // 14. Java Enums
  {
    id: 'java-oop-enums',
    title: 'Java Language: Enums with Fields & Methods',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Type-safe enum constants with custom constructor fields and lookup methods.',
    explanation: 'Enum constants are full-featured Java classes with custom fields, ordinal values, and encapsulation.',
    code: `public class Main {
    enum Level {
        LOW(1),
        MEDIUM(2),
        HIGH(3);

        private final int priority;

        Level(int priority) {
            this.priority = priority;
        }

        public int getPriority() {
            return this.priority;
        }
    }

    public static void main(String[] args) {
        Level current = Level.HIGH;
        System.out.println("Selected Level: " + current.name());
        System.out.println("Level Priority: " + current.getPriority());
        System.out.println("Level Ordinal: " + current.ordinal());
    }
}`,
  },

  // 15. Nested & Inner Classes
  {
    id: 'java-oop-nested-inner-classes',
    title: 'Java Language: Static Nested & Inner Classes',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Static nested classes do not require an outer instance, whereas member inner classes bind to an enclosing instance.',
    explanation: 'StaticNested can be instantiated via `Outer.StaticNested()`, while Inner requires `outer.new Inner()`.',
    code: `public class Main {
    static class Outer {
        String outerName = "OuterScope";

        static class StaticNested {
            void display() {
                System.out.println("Static nested class instantiated independently");
            }
        }

        class Inner {
            void show() {
                System.out.println("Inner class accessing outer field: " + outerName);
            }
        }
    }

    public static void main(String[] args) {
        Outer.StaticNested nested = new Outer.StaticNested();
        nested.display();

        Outer outer = new Outer();
        Outer.Inner inner = outer.new Inner();
        inner.show();
    }
}`,
  },

  // 16. Varargs (Variable Arguments)
  {
    id: 'java-oop-varargs',
    title: 'Java Language: Varargs (Variable Arguments)',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Varargs (Type... args) enables methods to accept zero, one, or multiple arguments seamlessly packaged into an array.',
    explanation: 'The JVM automatically wraps arguments passed into `sum(int... numbers)` into an array upon method entry.',
    code: `public class Main {
    static int sum(int... numbers) {
        int total = 0;
        for (int n : numbers) {
            total += n;
        }
        return total;
    }

    public static void main(String[] args) {
        int s1 = sum(10, 20);
        int s2 = sum(1, 2, 3, 4, 5);
        int s3 = sum();

        System.out.println("Sum 1: " + s1);
        System.out.println("Sum 2: " + s2);
        System.out.println("Sum 3: " + s3);
    }
}`,
  },

  // 17. Generics (Generic Classes & Methods)
  {
    id: 'java-oop-generics',
    title: 'Java Language: Generics (Class & Bounded)',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Generic type parameters provide compile-time type safety and eliminate runtime casting.',
    explanation: '`Box<T>` abstracts the stored type parameter while bounded generic `<N extends Number>` constrains numeric types.',
    code: `public class Main {
    static class Box<T> {
        private T value;

        void set(T val) { this.value = val; }
        T get() { return this.value; }
    }

    static <N extends Number> double square(N num) {
        return num.doubleValue() * num.doubleValue();
    }

    public static void main(String[] args) {
        Box<String> strBox = new Box<>();
        strBox.set("Java Generics");
        System.out.println("String Box: " + strBox.get());

        Box<Integer> intBox = new Box<>();
        intBox.set(42);
        System.out.println("Integer Box: " + intBox.get());

        double sq = square(5);
        System.out.println("Square of 5: " + sq);
    }
}`,
  },

  // 18. Java Collections: ArrayList
  {
    id: 'java-col-arraylist',
    title: 'Java Collections: ArrayList Dynamic Resizing',
    category: 'Java Collections & Streams',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) amortized',
    spaceComplexity: 'O(N)',
    description: 'Dynamic array implementation with indexed access, automatic resizing, and element operations.',
    explanation: 'ArrayList resizes dynamically when capacity is exceeded and supports random indexed access.',
    code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("Java");
        list.add("Kotlin");
        list.add("Scala");

        System.out.println("Initial size: " + list.size());
        System.out.println("Element at 1: " + list.get(1));

        list.remove(0);
        System.out.println("After remove(0): " + list.get(0));
        System.out.println("New size: " + list.size());
    }
}`,
  },

  // 19. Java Collections: TreeMap & TreeSet
  {
    id: 'java-col-treemap-treeset',
    title: 'Java Collections: TreeMap & TreeSet (Sorted)',
    category: 'Java Collections & Streams',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(N)',
    description: 'Red-Black Tree based sorted Map and Set guaranteeing log(n) time for key operations with natural ordering.',
    explanation: 'TreeMap and TreeSet automatically order elements according to natural order using Red-Black Tree structures.',
    code: `import java.util.TreeMap;
import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        TreeSet<Integer> sortedSet = new TreeSet<>();
        sortedSet.add(50);
        sortedSet.add(10);
        sortedSet.add(30);

        System.out.println("Sorted set elements:");
        for (int v : sortedSet) {
            System.out.println("  Val: " + v);
        }

        TreeMap<String, Integer> map = new TreeMap<>();
        map.put("Banana", 3);
        map.put("Apple", 5);
        map.put("Cherry", 8);

        System.out.println("First key: " + map.firstKey());
        System.out.println("Apple count: " + map.get("Apple"));
    }
}`,
  },

  // 20. Iterator & ListIterator
  {
    id: 'java-col-iterators',
    title: 'Java Collections: Iterator & ListIterator',
    category: 'Java Collections & Streams',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Sequential and bidirectional cursor traversal across Java Collections.',
    explanation: 'Iterator advances forward using next(), while ListIterator can traverse backward using previous().',
    code: `import java.util.ArrayList;
import java.util.Iterator;
import java.util.ListIterator;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> fruits = new ArrayList<>();
        fruits.add("Apple");
        fruits.add("Banana");
        fruits.add("Cherry");

        // Forward Iterator
        Iterator<String> it = fruits.iterator();
        while (it.hasNext()) {
            String item = it.next();
            System.out.println("Iterator visit: " + item);
        }

        // Bidirectional ListIterator
        ListIterator<String> lit = fruits.listIterator(fruits.size());
        while (lit.hasPrevious()) {
            String prev = lit.previous();
            System.out.println("Reverse visit: " + prev);
        }
    }
}`,
  },

  // 21. Functional Interfaces & Lambdas
  {
    id: 'java-func-lambdas',
    title: 'Functional Java: Lambdas & Functional Interfaces',
    category: 'Java Collections & Streams',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Predicate, Function, Consumer, and Supplier implementations with clean lambda syntax.',
    explanation: 'Lambdas implement single-abstract-method (SAM) functional interfaces with lightweight synthetic call-site bindings.',
    code: `import java.util.function.Predicate;
import java.util.function.Function;
import java.util.function.Consumer;

public class Main {
    public static void main(String[] args) {
        Predicate<Integer> isEven = x -> x % 2 == 0;
        System.out.println("Is 10 even? " + isEven.test(10));
        System.out.println("Is 7 even? " + isEven.test(7));

        Function<String, Integer> strLength = s -> s.length();
        int len = strLength.apply("CodeFlow");
        System.out.println("Length of CodeFlow: " + len);

        Consumer<String> greeter = name -> System.out.println("Hello, " + name);
        greeter.accept("Java Developer");
    }
}`,
  },

  // 22. Java Streams Pipeline & Laziness
  {
    id: 'java-func-streams-pipeline',
    title: 'Functional Java: Stream Pipeline & Laziness',
    category: 'Java Collections & Streams',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Declarative data processing with filter, map, sorted, and terminal reduction operations.',
    explanation: 'Streams execute lazily: intermediate operations filter and map only execute when the terminal forEach is invoked.',
    code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("Alice");
        names.add("Bob");
        names.add("Alexander");
        names.add("Charlie");

        // Stream Pipeline: [Source] -> [filter] -> [map] -> [forEach]
        System.out.println("Filtered and uppercased names:");
        names.stream()
            .filter(n -> n.startsWith("A"))
            .map(n -> n.toUpperCase())
            .forEach(n -> System.out.println("Result: " + n));
    }
}`,
  },

  // 23. Grand OOP Integration Demo (Section 72)
  {
    id: 'java-grand-oop-integration-demo',
    title: 'GRAND OOP & LANGUAGE INTEGRATION DEMO',
    category: 'Java OOP & Language Advanced',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Complete synthesis of Phase 14: Inheritance, Interfaces, Polymorphism, Encapsulation, Composition, Enums, Generics, and Streams.',
    explanation: 'Combines abstract classes, interfaces, dynamic dispatch, composition in Bank, and encapsulated accounts into a unified pipeline.',
    code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    enum Status { ACTIVE, COMPLETED, SUSPENDED }

    interface Identifiable {
        String getId();
    }

    static abstract class Account implements Identifiable {
        private final String id;
        protected int balance;
        Status status;

        Account(String id, int balance) {
            this.id = id;
            this.balance = balance;
            this.status = Status.ACTIVE;
        }

        public String getId() { return this.id; }
        public int getBalance() { return this.balance; }

        abstract void applyInterest();
    }

    static class SavingsAccount extends Account {
        int interestRatePercent;

        SavingsAccount(String id, int balance, int rate) {
            super(id, balance);
            this.interestRatePercent = rate;
        }

        void applyInterest() {
            int interest = (this.balance * this.interestRatePercent) / 100;
            this.balance += interest;
            System.out.println("Savings " + getId() + " interest applied: +" + interest);
        }
    }

    static class Bank {
        String name;
        List<Account> accounts = new ArrayList<>();

        Bank(String name) { this.name = name; }

        void addAccount(Account a) {
            accounts.add(a);
        }

        void processAll() {
            for (Account acc : accounts) {
                acc.applyInterest(); // Dynamic Dispatch!
            }
        }
    }

    public static void main(String[] args) {
        Bank bank = new Bank("Apex Global Bank");

        Account acc1 = new SavingsAccount("SA-101", 5000, 5);
        Account acc2 = new SavingsAccount("SA-102", 12000, 7);

        bank.addAccount(acc1);
        bank.addAccount(acc2);

        System.out.println("Processing accounts at: " + bank.name);
        bank.processAll();

        System.out.println("Final balance acc1: $" + acc1.getBalance());
        System.out.println("Final balance acc2: $" + acc2.getBalance());
    }
}`,
  },
];
