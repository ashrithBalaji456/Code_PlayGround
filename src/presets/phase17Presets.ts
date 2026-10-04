import { CodePreset } from '../types/execution';

export const PHASE_17_CONCURRENCY_PRESETS: CodePreset[] = [
  // ─── 01. Creating Threads ──────────────────────────────────────────────────
  {
    id: 'p17-01-thread-creation',
    title: '01 — Creating Threads (Thread & Runnable)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Demonstrating the two fundamental ways to create threads in Java: subclassing Thread vs implementing Runnable with a lambda.',
    explanation: 'In Java, an independent execution thread can be defined either by extending java.lang.Thread or passing a Runnable lambda to the Thread constructor.',
    code: `class WorkerThread extends Thread {
    @Override
    public void run() {
        System.out.println("Subclass Thread running on independent stack!");
    }
}

public class Main {
    public static void main(String[] args) {
        WorkerThread t1 = new WorkerThread();
        Thread t2 = new Thread(() -> {
            System.out.println("Runnable lambda running on another stack!");
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Both threads completed.");
    }
}
`,
  },

  // ─── 02. Starting Threads: start() vs run() ────────────────────────────────
  {
    id: 'p17-02-start-vs-run',
    title: '02 — Starting Threads (start() vs run())',
    category: 'Java Concurrency & Threads',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Crucial distinction: calling start() registers the thread with the JVM OS scheduler; calling run() directly executes synchronously on the caller thread!',
    explanation: 'Calling thread.run() is a regular synchronous method call on the main thread stack. Only thread.start() allocates a new OS/JVM thread stack.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread worker = new Thread(() -> {
            System.out.println("Thread executing: " + Thread.currentThread().getName());
        });

        System.out.println("1. Calling worker.run() directly:");
        worker.run(); // Synchronous on main thread!

        System.out.println("2. Calling worker.start():");
        worker.start(); // Asynchronous on newly spawned thread!

        try {
            worker.join();
        } catch (InterruptedException e) {}

        System.out.println("Execution finished.");
    }
}
`,
  },

  // ─── 03. Thread Lifecycle States ───────────────────────────────────────────
  {
    id: 'p17-03-thread-lifecycle',
    title: '03 — Thread Lifecycle States',
    category: 'Java Concurrency & Threads',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Visualizing the progression of Java Thread States: NEW -> RUNNABLE -> TIMED_WAITING -> TERMINATED.',
    explanation: 'A Thread is NEW after instantiation, RUNNABLE when started, TIMED_WAITING while sleeping, and TERMINATED when run() finishes.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread thread = new Thread(() -> {
            try {
                System.out.println("Child thread entering sleep...");
                Thread.sleep(50);
                System.out.println("Child thread woke up!");
            } catch (InterruptedException e) {}
        });

        System.out.println("State before start: " + thread.getState()); // NEW
        thread.start();
        System.out.println("State after start: " + thread.getState());  // RUNNABLE

        try {
            thread.join();
        } catch (InterruptedException e) {}

        System.out.println("State after completion: " + thread.getState()); // TERMINATED
    }
}
`,
  },

  // ─── 04. Thread Sleep & Timed Waiting ──────────────────────────────────────
  {
    id: 'p17-04-thread-sleep',
    title: '04 — Thread Sleep & Timed Waiting',
    category: 'Java Concurrency & Threads',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Using Thread.sleep(ms) to pause execution and transition the thread into TIMED_WAITING state without releasing locks.',
    explanation: 'Thread.sleep causes the current thread to yield execution to other threads for the specified duration. Crucially, sleep DOES NOT release held monitors.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread worker = new Thread(() -> {
            System.out.println("Worker starting task...");
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                System.out.println("Sleep interrupted");
            }
            System.out.println("Worker completed sleep task.");
        });

        worker.start();
        try {
            worker.join();
        } catch (InterruptedException e) {}

        System.out.println("Main thread resumed.");
    }
}
`,
  },

  // ─── 05. Thread Join (Waiting for Completion) ──────────────────────────────
  {
    id: 'p17-05-thread-join',
    title: '05 — Thread Join (Coordination)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Using t.join() to coordinate threads. The calling thread blocks in WAITING state until target thread t terminates.',
    explanation: 'join() allows one thread to wait for another thread to finish its task before proceeding with dependent work.',
    code: `public class Main {
    static int result = 0;

    public static void main(String[] args) {
        Thread calculator = new Thread(() -> {
            int sum = 0;
            for (int i = 1; i <= 5; i++) {
                sum += i;
            }
            result = sum;
            System.out.println("Calculation computed: " + result);
        });

        calculator.start();

        System.out.println("Main waiting on calculator.join()...");
        try {
            calculator.join();
        } catch (InterruptedException e) {}

        System.out.println("Main received result: " + result);
    }
}
`,
  },

  // ─── 06. Synchronized Method ───────────────────────────────────────────────
  {
    id: 'p17-06-synchronized-method',
    title: '06 — Synchronized Instance Method',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Enforcing mutual exclusion on an object using a synchronized instance method, which locks on "this".',
    explanation: 'A synchronized instance method implicitly acquires the intrinsic monitor lock of the instance (this) upon entry and releases it upon return.',
    code: `class Counter {
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
        Counter counter = new Counter();

        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 3; i++) {
                counter.increment();
            }
        });

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 3; i++) {
                counter.increment();
            }
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Final safe count: " + counter.getCount());
    }
}
`,
  },

  // ─── 07. Synchronized Block ────────────────────────────────────────────────
  {
    id: 'p17-07-synchronized-block',
    title: '07 — Synchronized Block with Explicit Lock',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Granular synchronization using synchronized (lockObject) to minimize the critical section scope.',
    explanation: 'Synchronized blocks provide finer control than synchronized methods by allowing custom lock objects and reducing contention.',
    code: `public class Main {
    static int balance = 100;
    static final Object lock = new Object();

    public static void withdraw(int amount) {
        synchronized (lock) {
            if (balance >= amount) {
                balance -= amount;
                System.out.println(Thread.currentThread().getName() + " withdrew " + amount + ", remaining: " + balance);
            }
        }
    }

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> withdraw(40), "Thread-A");
        Thread t2 = new Thread(() -> withdraw(50), "Thread-B");

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Final balance: " + balance);
    }
}
`,
  },

  // ─── 08. Instance vs Static Monitors ──────────────────────────────────────
  {
    id: 'p17-08-instance-vs-static-monitor',
    title: '08 — Instance Monitor vs Static Class Monitor',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Contrasting instance monitors (locking on this) with static monitors (locking on the Class object, e.g., Counter.class).',
    explanation: 'Instance synchronized methods lock on the specific instance (this). Static synchronized methods lock on the Class object itself, shared across all instances.',
    code: `class SharedAccount {
    static int globalTransfers = 0;
    int accountBalance = 1000;

    // Locks on Class object (SharedAccount.class)
    public static synchronized void recordTransfer() {
        globalTransfers++;
    }

    // Locks on instance object (this)
    public synchronized void updateBalance(int amount) {
        accountBalance += amount;
    }
}

