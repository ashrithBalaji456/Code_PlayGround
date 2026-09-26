import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';

const bfsJava = `import java.util.*;

public class Main {

    static void bfs(List<List<Integer>> graph, int start) {
        boolean[] visited = new boolean[graph.size()];
        Queue<Integer> queue = new LinkedList<>();

        queue.offer(start);
        visited[start] = true;

        while (!queue.isEmpty()) {
            int node = queue.poll();
            System.out.print(node + " ");

            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }
    }

    public static void main(String[] args) {
        int n = 6;

        List<List<Integer>> graph = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            graph.add(new ArrayList<>());
        }

        graph.get(0).add(1);
        graph.get(0).add(2);

        graph.get(1).add(0);
        graph.get(1).add(3);
        graph.get(1).add(4);

        graph.get(2).add(0);
        graph.get(2).add(4);

        graph.get(3).add(1);
        graph.get(3).add(5);

        graph.get(4).add(1);
        graph.get(4).add(2);
        graph.get(4).add(5);

        graph.get(5).add(3);
        graph.get(5).add(4);

        bfs(graph, 0);
    }
}`;

async function main() {
  console.log('Testing Arbitrary BFS Java Code...');
  const res = await executeJavaWorker(bfsJava);
  console.log('Success:', res.success);
  console.log('Console:', res.consoleOutput);
  console.log('Error:', res.error);
  console.log('Event count:', res.events.length);
  
  if (res.events.length > 0) {
    console.log('First 10 events:');
    res.events.slice(0, 10).forEach((e, idx) => console.log(`  [${idx}]`, e.type, e.variable || e.structureId, e.value || e.newValue));
    console.log('Last 10 events:');
    res.events.slice(-10).forEach((e, idx) => console.log(`  [${res.events.length - 10 + idx}]`, e.type, e.variable || e.structureId, e.value || e.newValue));
  }

  const steps = reconstructExecutionSteps(res.events, bfsJava);
  console.log('Total reconstructed steps:', steps.length);
  if (steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    console.log('Last step variables:', Object.keys(lastStep.variables));
    console.log('Last step structures:', Object.keys(lastStep.structures));
  }
}

main().catch(console.error);
