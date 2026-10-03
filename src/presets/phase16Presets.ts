import { CodePreset } from '../types/execution';

export const PHASE16_PRESETS: CodePreset[] = [
  // 35 Complete Collections Demo (Grand Demo, Section 67)
  {
    id: 'java-phase16-grand-collections-demo',
    title: 'Phase 16 Grand Collections & Data Structures Demo',
    category: 'Java Collections & Data Structures',
    difficulty: 'Hard',
    language: 'java',
    description:
      'The comprehensive Java Collections demonstration: ArrayList, LinkedList, HashSet, HashMap, TreeMap, PriorityQueue, ArrayDeque, Nested Collections, Custom Objects, and Iterators.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    code: `import java.util.*;

class Student {
    int id;
    String name;

    Student(int id, String name) {
        this.id = id;
        this.name = name;
    }
}

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.add(30);

        LinkedList<Integer> linked = new LinkedList<>();
        linked.add(100);
        linked.add(200);

        HashSet<Integer> set = new HashSet<>();
        set.add(10);
        set.add(20);

        HashMap<Integer, String> map = new HashMap<>();
        map.put(1, "Java");
        map.put(2, "Spring");

        TreeMap<Integer, String> treeMap = new TreeMap<>();
        treeMap.put(30, "C");
        treeMap.put(10, "A");
        treeMap.put(20, "B");

        PriorityQueue<Integer> pq = new PriorityQueue<>();
        pq.offer(30);
        pq.offer(10);
        pq.offer(20);

        ArrayDeque<Integer> deque = new ArrayDeque<>();
        deque.addFirst(10);
        deque.addLast(20);

        List<List<Integer>> nested = new ArrayList<>();
        nested.add(new ArrayList<>());
        nested.get(0).add(100);

        Student s = new Student(1, "Ashrith");
        ArrayList<Student> students = new ArrayList<>();
        students.add(s);

        Iterator<Integer> iterator = list.iterator();
        while (iterator.hasNext()) {
            System.out.println(iterator.next());
        }
    }
}`,
    explanation:
      'Demonstrates concurrent execution and state visualization of all major Java Collections: ArrayList, LinkedList, HashSet, HashMap, TreeMap, PriorityQueue, ArrayDeque, nested list of lists, custom heap objects, and Iterator traversal.',
  },

  // 01 ArrayList Basics
  {
    id: 'java-phase16-arraylist-basics',
    title: 'ArrayList Basics & Dynamic Resizing',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Instantiates an ArrayList, appends elements, and inspects size and elements.',
    timeComplexity: 'O(1) amortized',
    spaceComplexity: 'O(N)',
    code: `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.add(30);

        System.out.println("Size: " + list.size());
        System.out.println(list);
    }
}`,
    explanation:
      'ArrayList is an index-based resizable array. Calling add() appends elements to the internal buffer and increments size.',
  },

  // 02 ArrayList Insert/Remove
  {
    id: 'java-phase16-arraylist-insert-remove',
    title: 'ArrayList Index Insertion & Element Shifting',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Demonstrates index-based insertion and removal causing downstream element shifting.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    code: `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.add(30);

        // Insert 50 at index 1 -> shifts 20, 30 right
        list.add(1, 50);
        System.out.println(list);

        // Remove element at index 2 -> shifts remaining left
        list.remove(2);
        System.out.println(list);
    }
}`,
    explanation:
      'Adding at an intermediate index shifts all subsequent elements to the right. Removing an element shifts elements to the left to close the gap.',
  },

  // 03 ArrayList Index Access
  {
    id: 'java-phase16-arraylist-index-access',
    title: 'ArrayList get, set & indexOf',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'O(1) random access get(index), set(index, value), and contains(value).',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> fruits = new ArrayList<>();
        fruits.add("Apple");
        fruits.add("Banana");
        fruits.add("Cherry");

        String second = fruits.get(1);
        System.out.println("Item at index 1: " + second);

        fruits.set(1, "Blueberry");
        System.out.println("Updated: " + fruits.get(1));

        boolean hasApple = fruits.contains("Apple");
        System.out.println("Contains Apple: " + hasApple);
    }
}`,
    explanation:
      'ArrayList provides O(1) time complexity for get() and set() because elements are stored in contiguous memory.',
  },

  // 04 ArrayList Aliasing
  {
    id: 'java-phase16-arraylist-aliasing',
    title: 'ArrayList Reference Aliasing',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Shows two reference variables pointing to the exact same ArrayList heap object.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> a = new ArrayList<>();
        a.add(10);
        a.add(20);

        ArrayList<Integer> b = a; // Aliasing
        b.add(30);

        System.out.println("a size: " + a.size());
        System.out.println("b size: " + b.size());
        System.out.println("Are same instance: " + (a == b));
    }
}`,
    explanation:
      'Variables a and b store the same memory reference. Modifying the list through b immediately reflects on a.',
  },

  // 05 LinkedList Basics
  {
    id: 'java-phase16-linkedlist-basics',
    title: 'LinkedList Doubly-Linked Node Chain',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Visualizes LinkedList as doubly-linked nodes with head, tail, prev, and next pointers.',
    timeComplexity: 'O(1) at ends',
    spaceComplexity: 'O(N)',
    code: `import java.util.LinkedList;