public class Main {
    public static void main(String[] args) {
        SharedAccount acc1 = new SharedAccount();
        SharedAccount acc2 = new SharedAccount();

        Thread t1 = new Thread(() -> {
            acc1.updateBalance(100);
            SharedAccount.recordTransfer();
        });

        Thread t2 = new Thread(() -> {
            acc2.updateBalance(200);
            SharedAccount.recordTransfer();
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Acc1: " + acc1.accountBalance + ", Acc2: " + acc2.accountBalance);
        System.out.println("Global Transfers: " + SharedAccount.globalTransfers);
    }
}
`,
  },

  // ─── 09. Lock Contention & Thread Blocking ─────────────────────────────────
  {
    id: 'p17-09-lock-contention',
    title: '09 — Lock Contention & Thread Blocking',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Observing a thread entering the BLOCKED state when attempting to acquire a lock already owned by another thread.',
    explanation: 'When Thread B attempts to enter a synchronized block guarded by a lock currently held by Thread A, Thread B is placed into the monitor Entry Set (BLOCKED).',
    code: `public class Main {
    static final Object sharedGate = new Object();

    public static void enterGate(String name, int holdMs) {
        synchronized (sharedGate) {
            System.out.println(name + " acquired gate lock.");
            try {
                Thread.sleep(holdMs);
            } catch (InterruptedException e) {}
            System.out.println(name + " releasing gate lock.");
        }
    }

    public static void main(String[] args) {
        Thread workerA = new Thread(() -> enterGate("Worker-A", 60), "Worker-A");
        Thread workerB = new Thread(() -> enterGate("Worker-B", 20), "Worker-B");

        workerA.start();
        workerB.start();

        try {
            workerA.join();
            workerB.join();
        } catch (InterruptedException e) {}

        System.out.println("Both workers completed.");
    }
}
`,
  },

  // ─── 10. Critical Section ──────────────────────────────────────────────────
  {
    id: 'p17-10-critical-section',
    title: '10 — Critical Section (Mutual Exclusion)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Guarding a critical section of code where shared resources are modified to guarantee strict mutual exclusion.',
    explanation: 'A critical section is a sequence of instructions accessing shared variables that must not be executed concurrently by more than one thread.',
    code: `public class Main {
    static int sharedResource = 0;
    static final Object criticalLock = new Object();

    public static void modifyResource(int delta) {
        // Entry section: Acquire lock
        synchronized (criticalLock) {
            // Critical section starts
            int temp = sharedResource;
            temp += delta;
            sharedResource = temp;
            System.out.println(Thread.currentThread().getName() + " updated resource to: " + sharedResource);
            // Critical section ends
        }
        // Remainder section
    }

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> modifyResource(5), "Writer-1");
        Thread t2 = new Thread(() -> modifyResource(10), "Writer-2");

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Final Resource State: " + sharedResource);
    }
}
`,
  },

  // ─── 11. Race Condition (Unsynchronized Counter) ───────────────────────────
  {
    id: 'p17-11-race-condition',
    title: '11 — Race Condition (Unsynchronized Counter)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Demonstrating the lost update phenomenon caused by unsynchronized concurrent READ -> COMPUTE -> WRITE cycles.',
    explanation: 'The operation count++ is not atomic in bytecode: it performs (1) getstatic, (2) iconst_1, (3) iadd, (4) putstatic. Interleaving causes lost updates.',
    code: `public class Main {
    static int unsafeCounter = 0;

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                unsafeCounter++; // Non-atomic compound operation!
            }
        });

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                unsafeCounter++; // Non-atomic compound operation!
            }
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Expected count: 10, Actual count: " + unsafeCounter);
    }
}
`,
  },

  // ─── 12. Fixing Race Condition with Synchronization ───────────────────────
  {
    id: 'p17-12-race-condition-fix',
    title: '12 — Race Condition Fix with Synchronization',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Fixing the race condition by serializing access to the shared counter with a synchronized block.',
    explanation: 'Adding synchronization establishes a happens-before relationship between successive increments, guaranteeing that all 10 updates are committed.',
    code: `public class Main {
    static int safeCounter = 0;
    static final Object counterLock = new Object();

    public static void safeIncrement() {
        synchronized (counterLock) {
            safeCounter++;
        }
    }

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                safeIncrement();
            }
        });

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                safeIncrement();
            }
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Synchronized Safe Counter: " + safeCounter);
    }
}
`,
  },

  // ─── 13. Atomic Operations (AtomicInteger CAS) ────────────────────────────
  {
    id: 'p17-13-atomic-integer',
    title: '13 — AtomicInteger (Lock-Free Hardware CAS)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'High-performance lock-free atomic updates using AtomicInteger and hardware Compare-And-Swap (CAS).',
    explanation: 'AtomicInteger uses CPU-level CAS instructions (e.g., LOCK CMPXCHG on x86) to update variables atomically without OS thread blocking.',
    code: `import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    static AtomicInteger atomicCount = new AtomicInteger(0);

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                atomicCount.incrementAndGet();
            }
        });

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                atomicCount.incrementAndGet();
            }
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Lock-Free Atomic Count: " + atomicCount.get());
    }
}
`,
  },

  // ─── 14. Volatile Keyword & Memory Visibility ──────────────────────────────
  {
    id: 'p17-14-volatile-visibility',
    title: '14 — Volatile Keyword & Visibility',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Understanding volatile: enforcing CPU cache coherence and preventing JVM instruction reordering for shared flags.',
    explanation: 'The volatile modifier ensures that reads and writes bypass local CPU registers and L1/L2 caches, establishing a memory barrier.',
    code: `public class Main {
    static volatile boolean running = true;

    public static void main(String[] args) {
        Thread worker = new Thread(() -> {
            System.out.println("Worker thread observing running flag...");
            int loopCount = 0;
            while (running && loopCount < 10) {
                loopCount++;
            }
            System.out.println("Worker detected running == false. Exiting loop.");
        });

        worker.start();

        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {}

        System.out.println("Main setting running = false");
        running = false;

        try {
            worker.join();
        } catch (InterruptedException e) {}

        System.out.println("Program finished safely.");
    }
}
`,
  },

  // ─── 15. Wait and Notify (Guarded Blocks) ──────────────────────────────────
  {
    id: 'p17-15-wait-and-notify',
    title: '15 — wait() and notify() Coordination',
    category: 'Java Concurrency & Threads',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Thread signaling using Object.wait() and Object.notify(). Observing Wait Set and Entry Set transitions.',
    explanation: 'Calling wait() causes a thread to release its monitor lock and enter the monitor Wait Set. notify() awakens one waiting thread.',
    code: `public class Main {
    static final Object signal = new Object();
    static boolean ready = false;

    public static void main(String[] args) {
        Thread waiter = new Thread(() -> {
            synchronized (signal) {
                while (!ready) {
                    try {
                        System.out.println("Waiter entering wait()...");
                        signal.wait();
                    } catch (InterruptedException e) {}
                }
                System.out.println("Waiter awakened and resumed!");
            }
        });

        Thread notifier = new Thread(() -> {
            synchronized (signal) {
                System.out.println("Notifier preparing work...");
                ready = true;
                signal.notify();
                System.out.println("Notifier called notify()!");
            }
        });

        waiter.start();
        notifier.start();

        try {
            waiter.join();
            notifier.join();
        } catch (InterruptedException e) {}

        System.out.println("Signaling flow complete.");
    }
}
`,
  },

  // ─── 16. Producer-Consumer with Wait/Notify ────────────────────────────────
  {
    id: 'p17-16-producer-consumer',
    title: '16 — Producer-Consumer with Monitor',
    category: 'Java Concurrency & Threads',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Classic bounded-buffer Producer-Consumer pattern using synchronized, wait(), and notify().',
    explanation: 'The producer produces an item and notifies the consumer. If the buffer is full, the producer waits; if empty, the consumer waits.',
    code: `class BoundedBuffer {
    private int data = -1;
    private boolean hasData = false;

    public synchronized void produce(int val) {
        while (hasData) {
            try { wait(); } catch (InterruptedException e) {}
        }
        data = val;
        hasData = true;
        System.out.println("Produced: " + val);
        notify();
    }

    public synchronized int consume() {
        while (!hasData) {
            try { wait(); } catch (InterruptedException e) {}
        }
        int val = data;
        hasData = false;
        System.out.println("Consumed: " + val);
        notify();
        return val;
    }
}

