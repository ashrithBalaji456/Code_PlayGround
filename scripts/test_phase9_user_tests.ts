import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';

// Test 2: Custom Node class linked list traversal
const test2Java = `class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}

public class Main {
    public static void main(String[] args) {
        Node first = new Node(10);
        Node second = new Node(20);
        Node third = new Node(30);

        first.next = second;
        second.next = third;

        Node current = first;

        while (current != null) {
            System.out.println(current.data);
            current = current.next;
        }
    }
}`;

// Test 3: Map<String, List<Integer>> with iteration
const test3Java = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<String, List<Integer>> map = new HashMap<>();

        map.put("A", new ArrayList<>());
        map.put("B", new ArrayList<>());

        map.get("A").add(10);
        map.get("A").add(20);

        map.get("B").add(30);

        for (Map.Entry<String, List<Integer>> entry : map.entrySet()) {
            System.out.println(entry.getKey());
            for (int value : entry.getValue()) {
                System.out.println(value);
            }
        }
    }
}`;

// Test 4: Reference parameters mutation
const test4Java = `public class Main {
    static void change(int[] arr) {
        arr[0] = 100;
    }

    public static void main(String[] args) {
        int[] arr = new int[]{1, 2, 3};
        change(arr);
        System.out.println(arr[0]);
    }
}`;

// Test 5: NPE explanation
const test5Java = `public class Main {
    public static void main(String[] args) {
        String value = null;
        System.out.println(value.length());
    }
}`;

async function run() {
    console.log('=== RUNNING TEST 2: CUSTOM NODE LINKED LIST ===');
    const res2 = await executeJavaWorker(test2Java);
    console.log('Test 2 Success:', res2.success, 'Console:', res2.consoleOutput, 'Error:', res2.error);
    const steps2 = reconstructExecutionSteps(res2.events, test2Java);
    console.log('Test 2 Steps:', steps2.length);
    if (steps2.length > 0) {
        const last = steps2[steps2.length - 1];
        console.log('Test 2 vars:', Object.keys(last.variables));
        console.log('Test 2 structures:', Object.keys(last.structures));
    }

    console.log('\n=== RUNNING TEST 3: MAP WITH NESTED LISTS ===');
    const res3 = await executeJavaWorker(test3Java);
    console.log('Test 3 Success:', res3.success, 'Console:', res3.consoleOutput, 'Error:', res3.error);
    if (res3.events) {
        const steps3 = reconstructExecutionSteps(res3.events, test3Java);
        console.log('Test 3 Steps:', steps3.length);
        if (steps3.length > 0) {
            const last = steps3[steps3.length - 1];
            console.log('Test 3 vars:', Object.keys(last.variables));
            console.log('Test 3 structures:', Object.keys(last.structures));
            if (last.structures['map']?.mapData) {
                console.log('Test 3 map entries:', JSON.stringify(last.structures['map'].mapData.entries));
            }
        }
    }

    console.log('\n=== RUNNING TEST 4: REFERENCE PARAMETERS ===');
    const res4 = await executeJavaWorker(test4Java);
    console.log('Test 4 Success:', res4.success, 'Console:', res4.consoleOutput);
    if (res4.events) {
        const steps4 = reconstructExecutionSteps(res4.events, test4Java);
        console.log('Test 4 Steps:', steps4.length);
        if (steps4.length > 0) {
            const last = steps4[steps4.length - 1];
            console.log('Test 4 arr[0]:', (last.structures['arr']?.arrayData as any)?.[0]);
        }
    }

    console.log('\n=== RUNNING TEST 5: NULL POINTER EXCEPTION ===');
    const res5 = await executeJavaWorker(test5Java);
    console.log('Test 5 Success:', res5.success, 'Error:', res5.error);
    if (res5.events) {
        const steps5 = reconstructExecutionSteps(res5.events, test5Java);
        console.log('Test 5 Steps:', steps5.length);
        if (steps5.length > 0) {
            const last = steps5[steps5.length - 1];
            console.log('Test 5 Error info:', last.error);
        }
    }
}

run().catch(console.error);