public class Main {
    public static void main(String[] args) {
        LinkedList<String> list = new LinkedList<>();
        list.add("First");
        list.add("Middle");
        list.add("Last");

        System.out.println("Head: " + list.getFirst());
        System.out.println("Tail: " + list.getLast());
        System.out.println("Size: " + list.size());
    }
}`,
    explanation:
      'Java LinkedList is implemented as a doubly-linked list. Each node contains a data element and pointers to previous and next nodes.',
  },

  // 06 LinkedList Insert/Remove
  {
    id: 'java-phase16-linkedlist-insert-remove',
    title: 'LinkedList Node Insertion & Removal',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Demonstrates unlinking nodes in a doubly-linked list when removing elements.',
    timeComplexity: 'O(1) ends, O(N) middle',
    spaceComplexity: 'O(1)',
    code: `import java.util.LinkedList;

public class Main {
    public static void main(String[] args) {
        LinkedList<Integer> list = new LinkedList<>();
        list.add(10);
        list.add(20);
        list.add(30);

        list.addFirst(5);
        list.addLast(40);
        System.out.println(list);

        list.removeFirst();
        list.remove(1); // removes 20
        System.out.println(list);
    }
}`,
    explanation:
      'addFirst and addLast operate in O(1) by updating head/tail node pointers without shifting array elements.',
  },

  // 07 Vector
  {
    id: 'java-phase16-vector',
    title: 'Vector Dynamic Growth & Capacity',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Inspects Vector capacity, size, and synchronized legacy collection operations.',
    timeComplexity: 'O(1) amortized',
    spaceComplexity: 'O(N)',
    code: `import java.util.Vector;

public class Main {
    public static void main(String[] args) {
        Vector<Integer> v = new Vector<>();
        v.add(10);
        v.add(20);
        v.add(30);

        System.out.println("Size: " + v.size());
        System.out.println("Capacity: " + v.capacity());
        System.out.println("Element at 1: " + v.get(1));
    }
}`,
    explanation:
      'Vector is a synchronized resizable array that maintains an explicit internal capacity and doubles when exhausted.',
  },

  // 08 Stack
  {
    id: 'java-phase16-stack',
    title: 'Stack LIFO: push, pop, peek & search',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Visualizes Last-In-First-Out (LIFO) operations on java.util.Stack.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    code: `import java.util.Stack;

