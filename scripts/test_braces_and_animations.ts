import { executeJavaWorker } from '../src/server/javaExecutor.ts';

async function main() {
  const code = `
public class Main {
    public static void main(String[] args) {
        int x = 10;
        if (x > 5)
            x = 20;
        else
            x = 0;

        int sum = 0;
        for (int i = 0; i < 3; i++)
            sum += i;

        int j = 0;
        while (j < 3)
        {
            j++;
        }

        int[] arr = { 25, 10, 5 };
        // simple swap
        int temp = arr[0];
        arr[0] = arr[1];
        arr[1] = temp;

        System.out.println("x=" + x + ", sum=" + sum + ", j=" + j + ", arr0=" + arr[0]);
    }
}
`;

  console.log('Testing Arbitrary Java Syntax (no braces, braces on new lines)...');
  const result = await executeJavaWorker(code);
  console.log('Success:', result.success);
  console.log('Status:', result.status);
  console.log('Console Output:', result.consoleOutput);
  if (result.error) {
    console.error('Error:', result.error);
    process.exit(1);
  }
  if (!result.consoleOutput?.some(l => l.includes('x=20, sum=3, j=3, arr0=10'))) {
    console.error('Unexpected output');
    process.exit(1);
  }
  console.log('✅ Arbitrary brace-less and new-line brace Java code passed with zero errors!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
