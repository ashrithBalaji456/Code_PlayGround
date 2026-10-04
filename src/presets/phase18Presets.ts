import { CodePreset } from '../types/execution';

export const PHASE_18_COLLECTIONS_PRESETS: CodePreset[] = [
  // ─── 01. ArrayList Basics ──────────────────────────────────────────────────
  {
    id: 'p18-01-arraylist-basics',
    title: '01 — ArrayList Basics',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) amortized add, O(1) get',
    spaceComplexity: 'O(N)',
    description: 'Declaring a generic ArrayList, appending elements, checking size, and reading by index.',
    explanation: 'ArrayList is backed by a dynamic array. Appending via add() is O(1) amortized; indexing via get() is direct O(1) memory lookup.',
    code: `import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.add(30);

        int size = list.size();
        int first = list.get(0);
        int last = list.get(size - 1);

        System.out.println("Size: " + size);
        System.out.println("First: " + first + ", Last: " + last);
    }
}
`,
  },

  // ─── 02. ArrayList Updates ─────────────────────────────────────────────────
  {
    id: 'p18-02-arraylist-updates',
    title: '02 — ArrayList Updates & Shifting',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N) for mid-insert/remove, O(1) set',
    spaceComplexity: 'O(N)',
    description: 'Modifying elements in-place with set(), inserting at index causing right shift, and removing causing left shift.',
    explanation: 'set() replaces an element at index in O(1). Inserting with add(index, val) or remove(index) shifts subsequent elements, taking O(N) time.',
    code: `import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("Alpha");
        list.add("Gamma");
        list.add("Delta");

        // Insert at index 1 -> right shift
        list.add(1, "Beta");

        // Replace at index 0
        list.set(0, "A-Prime");

        // Remove from index 2 -> left shift
        list.remove(2);

        boolean hasBeta = list.contains("Beta");
        System.out.println("Has Beta: " + hasBeta);
        System.out.println("Final list: " + list);
    }
}
`,
  },

  // ─── 03. LinkedList ────────────────────────────────────────────────────────
  {
    id: 'p18-03-linkedlist',
    title: '03 — LinkedList (Doubly Linked)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) add/remove at ends, O(N) index access',
    spaceComplexity: 'O(N)',
    description: 'Demonstrating java.util.LinkedList as a doubly-linked list with pointer manipulation for insertion and deletion.',
    explanation: 'LinkedList stores nodes containing item, next, and prev references. Adding or removing elements does not require array reallocations.',
    code: `import java.util.List;
import java.util.LinkedList;

public class Main {
    public static void main(String[] args) {
        List<String> list = new LinkedList<>();
        list.add("Node-A");
        list.add("Node-B");
        list.add("Node-C");

        list.remove("Node-B");
        list.add(1, "Node-X");

        System.out.println("LinkedList size: " + list.size());
        System.out.println("Element at 1: " + list.get(1));
    }
}
`,
  },

  // ─── 04. Vector ────────────────────────────────────────────────────────────
  {
    id: 'p18-04-vector',
    title: '04 — Vector (Synchronized List)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) amortized add, O(1) get',
    spaceComplexity: 'O(N)',
    description: 'Inspecting java.util.Vector: legacy synchronized growable array with capacity increment dynamics.',
    explanation: 'Vector is thread-safe because its methods are synchronized. Unlike ArrayList which grows by 50%, Vector doubles its capacity by default.',
    code: `import java.util.Vector;

public class Main {
    public static void main(String[] args) {
        Vector<Integer> vec = new Vector<>(5);
        vec.add(100);
        vec.add(200);
        vec.add(300);

        int capacity = vec.capacity();
        int size = vec.size();

        System.out.println("Size: " + size + ", Capacity: " + capacity);
        System.out.println("Element at 0: " + vec.get(0));
    }
}
`,
  },

  // ─── 05. Stack ─────────────────────────────────────────────────────────────
  {
    id: 'p18-05-stack',
    title: '05 — Stack (LIFO Operations)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) push, pop, peek',
    spaceComplexity: 'O(N)',
    description: 'LIFO (Last-In First-Out) operations using java.util.Stack: push, peek, pop, and empty checks.',
    explanation: 'Stack extends Vector. The most recently pushed element resides at the top of the stack and is returned by peek() or pop().',
    code: `import java.util.Stack;

public class Main {
    public static void main(String[] args) {
        Stack<String> stack = new Stack<>();
        stack.push("Page-1");
        stack.push("Page-2");
        stack.push("Page-3");

        String top = stack.peek();
        String popped = stack.pop();

        System.out.println("Top was: " + top);
        System.out.println("Popped: " + popped);
        System.out.println("New top: " + stack.peek());
    }
}
`,
  },

  // ─── 06. ArrayDeque ────────────────────────────────────────────────────────
  {
    id: 'p18-06-arraydeque',
    title: '06 — ArrayDeque (Double-Ended Queue)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) amortized add/poll at both ends',
    spaceComplexity: 'O(N)',
    description: 'Resizing circular array implementation of Deque without pointer overhead: addFirst, addLast, pollFirst, pollLast.',
    explanation: 'ArrayDeque is faster than Stack when used as a stack and faster than LinkedList when used as a queue due to cache locality and no node allocations.',
    code: `import java.util.Deque;
import java.util.ArrayDeque;

public class Main {
    public static void main(String[] args) {
        Deque<Integer> deque = new ArrayDeque<>();
        deque.addLast(10);
        deque.addLast(20);
        deque.addFirst(5);

        int front = deque.pollFirst();
        int back = deque.pollLast();

        System.out.println("Front polled: " + front);
        System.out.println("Back polled: " + back);
        System.out.println("Remaining size: " + deque.size());
    }
}
`,
  },

  // ─── 07. PriorityQueue ─────────────────────────────────────────────────────
  {
    id: 'p18-07-priorityqueue',
    title: '07 — PriorityQueue (Binary Min-Heap)',
    category: 'Java Collections & Generics',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(log N) offer/poll, O(1) peek',
    spaceComplexity: 'O(N)',
    description: 'Unbounded priority queue based on a binary min-heap ordering elements by natural Comparable order.',
    explanation: 'PriorityQueue maintains the min-heap invariant: the smallest element is always at index 0 (the root) and retrieved in O(1) via peek() or O(log N) poll().',
    code: `import java.util.PriorityQueue;

public class Main {
    public static void main(String[] args) {
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        pq.offer(45);
        pq.offer(12);
        pq.offer(89);
        pq.offer(23);

        int smallest = pq.poll();
        int secondSmallest = pq.poll();

        System.out.println("1st extracted: " + smallest);
        System.out.println("2nd extracted: " + secondSmallest);
        System.out.println("Next peek: " + pq.peek());
    }
}
`,
  },

  // ─── 08. HashSet ───────────────────────────────────────────────────────────
  {
    id: 'p18-08-hashset',
    title: '08 — HashSet (Unordered Unique Elements)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) average add/contains/remove',
    spaceComplexity: 'O(N)',
    description: 'HashSet backed by a HashMap instance guaranteeing uniqueness through element hashCode() and equals().',
    explanation: 'HashSet stores elements as keys in an internal HashMap with a dummy PRESENT value object. Duplicate additions return false.',
    code: `import java.util.Set;
import java.util.HashSet;

public class Main {
    public static void main(String[] args) {
        Set<String> set = new HashSet<>();
        set.add("Apple");
        set.add("Banana");
        set.add("Orange");

        boolean dupResult = set.add("Apple");
        boolean containsBanana = set.contains("Banana");

        System.out.println("Duplicate add result: " + dupResult);
        System.out.println("Contains Banana: " + containsBanana);
        System.out.println("Set size: " + set.size());
    }
}
`,
  },

  // ─── 09. LinkedHashSet ─────────────────────────────────────────────────────
  {
    id: 'p18-09-linkedhashset',
    title: '09 — LinkedHashSet (Predictable Insertion Order)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) average operations + O(N) iteration',
    spaceComplexity: 'O(N)',
    description: 'Hash table and linked list implementation of the Set interface with predictable iteration order.',
    explanation: 'LinkedHashSet maintains a doubly-linked list through all its entries, iterating in the exact sequence elements were inserted.',
    code: `import java.util.Set;
import java.util.LinkedHashSet;

public class Main {
    public static void main(String[] args) {
        Set<String> set = new LinkedHashSet<>();
        set.add("First");
        set.add("Second");
        set.add("Third");
        set.add("First"); // Duplicate ignored

        System.out.println("LinkedHashSet maintains insertion order:");
        for (String item : set) {
            System.out.println(" - " + item);
        }
    }
}
`,
  },

  // ─── 10. TreeSet ───────────────────────────────────────────────────────────
  {
    id: 'p18-10-treeset',
    title: '10 — TreeSet (Red-Black Sorted Set)',
    category: 'Java Collections & Generics',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(log N) add/contains/remove',
    spaceComplexity: 'O(N)',
    description: 'NavigableSet implementation based on a TreeMap Red-Black binary search tree sorted naturally.',
    explanation: 'TreeSet guarantees log(N) time cost for basic operations and enables range queries like first(), last(), and subset views.',
    code: `import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        TreeSet<Integer> set = new TreeSet<>();
        set.add(50);
        set.add(10);
        set.add(90);
        set.add(30);

        int minVal = set.first();
        int maxVal = set.last();

        System.out.println("Sorted First: " + minVal);
        System.out.println("Sorted Last: " + maxVal);
        System.out.println("Higher than 30: " + set.higher(30));
    }
}
`,
  },

  // ─── 11. HashMap ───────────────────────────────────────────────────────────
  {
    id: 'p18-11-hashmap',
    title: '11 — HashMap (Key-Value Hash Table)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) average put/get/remove',
    spaceComplexity: 'O(N)',
    description: 'Hash table based implementation of Map: hashing keys, resolving bucket index, and retrieving values.',
    explanation: 'HashMap computes Objects.hashCode(key) to index an array of Node buckets. Collisions form linked lists or balance trees in Java 8+.',
    code: `import java.util.Map;
import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();
        map.put("Alice", 95);
        map.put("Bob", 82);
        map.put("Charlie", 88);

        // Update existing key
        map.put("Bob", 89);

        int aliceScore = map.get("Alice");
        boolean hasCharlie = map.containsKey("Charlie");
        map.remove("Alice");

        System.out.println("Alice score was: " + aliceScore);
        System.out.println("Has Charlie: " + hasCharlie);
        System.out.println("Map size: " + map.size());
    }
}
`,
  },

  // ─── 12. LinkedHashMap ─────────────────────────────────────────────────────
  {
    id: 'p18-12-linkedhashmap',
    title: '12 — LinkedHashMap (Insertion-Ordered Map)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) average put/get',
    spaceComplexity: 'O(N)',
    description: 'Map implementation maintaining a doubly-linked list running through all its entries for deterministic iteration order.',
    explanation: 'LinkedHashMap allows predictable iteration without the cost of sorting a TreeMap. Useful for building LRU caches.',
    code: `import java.util.Map;
import java.util.LinkedHashMap;

public class Main {
    public static void main(String[] args) {
        Map<String, String> config = new LinkedHashMap<>();
        config.put("host", "localhost");
        config.put("port", "8080");
        config.put("mode", "production");

        System.out.println("LinkedHashMap iteration order:");
        for (Map.Entry<String, String> entry : config.entrySet()) {
            System.out.println(entry.getKey() + " -> " + entry.getValue());
        }
    }
}
`,
  },

  // ─── 13. TreeMap ───────────────────────────────────────────────────────────
  {
    id: 'p18-13-treemap',
    title: '13 — TreeMap (Sorted Map by Keys)',
    category: 'Java Collections & Generics',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(log N) put/get/remove',
    spaceComplexity: 'O(N)',
    description: 'Red-Black tree based NavigableMap implementation maintaining keys in natural or Comparator ascending order.',
    explanation: 'TreeMap keeps keys sorted at all times. Enables firstKey(), lastKey(), and range queries with O(log N) overhead.',
    code: `import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        TreeMap<String, Integer> treeMap = new TreeMap<>();
        treeMap.put("Zeta", 6);
        treeMap.put("Alpha", 1);
        treeMap.put("Gamma", 3);
        treeMap.put("Beta", 2);

        String firstKey = treeMap.firstKey();
        String lastKey = treeMap.lastKey();

        System.out.println("First sorted key: " + firstKey);
        System.out.println("Last sorted key: " + lastKey);
    }
}
`,
  },

  // ─── 14. Hashtable ─────────────────────────────────────────────────────────
  {
    id: 'p18-14-hashtable',
    title: '14 — Hashtable (Synchronized Map)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) average put/get',
    spaceComplexity: 'O(N)',
    description: 'Legacy synchronized hash table that does not permit null keys or null values.',
    explanation: 'Hashtable is synchronized and legacy. If thread safety is not needed, HashMap is preferred; if needed, ConcurrentHashMap is preferred.',
    code: `import java.util.Hashtable;

public class Main {
    public static void main(String[] args) {
        Hashtable<String, Integer> table = new Hashtable<>();
        table.put("ItemA", 100);
        table.put("ItemB", 200);
        table.put("ItemC", 300);

        int val = table.get("ItemB");
        System.out.println("ItemB value: " + val);
        System.out.println("Table size: " + table.size());
    }
}
`,
  },

  // ─── 15. Iterator ──────────────────────────────────────────────────────────
  {
    id: 'p18-15-iterator',
    title: '15 — Iterator Pattern & Safe Removal',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N) traversal',
    spaceComplexity: 'O(1)',
    description: 'Traversing a collection with java.util.Iterator and safely removing elements during iteration via it.remove().',
    explanation: 'Calling list.remove() inside a standard loop invalidates the cursor and throws ConcurrentModificationException. The Iterator.remove() method safely updates modCount.',
    code: `import java.util.List;
import java.util.ArrayList;
import java.util.Iterator;

public class Main {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("Apple");
        list.add("Banana");
        list.add("Cherry");
        list.add("Date");

        Iterator<String> it = list.iterator();
        while (it.hasNext()) {
            String item = it.next();
            if (item.equals("Banana")) {
                it.remove(); // Safe removal!
            }
        }

        System.out.println("Remaining items: " + list);
    }
}
`,
  },

  // ─── 16. ListIterator ──────────────────────────────────────────────────────
  {
    id: 'p18-16-listiterator',
    title: '16 — ListIterator (Bidirectional Traversal)',
    category: 'Java Collections & Generics',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N) traversal',
    spaceComplexity: 'O(1)',
    description: 'Bidirectional iteration over a List with forward next() and backward previous() cursors and inline replacement.',
    explanation: 'ListIterator extends Iterator to support bidirectional movement (hasPrevious, previous), element replacement (set), and element insertion (add).',
    code: `import java.util.List;
import java.util.ArrayList;
import java.util.ListIterator;

public class Main {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.add(30);

        ListIterator<Integer> lit = list.listIterator();
        while (lit.hasNext()) {
            int val = lit.next();
            if (val == 20) {
                lit.set(25); // In-place update
            }
        }

        System.out.println("Traversing backwards:");
        while (lit.hasPrevious()) {
            int prev = lit.previous();
            System.out.println(" - " + prev);
        }
    }
}
`,
  },

  // ─── 17. For-Each ──────────────────────────────────────────────────────────
  {
    id: 'p18-17-for-each',
    title: '17 — Enhanced For-Each Loop',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N) traversal',
    spaceComplexity: 'O(1)',
    description: 'Enhanced for loop syntax over Iterable collections compiled into an iterator under the hood.',
    explanation: 'The Java compiler translates for (Type x : iterable) into an Iterator while (it.hasNext()) { x = it.next(); } loop.',
    code: `import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        List<String> frameworks = new ArrayList<>();
        frameworks.add("Spring");
        frameworks.add("React");
        frameworks.add("Vite");

        System.out.println("Iterating with for-each loop:");
        for (String fw : frameworks) {
            System.out.println("Framework: " + fw);
        }
    }
}
`,
  },

  // ─── 18. Generic List ──────────────────────────────────────────────────────
  {
    id: 'p18-18-generic-list',
    title: '18 — Generic Type Constraints (List<T>)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) add/get',
    spaceComplexity: 'O(N)',
    description: 'Compile-time type safety preventing ClassCastException at runtime without manual type casting.',
    explanation: 'Prior to Java 5, collections stored raw Objects requiring manual casting. Generics enforce strict compile-time types that are erased at runtime.',
    code: `import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        List<Double> doubles = new ArrayList<>();
        doubles.add(3.14159);
        doubles.add(2.71828);
        doubles.add(1.61803);

        double first = doubles.get(0);
        double sum = 0.0;
        for (Double d : doubles) {
            sum += d;
        }

        System.out.println("First double: " + first);
        System.out.println("Sum of doubles: " + sum);
    }
}
`,
  },

  // ─── 19. Generic Map ───────────────────────────────────────────────────────
  {
    id: 'p18-19-generic-map',
    title: '19 — Generic Multi-Type Map (Map<K, V>)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1) average put/get',
    spaceComplexity: 'O(N)',
    description: 'Parameterizing both Key and Value types with distinct generic bounds.',
    explanation: 'Map<K, V> enforces compile-time typing for both key lookups and values returned by get(), preventing type mismatch errors.',
    code: `import java.util.Map;
import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        Map<Integer, String> statusCodes = new HashMap<>();
        statusCodes.put(200, "OK");
        statusCodes.put(404, "Not Found");
        statusCodes.put(500, "Internal Server Error");

        String msg404 = statusCodes.get(404);
        System.out.println("HTTP 404: " + msg404);
        System.out.println("Codes tracked: " + statusCodes.size());
    }
}
`,
  },

  // ─── 20. Generic Class ─────────────────────────────────────────────────────
  {
    id: 'p18-20-generic-class',
    title: '20 — Custom Generic Class (Box<T>)',
    category: 'Java Collections & Generics',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Defining a reusable generic class parameterized with type placeholder T.',
    explanation: 'Generic classes allow writing flexible, type-safe data containers. The JVM replaces T with Object or the upper bound during bytecode compilation.',
    code: `class Box<T> {
    private T content;

    public Box(T content) {
        this.content = content;
    }

    public T getContent() {
        return content;
    }

    public void setContent(T content) {
        this.content = content;
    }
}

public class Main {
    public static void main(String[] args) {
        Box<String> stringBox = new Box<>("Hello CodeFlow");
        Box<Integer> intBox = new Box<>(100);

        System.out.println("String Box: " + stringBox.getContent());
        System.out.println("Integer Box: " + intBox.getContent());
    }
}
`,
  },

  // ─── 21. Generic Method ────────────────────────────────────────────────────
  {
    id: 'p18-21-generic-method',
    title: '21 — Generic Method with Type Inference',
    category: 'Java Collections & Generics',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Declaring methods with their own type parameter <T> independent of the enclosing class.',
    explanation: 'Generic methods introduce type parameters scoped strictly to the method call. The compiler automatically infers T from the arguments.',
    code: `public class Main {
    public static <T> void printArray(T[] array) {
        for (T item : array) {
            System.out.print(item + " ");
        }
        System.out.println();
    }

    public static void main(String[] args) {
        String[] words = {"Java", "Collections", "Generics"};
        Integer[] nums = {1, 2, 3, 4, 5};

        System.out.print("Words: ");
        printArray(words);

        System.out.print("Numbers: ");
        printArray(nums);
    }
}
`,
  },

  // ─── 22. Nested Collections ────────────────────────────────────────────────
  {
    id: 'p18-22-nested-collections',
    title: '22 — Nested Collections (List<List<T>>)',
    category: 'Java Collections & Generics',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(R * C) traversal',
    spaceComplexity: 'O(R * C)',
    description: '2D matrix modeled as a nested collection: List of Lists with dynamic rows and columns.',
    explanation: 'Nested generic collections provide dynamic multi-dimensional representations without fixed array size limitations.',
    code: `import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        List<List<Integer>> matrix = new ArrayList<>();

        List<Integer> row0 = new ArrayList<>();
        row0.add(1);
        row0.add(2);
        matrix.add(row0);

        List<Integer> row1 = new ArrayList<>();
        row1.add(3);
        row1.add(4);
        matrix.add(row1);

        int val01 = matrix.get(0).get(1);
        System.out.println("Element at [0][1]: " + val01);
        System.out.println("Matrix rows: " + matrix.size());
    }
}
`,
  },

  // ─── 23. Map of Lists ──────────────────────────────────────────────────────
  {
    id: 'p18-23-map-of-lists',
    title: '23 — Map of Lists (Grouping & Multimap)',
    category: 'Java Collections & Generics',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1) average lookup + O(1) list append',
    spaceComplexity: 'O(N)',
    description: 'Building a one-to-many relationship mapping category keys to lists of elements.',
    explanation: 'A Map<K, List<V>> simulates a MultiMap data structure, commonly used for grouping operations in data processing pipelines.',
    code: `import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        Map<String, List<String>> categories = new HashMap<>();

        List<String> fruits = new ArrayList<>();
        fruits.add("Apple");
        fruits.add("Banana");
        categories.put("Fruits", fruits);

        List<String> veggies = new ArrayList<>();
        veggies.add("Carrot");
        veggies.add("Broccoli");
        categories.put("Vegetables", veggies);

        System.out.println("Fruits count: " + categories.get("Fruits").size());
        System.out.println("Categories registered: " + categories.size());
    }
}
`,
  },

  // ─── 24. Frequency Map ─────────────────────────────────────────────────────
  {
    id: 'p18-24-frequency-map',
    title: '24 — Frequency Map (Counting Occurrences)',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N) total passes, O(1) avg map lookup',
    spaceComplexity: 'O(U) where U is unique elements',
    description: 'Classic algorithm: counting word or character frequencies using Map.getOrDefault().',
    explanation: 'Using map.put(key, map.getOrDefault(key, 0) + 1) efficiently computes frequency distributions in linear time.',
    code: `import java.util.Map;
import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        String[] tokens = {"cat", "dog", "cat", "bird", "dog", "cat"};
        Map<String, Integer> freq = new HashMap<>();

        for (String token : tokens) {
            freq.put(token, freq.getOrDefault(token, 0) + 1);
        }

        System.out.println("Frequencies: " + freq);
        System.out.println("Cat count: " + freq.get("cat"));
    }
}
`,
  },

  // ─── 25. HashSet Duplicate Detection ───────────────────────────────────────
  {
    id: 'p18-25-hashset-duplicates',
    title: '25 — HashSet Duplicate Detection',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N) time',
    spaceComplexity: 'O(N) space',
    description: 'Detecting duplicates in linear time by checking the boolean return value of set.add().',
    explanation: 'In Java, set.add(val) returns false when an item already exists in the set, enabling O(N) duplicate detection in a single pass.',
    code: `import java.util.Set;
import java.util.HashSet;
import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        int[] stream = {5, 2, 9, 2, 7, 5, 8};
        Set<Integer> seen = new HashSet<>();
        List<Integer> duplicates = new ArrayList<>();

        for (int num : stream) {
            if (!seen.add(num)) {
                duplicates.add(num);
            }
        }

        System.out.println("Unique items seen: " + seen.size());
        System.out.println("Duplicates found: " + duplicates);
    }
}
`,
  },

  // ─── 26. Collection Exception ──────────────────────────────────────────────
  {
    id: 'p18-26-collection-exception',
    title: '26 — IndexOutOfBoundsException Handling',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Gracefully handling runtime IndexOutOfBoundsException when requesting an invalid collection index.',
    explanation: 'Accessing an index >= size() throws IndexOutOfBoundsException. Catching it demonstrates resilient error handling in Java.',
    code: `import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("SingleItem");

        try {
            System.out.println("Attempting to access index 5...");
            String item = list.get(5);
        } catch (IndexOutOfBoundsException e) {
            System.out.println("Safely caught IndexOutOfBoundsException: " + e.getMessage());
        }

        System.out.println("Program recovered normally.");
    }
}
`,
  },

  // ─── 27. ConcurrentModificationException ───────────────────────────────────
  {
    id: 'p18-27-concurrent-mod',
    title: '27 — Fail-Fast & ConcurrentModificationException',
    category: 'Java Collections & Generics',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1) exception trigger',
    spaceComplexity: 'O(1)',
    description: 'Demonstrating the JVM collections fail-fast mechanism when mutating a collection during for-each iteration.',
    explanation: 'ArrayList tracks internal modCount. If modCount changes during iteration without using the iterator method, the JVM throws ConcurrentModificationException.',
    code: `import java.util.List;
import java.util.ArrayList;
import java.util.ConcurrentModificationException;

public class Main {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("Item-1");
        list.add("Item-2");
        list.add("Item-3");

        try {
            for (String item : list) {
                if (item.equals("Item-2")) {
                    list.remove(item); // Illegal concurrent modification!
                }
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("Fail-fast triggered: ConcurrentModificationException caught!");
        }

        System.out.println("Execution resumed safely.");
    }
}
`,
  },

  // ─── 28. Collection Aliasing ───────────────────────────────────────────────
  {
    id: 'p18-28-aliasing',
    title: '28 — Collection Reference Aliasing',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Demonstrating that assigning one collection variable to another creates a reference alias, not a deep copy.',
    explanation: 'In Java, List<T> b = a assigns the memory address reference. Mutating b directly affects a because both point to the exact same heap object.',
    code: `import java.util.List;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        List<Integer> original = new ArrayList<>();
        original.add(10);
        original.add(20);

        // Alias: same heap reference
        List<Integer> alias = original;
        alias.add(30);

        System.out.println("Original size after mutating alias: " + original.size());
        System.out.println("Are references identical? " + (original == alias));
    }
}
`,
  },

  // ─── 29. Collection Null Reference ─────────────────────────────────────────
  {
    id: 'p18-29-null-reference',
    title: '29 — NullPointerException on Collection',
    category: 'Java Collections & Generics',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Attempting to call methods on an uninitialized collection reference causing NullPointerException.',
    explanation: 'Declaring List<String> list; without assigning new ArrayList<>() leaves the reference null. Dereferencing triggers NullPointerException.',
    code: `import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> uninitializedList = null;

        try {
            System.out.println("Attempting add on null collection reference...");
            uninitializedList.add("Data");
        } catch (NullPointerException e) {
            System.out.println("Safely caught NullPointerException: reference was null!");
        }

        System.out.println("Graceful continuation complete.");
    }
}
`,
  },

  // ─── 30. Complete Collections Demo ─────────────────────────────────────────
  {
    id: 'p18-30-complete-demo',
    title: '30 — Complete Java Collections Ecosystem Demo',
    category: 'Java Collections & Generics',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N log N) sorting + O(N) filtering',
    spaceComplexity: 'O(N)',
    description: 'Comprehensive pipeline: ArrayList data ingestion, HashSet deduplication, HashMap indexing, and Collections.sort().',
    explanation: 'Combining multiple Java collections: Lists for sequential ordering, Sets for deduplication, Maps for indexing, and utility methods like Collections.sort().',
    code: `import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;
import java.util.Map;
import java.util.HashMap;
import java.util.Collections;

public class Main {
    public static void main(String[] args) {
        // 1. Raw inputs with duplicates
        List<String> rawNames = new ArrayList<>();
        rawNames.add("Charlie");
        rawNames.add("Alice");
        rawNames.add("Bob");
        rawNames.add("Alice");

        // 2. Deduplicate using HashSet
        Set<String> uniqueSet = new HashSet<>(rawNames);

        // 3. Convert back to list and sort using Collections utility
        List<String> sortedNames = new ArrayList<>(uniqueSet);
        Collections.sort(sortedNames);

        // 4. Index lengths into a HashMap
        Map<String, Integer> lengthMap = new HashMap<>();
        for (String name : sortedNames) {
            lengthMap.put(name, name.length());
        }

        System.out.println("Sorted unique names: " + sortedNames);
        System.out.println("Name lengths map: " + lengthMap);
    }
}
`,
  },
];
