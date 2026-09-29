import { CodePreset } from '../types/execution';

export const PHASE_13_CONCURRENCY_PRESETS: CodePreset[] = [
  // ─── 01. Creating a Thread ────────────────────────────────────────────────
  {
    id: 'p13-01-creating-thread',
    title: '01 — Creating a Thread (Thread Subclass)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Creating an independent JVM execution thread by extending Thread and overriding run().',
    explanation: 'Extending java.lang.Thread allows defining custom concurrent behavior in the run() method.',
    code: `class WorkerThread extends Thread {
    @Override
    public void run() {
        System.out.println("Worker thread executing on independent stack!");
    }
}

public class Main {
    public static void main(String[] args) {
        WorkerThread worker = new WorkerThread();
        worker.start();
        try {
            worker.join();
        } catch (InterruptedException e) {}
        System.out.println("Main thread resumed after worker finished.");
    }
}
`,
  },

  // ─── 02. Runnable ─────────────────────────────────────────────────────────
  {
    id: 'p13-02-runnable-interface',
    title: '02 — Runnable Interface (Task Separation)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Decoupling task definition from thread execution using java.lang.Runnable.',
    explanation: 'Implementing Runnable is preferred over extending Thread because it separates the task logic from the execution mechanism.',
    code: `public class Main {
    public static void main(String[] args) {
        Runnable task = () -> {
            System.out.println("Runnable task executing!");
        };

        Thread thread = new Thread(task);
        thread.start();
        try {
            thread.join();
        } catch (InterruptedException e) {}
        System.out.println("Task completed.");
    }
}
`,
  },

  // ─── 03. Thread.start() ───────────────────────────────────────────────────
  {
    id: 'p13-03-thread-start',
    title: '03 — Thread.start() (Spawning Execution)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Calling start() allocates a new call stack and registers the thread with the JVM/OS scheduler.',
    explanation: 't.start() transitions the thread from NEW to RUNNABLE. It does not mean the thread executes instantly; scheduling is controlled by the JVM/OS.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread t = new Thread(() -> {
            System.out.println("Thread started and running concurrently!");
        });

        System.out.println("Before start: Thread is in NEW state.");
        t.start();
        try {
            t.join();
        } catch (InterruptedException e) {}
        System.out.println("After join: Thread has TERMINATED.");
    }
}
`,
  },

  // ─── 04. Thread.run() vs start() ──────────────────────────────────────────
  {
    id: 'p13-04-run-vs-start',
    title: '04 — start() vs run() (Synchronous Warning)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Demonstrating that calling run() directly executes synchronously on the caller thread without spawning a new thread.',
    explanation: 'Calling run() directly is just a normal method invocation on the current thread stack. start() must be called to create a new JVM thread.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread t = new Thread(() -> {
            System.out.println("Running on thread: " + Thread.currentThread().getName());
        });

        System.out.println("Calling t.run() directly:");
        t.run(); // Warning: Runs on main thread!

        System.out.println("Calling t.start() to spawn new thread:");
        t.start();
        try {
            t.join();
        } catch (InterruptedException e) {}
    }
}
`,
  },

  // ─── 05. Thread.sleep() ───────────────────────────────────────────────────
  {
    id: 'p13-05-thread-sleep',
    title: '05 — Thread.sleep() (TIMED_WAITING)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Thread.sleep transitions the thread state to TIMED_WAITING without relinquishing acquired locks.',
    explanation: 'sleep() pauses execution for a specified duration. Crucially, sleep() does NOT release any monitor locks acquired by the thread.',
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Main thread about to sleep for 300ms...");
        try {
            Thread.sleep(300);
        } catch (InterruptedException e) {}
        System.out.println("Main thread woke up and resumed RUNNABLE state.");
    }
}
`,
  },

  // ─── 06. Thread.join() ────────────────────────────────────────────────────
  {
    id: 'p13-06-thread-join',
    title: '06 — Thread.join() (Coordination & Waiting)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Halting calling thread in WAITING state until target thread completes and terminates.',
    explanation: 'join() coordinates thread termination. The calling thread remains in WAITING state until the joined thread reaches TERMINATED.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread worker = new Thread(() -> {
            System.out.println("Worker thread performing calculation...");
        });

        worker.start();
        System.out.println("Main thread calling worker.join()...");
        try {
            worker.join();
        } catch (InterruptedException e) {}
        System.out.println("Worker finished! Main thread continues.");
    }
}
`,
  },

  // ─── 07. Thread Names & Priority ──────────────────────────────────────────
  {
    id: 'p13-07-thread-names-priority',
    title: '07 — Thread Names & Priority (Scheduling Hints)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Configuring meaningful thread names and priority hints for the OS/JVM scheduler.',
    explanation: 'Thread priorities (1 to 10) are hints to the scheduler, not strict guarantees of execution order.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread t = new Thread(() -> {
            System.out.println("Thread running: " + Thread.currentThread().getName());
        });

        t.setName("Worker-Alpha");
        t.setPriority(7);
        t.start();
        try {
            t.join();
        } catch (InterruptedException e) {}
    }
}
`,
  },

  // ─── 08. Multiple Threads ─────────────────────────────────────────────────
  {
    id: 'p13-08-multiple-threads',
    title: '08 — Multiple Concurrent Threads',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Spawning multiple worker threads running concurrently with independent call stacks.',
    explanation: 'Each thread allocates its own independent stack frames while sharing the JVM heap.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            System.out.println("Task 1 completed by Worker-1");
        });

        Thread t2 = new Thread(() -> {
            System.out.println("Task 2 completed by Worker-2");
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Both workers finished execution.");
    }
}
`,
  },

  // ─── 09. Shared Variable ──────────────────────────────────────────────────
  {
    id: 'p13-09-shared-variable',
    title: '09 — Shared Variable (Heap Sharing)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Multiple threads referencing and mutating the same shared heap object.',
    explanation: 'While thread call stacks are completely private, heap objects are shared across all threads.',
    code: `class SharedData {
    int value = 0;
}

public class Main {
    public static void main(String[] args) {
        SharedData shared = new SharedData();

        Thread t1 = new Thread(() -> {
            shared.value = 10;
            System.out.println("t1 set shared.value = " + shared.value);
        });

        t1.start();
        try {
            t1.join();
        } catch (InterruptedException e) {}

        System.out.println("Main reads shared.value = " + shared.value);
    }
}
`,
  },

  // ─── 10. Race Condition ───────────────────────────────────────────────────
  {
    id: 'p13-10-race-condition',
    title: '10 — Race Condition & Lost Updates',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Demonstrating how unsynchronized compound operations (counter++) cause conflicting reads and lost updates.',
    explanation: 'counter++ is not atomic: it involves READ, ADD, and WRITE. Concurrent interleavings overwrite updates.',
    code: `class Counter {
    int count = 0;
    void increment() {
        count++;
    }
}

public class Main {
    public static void main(String[] args) {
        Counter counter = new Counter();

        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5; i++) counter.increment();
        });

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 5; i++) counter.increment();
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Final count: " + counter.count);
    }
}
`,
  },

  // ─── 11. synchronized Method ──────────────────────────────────────────────
  {
    id: 'p13-11-synchronized-method',
    title: '11 — synchronized Method (Mutual Exclusion)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Guarding critical sections with synchronized methods to guarantee mutual exclusion.',
    explanation: 'A synchronized instance method acquires the monitor lock on "this", ensuring only one thread executes it at a time.',
    code: `class SafeCounter {
    private int count = 0;

    public synchronized void increment() {
        count++;
    }

    public synchronized int getCount() {
        return count;
    }
}

public class Main {
    public static void main(String[] args) {
        SafeCounter counter = new SafeCounter();

        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 3; i++) counter.increment();
        });

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 3; i++) counter.increment();
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Thread-safe count: " + counter.getCount());
    }
}
`,
  },

  // ─── 12. synchronized Block ───────────────────────────────────────────────
  {
    id: 'p13-12-synchronized-block',
    title: '12 — synchronized Block (Explicit Monitor)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Using an explicit lock object to synchronize a specific code block with fine-grained control.',
    explanation: 'Synchronized blocks reduce lock contention by locking only the critical statements rather than the entire method.',
    code: `public class Main {
    private static int total = 0;
    private static final Object lock = new Object();

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            synchronized (lock) {
                total += 10;
                System.out.println("t1 added 10, total = " + total);
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (lock) {
                total += 20;
                System.out.println("t2 added 20, total = " + total);
            }
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Final total: " + total);
    }
}
`,
  },

  // ─── 13. Lock Contention & BLOCKED State ──────────────────────────────────
  {
    id: 'p13-13-lock-contention',
    title: '13 — Lock Contention & BLOCKED State',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Observing the BLOCKED thread state when one thread tries to acquire a lock already held by another.',
    explanation: 'When thread B attempts to enter a synchronized block held by thread A, thread B enters BLOCKED state in the monitor Entry Queue.',
    code: `public class Main {
    private static final Object lock = new Object();

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            synchronized (lock) {
                System.out.println("t1 holds lock and working...");
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (lock) {
                System.out.println("t2 acquired lock after t1 released it!");
            }
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}
    }
}
`,
  },

  // ─── 14. wait() & notify() ────────────────────────────────────────────────
  {
    id: 'p13-14-wait-notify',
    title: '14 — wait() & notify() (Inter-thread Signaling)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Thread coordination where one thread waits on a condition and another signals when ready.',
    explanation: 'wait() releases the monitor lock and suspends the thread in the Wait Set. notify() awakens one waiting thread.',
    code: `public class Main {
    private static final Object monitor = new Object();
    private static boolean dataReady = false;

    public static void main(String[] args) {
        Thread consumer = new Thread(() -> {
            synchronized (monitor) {
                while (!dataReady) {
                    try {
                        System.out.println("Consumer: Waiting for data...");
                        monitor.wait();
                    } catch (InterruptedException e) {}
                }
                System.out.println("Consumer: Data received!");
            }
        });

        Thread producer = new Thread(() -> {
            synchronized (monitor) {
                dataReady = true;
                System.out.println("Producer: Produced data, calling notify().");
                monitor.notify();
            }
        });

        consumer.start();
        producer.start();

        try {
            consumer.join();
            producer.join();
        } catch (InterruptedException e) {}
    }
}
`,
  },

  // ─── 15. notifyAll() ──────────────────────────────────────────────────────
  {
    id: 'p13-15-notify-all',
    title: '15 — notifyAll() (Multiple Waiters)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Awakening all threads in the monitor Wait Set so each can re-evaluate its condition.',
    explanation: 'notifyAll() moves all waiting threads from the Wait Set to the Entry Queue, preventing lost signal bugs.',
    code: `public class Main {
    private static final Object lock = new Object();
    private static boolean ready = false;

    public static void main(String[] args) {
        Thread worker1 = new Thread(() -> {
            synchronized (lock) {
                while (!ready) {
                    try { lock.wait(); } catch (InterruptedException e) {}
                }
                System.out.println("Worker 1 notified and active!");
            }
        });

        Thread worker2 = new Thread(() -> {
            synchronized (lock) {
                while (!ready) {
                    try { lock.wait(); } catch (InterruptedException e) {}
                }
                System.out.println("Worker 2 notified and active!");
            }
        });

        worker1.start();
        worker2.start();

        synchronized (lock) {
            ready = true;
            System.out.println("Signaler calling notifyAll()...");
            lock.notifyAll();
        }

        try {
            worker1.join();
            worker2.join();
        } catch (InterruptedException e) {}
    }
}
`,
  },

  // ─── 16. Producer-Consumer ────────────────────────────────────────────────
  {
    id: 'p13-16-producer-consumer',
    title: '16 — Producer-Consumer (Bounded Buffer)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Classic synchronization problem coordinating buffer capacity between producer and consumer threads.',
    explanation: 'Producer waits when buffer is full; consumer waits when buffer is empty. notify() coordinates state changes.',
    code: `class BoundedBuffer {
    private int item = 0;
    private boolean hasItem = false;

    public synchronized void produce(int val) {
        while (hasItem) {
            try { wait(); } catch (InterruptedException e) {}
        }
        item = val;
        hasItem = true;
        System.out.println("Produced: " + item);
        notify();
    }

    public synchronized int consume() {
        while (!hasItem) {
            try { wait(); } catch (InterruptedException e) {}
        }
        int result = item;
        hasItem = false;
        System.out.println("Consumed: " + result);
        notify();
        return result;
    }
}

public class Main {
    public static void main(String[] args) {
        BoundedBuffer buffer = new BoundedBuffer();

        Thread producer = new Thread(() -> {
            buffer.produce(42);
        });

        Thread consumer = new Thread(() -> {
            buffer.consume();
        });

        producer.start();
        consumer.start();

        try {
            producer.join();
            consumer.join();
        } catch (InterruptedException e) {}
    }
}
`,
  },

  // ─── 17. Deadlock & Circular Wait ─────────────────────────────────────────
  {
    id: 'p13-17-deadlock',
    title: '17 — Deadlock & Circular Wait Condition',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Circular lock dependency between two threads leading to permanent system freeze.',
    explanation: 'Thread A holds Lock 1 and waits for Lock 2; Thread B holds Lock 2 and waits for Lock 1. Neither can proceed.',
    code: `public class Main {
    public static void main(String[] args) {
        String lock1 = "Resource-1";
        String lock2 = "Resource-2";

        System.out.println("Illustrating circular lock acquisition dependency:");
        System.out.println("Thread-A: holds Lock 1 -> requests Lock 2");
        System.out.println("Thread-B: holds Lock 2 -> requests Lock 1");
        System.out.println("Condition: Circular Wait -> DEADLOCK DETECTED");
    }
}
`,
  },

  // ─── 18. Deadlock Prevention ──────────────────────────────────────────────
  {
    id: 'p13-18-deadlock-prevention',
    title: '18 — Deadlock Prevention (Lock Ordering)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Preventing deadlocks by strictly enforcing a global lock acquisition hierarchy.',
    explanation: 'When all threads acquire locks in the exact same sequence (Lock 1 then Lock 2), circular wait is mathematically impossible.',
    code: `public class Main {
    private static final Object lock1 = new Object();
    private static final Object lock2 = new Object();

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            synchronized (lock1) {
                synchronized (lock2) {
                    System.out.println("t1 acquired lock1 and lock2 safely!");
                }
            }
        });

        Thread t2 = new Thread(() -> {
            // Consistent ordering: lock1 first, then lock2!
            synchronized (lock1) {
                synchronized (lock2) {
                    System.out.println("t2 acquired lock1 and lock2 safely!");
                }
            }
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Deadlock prevented via consistent lock ordering.");
    }
}
`,
  },

  // ─── 19. AtomicInteger ────────────────────────────────────────────────────
  {
    id: 'p13-19-atomic-integer',
    title: '19 — AtomicInteger (Lock-Free Increment)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Thread-safe atomic updates using hardware Compare-And-Swap (CAS) instructions without locking.',
    explanation: 'AtomicInteger eliminates synchronized overhead while ensuring atomicity and thread-safety for numeric counters.',
    code: `import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) {
        AtomicInteger counter = new AtomicInteger(0);

        int v1 = counter.incrementAndGet();
        int v2 = counter.incrementAndGet();
        int v3 = counter.addAndGet(5);

        System.out.println("Atomic increments completed. Final value: " + counter.get());
    }
}
`,
  },

  // ─── 20. AtomicLong & AtomicBoolean ───────────────────────────────────────
  {
    id: 'p13-20-atomic-utilities',
    title: '20 — AtomicLong & AtomicBoolean',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Atomic flags and 64-bit atomic accumulators for lock-free state synchronization.',
    explanation: 'AtomicBoolean provides thread-safe flag flipping (e.g. compareAndSet) commonly used in state machines.',
    code: `import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

public class Main {
    public static void main(String[] args) {
        AtomicBoolean flag = new AtomicBoolean(false);
        AtomicLong bytesProcessed = new AtomicLong(1024L);

        boolean switched = flag.compareAndSet(false, true);
        long totalBytes = bytesProcessed.addAndGet(2048L);

        System.out.println("Flag switched: " + switched + ", Flag: " + flag.get());
        System.out.println("Total bytes: " + totalBytes);
    }
}
`,
  },

  // ─── 21. volatile Keyword ─────────────────────────────────────────────────
  {
    id: 'p13-21-volatile',
    title: '21 — volatile Keyword (Memory Visibility)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Guarantees that reads and writes of a variable are directly read from and written to main memory.',
    explanation: 'volatile prevents CPU cache staleness and instruction reordering. Note: volatile does NOT make compound updates like count++ atomic.',
    code: `class Worker implements Runnable {
    private volatile boolean running = true;

    public void stop() {
        running = false;
    }

    @Override
    public void run() {
        if (running) {
            System.out.println("Worker checked volatile running: true");
        }
    }
}

public class Main {
    public static void main(String[] args) {
        Worker worker = new Worker();
        Thread thread = new Thread(worker);
        thread.start();

        worker.stop();
        System.out.println("Main set running = false via volatile field.");

        try {
            thread.join();
        } catch (InterruptedException e) {}
    }
}
`,
  },

  // ─── 22. ExecutorService ──────────────────────────────────────────────────
  {
    id: 'p13-22-executor-service',
    title: '22 — ExecutorService & FixedThreadPool',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Managed thread pool that reuses a fixed number of threads for executing submitted tasks.',
    explanation: 'ExecutorService manages a work queue and pool of worker threads, avoiding the overhead of creating threads per task.',
    code: `import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(2);

        executor.submit(() -> {
            System.out.println("Task 1 executed by pool worker.");
        });

        executor.submit(() -> {
            System.out.println("Task 2 executed by pool worker.");
        });

        executor.shutdown();
        System.out.println("ExecutorService initiated graceful shutdown.");
    }
}
`,
  },

  // ─── 23. SingleThreadExecutor ─────────────────────────────────────────────
  {
    id: 'p13-23-single-thread-executor',
    title: '23 — SingleThreadExecutor (Serialized Queue)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Single worker thread executing tasks sequentially in exact submission order.',
    explanation: 'Executors.newSingleThreadExecutor() guarantees that no more than one task is active at any time, eliminating concurrency conflicts.',
    code: `import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newSingleThreadExecutor();

        executor.submit(() -> System.out.println("Step A executed"));
        executor.submit(() -> System.out.println("Step B executed"));
        executor.submit(() -> System.out.println("Step C executed"));

        executor.shutdown();
    }
}
`,
  },

  // ─── 24. Callable & Future ────────────────────────────────────────────────
  {
    id: 'p13-24-callable-future',
    title: '24 — Callable & Future (Asynchronous Return)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Submitting a value-returning Callable and retrieving its result via Future.get().',
    explanation: 'Unlike Runnable, Callable<V> returns a value and can throw checked exceptions. future.get() blocks until the result is computed.',
    code: `import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(1);

        Future<Integer> future = executor.submit(() -> {
            int result = 20 + 22;
            return result;
        });

        try {
            System.out.println("Awaiting future result...");
            int answer = future.get();
            System.out.println("Computed answer: " + answer);
        } catch (Exception e) {}

        executor.shutdown();
    }
}
`,
  },

  // ─── 25. Thread Interruption ──────────────────────────────────────────────
  {
    id: 'p13-25-thread-interruption',
    title: '25 — Thread Interruption (Handling Signals)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Using thread.interrupt() to request thread cancellation and handling InterruptedException.',
    explanation: 'interrupt() sets the thread interrupt status flag. Sleeping or waiting threads throw InterruptedException when interrupted.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread worker = new Thread(() -> {
            try {
                System.out.println("Worker sleeping...");
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                System.out.println("Worker caught InterruptedException safely!");
            }
        });

        worker.start();
        worker.interrupt();

        try {
            worker.join();
        } catch (InterruptedException e) {}

        System.out.println("Main verified worker interruption handling.");
    }
}
`,
  },

  // ─── 26. ConcurrentHashMap ────────────────────────────────────────────────
  {
    id: 'p13-26-concurrent-hashmap',
    title: '26 — ConcurrentHashMap (Thread-Safe Map)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Highly concurrent hash table supporting concurrent reads and segmented writes without full map locking.',
    explanation: 'ConcurrentHashMap achieves high throughput using bucket-level CAS and synchronized nodes instead of coarse-grained table locking.',
    code: `import java.util.concurrent.ConcurrentHashMap;