public class Main {
    public static void main(String[] args) {
        Stack<Integer> stack = new Stack<>();
        stack.push(10);
        stack.push(20);
        stack.push(30);

        System.out.println("Top: " + stack.peek());

        int popped = stack.pop();
        System.out.println("Popped: " + popped);
        System.out.println("New Top: " + stack.peek());
    }
}`,
    explanation:
      'Stack extends Vector and provides LIFO access with push() onto top and pop() from top.',
  },

  // 09 ArrayDeque
  {
    id: 'java-phase16-arraydeque',
    title: 'ArrayDeque Double-Ended Queue',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Circular resizable array buffer supporting insertions and removals at both ends.',
    timeComplexity: 'O(1) amortized',
    spaceComplexity: 'O(N)',
    code: `import java.util.ArrayDeque;

public class Main {
    public static void main(String[] args) {
        ArrayDeque<String> deque = new ArrayDeque<>();
        deque.addFirst("Middle");
        deque.addFirst("Front");
        deque.addLast("Rear");

        System.out.println("First: " + deque.peekFirst());
        System.out.println("Last: " + deque.peekLast());

        deque.pollFirst();
        deque.pollLast();
        System.out.println("Remaining: " + deque);
    }
}`,
    explanation:
      'ArrayDeque is faster than Stack when used as a stack and faster than LinkedList when used as a queue.',
  },

  // 10 Queue
  {
    id: 'java-phase16-queue',
    title: 'Queue Interface: offer, poll & peek',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'First-In-First-Out (FIFO) queue semantics backed by LinkedList.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    code: `import java.util.LinkedList;
import java.util.Queue;

public class Main {
    public static void main(String[] args) {
        Queue<Integer> queue = new LinkedList<>();
        queue.offer(10);
        queue.offer(20);
        queue.offer(30);

        System.out.println("Front: " + queue.peek());

        int served = queue.poll();
        System.out.println("Served: " + served);
        System.out.println("Next: " + queue.peek());
    }
}`,
    explanation:
      'Queue implements FIFO order: offer() inserts at rear, poll() retrieves and removes from front.',
  },

  // 11 PriorityQueue
  {
    id: 'java-phase16-priorityqueue',
    title: 'PriorityQueue Binary Min-Heap',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Maintains min-heap property where the smallest element is always at the head.',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(N)',
    code: `import java.util.PriorityQueue;

public class Main {
    public static void main(String[] args) {
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        pq.offer(40);
        pq.offer(10);
        pq.offer(30);
        pq.offer(20);

        System.out.println("Min Element: " + pq.peek()); // 10

        while (!pq.isEmpty()) {
            System.out.println("Polled: " + pq.poll());
        }
    }
}`,
    explanation:
      'PriorityQueue stores elements in an internal binary heap array, ensuring the root node is always the lowest element according to natural ordering.',
  },

  // 12 HashSet
  {
    id: 'java-phase16-hashset',
    title: 'HashSet Uniqueness & Hash Lookup',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Prevents duplicate values using hash codes and internal hash buckets.',
    timeComplexity: 'O(1) average',
    spaceComplexity: 'O(N)',
    code: `import java.util.HashSet;

public class Main {
    public static void main(String[] args) {
        HashSet<String> set = new HashSet<>();
        set.add("Apple");
        set.add("Banana");
        boolean addedAgain = set.add("Apple"); // duplicate rejected

        System.out.println("Was duplicate added: " + addedAgain);
        System.out.println("Size: " + set.size());
        System.out.println("Contains Banana: " + set.contains("Banana"));
    }
}`,
    explanation:
      'HashSet delegates to an internal HashMap. When adding an element, it hashes the value and rejects duplicates if already present in the bucket.',
  },

  // 13 HashSet Collision Concept
  {
    id: 'java-phase16-hashset-collision',
    title: 'HashSet Hash Codes & Bucket Distribution',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Inspects multiple items added to a HashSet and their hash uniqueness.',
    timeComplexity: 'O(1) average',
    spaceComplexity: 'O(N)',
    code: `import java.util.HashSet;

