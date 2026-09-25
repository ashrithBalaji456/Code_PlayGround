import http from 'http';

function executeCode(code) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ code, language: 'java' });
    const req = http.request(
      'http://127.0.0.1:5173/api/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  CodeFlow DSA Lab — Phase 5 E2E Verification Suite ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --- TEST 1: Linear Search ---
  console.log('--- Test 1: Linear Search Real Java Execution ---');
  const lsCode = `
public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50};
        int target = 40;
        int foundIdx = -1;
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                foundIdx = i;
                break;
            }
        }
        System.out.println("Found at: " + foundIdx);
    }
}
`;
  const lsRes = await executeCode(lsCode);
  assert(lsRes.success === true, 'Linear Search compiled and executed successfully');
  assert(lsRes.events && lsRes.events.length > 5, 'Linear Search generated trace events');
  const lsOutput = (lsRes.consoleOutput || []).join('\n');
  console.log('lsRes.consoleOutput is:', lsRes.consoleOutput);
  console.log('sample events:', lsRes.events?.slice(0, 5));
  assert(lsOutput.includes('Found at: 3'), 'Linear Search output verified: Found at: 3');

  // --- TEST 2: Binary Search ---
  console.log('\n--- Test 2: Binary Search Real Java Execution ---');
  const bsCode = `
public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50, 60, 70};
        int target = 50;
        int low = 0;
        int high = arr.length - 1;
        int found = -1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == target) {
                found = mid;
                break;
            } else if (arr[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        System.out.println("BS result: " + found);
    }
}
`;
  const bsRes = await executeCode(bsCode);
  assert(bsRes.success === true, 'Binary Search compiled and executed successfully');
  const bsOutput = (bsRes.consoleOutput || []).join('\n');
  assert(bsOutput.includes('BS result: 4'), 'Binary Search output verified: BS result: 4');
  console.log('Binary Search event types:', Array.from(new Set(bsRes.events?.map(e => e.type))));
  assert(bsRes.events.some(e => e.type === 'VARIABLE_UPDATE' || e.type === 'ARRAY_CREATE'), 'Binary Search emitted actual runtime events');

  // --- TEST 3: Bubble Sort ---
  console.log('\n--- Test 3: Bubble Sort Real Java Execution ---');
  const bubbleCode = `
public class Main {
    public static void main(String[] args) {
        int[] arr = {5, 2, 8, 1, 9};
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
        System.out.println("Sorted: " + arr[0] + "," + arr[1] + "," + arr[2] + "," + arr[3] + "," + arr[4]);
    }
}
`;
  const bubbleRes = await executeCode(bubbleCode);
  if (!bubbleRes.success) {
    console.error('bubbleRes error:', JSON.stringify(bubbleRes.error, null, 2));
  }
  assert(bubbleRes.success === true, 'Bubble Sort compiled and executed');
  const bubbleOutput = (bubbleRes.consoleOutput || []).join('\n');
  assert(bubbleOutput.includes('Sorted: 1,2,5,8,9'), 'Bubble Sort array correctly sorted');
  assert(bubbleRes.events.filter(e => e.type === 'ARRAY_UPDATE').length >= 4, 'Real swaps detected via ARRAY_UPDATE events');

  // --- TEST 4: Two Pointers ---
  console.log('\n--- Test 4: Two Pointers Real Java Execution ---');
  const twoPointerCode = `
public class Main {
    public static void main(String[] args) {
        int[] arr = {1, 2, 4, 7, 11, 15};
        int target = 15;
        int left = 0;
        int right = arr.length - 1;
        boolean found = false;
        while (left < right) {
            int sum = arr[left] + arr[right];
            if (sum == target) {
                found = true;
                break;
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        System.out.println("Two sum 15: " + found);
    }
}
`;
  const tpRes = await executeCode(twoPointerCode);
  assert(tpRes.success === true, 'Two Pointers compiled and executed');
  const tpOutput = (tpRes.consoleOutput || []).join('\n');
  assert(tpOutput.includes('Two sum 15: true'), 'Two Pointers target found correctly');

  // --- TEST 5: Kadane's Algorithm ---
  console.log('\n--- Test 5: Kadane\'s Algorithm Real Java Execution ---');
  const kadaneCode = `
public class Main {
    public static void main(String[] args) {
        int[] arr = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        int maxSoFar = arr[0];
        int currentMax = arr[0];
        for (int i = 1; i < arr.length; i++) {
            currentMax = Math.max(arr[i], currentMax + arr[i]);
            maxSoFar = Math.max(maxSoFar, currentMax);
        }
        System.out.println("Kadane max: " + maxSoFar);
    }
}
`;
  const kadaneRes = await executeCode(kadaneCode);
  assert(kadaneRes.success === true, 'Kadane compiled and executed');
  const kadaneOutput = (kadaneRes.consoleOutput || []).join('\n');
  assert(kadaneOutput.includes('Kadane max: 6'), 'Kadane maximum subarray sum is 6');

  // --- TEST 6: Recursion (Factorial & Call Stack) ---
  console.log('\n--- Test 6: Recursion Real Java Execution ---');
  const recCode = `
public class Main {
    public static int fact(int n) {
        if (n <= 1) return 1;
        return n * fact(n - 1);
    }
    public static void main(String[] args) {
        int ans = fact(5);
        System.out.println("Fact 5: " + ans);
    }
}
`;
  const recRes = await executeCode(recCode);
  assert(recRes.success === true, 'Recursion compiled and executed');
  const recOutput = (recRes.consoleOutput || []).join('\n');
  assert(recOutput.includes('Fact 5: 120'), 'Factorial 5 computed as 120');
  assert(recRes.events.some(e => e.type === 'FUNCTION_CALL'), 'Call stack FUNCTION_CALL events traced');

  // --- TEST 7: Dynamic Programming Tabulation ---
  console.log('\n--- Test 7: DP Tabulation Real Java Execution ---');
  const dpCode = `
public class Main {
    public static void main(String[] args) {
        int n = 7;
        int[] dp = new int[n + 1];
        dp[0] = 0;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        System.out.println("Fib 7: " + dp[n]);
    }
}
`;
  const dpRes = await executeCode(dpCode);
  assert(dpRes.success === true, 'DP Tabulation compiled and executed');
  const dpOutput = (dpRes.consoleOutput || []).join('\n');
  assert(dpOutput.includes('Fib 7: 13'), 'DP Tabulation computed Fib(7) = 13');
  assert(dpRes.events.filter(e => e.type === 'ARRAY_UPDATE').length >= 6, 'DP Table filled via actual array updates');

  // --- TEST 8: Section 65 Comprehensive Final Demo ---
  console.log('\n--- Test 8: Section 65 Comprehensive Final Demo ---');
  const section65Code = `
public class Main {
    public static void main(String[] args) {
        int[] arr = {5, 2, 8, 1, 3};
        int target = 8;

        // Search phase
        int found = -1;
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                found = i;
                break;
            }
        }

        // Sort phase
        for (int i = 0; i < arr.length; i++) {
            for (int j = 0; j < arr.length - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }

        System.out.println("Demo search: " + found);
        System.out.println("Demo sorted: " + arr[0] + "," + arr[1] + "," + arr[2] + "," + arr[3] + "," + arr[4]);
    }
}
`;
  const s65Res = await executeCode(section65Code);
  assert(s65Res.success === true, 'Section 65 Comprehensive Demo compiled and executed');
  const s65Output = (s65Res.consoleOutput || []).join('\n');
  assert(s65Output.includes('Demo search: 2'), 'Section 65 Search located target 8 at index 2');
  assert(s65Output.includes('Demo sorted: 1,2,3,5,8'), 'Section 65 Sort correctly sorted array to 1,2,3,5,8');

  console.log('\n====================================================');
  console.log(`  E2E TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