public class Main {
    public static void main(String[] args) {
        ConcurrentHashMap<String, Integer> scores = new ConcurrentHashMap<>();

        scores.put("Alex", 95);
        scores.put("Sam", 88);

        System.out.println("Alex score: " + scores.get("Alex"));
        System.out.println("Total entries: " + scores.size());
    }
}
`,
  },

  // ─── 27. BlockingQueue ────────────────────────────────────────────────────
  {
    id: 'p13-27-blocking-queue',
    title: '27 — BlockingQueue (ArrayBlockingQueue)',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Thread-safe bounded queue that blocks producers when full and consumers when empty.',
    explanation: 'ArrayBlockingQueue encapsulates internal locks and condition variables, eliminating manual wait/notify boilerplate.',
    code: `import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class Main {
    public static void main(String[] args) {
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(5);

        try {
            queue.put(10);
            queue.put(20);
            System.out.println("Queue size: " + queue.size());

            int val1 = queue.take();
            int val2 = queue.take();
            System.out.println("Dequeued items: " + val1 + ", " + val2);
        } catch (InterruptedException e) {}
    }
}
`,
  },

  // ─── 28. Grand Integration Demo (Section 52) ──────────────────────────────
  {
    id: 'p13-28-grand-concurrency-demo',
    title: '28 — Grand Multithreading Integration Demo',
    category: 'Java Multithreading & Concurrency',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Section 52 Grand Integration Demo: Main thread, multiple worker threads, shared object, synchronized method, join, ExecutorService, and BlockingQueue.',
    explanation: 'A comprehensive unification of Java multithreading: independent thread call stacks, monitor synchronization, thread pool task execution, and concurrent queues on the real JVM.',
    code: `import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

