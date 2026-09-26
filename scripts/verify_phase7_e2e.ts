import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';

function assert(cond: boolean, msg: string, details?: any) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`, details ? details : '');
    process.exit(1);
  }
}

async function run() {
  console.log('================================================================');
  console.log('  PHASE 7: ADVANCED DYNAMIC PROGRAMMING JVM E2E VERIFICATION');
  console.log('================================================================\n');

  // --- Test 1: 0/1 Knapsack Execution ---
  console.log('--- Test 1: 0/1 Knapsack Actual JVM Execution ---');
  const ksJava = `
public class Main {
    public static void main(String[] args) {
        int[] weights = {1, 3, 4};
        int[] values = {15, 20, 30};
        int W = 4;
        int n = weights.length;

        int[][] dp = new int[n + 1][W + 1];
        CodeFlowTracer.knapsackStart("dp_knapsack", n, W, 10);
        CodeFlowTracer.dpTableCreate("dp_knapsack", "[5, 5]", 11);

        for (int i = 1; i <= n; i++) {
            int wt = weights[i - 1];
            int val = values[i - 1];
            CodeFlowTracer.knapsackItemSelect("dp_knapsack", i, wt, val, 16);

            for (int w = 1; w <= W; w++) {
                CodeFlowTracer.knapsackCapacitySelect("dp_knapsack", i, w, 19);
                boolean fits = wt <= w;
                CodeFlowTracer.knapsackFitCheck("dp_knapsack", i, w, wt, fits, 21);

                int exclude = dp[i - 1][w];
                CodeFlowTracer.knapsackExclude("dp_knapsack", i, w, exclude, 24);

                if (fits) {
                    int include = val + dp[i - 1][w - wt];
                    CodeFlowTracer.knapsackInclude("dp_knapsack", i, w, include, 28);
                    int chosen = Math.max(exclude, include);
                    CodeFlowTracer.knapsackCompare("dp_knapsack", i, w, exclude, include, chosen, 30);
                    dp[i][w] = chosen;
                    CodeFlowTracer.knapsackStateUpdate("dp_knapsack", i, w, exclude, chosen, 32);
                } else {
                    dp[i][w] = exclude;
                    CodeFlowTracer.knapsackStateUpdate("dp_knapsack", i, w, exclude, exclude, 35);
                }
            }
        }
        CodeFlowTracer.knapsackEnd("dp_knapsack", dp[n][W], 40);
        System.out.println("Knapsack Max Value = " + dp[n][W]);
    }
}
`;
  const ksResult = await executeJavaWorker(ksJava);
  assert(ksResult.success, '0/1 Knapsack Java compilation and execution succeeded', ksResult.error);
  assert((ksResult.events?.length ?? 0) > 20, '0/1 Knapsack emitted rich execution trace', { count: ksResult.events?.length });
  const ksSteps = reconstructExecutionSteps(ksResult.events, ksJava);
  assert(ksSteps.length > 0, 'Reconstructed steps for 0/1 Knapsack');
  const ksLast = ksSteps[ksSteps.length - 1];
  assert(ksLast.algorithmState?.dpTable2D?.[3]?.[4] === 35, '0/1 Knapsack optimal answer dp[3][4] == 35', ksLast.algorithmState?.dpTable2D);

  // --- Test 2: Unbounded Knapsack Execution ---
  console.log('\n--- Test 2: Unbounded Knapsack Actual JVM Execution ---');
  const ubJava = `