public class Main {
    public static void main(String[] args) {
        HashSet<Integer> set = new HashSet<>();
        set.add(10);
        set.add(26);
        set.add(42);

        System.out.println("Set size: " + set.size());
        for (int val : set) {
            System.out.println("Element: " + val);
        }
    }
}`,
    explanation:
      'Hash-based collections calculate bucket indices by hashing keys. Multiple keys that map to the same bucket index form a collision chain.',
  },

  // 14 LinkedHashSet
  {
    id: 'java-phase16-linkedhashset',
    title: 'LinkedHashSet: Uniqueness + Insertion Order',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Preserves the predictable iteration order in which elements were inserted.',
    timeComplexity: 'O(1) average',
    spaceComplexity: 'O(N)',
    code: `import java.util.LinkedHashSet;

public class Main {
    public static void main(String[] args) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        set.add("Zebra");
        set.add("Elephant");
        set.add("Ant");

        System.out.println("Order preserved:");
        for (String animal : set) {
            System.out.println(animal);
        }
    }
}`,
    explanation:
      'LinkedHashSet maintains a doubly-linked list through all of its entries, ensuring predictable iteration matching insertion order.',
  },

  // 15 TreeSet
  {
    id: 'java-phase16-treeset',
    title: 'TreeSet Sorted Balanced Binary Tree',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Maintains sorted order using a Red-Black Tree and supports range navigation.',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(N)',
    code: `import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        TreeSet<Integer> set = new TreeSet<>();
        set.add(50);
        set.add(20);
        set.add(80);
        set.add(10);

        System.out.println("Sorted: " + set);
        System.out.println("First: " + set.first());
        System.out.println("Last: " + set.last());
        System.out.println("Higher than 20: " + set.higher(20));
    }
}`,
    explanation:
      'TreeSet elements are stored in a self-balancing binary search tree, providing guaranteed O(log N) cost for add, remove, and contains.',
  },

  // 16 HashMap
  {
    id: 'java-phase16-hashmap',
    title: 'HashMap Key-Value Mappings',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Associative key-value store with O(1) average lookup time.',
    timeComplexity: 'O(1) average',
    spaceComplexity: 'O(N)',
    code: `import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        HashMap<String, Integer> scores = new HashMap<>();
        scores.put("Alice", 95);
        scores.put("Bob", 82);
        scores.put("Charlie", 88);

        System.out.println("Alice score: " + scores.get("Alice"));
        System.out.println("Contains Bob: " + scores.containsKey("Bob"));
        System.out.println("Map size: " + scores.size());
    }
}`,
    explanation:
      'HashMap hashes keys into an array of buckets. Each entry stores a key and value.',
  },

  // 17 HashMap Update
  {
    id: 'java-phase16-hashmap-update',
    title: 'HashMap Value Update & Replacement',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Replaces the value associated with an existing key.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        HashMap<Integer, String> status = new HashMap<>();
        status.put(200, "OK");
        status.put(404, "Not Found");

        System.out.println("Initial 200: " + status.get(200));

        status.put(200, "Success"); // Update existing key
        System.out.println("Updated 200: " + status.get(200));
        System.out.println("Size remains 2: " + status.size());
    }
}`,
    explanation:
      'Calling put() with an existing key overwrites the previous value and returns the old value without changing map size.',
  },

  // 18 HashMap Removal
  {
    id: 'java-phase16-hashmap-removal',
    title: 'HashMap Key Removal & clear()',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Removes key-value pairs and clears map storage.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        HashMap<String, String> map = new HashMap<>();
        map.put("US", "Washington");
        map.put("FR", "Paris");
        map.put("JP", "Tokyo");

        map.remove("FR");
        System.out.println("Contains FR: " + map.containsKey("FR"));
        System.out.println("Size: " + map.size());

        map.clear();
        System.out.println("After clear size: " + map.size());
    }
}`,
    explanation:
      'remove(key) detaches the entry from its bucket. clear() nulls all internal bucket references.',
  },

  // 19 LinkedHashMap
  {
    id: 'java-phase16-linkedhashmap',
    title: 'LinkedHashMap Insertion Order Preservation',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Maintains a running doubly-linked list through all map entries.',
    timeComplexity: 'O(1) average',
    spaceComplexity: 'O(N)',
    code: `import java.util.LinkedHashMap;