public class Main {
    public static void main(String[] args) {
        BoundedBuffer buffer = new BoundedBuffer();

        Thread producer = new Thread(() -> {
            for (int i = 1; i <= 3; i++) {
                buffer.produce(i * 10);
            }
        });

        Thread consumer = new Thread(() -> {
            for (int i = 1; i <= 3; i++) {
                buffer.consume();
            }
        });

        producer.start();
        consumer.start();

        try {
            producer.join();
            consumer.join();
        } catch (InterruptedException e) {}

        System.out.println("Producer-Consumer processing complete.");
    }
}
`,
  },

  // ─── 17. notify() vs notifyAll() ───────────────────────────────────────────
  {
    id: 'p17-17-notify-vs-notifyall',
    title: '17 — notify() vs notifyAll() Broadcast',
    category: 'Java Concurrency & Threads',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Comparing single-waiter wakeup (notify) vs multi-waiter broadcast (notifyAll).',
    explanation: 'notify() wakes an arbitrary single thread from the Wait Set, risking lost signals. notifyAll() awakens all waiting threads to recheck conditions.',
    code: `public class Main {
    static final Object bell = new Object();
    static boolean dismissed = false;

    public static void studentWait(String name) {
        synchronized (bell) {
            while (!dismissed) {
                try {
                    System.out.println(name + " waiting in class...");
                    bell.wait();
                } catch (InterruptedException e) {}
            }
            System.out.println(name + " left class!");
        }
    }

    public static void main(String[] args) {
        Thread s1 = new Thread(() -> studentWait("Student-1"));
        Thread s2 = new Thread(() -> studentWait("Student-2"));

        s1.start();
        s2.start();

        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {}

        synchronized (bell) {
            System.out.println("Teacher ringing bell: notifyAll()!");
            dismissed = true;
            bell.notifyAll(); // Wakes both waiting students
        }

        try {
            s1.join();
            s2.join();
        } catch (InterruptedException e) {}

        System.out.println("All students dismissed.");
    }
}
`,
  },

  // ─── 18. Thread Interruption ───────────────────────────────────────────────
  {
    id: 'p17-18-thread-interruption',
    title: '18 — Thread Interruption & Handling',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Cooperative thread cancellation using thread.interrupt() and handling InterruptedException.',
    explanation: 'In Java, threads cannot be abruptly stopped safely. Instead, interruption sets an interrupt flag or causes blocking methods to throw InterruptedException.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread worker = new Thread(() -> {
            System.out.println("Worker started, attempting sleep...");
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                System.out.println("InterruptedException caught! Cleaning up worker resources.");
            }
            System.out.println("Worker gracefully exited.");
        });

        worker.start();
        worker.interrupt(); // Signal cancellation

        try {
            worker.join();
        } catch (InterruptedException e) {}

        System.out.println("Main completed.");
    }
}
`,
  },

  // ─── 19. Deadlock Demonstration ───────────────────────────────────────────
  {
    id: 'p17-19-deadlock-demo',
    title: '19 — Deadlock Demonstration (Circular Wait)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Deadlock demonstration where Thread 1 holds Lock A waiting for Lock B, while Thread 2 holds Lock B waiting for Lock A.',
    explanation: 'Deadlock occurs when four Coffman conditions hold: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.',
    code: `public class Main {
    static final Object lockA = new Object();
    static final Object lockB = new Object();

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            synchronized (lockA) {
                System.out.println("Thread-1 holds Lock-A");
                try { Thread.sleep(20); } catch (InterruptedException e) {}
                System.out.println("Thread-1 waiting for Lock-B...");
                synchronized (lockB) {
                    System.out.println("Thread-1 acquired Lock-B");
                }
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (lockB) {
                System.out.println("Thread-2 holds Lock-B");
                try { Thread.sleep(20); } catch (InterruptedException e) {}
                System.out.println("Thread-2 waiting for Lock-A...");
                synchronized (lockA) {
                    System.out.println("Thread-2 acquired Lock-A");
                }
            }
        });

        t1.start();
        t2.start();

        try {
            t1.join(50);
            t2.join(50);
        } catch (InterruptedException e) {}

        System.out.println("Deadlock observation check complete.");
    }
}
`,
  },

  // ─── 20. Deadlock Prevention (Lock Ordering) ───────────────────────────────
  {
    id: 'p17-20-deadlock-prevention',
    title: '20 — Deadlock Prevention (Global Lock Ordering)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Preventing deadlock by enforcing a strict global lock acquisition ordering (always acquire Lock A before Lock B).',
    explanation: 'By ensuring all threads acquire multiple locks in identical order, circular wait is mathematically broken, making deadlock impossible.',
    code: `public class Main {
    static final Object lockA = new Object();
    static final Object lockB = new Object();

    public static void doWork(String threadName) {
        // Strict ordering: Lock-A FIRST, then Lock-B
        synchronized (lockA) {
            System.out.println(threadName + " acquired Lock-A");
            synchronized (lockB) {
                System.out.println(threadName + " acquired Lock-B");
                System.out.println(threadName + " completed work safely.");
            }
        }
    }

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> doWork("Thread-1"));
        Thread t2 = new Thread(() -> doWork("Thread-2"));

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("Both threads succeeded without deadlock.");
    }
}
`,
  },

  // ─── 21. Thread Priority & Daemon Threads ──────────────────────────────────
  {
    id: 'p17-21-priority-and-daemon',
    title: '21 — Thread Priority & Daemon Threads',
    category: 'Java Concurrency & Threads',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Configuring thread priority (1 to 10) and daemon threads that do not prevent the JVM from shutting down.',
    explanation: 'Daemon threads run in the background (e.g., GC). When all non-daemon user threads terminate, the JVM halts automatically.',
    code: `public class Main {
    public static void main(String[] args) {
        Thread daemonWorker = new Thread(() -> {
            System.out.println("Daemon thread running in background...");
        });
        daemonWorker.setDaemon(true);
        daemonWorker.setPriority(Thread.MIN_PRIORITY);

        Thread userWorker = new Thread(() -> {
            System.out.println("User thread executing primary task.");
        });
        userWorker.setPriority(Thread.MAX_PRIORITY);

        daemonWorker.start();
        userWorker.start();

        try {
            userWorker.join();
            daemonWorker.join();
        } catch (InterruptedException e) {}

        System.out.println("Main thread ending.");
    }
}
`,
  },

  // ─── 22. Thread Pools (FixedThreadPool) ────────────────────────────────────
  {
    id: 'p17-22-fixed-thread-pool',
    title: '22 — Fixed Thread Pool (Executors)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Using Executors.newFixedThreadPool(2) to queue and execute tasks across reusable worker threads.',
    explanation: 'A fixed thread pool maintains a fixed number of threads, reusing them to execute submitted tasks and reducing thread creation overhead.',
    code: `import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(2);

        for (int i = 1; i <= 4; i++) {
            final int taskId = i;
            executor.submit(() -> {
                System.out.println("Task-" + taskId + " running on: " + Thread.currentThread().getName());
            });
        }

        executor.shutdown();
        System.out.println("All tasks submitted to pool.");
    }
}
`,
  },

  // ─── 23. Cached Thread Pool ───────────────────────────────────────────────
  {
    id: 'p17-23-cached-thread-pool',
    title: '23 — Cached Thread Pool (Dynamic Sizing)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Using Executors.newCachedThreadPool() for dynamic short-lived burst task execution.',
    explanation: 'Cached thread pools create new threads as needed and reuse existing idle threads when available, terminating threads idle for 60 seconds.',
    code: `import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) {
        ExecutorService cachedPool = Executors.newCachedThreadPool();

        for (int i = 1; i <= 3; i++) {
            final int id = i;
            cachedPool.submit(() -> {
                System.out.println("Burst Task-" + id + " executed on " + Thread.currentThread().getName());
            });
        }

        cachedPool.shutdown();
        System.out.println("Cached pool shutdown initiated.");
    }
}
`,
  },

  // ─── 24. Callable and Future ───────────────────────────────────────────────
  {
    id: 'p17-24-callable-and-future',
    title: '24 — Callable and Future (Return Values)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Using java.util.concurrent.Callable to return computational results and Future.get() to await resolution.',
    explanation: 'Unlike Runnable, Callable<V> can return a value and throw checked exceptions. Future represents the pending result of asynchronous computation.',
    code: `import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class Main {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(2);

        Future<Integer> future = executor.submit(() -> {
            System.out.println("Callable calculating square...");
            return 7 * 7;
        });

        try {
            System.out.println("Awaiting future.get()...");
            int result = future.get();
            System.out.println("Future resolved: " + result);
        } catch (Exception e) {}

        executor.shutdown();
    }
}
`,
  },

  // ─── 25. CountDownLatch Coordination ───────────────────────────────────────
  {
    id: 'p17-25-countdown-latch',
    title: '25 — CountDownLatch Coordination',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Using CountDownLatch to synchronize one or more threads until a set of operations being performed by other threads completes.',
    explanation: 'CountDownLatch is initialized with a given count. await() blocks until the count reaches zero due to countDown() invocations.',
    code: `import java.util.concurrent.CountDownLatch;

public class Main {
    public static void main(String[] args) {
        CountDownLatch latch = new CountDownLatch(2);

        Thread serviceA = new Thread(() -> {
            System.out.println("Service A initialized.");
            latch.countDown();
        });

        Thread serviceB = new Thread(() -> {
            System.out.println("Service B initialized.");
            latch.countDown();
        });

        serviceA.start();
        serviceB.start();

        try {
            System.out.println("Main waiting on CountDownLatch...");
            latch.await();
            System.out.println("All services ready. Main starting application.");
        } catch (InterruptedException e) {}
    }
}
`,
  },

  // ─── 26. CyclicBarrier Synchronization ─────────────────────────────────────
  {
    id: 'p17-26-cyclic-barrier',
    title: '26 — CyclicBarrier Barrier Synchronization',
    category: 'Java Concurrency & Threads',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Synchronizing threads at a common barrier point with CyclicBarrier. All threads wait until everyone arrives.',
    explanation: 'CyclicBarrier allows a set of threads to all wait for each other to reach a common barrier point before any thread continues.',
    code: `import java.util.concurrent.CyclicBarrier;

public class Main {
    public static void main(String[] args) {
        CyclicBarrier barrier = new CyclicBarrier(2, () -> {
            System.out.println(">>> Barrier reached! All parties arrived. <<<");
        });

        Thread p1 = new Thread(() -> {
            try {
                System.out.println("Player 1 arrived at checkpoint.");
                barrier.await();
                System.out.println("Player 1 advancing!");
            } catch (Exception e) {}
        });

        Thread p2 = new Thread(() -> {
            try {
                System.out.println("Player 2 arrived at checkpoint.");
                barrier.await();
                System.out.println("Player 2 advancing!");
            } catch (Exception e) {}
        });

        p1.start();
        p2.start();

        try {
            p1.join();
            p2.join();
        } catch (InterruptedException e) {}
    }
}
`,
  },

  // ─── 27. Semaphore Resource Throttling ────────────────────────────────────
  {
    id: 'p17-27-semaphore-permits',
    title: '27 — Semaphore (Permit-Based Access)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Restricting concurrent access to a shared resource using Semaphore permits.',
    explanation: 'A Semaphore maintains a set of permits. Each acquire() blocks if necessary until a permit is available, and release() returns a permit.',
    code: `import java.util.concurrent.Semaphore;

public class Main {
    static Semaphore printerSemaphore = new Semaphore(1); // Only 1 printer permit

    public static void printDocument(String docName) {
        try {
            printerSemaphore.acquire();
            System.out.println(Thread.currentThread().getName() + " printing " + docName);
            Thread.sleep(30);
        } catch (InterruptedException e) {
        } finally {
            System.out.println(Thread.currentThread().getName() + " finished printing.");
            printerSemaphore.release();
        }
    }

    public static void main(String[] args) {
        Thread user1 = new Thread(() -> printDocument("Report.pdf"), "User-1");
        Thread user2 = new Thread(() -> printDocument("Invoice.pdf"), "User-2");

        user1.start();
        user2.start();

        try {
            user1.join();
            user2.join();
        } catch (InterruptedException e) {}

        System.out.println("All print jobs done.");
    }
}
`,
  },

  // ─── 28. ConcurrentHashMap Thread Safety ───────────────────────────────────
  {
    id: 'p17-28-concurrent-hash-map',
    title: '28 — ConcurrentHashMap Thread Safety',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Demonstrating thread-safe concurrent map access using ConcurrentHashMap without global lock bottlenecks.',
    explanation: 'ConcurrentHashMap uses fine-grained bucket-level locks and CAS operations, allowing concurrent reads and writes without table-wide locks.',
    code: `import java.util.concurrent.ConcurrentHashMap;

public class Main {
    static ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            map.put("Alice", 95);
            map.put("Bob", 88);
        });

        Thread t2 = new Thread(() -> {
            map.put("Charlie", 92);
            map.put("Diana", 97);
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {}

        System.out.println("ConcurrentHashMap size: " + map.size());
        System.out.println("Alice: " + map.get("Alice"));
        System.out.println("Diana: " + map.get("Diana"));
    }
}
`,
  },

  // ─── 29. BlockingQueue Producer-Consumer ───────────────────────────────────
  {
    id: 'p17-29-blocking-queue',
    title: '29 — BlockingQueue Producer-Consumer',
    category: 'Java Concurrency & Threads',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Modern thread-safe Producer-Consumer implementation using ArrayBlockingQueue.',
    explanation: 'BlockingQueue methods put() and take() block automatically when the queue is full or empty, eliminating manual wait/notify code.',
    code: `import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class Main {
    public static void main(String[] args) {
        BlockingQueue<String> queue = new ArrayBlockingQueue<>(2);

        Thread producer = new Thread(() -> {
            try {
                queue.put("Message-1");
                System.out.println("Produced Message-1");
                queue.put("Message-2");
                System.out.println("Produced Message-2");
            } catch (InterruptedException e) {}
        });

        Thread consumer = new Thread(() -> {
            try {
                String m1 = queue.take();
                System.out.println("Consumed: " + m1);
                String m2 = queue.take();
                System.out.println("Consumed: " + m2);
            } catch (InterruptedException e) {}
        });

        producer.start();
        consumer.start();

        try {
            producer.join();
            consumer.join();
        } catch (InterruptedException e) {}

        System.out.println("Queue processing complete.");
    }
}
`,
  },

  // ─── 30. Comprehensive Concurrency Grand Suite ─────────────────────────────
  {
    id: 'p17-30-grand-concurrency-suite',
    title: '30 — Concurrency Grand Suite (Multi-Feature)',
    category: 'Java Concurrency & Threads',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Grand integration suite combining Threads, Locks, Synchronized methods, and Atomic variables in a complete workflow.',
    explanation: 'A comprehensive demonstration of real JVM concurrency: thread coordination, mutual exclusion, atomic hardware updates, and thread joining.',
    code: `import java.util.concurrent.atomic.AtomicInteger;

class SafeBank {
    private int balance = 1000;
    private static AtomicInteger transactionId = new AtomicInteger(100);

    public synchronized void transfer(int amount, String client) {
        int tx = transactionId.incrementAndGet();
        balance -= amount;
        System.out.println("[Tx #" + tx + "] " + client + " transferred " + amount + ", Balance: " + balance);
    }

    public synchronized int getBalance() {
        return balance;
    }
}

public class Main {
    public static void main(String[] args) {
        SafeBank bank = new SafeBank();

        Thread client1 = new Thread(() -> {
            for (int i = 0; i < 2; i++) {
                bank.transfer(100, "Client-A");
            }
        }, "Client-A");

        Thread client2 = new Thread(() -> {
            for (int i = 0; i < 2; i++) {
                bank.transfer(150, "Client-B");
            }
        }, "Client-B");

        client1.start();
        client2.start();

        try {
            client1.join();
            client2.join();
        } catch (InterruptedException e) {}

        System.out.println("Final Bank Balance: " + bank.getBalance());
    }
}
`,
  },
];