public class Main {
    public static void main(String[] args) {
        int[] weights = {1, 3, 4};
        int[] values = {15, 20, 30};
        int capacity = 4;
        int n = weights.length;

        int[] dp = new int[capacity + 1];
        CodeFlowTracer.unboundedKnapsackStart("dp_unbounded", capacity, 9);

        for (int w = 1; w <= capacity; w++) {
            CodeFlowTracer.unboundedCapacitySelect("dp_unbounded", w, 12);
            for (int i = 0; i < n; i++) {
                int wt = weights[i];
                int val = values[i];
                CodeFlowTracer.unboundedItemSelect("dp_unbounded", i, wt, val, 16);
                boolean fits = wt <= w;
                CodeFlowTracer.unboundedFitCheck("dp_unbounded", w, wt, fits, 18);

                if (fits) {
                    int prev = dp[w];
                    int candidate = val + dp[w - wt];
                    CodeFlowTracer.unboundedInclude("dp_unbounded", w, candidate, 23);
                    int chosen = Math.max(prev, candidate);
                    CodeFlowTracer.unboundedCompare("dp_unbounded", w, prev, candidate, chosen, 25);
                    dp[w] = chosen;
                    CodeFlowTracer.unboundedStateUpdate("dp_unbounded", w, prev, chosen, 27);
                }
            }
        }
        CodeFlowTracer.unboundedEnd("dp_unbounded", dp[capacity], 32);
        System.out.println("Unbounded Knapsack Max Value = " + dp[capacity]);
    }
}
`;
  const ubResult = await executeJavaWorker(ubJava);
  assert(ubResult.success, 'Unbounded Knapsack Java compilation and execution succeeded');
  const ubSteps = reconstructExecutionSteps(ubResult.events, ubJava);
  const ubLast = ubSteps[ubSteps.length - 1];
  assert(ubLast.algorithmState?.dpTable1D?.[4] === 60, 'Unbounded Knapsack dp[4] == 60 (4 x Item 0: 4 * 15)', ubLast.algorithmState?.dpTable1D);

  // --- Test 3: Coin Change (Minimum Coins) Execution ---
  console.log('\n--- Test 3: Coin Change (Minimum Coins) Actual JVM Execution ---');
  const coinJava = `
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] coins = {1, 2, 5};
        int amount = 5;

        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;

        CodeFlowTracer.coinChangeStart("dp_coins", "Coin Change — Minimum Coins", amount, 11);

        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                CodeFlowTracer.coinSelect("dp_coins", c, 14);
                CodeFlowTracer.coinAmountSelect("dp_coins", c, a, 15);
                boolean fits = c <= a;
                CodeFlowTracer.coinFitCheck("dp_coins", c, a, fits, 16);

                if (fits) {
                    int cand = dp[a - c] + 1;
                    CodeFlowTracer.coinCandidate("dp_coins", c, a, cand, 22);
                    int prev = dp[a];
                    int chosen = Math.min(prev, cand);
                    CodeFlowTracer.coinCompare("dp_coins", a, prev, cand, chosen, 25);
                    dp[a] = chosen;
                    CodeFlowTracer.coinStateUpdate("dp_coins", a, prev, chosen, 27);
                }
            }
        }
        int res = dp[amount] > amount ? -1 : dp[amount];
        CodeFlowTracer.coinChangeEnd("dp_coins", res, 32);
        System.out.println("Min Coins for " + amount + " = " + res);
    }
}
`;
  const coinResult = await executeJavaWorker(coinJava);
  assert(coinResult.success, 'Coin Change Java execution succeeded', coinResult.error);
  const coinSteps = reconstructExecutionSteps(coinResult.events!, coinJava);
  const coinLast = coinSteps[coinSteps.length - 1];
  assert(coinLast.algorithmState?.dpTable1D?.[5] === 1, 'Minimum coins for 5 is 1 (one 5-coin)', coinLast.algorithmState?.dpTable1D);

  // --- Test 4: Longest Common Subsequence & Reconstruction ---
  console.log('\n--- Test 4: LCS & Reconstruction Actual JVM Execution ---');
  const lcsJava = `