public class Main {
    public static void main(String[] args) {
        LinkedHashMap<String, Integer> map = new LinkedHashMap<>();
        map.put("Three", 3);
        map.put("One", 1);
        map.put("Two", 2);

        for (String key : map.keySet()) {
            System.out.println(key + " -> " + map.get(key));
        }
    }
}`,
    explanation:
      'LinkedHashMap ensures that iterating through keys or entries preserves the exact order they were inserted.',
  },

  // 20 TreeMap
  {
    id: 'java-phase16-treemap',
    title: 'TreeMap Sorted Keys & Range Queries',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Red-Black Tree sorted map with firstKey, lastKey, and ceilingKey.',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(N)',
    code: `import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        TreeMap<Integer, String> treeMap = new TreeMap<>();
        treeMap.put(30, "Thirty");
        treeMap.put(10, "Ten");
        treeMap.put(20, "Twenty");

        System.out.println("Lowest Key: " + treeMap.firstKey());
        System.out.println("Highest Key: " + treeMap.lastKey());
        System.out.println("Ceiling Key of 15: " + treeMap.ceilingKey(15));
    }
}`,
    explanation:
      'TreeMap orders keys according to their natural comparison order, enabling logarithmic time search and range operations.',
  },

  // 21 Iterator
  {
    id: 'java-phase16-iterator',
    title: 'Iterator Sequential Traversal & remove()',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Visualizes active cursor advancement with hasNext() and next().',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    code: `import java.util.ArrayList;
import java.util.Iterator;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("Alpha");
        list.add("Beta");
        list.add("Gamma");

        Iterator<String> it = list.iterator();
        while (it.hasNext()) {
            String item = it.next();
            System.out.println("Item: " + item);
        }
    }
}`,
    explanation:
      'An Iterator maintains an internal cursor position pointing between elements, advancing one step on each next() call.',
  },

  // 22 ListIterator
  {
    id: 'java-phase16-listiterator',
    title: 'ListIterator Bidirectional Traversal',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Allows forward and backward navigation with previous() and next().',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    code: `import java.util.ArrayList;
import java.util.ListIterator;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.add(30);

        ListIterator<Integer> lit = list.listIterator();
        while (lit.hasNext()) {
            lit.next();
        }

        System.out.println("Traversing backward:");
        while (lit.hasPrevious()) {
            System.out.println(lit.previous());
        }
    }
}`,
    explanation:
      'ListIterator allows moving both forward (next) and backward (previous), and inspecting previousIndex and nextIndex.',
  },

  // 23 Comparable
  {
    id: 'java-phase16-comparable',
    title: 'Comparable Natural Ordering: compareTo()',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Implements Comparable<T> to define the natural sorting order of custom objects.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `class Item implements Comparable<Item> {
    int price;

    Item(int price) {
        this.price = price;
    }

    @Override
    public int compareTo(Item other) {
        return Integer.compare(this.price, other.price);
    }
}

public class Main {
    public static void main(String[] args) {
        Item a = new Item(50);
        Item b = new Item(100);

        int cmp = a.compareTo(b);
        System.out.println("Comparison result: " + cmp);
        System.out.println("a comes before b: " + (cmp < 0));
    }
}`,
    explanation:
      'compareTo() returns a negative integer if this object precedes other, zero if equal, or positive if it succeeds.',
  },

  // 24 Comparator
  {
    id: 'java-phase16-comparator',
    title: 'Comparator Custom Sorting: compare()',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Defines external comparison logic using lambda expressions.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `import java.util.Comparator;

