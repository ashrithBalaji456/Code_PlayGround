import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { PHASE_13_RUNTIME_JAVA_PRESETS } from '../src/presets/phase13RuntimePresets.ts';

function assert(cond: boolean, msg: string, details?: any) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`, details ? details : '');
    process.exit(1);
  }
}

async function runTest(id: string, name: string, validator: (res: any, steps: any[]) => void) {
  console.log(`\n--- Testing ${id}: ${name} ---`);
  const preset = PHASE_13_RUNTIME_JAVA_PRESETS.find(p => p.id === id);
  assert(preset !== undefined, `Preset ${id} exists in PHASE_13_RUNTIME_JAVA_PRESETS`);
  
  const res = await executeJavaWorker(preset!.code);
  assert(res.success === true, `Execution succeeded for ${id}`);
  assert(Array.isArray(res.events) && res.events.length > 0, `Emitted events for ${id}`);

  const steps = reconstructExecutionSteps(res.events!, preset!.code);
  assert(steps.length > 0, `Reconstructed steps for ${id} (total: ${steps.length})`);

  validator(res, steps);
}

async function main() {
  console.log('================================================================');
  console.log('  PHASE 13: COMPLETE JAVA RUNTIME & MEMORY GRAND VERIFICATION   ');
  console.log('================================================================');

  // 1. Primitive Variables (p13-01-primitive-variables)
  await runTest('p13-01-primitive-variables', 'Primitive Variables & Values', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['age']?.value === 22, 'int age = 22');
    assert(lastStep.variables['count']?.value === 100000, 'long count = 100000');
    assert(lastStep.variables['grade']?.value === 'A', 'char grade = A');
    assert(lastStep.variables['grade']?.unicodeCodePoint === 65, 'grade unicodeCodePoint = 65');
    assert(lastStep.variables['active']?.value === true, 'boolean active = true');
  });

  // 2. Assignment & Swap (p13-02-assignment-swap)
  await runTest('p13-02-assignment-swap', 'Variable Assignment & Swap', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['a']?.value === 20, 'Variable a swapped to 20');
    assert(lastStep.variables['b']?.value === 10, 'Variable b swapped to 10');
    assert(lastStep.variables['temp']?.value === 10, 'temp held previous value 10');
    // History timeline check on a
    const aHist = lastStep.variables['a'].history;
    assert(Array.isArray(aHist) && aHist.length >= 2, 'Variable a has history timeline');
  });

  // 3. Variable Scope and Inactive Scope Exit (p13-03-variable-scope)
  await runTest('p13-03-variable-scope', 'Variable Scope & Lifetime', (res, steps) => {
    const hasYInside = steps.some(st => st.variables['y'] !== undefined);
    assert(hasYInside, 'Variable y existed inside the if block');
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['y'] === undefined, 'Variable y exited active scope and was cleaned up');
    assert(lastStep.variables['x']?.value === 10, 'Variable x preserved in outer scope');
  });

  // 4. Object Creation & Heap Allocation (p13-04-object-creation)
  await runTest('p13-04-object-creation', 'Object Creation (new)', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['s'] !== undefined, 'Variable s exists');
    assert(lastStep.heap.length >= 1, 'Heap has allocated object');
    const studentObj = lastStep.heap.find((h: any) => h.className === 'Student' || h.type === 'Student');
    assert(studentObj !== undefined, 'Student object found in heap');
    assert(studentObj.fields?.['age'] === 22, 'Student age field set to 22');
  });

  // 5. Object References & Aliasing (p13-05-object-references)
  await runTest('p13-05-object-references', 'Object References & Aliasing', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    const s1 = lastStep.variables['s1'];
    const s2 = lastStep.variables['s2'];
    assert(s1 !== undefined && s2 !== undefined, 'Both s1 and s2 exist');
    assert(s1.value === s2.value, 's1 and s2 point to identical Heap object ID (aliasing)');
    const studentObj = lastStep.heap.find((h: any) => h.id === s1.value);
    assert(studentObj?.fields?.['age'] === 23, 'Mutation through s2 reflected when inspecting heap');
  });

  // 6. Reference Reassignment (p13-06-reference-reassignment)
  await runTest('p13-06-reference-reassignment', 'Reference Reassignment', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    const s1 = lastStep.variables['s1'];
    const s2 = lastStep.variables['s2'];
    assert(s1.value !== s2.value, 'After reassignment, s1 and s2 point to different Heap object IDs');
    assert(lastStep.heap.length >= 2, 'Two distinct Student objects exist on Heap');
  });

  // 7. Null Reference (p13-07-null)
  await runTest('p13-07-null', 'Null Reference Representation', (res, steps) => {
    // In early steps, s is null
    const nullStep = steps.find(st => st.variables['s'] && (st.variables['s'].value === null || st.variables['s'].value === 'null'));
    assert(nullStep !== undefined, 's was explicitly null');
    // Later reassigned
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['s']?.value !== null && lastStep.variables['s']?.value !== 'null', 's reassigned to valid object');
  });

  // 8. NullPointerException (p13-08-nullpointerexception)
  await runTest('p13-08-nullpointerexception', 'NullPointerException Handling', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['s'] !== undefined, 'Reference variable s exists');
    const hasNpeLog = steps.some(st => (st.consoleOutput || []).some(line => line.includes('Caught NullPointerException'))) || res.consoleOutput?.some((line: string) => line.includes('Caught NullPointerException'));
    assert(hasNpeLog, 'Caught NPE printed to consoleOutput');
  });

  // 9. Array References & Cloning (p13-09-array-references)
  await runTest('p13-09-array-references', 'Array References & Cloning', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    const a = lastStep.variables['a'];
    const b = lastStep.variables['b'];
    const c = lastStep.variables['c'];
    assert(a.value === b.value, 'a and b reference the exact same array object');
    assert(a.value !== c.value, 'c is an independent cloned array object');
  });

  // 10. String Operations & Character Cells (p13-10-string-operations)
  await runTest('p13-10-string-operations', 'String Operations & Indexing', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['s']?.value === 'Ashrith', 'String s = "Ashrith"');
    assert(lastStep.variables['len']?.value === 7, 's.length() = 7');
    assert(lastStep.variables['ch']?.value === 'h', 's.charAt(2) = "h"');
    assert(lastStep.variables['sub']?.value === 'shr', 's.substring(1, 4) = "shr"');
  });

  // 11. StringBuilder (p13-11-stringbuilder)
  await runTest('p13-11-stringbuilder', 'StringBuilder Mutability', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['sb'] !== undefined, 'StringBuilder sb exists');
    assert(lastStep.heap.length >= 1, 'StringBuilder exists in Heap');
  });

  // 12. Character Operations & Unicode (p13-12-character-operations)
  await runTest('p13-12-character-operations', 'Character Operations & Unicode', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['codePoint']?.value === 65, 'Unicode code point for A = 65');
    assert(lastStep.variables['ch']?.value === 'B', 'Character incremented from A to B');
    assert(lastStep.variables['ch']?.unicodeCodePoint === 66, 'New unicodeCodePoint = 66');
  });

  // 13. Type Casting (p13-13-type-casting)
  await runTest('p13-13-type-casting', 'Type Casting (Widening & Narrowing)', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['y']?.value === 10, 'Widened double y = 10');
    assert(lastStep.variables['casted']?.value === 10, 'Narrowed explicit cast (int) 10.8 = 10');
  });

  // 14. Autoboxing & Unboxing (p13-14 & p13-15)
  await runTest('p13-14-autoboxing', 'Autoboxing', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['boxed']?.value === 10, 'Autoboxed int 10 into Integer(10)');
  });
  await runTest('p13-15-unboxing', 'Auto-Unboxing', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['unboxed']?.value === 25, 'Unboxed Integer(25) to int 25');
    assert(lastStep.variables['result']?.value === 30, 'Arithmetic with unboxed value = 30');
  });

  // 15. Bitwise & Shifts (p13-16, p13-17, p13-18, p13-19)
  await runTest('p13-16-bitwise-and', 'Bitwise AND (&)', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['result']?.value === 1, '5 & 3 = 1');
  });
  await runTest('p13-17-bitwise-or', 'Bitwise OR (|)', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['result']?.value === 7, '5 | 3 = 7');
  });
  await runTest('p13-18-bitwise-xor', 'Bitwise XOR (^)', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['result']?.value === 6, '5 ^ 3 = 6');
  });
  await runTest('p13-19-bit-shifts', 'Bit Shifts (<<, >>)', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['left']?.value === 8, '4 << 1 = 8');
    assert(lastStep.variables['right']?.value === 2, '4 >> 1 = 2');
  });

  // 16. Bit Masks (p13-20-bit-masks)
  await runTest('p13-20-bit-masks', 'Bit Masks (Set, Clear, Toggle)', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['setBit']?.value === 7, 'Set bit 1: 5 | 2 = 7');
    assert(lastStep.variables['clearBit']?.value === 6, 'Clear bit 0: 7 & ~1 = 6');
    assert(lastStep.variables['toggleBit']?.value === 2, 'Toggle bit 2: 6 ^ 4 = 2');
  });

  // 17. Exceptions & Try-Catch-Finally (p13-21 & p13-22)
  await runTest('p13-21-exception-handling', 'Exception Handling (try-catch)', (res, steps) => {
    const hasLog = steps.some(st => (st.consoleOutput || []).some(l => l.includes('Caught ArithmeticException'))) || res.consoleOutput?.some((l: string) => l.includes('Caught ArithmeticException'));
    assert(hasLog, 'Caught ArithmeticException logged');
  });
  await runTest('p13-22-try-catch-finally', 'Try / Catch / Finally Control Flow', (res, steps) => {
    const hasFinally = steps.some(st => (st.consoleOutput || []).some(l => l.includes('In finally block'))) || res.consoleOutput?.some((l: string) => l.includes('In finally block'));
    assert(hasFinally, 'Finally block executed');
  });

  // 18. Static Class Variables (p13-26-static-variables)
  await runTest('p13-26-static-variables', 'Static Class Variables (Metaspace)', (res, steps) => {
    const hasStatic = steps.some(st => (st.consoleOutput || []).some(l => l.includes('globalCount = 2'))) || res.consoleOutput?.some((l: string) => l.includes('globalCount = 2'));
    assert(hasStatic, 'Static globalCount across instances = 2');
  });

  // 19. Object Reachability (p13-30-object-reachability)
  await runTest('p13-30-object-reachability', 'Object Reachability & GC Eligibility', (res, steps) => {
    const lastStep = steps[steps.length - 1];
    assert(lastStep.variables['s']?.value === null || lastStep.variables['s']?.value === 'null', 's set to null');
    const hasGc = steps.some(st => (st.consoleOutput || []).some(l => l.includes('eligible for garbage collection'))) || res.consoleOutput?.some((l: string) => l.includes('eligible for garbage collection'));
    assert(hasGc, 'GC eligibility confirmed');
  });

  // 20. SECTION 73: FINAL GRAND RUNTIME & MEMORY DEMO (p13-31-final-java-demo)
  await runTest('p13-31-final-java-demo', 'Phase 13 Final Comprehensive Java Demo', (res, steps) => {
    console.log(`  Verifying ${steps.length} execution steps for Section 73 Final Grand Demo...`);
    const lastStep = steps[steps.length - 1];
    
    // Primitives
    assert(lastStep.variables['sum']?.value === 30, 'Primitive sum: 10 + 20 = 30');
    
    // Objects & References
    assert(lastStep.variables['s1']?.value === lastStep.variables['s2']?.value, 's1 and s2 reference same Student (Aliasing)');
    const student = lastStep.heap.find((h: any) => h.id === lastStep.variables['s1']?.value);
    assert(student?.fields?.['age'] === 23, 'Student age mutated through s2 = 23');
    
    // Null & Exception
    assert(lastStep.variables['emptyStudent']?.value === null || lastStep.variables['emptyStudent']?.value === 'null', 'emptyStudent is null');
    
    // Bit manipulation
    assert(lastStep.variables['bitResult']?.value === ((5 & 3) | (1 << 2)), 'Bit result calculated correctly: 5');
    
    // Recursion
    assert(lastStep.variables['fact5']?.value === 120, 'factorial(5) = 120');

    // Step replay consistency
    for (let i = 0; i < steps.length; i++) {
      assert(steps[i].stepIndex === i, `Step index consistent at step ${i}`);
      assert(steps[i].line > 0, `Valid source line at step ${i}`);
    }
  });

  console.log('\n================================================================');
  console.log('  ALL PHASE 13 RUNTIME & MEMORY VERIFICATION TESTS PASSED 100%! ');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