public class Main {
    public static void main(String[] args) {
        String s1 = "abcde";
        String s2 = "ace";
        int m = s1.length();
        int n = s2.length();

        int[][] dp = new int[m + 1][n + 1];
        CodeFlowTracer.lcsStart("dp_lcs", s1, s2, 9);

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                char c1 = s1.charAt(i - 1);
                char c2 = s2.charAt(j - 1);
                boolean match = (c1 == c2);
                CodeFlowTracer.lcsCharCompare("dp_lcs", i, j, c1, c2, match, 16);

                if (match) {
                    int old = dp[i - 1][j - 1];
                    int neu = old + 1;
                    dp[i][j] = neu;
                    CodeFlowTracer.lcsMatch("dp_lcs", i, j, old, neu, 22);
                    CodeFlowTracer.lcsStateUpdate("dp_lcs", i, j, old, neu, 23);
                } else {
                    int top = dp[i - 1][j];
                    int left = dp[i][j - 1];
                    int chosen = Math.max(top, left);
                    dp[i][j] = chosen;
                    CodeFlowTracer.lcsMismatch("dp_lcs", i, j, top, left, chosen, 29);
                    CodeFlowTracer.lcsStateUpdate("dp_lcs", i, j, 0, chosen, 30);
                }
            }
        }

        // Traceback
        CodeFlowTracer.lcsReconstructionStart("dp_lcs", m, n, 35);
        int curI = m, curJ = n;
        StringBuilder sb = new StringBuilder();
        while (curI > 0 && curJ > 0) {
            if (s1.charAt(curI - 1) == s2.charAt(curJ - 1)) {
                sb.append(s1.charAt(curI - 1));
                CodeFlowTracer.lcsReconstructionStep("dp_lcs", curI, curJ, s1.charAt(curI - 1), "Matched char", 42);
                curI--;
                curJ--;
            } else if (dp[curI - 1][curJ] >= dp[curI][curJ - 1]) {
                curI--;
            } else {
                curJ--;
            }
        }
        String lcs = sb.reverse().toString();
        CodeFlowTracer.lcsReconstructionEnd("dp_lcs", lcs, 52);
        CodeFlowTracer.lcsEnd("dp_lcs", dp[m][n], 53);
        System.out.println("LCS = " + lcs + ", len = " + dp[m][n]);
    }
}
`;
  const lcsResult = await executeJavaWorker(lcsJava);
  assert(lcsResult.success, 'LCS Java execution succeeded', lcsResult.error);
  const lcsSteps = reconstructExecutionSteps(lcsResult.events!, lcsJava);
  const lcsLast = lcsSteps[lcsSteps.length - 1];
  assert(lcsLast.algorithmState?.lcsResult === 'ace', 'LCS reconstructed is "ace"');
  assert(lcsLast.algorithmState?.dpTable2D?.[5]?.[3] === 3, 'LCS length is 3');

  // --- Test 5: LIS & Parent Reconstruction ---
  console.log('\n--- Test 5: LIS & Parent Reconstruction Actual JVM Execution ---');
  const lisJava = `
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 9, 2, 5, 3, 7, 101, 18};
        int n = arr.length;
        int[] dp = new int[n];
        int[] parent = new int[n];
        Arrays.fill(dp, 1);
        Arrays.fill(parent, -1);

        CodeFlowTracer.lisStart("dp_lis", n, 12);

        int maxLen = 1;
        int bestEnd = 0;

        for (int i = 0; i < n; i++) {
            CodeFlowTracer.lisIndexSelect("dp_lis", i, 18);
            for (int j = 0; j < i; j++) {
                boolean less = arr[j] < arr[i];
                CodeFlowTracer.lisCompare("dp_lis", i, j, arr[i], arr[j], less, 21);

                if (less) {
                    int cand = dp[j] + 1;
                    CodeFlowTracer.lisCandidate("dp_lis", i, j, cand, 25);
                    if (cand > dp[i]) {
                        dp[i] = cand;
                        parent[i] = j;
                        CodeFlowTracer.lisStateUpdate("dp_lis", i, dp[i] - 1, cand, 29);
                        CodeFlowTracer.lisParentUpdate("dp_lis", i, j, 30);
                    }
                }
            }
            if (dp[i] > maxLen) {
                maxLen = dp[i];
                bestEnd = i;
            }
        }

        CodeFlowTracer.lisReconstructionStart("dp_lis", bestEnd, 40);
        int curr = bestEnd;
        while (curr != -1) {
            CodeFlowTracer.lisReconstructionStep("dp_lis", curr, arr[curr], parent[curr], 44);
            curr = parent[curr];
        }

        CodeFlowTracer.lisEnd("dp_lis", maxLen, 49);
        System.out.println("LIS length = " + maxLen);
    }
}
`;
  const lisResult = await executeJavaWorker(lisJava);
  assert(lisResult.success, 'LIS Java execution succeeded', lisResult.error);
  const lisSteps = reconstructExecutionSteps(lisResult.events!, lisJava);
  const lisLast = lisSteps[lisSteps.length - 1];
  assert(lisLast.algorithmState?.dpTable1D?.[7] === 4, 'LIS at index 7 is 4 (2 -> 5 -> 7 -> 18 or 2 -> 3 -> 7 -> 18)');
  assert(lisLast.algorithmState?.lisReconstructedIndices?.length === 4, 'Reconstructed 4 indices for optimal LIS');

  // --- Test 6: Grid DP (Unique Paths & Obstacles) ---
  console.log('\n--- Test 6: Grid DP Actual JVM Execution ---');
  const gridJava = `