public class Main {
    public static void main(String[] args) {
        Comparator<Integer> descending = (x, y) -> y - x;

        int res = descending.compare(10, 20);
        System.out.println("Result: " + res);
        System.out.println("20 comes before 10: " + (res > 0));
    }
}`,
    explanation:
      'Comparator decouples ordering logic from the class itself, allowing multiple independent sorting strategies.',
  },

  // 25 Collections.sort
  {
    id: 'java-phase16-collections-sort',
    title: 'Collections.sort() Natural & Custom Order',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Sorts a list in place using TimSort algorithm.',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(N)',
    code: `import java.util.ArrayList;
import java.util.Collections;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> nums = new ArrayList<>();
        nums.add(40);
        nums.add(10);
        nums.add(30);
        nums.add(20);

        System.out.println("Before: " + nums);
        Collections.sort(nums);
        System.out.println("After sort: " + nums);
    }
}`,
    explanation:
      'Collections.sort() performs an adaptive, stable, in-place merge-insertion sort (TimSort) with O(N log N) worst-case time.',
  },

  // 26 Collection Utility Methods
  {
    id: 'java-phase16-collection-utilities',
    title: 'Collections Utilities: reverse, swap & min/max',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Demonstrates common library utility algorithms operating on lists.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    code: `import java.util.ArrayList;