class BankAccount {
    private int balance = 100;

    public synchronized void deposit(int amount) {
        balance += amount;
    }

    public synchronized int getBalance() {
        return balance;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println("--- PHASE 13: GRAND CONCURRENCY INTEGRATION DEMO ---");

        // 1. Shared Object & Synchronized Operations
        BankAccount account = new BankAccount();

        Thread t1 = new Thread(() -> {
            account.deposit(50);
            System.out.println("Worker-1 deposited $50");
        });

        Thread t2 = new Thread(() -> {
            account.deposit(50);
            System.out.println("Worker-2 deposited $50");
        });

        t1.setName("Depositor-A");
        t2.setName("Depositor-B");

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Verified balance after joins: $" + account.getBalance());

        // 2. Lock-Free Atomic Operations
        AtomicInteger transactionCount = new AtomicInteger(2);
        transactionCount.incrementAndGet();
        System.out.println("Total transactions (Atomic): " + transactionCount.get());

        // 3. BlockingQueue Coordination
        BlockingQueue<String> logQueue = new ArrayBlockingQueue<>(5);
        try {
            logQueue.put("TXN_001");
            logQueue.put("TXN_002");
            System.out.println("Logged queue items: " + logQueue.size());
        } catch (InterruptedException e) {}

        // 4. Managed Thread Pool (ExecutorService)
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<String> auditFuture = pool.submit(() -> "AUDIT_PASSED");

        try {
            String auditResult = auditFuture.get();
            System.out.println("Audit task completed: " + auditResult);
        } catch (Exception e) {}

        pool.shutdown();
        System.out.println("Grand Concurrency Integration Demo Completed Successfully!");
    }
}
`,
  },
];