public class Main {
    public static void main(String[] args) {
        int rows = 3;
        int cols = 3;
        int[][] grid = {
            {0, 0, 0},
            {0, 1, 0}, // obstacle at (1,1)
            {0, 0, 0}
        };

        int[][] dp = new int[rows][cols];
        CodeFlowTracer.gridDpStart("dp_grid", "Unique Paths with Obstacles", rows, cols, 12);

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                CodeFlowTracer.gridCellSelect("dp_grid", r, c, 16);
                boolean isObstacle = (grid[r][c] == 1);
                CodeFlowTracer.gridObstacleCheck("dp_grid", r, c, isObstacle, 18);

                if (isObstacle) {
                    dp[r][c] = 0;
                    CodeFlowTracer.gridStateUpdate("dp_grid", r, c, 0, 0, 22);
                    continue;
                }

                if (r == 0 && c == 0) {
                    dp[r][c] = 1;
                    CodeFlowTracer.gridStateUpdate("dp_grid", r, c, 0, 1, 28);
                } else {
                    int top = (r > 0) ? dp[r - 1][c] : 0;
                    int left = (c > 0) ? dp[r][c - 1] : 0;
                    CodeFlowTracer.gridCandidate("dp_grid", r, c, top, left, 32);
                    dp[r][c] = top + left;
                    CodeFlowTracer.gridStateUpdate("dp_grid", r, c, 0, dp[r][c], 34);
                }
            }
        }
        CodeFlowTracer.gridDpEnd("dp_grid", dp[rows - 1][cols - 1], 39);
        System.out.println("Paths = " + dp[rows - 1][cols - 1]);
    }
}
`;
  const gridResult = await executeJavaWorker(gridJava);
  assert(gridResult.success, 'Grid DP Java execution succeeded', gridResult.error);
  const gridSteps = reconstructExecutionSteps(gridResult.events!, gridJava);
  const gridLast = gridSteps[gridSteps.length - 1];
  assert(gridLast.algorithmState?.dpTable2D?.[2]?.[2] === 2, 'Unique paths for 3x3 with obstacle at (1,1) is 2', gridLast.algorithmState?.dpTable2D);

  // --- Test 7: Bitmask DP Execution ---
  console.log('\n--- Test 7: Bitmask DP Actual JVM Execution ---');
  const bitmaskJava = `