import java.util.Collections;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(1);
        list.add(2);
        list.add(3);

        Collections.reverse(list);
        System.out.println("Reversed: " + list);

        Collections.swap(list, 0, 2);
        System.out.println("Swapped: " + list);

        System.out.println("Max: " + Collections.max(list));
        System.out.println("Min: " + Collections.min(list));
    }
}`,
    explanation:
      'java.util.Collections provides static algorithms that operate directly on collections, modifying order or inspecting extrema.',
  },

  // 27 Nested Lists
  {
    id: 'java-phase16-nested-lists',
    title: 'Nested Collections: List<List<Integer>>',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Visualizes two-dimensional nested list structures representing adjacency matrices or tables.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    code: `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<List<Integer>> matrix = new ArrayList<>();
        matrix.add(new ArrayList<>());
        matrix.add(new ArrayList<>());

        matrix.get(0).add(10);
        matrix.get(0).add(20);
        matrix.get(1).add(30);

        System.out.println("Row 0: " + matrix.get(0));
        System.out.println("Row 1: " + matrix.get(1));
    }
}`,
    explanation:
      'An outer ArrayList contains references to inner ArrayList instances on the heap, enabling dynamic multidimensional structures.',
  },

  // 28 Map of Lists
  {
    id: 'java-phase16-map-of-lists',
    title: 'Nested Collections: Map<Integer, List<Integer>>',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Visualizes an adjacency list graph representation using a HashMap mapping vertex IDs to neighbor lists.',
    timeComplexity: 'O(1) average',
    spaceComplexity: 'O(V + E)',
    code: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<Integer, List<Integer>> graph = new HashMap<>();
        graph.put(0, new ArrayList<>());
        graph.put(1, new ArrayList<>());

        graph.get(0).add(1);
        graph.get(0).add(2);
        graph.get(1).add(2);

        System.out.println("Node 0 neighbors: " + graph.get(0));
        System.out.println("Node 1 neighbors: " + graph.get(1));
    }
}`,
    explanation:
      'Demonstrates combining HashMaps and Lists to model complex relational structures such as graphs.',
  },

  // 29 Collection of Custom Objects
  {
    id: 'java-phase16-collection-custom-objects',
    title: 'ArrayList with Custom Objects & References',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Stores custom class instances inside a collection and inspects object fields.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    code: `import java.util.ArrayList;

class Book {
    String title;
    double price;

    Book(String title, double price) {
        this.title = title;
        this.price = price;
    }
}

public class Main {
    public static void main(String[] args) {
        ArrayList<Book> books = new ArrayList<>();
        books.add(new Book("Clean Code", 45.0));
        books.add(new Book("Effective Java", 55.0));

        for (Book b : books) {
            System.out.println(b.title + " : $" + b.price);
        }
    }
}`,
    explanation:
      'The ArrayList stores references to Book instances allocated on the heap, allowing inspection of individual fields.',
  },

  // 30 Multiple Collections
  {
    id: 'java-phase16-multiple-collections',
    title: 'Multiple Independent Collections in Memory',
    category: 'Java Collections & Data Structures',
    difficulty: 'Medium',
    language: 'java',
    description:
      'Simultaneously manages an ArrayList, a HashSet, and a PriorityQueue without cross-contamination.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    code: `import java.util.ArrayList;
import java.util.HashSet;
import java.util.PriorityQueue;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);

        HashSet<Integer> set = new HashSet<>();
        set.add(100);
        set.add(200);

        PriorityQueue<Integer> pq = new PriorityQueue<>();
        pq.offer(5);
        pq.offer(15);

        System.out.println("List: " + list);
        System.out.println("Set: " + set);
        System.out.println("PQ Min: " + pq.peek());
    }
}`,
    explanation:
      'The engine reconstructs and visualizes multiple independent data structures simultaneously in the same execution step.',
  },

  // 31 Collection Aliasing
  {
    id: 'java-phase16-collection-aliasing-deep',
    title: 'Collection Aliasing & State Synchronization',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Mutations through one reference immediately reflect across all aliased references.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> ref1 = new ArrayList<>();
        ref1.add("Initial");

        ArrayList<String> ref2 = ref1;
        ref2.add("Added via ref2");

        System.out.println("ref1 sees: " + ref1);
        System.out.println("Same object: " + (ref1 == ref2));
    }
}`,
    explanation:
      'Because ref1 and ref2 share the same heap object address, modifications through either variable affect the underlying collection.',
  },

  // 32 Collection Null Values
  {
    id: 'java-phase16-collection-nulls',
    title: 'Collections with Null Elements and Keys',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Shows how ArrayList and HashMap safely handle null elements and keys.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `import java.util.ArrayList;
import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("Valid");
        list.add(null); // explicit null element
        list.add("End");

        HashMap<String, String> map = new HashMap<>();
        map.put(null, "NullKeyEntry");
        map.put("Key", null);

        System.out.println("List element at 1: " + list.get(1));
        System.out.println("Map with null key: " + map.get(null));
        System.out.println("Map with null value: " + map.get("Key"));
    }
}`,
    explanation:
      'Java ArrayList and HashMap permit null values. HashMap maps null keys to bucket index 0.',
  },

  // 33 ConcurrentModificationException
  {
    id: 'java-phase16-fail-fast-iterator',
    title: 'Fail-Fast Iterator & ConcurrentModificationException',
    category: 'Java Collections & Data Structures',
    difficulty: 'Hard',
    language: 'java',
    description:
      'Catches and visualizes a ConcurrentModificationException when mutating a collection during iteration.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.Iterator;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.add(30);

        try {
            Iterator<Integer> it = list.iterator();
            while (it.hasNext()) {
                int val = it.next();
                if (val == 20) {
                    list.add(40); // Direct modification invalidates iterator
                }
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("Caught expected: " + e.getClass().getSimpleName());
        }
    }
}`,
    explanation:
      'Java iterators are fail-fast: if the underlying collection is structurally modified during iteration, the iterator detects modCount mismatch and throws ConcurrentModificationException.',
  },

  // 34 Collection Exceptions
  {
    id: 'java-phase16-collection-exceptions',
    title: 'IndexOutOfBoundsException in Collections',
    category: 'Java Collections & Data Structures',
    difficulty: 'Easy',
    language: 'java',
    description:
      'Catches IndexOutOfBoundsException when accessing an invalid collection index.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    code: `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(100);

        try {
            int outOfBounds = list.get(5); // illegal index
            System.out.println(outOfBounds);
        } catch (IndexOutOfBoundsException e) {
            System.out.println("Caught: " + e.getClass().getSimpleName());
        }
    }
}`,
    explanation:
      'Accessing an index >= size throws IndexOutOfBoundsException, unwinding the call stack into the catch handler.',
  },
];
