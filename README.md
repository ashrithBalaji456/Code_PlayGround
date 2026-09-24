# CodeFlow DSA Lab 🚀

**CodeFlow DSA Lab** is an interactive programming learning platform where users write and execute real Java or Python code while observing actual execution represented visually and dynamically in memory.

The platform is **NOT a collection of hardcoded algorithm animations**. It strictly implements the core principle:

$$\text{USER CODE} \longrightarrow \text{ACTUAL EXECUTION} \longrightarrow \text{EXECUTION EVENTS} \longrightarrow \text{STATE CHANGES} \longrightarrow \text{LIVE ANIMATION}$$

Whenever the user's code creates, modifies, accesses, moves, compares, links, removes, or returns data, the corresponding visualization updates automatically and synchronously with source-code line highlighting.

---

## 🌟 Key Features

1. **Normalized Execution Event Model**:
   - Generic intermediate event schema that unifies Java and Python runtimes.
   - Captures `ARRAY_CREATE`, `ARRAY_UPDATE`, `ARRAY_SWAP`, `STACK_PUSH`, `STACK_POP`, `QUEUE_ENQUEUE`, `QUEUE_DEQUEUE`, `NODE_CREATE`, `NODE_LINK`, `TREE_LINK`, `MAP_INSERT`, `CONDITION_EVALUATE`, `FUNCTION_CALL`, `FUNCTION_RETURN`, and `EXCEPTION`.

2. **Dynamic Multi-Structure Canvas**:
   - Automatically provisions independent visualizations for all active variables.
   - For example:
     ```java
     Stack<Integer> a = new Stack<>();
     Stack<Integer> b = new Stack<>();
     Stack<Integer> c = new Stack<>();
     ```
     automatically provisions 3 independent visual stacks side-by-side.

3. **Supported Data Structures**:
   - **Arrays & 2D Matrices**: In-place mutations, active pointer indicators (`i`, `j`, `left`, `right`), and a toggleable **Chart Tracer** bar height view.
   - **Stacks**: Vertical vessel container, top pointer indicator, LIFO push and pop animations.
   - **Queues**: FIFO conveyor pipeline, front (dequeue) and rear (enqueue) indicators.
   - **Linked Lists**: Real heap nodes `[ Value | Next • ]` with animated SVG arrows, pointer tags (`head`, `curr`, `prev`), and null terminator.
   - **Trees & Heaps**: Hierarchical SVG curved/straight branches connecting parent and child nodes, plus sequential level-order array mapping for Heaps.
   - **Hash Tables**: Key hashing flow `Key ➔ hash() ➔ % Capacity ➔ Bucket Slot ➔ Chained Entry Node`.
   - **Graphs**: Interactive SVG graph with circular vertices and directed edges.

4. **Rich Debugger & Inspection Panels**:
   - **Variables Panel**: Scope tracking, types, runtime values, references, and estimated memory footprints.
   - **Stack vs Heap Memory Model**: Visual distinction between stack frames/primitives and heap allocations with compressed OOPs byte estimates (`int: 4B`, `ref: 8B`, `Node: ~24B`).
   - **Call Stack & Recursion**: Displays frame descent and return values for recursive functions (e.g. Factorial, Fibonacci).
   - **Execution Console**: Standard output stream (`System.out.println` and `print`).
   - **Visual Exception Diagnostics**: Detailed diagnosis of `NullPointerException` (with broken pointer visualization) and `ArrayIndexOutOfBoundsException`.

5. **Integrated IDE & Execution Controls**:
   - Monaco Editor with Java & Python syntax highlighting, line numbers, and gutter breakpoint toggles.
   - Execution controls: **Run**, **Pause**, **Resume**, **Stop**, **Prev Step**, **Next Step**, **Step Over/Into/Out**, **Restart**, **Timeline Scrubber**, and **Speed control** (0.25x to 4.0x).
   - Built-in **Study Guide** / Learning Mode with Big-O time and space complexity analysis and curated exercises.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Enter` / `Cmd + Enter` | Run Code Execution |
| `Right Arrow` | Step Forward |
| `Left Arrow` | Step Backward |
| `Space` | Pause / Resume Playback |
| Click Editor Gutter | Toggle Breakpoint on Line |

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Dark Developer Palette
- **Code Editor**: `@monaco-editor/react`
- **Icons**: Lucide React
- **Celebration FX**: `canvas-confetti`