public class Main {
    public static void main(String[] args) {
        int n = 3;
        int totalMasks = 1 << n;
        int[] dp = new int[totalMasks];

        CodeFlowTracer.bitmaskDpStart("dp_mask", n, 8);

        for (int mask = 0; mask < totalMasks; mask++) {
            CodeFlowTracer.bitmaskCreate("dp_mask", mask, 11);
            for (int i = 0; i < n; i++) {
                boolean bitSet = ((mask & (1 << i)) != 0);
                CodeFlowTracer.bitmaskBitCheck("dp_mask", mask, i, bitSet, 14);

                if (!bitSet) {
                    int nextMask = mask | (1 << i);
                    CodeFlowTracer.bitmaskBitSet("dp_mask", mask, i, nextMask, 18);
                    int candidate = dp[mask] + (i + 1) * 10;
                    CodeFlowTracer.bitmaskTransition("dp_mask", mask, nextMask, candidate, 20);
                    if (candidate > dp[nextMask]) {
                        int old = dp[nextMask];
                        dp[nextMask] = candidate;
                        CodeFlowTracer.bitmaskStateUpdate("dp_mask", nextMask, i, old, candidate, 24);
                    }
                }
            }
        }
        CodeFlowTracer.bitmaskDpEnd("dp_mask", dp[totalMasks - 1], 30);
        System.out.println("Bitmask max = " + dp[totalMasks - 1]);
    }
}
`;
  const bitmaskResult = await executeJavaWorker(bitmaskJava);
  assert(bitmaskResult.success, 'Bitmask DP Java execution succeeded', bitmaskResult.error);
  const bitmaskSteps = reconstructExecutionSteps(bitmaskResult.events!, bitmaskJava);
  const bitmaskLast = bitmaskSteps[bitmaskSteps.length - 1];
  assert(bitmaskLast.algorithmState?.dpTable1D?.[7] === 60, 'Bitmask state 7 (all 3 items selected) cost = 60', bitmaskLast.algorithmState?.dpTable1D);

  // --- Test 8: Memoization Cache Execution ---
  console.log('\n--- Test 8: Top-Down Memoization Actual JVM Execution ---');
  const memoJava = `
import java.util.HashMap;
import java.util.Map;

public class Main {
    static Map<Integer, Long> memo = new HashMap<>();

    static long fib(int n) {
        CodeFlowTracer.memoLookup("fib_cache", String.valueOf(n), 9);
        if (memo.containsKey(n)) {
            long val = memo.get(n);
            CodeFlowTracer.memoHit("fib_cache", String.valueOf(n), val, 12);
            CodeFlowTracer.memoReturn("fib_cache", String.valueOf(n), val, 13);
            return val;
        }

        CodeFlowTracer.memoMiss("fib_cache", String.valueOf(n), 17);
        if (n <= 1) {
            memo.put(n, (long) n);
            CodeFlowTracer.memoStore("fib_cache", String.valueOf(n), (long) n, 20);
            return n;
        }

        CodeFlowTracer.memoCompute("fib_cache", String.valueOf(n), 24);
        long res = fib(n - 1) + fib(n - 2);
        memo.put(n, res);
        CodeFlowTracer.memoStore("fib_cache", String.valueOf(n), res, 27);
        CodeFlowTracer.memoReturn("fib_cache", String.valueOf(n), res, 28);
        return res;
    }

    public static void main(String[] args) {
        long ans = fib(6);
        System.out.println("Fib(6) = " + ans);
    }
}
`;
  const memoResult = await executeJavaWorker(memoJava);
  assert(memoResult.success, 'Memoization Java execution succeeded', memoResult.error);
  const memoSteps = reconstructExecutionSteps(memoResult.events!, memoJava);
  const memoLast = memoSteps[memoSteps.length - 1];
  assert(memoLast.algorithmState?.dpSparseMap?.['6'] === 8, 'Fib(6) stored in memoization sparse map is 8', memoLast.algorithmState?.dpSparseMap);
  assert(memoLast.algorithmState?.metrics.cacheHits > 0, 'Observed real cache hits in memoization trace', memoLast.algorithmState?.metrics.cacheHits);

  console.log('\n================================================================');
  console.log('  ALL PHASE 7 JVM E2E EXECUTION TESTS PASSED (100%)!');
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});
