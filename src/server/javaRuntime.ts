export const CODE_FLOW_TRACER_JAVA = `package com.codeflow;

import java.io.*;
import java.util.*;

public class CodeFlowTracer {
    private static final List<String> events = new ArrayList<>();
    private static int stepCounter = 0;
    private static final int MAX_STEPS = 1500;
    private static PrintStream originalOut = System.out;
    private static final List<String> consoleLines = new ArrayList<>();

    public static void start() {
        stepCounter = 0;
        events.clear();
        consoleLines.clear();
        installConsole();
        recordEvent("{\\"type\\":\\"PROGRAM_START\\",\\"step\\":0,\\"line\\":1,\\"message\\":\\"Program execution started\\"}");
    }

    public static void installConsole() {
        originalOut = System.out;
        OutputStream customOut = new OutputStream() {
            private final ByteArrayOutputStream buffer = new ByteArrayOutputStream();

            @Override
            public void write(int b) throws IOException {
                if (b == '\\n') {
                    String line = buffer.toString("UTF-8");
                    buffer.reset();
                    consoleLines.add(line);
                    line = line.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\r", "");
                    recordEvent("{\\"type\\":\\"CONSOLE_OUTPUT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":0,\\"message\\":\\"" + line + "\\"}");
                } else if (b != '\\r') {
                    buffer.write(b);
                }
            }
        };
        try {
            System.setOut(new PrintStream(customOut, true, "UTF-8"));
        } catch (UnsupportedEncodingException ignored) {}
    }

    private static synchronized void recordEvent(String json) {
        if (stepCounter >= MAX_STEPS) {
            throw new RuntimeException("CodeFlow Safety Limit: Exceeded " + MAX_STEPS + " execution steps. Possible infinite loop.");
        }
        events.add(json);
    }

    public static void line(int line) {
        recordEvent("{\\"type\\":\\"LINE_EXECUTE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + "}");
    }

    public static void varCreate(String name, String type, Object val, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"VARIABLE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"dataType\\":\\"" + type + "\\",\\"value\\":" + valStr + "}");
    }

    public static void varUpdate(String name, String type, Object oldVal, Object newVal, int line) {
        String oldStr = formatValue(oldVal);
        String newStr = formatValue(newVal);
        recordEvent("{\\"type\\":\\"VARIABLE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"dataType\\":\\"" + type + "\\",\\"oldValue\\":" + oldStr + ",\\"newValue\\":" + newStr + "}");
    }

    public static void arrayCreate(String name, int[] arr, int line) {
        StringBuilder sb = new StringBuilder("[");
        if (arr != null) {
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append(arr[i]);
            }
        }
        sb.append("]");
        recordEvent("{\\"type\\":\\"ARRAY_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"arrayId\\":\\"" + name + "\\",\\"structureId\\":\\"" + name + "\\",\\"structureType\\":\\"array\\",\\"dataType\\":\\"int[]\\",\\"values\\":" + sb.toString() + "}");
    }

    public static void arrayUpdate(String name, int index, int oldVal, int newVal, int line) {
        recordEvent("{\\"type\\":\\"ARRAY_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"arrayId\\":\\"" + name + "\\",\\"structureId\\":\\"" + name + "\\",\\"structureType\\":\\"array\\",\\"index\\":" + index + ",\\"oldValue\\":" + oldVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void arrayAccess(String name, int index, int val, int line) {
        recordEvent("{\\"type\\":\\"ARRAY_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"arrayId\\":\\"" + name + "\\",\\"structureId\\":\\"" + name + "\\",\\"index\\":" + index + ",\\"value\\":" + val + "}");
    }

    // === STACK ===
    public static void stackCreate(String name, String type, int line) {
        recordEvent("{\\"type\\":\\"STACK_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"stack\\",\\"dataType\\":\\"" + type + "\\",\\"size\\":0}");
    }

    public static void stackPush(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"STACK_PUSH\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void stackPop(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"STACK_POP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void stackPeek(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"STACK_PEEK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void stackClear(String name, int line) {
        recordEvent("{\\"type\\":\\"STACK_CLEAR\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"size\\":0}");
    }

    // === QUEUE ===
    public static void queueCreate(String name, String type, int line) {
        recordEvent("{\\"type\\":\\"QUEUE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"queue\\",\\"dataType\\":\\"" + type + "\\",\\"size\\":0}");
    }

    public static void queueEnqueue(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"QUEUE_ENQUEUE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void queueDequeue(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"QUEUE_DEQUEUE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void queuePeek(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"QUEUE_PEEK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void queueClear(String name, int line) {
        recordEvent("{\\"type\\":\\"QUEUE_CLEAR\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"size\\":0}");
    }

    // === DEQUE ===
    public static void dequeCreate(String name, String type, int line) {
        recordEvent("{\\"type\\":\\"DEQUE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"deque\\",\\"dataType\\":\\"" + type + "\\",\\"size\\":0}");
    }

    public static void dequeAddFirst(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DEQUE_ADD_FIRST\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void dequeAddLast(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DEQUE_ADD_LAST\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void dequeRemoveFirst(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DEQUE_REMOVE_FIRST\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void dequeRemoveLast(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DEQUE_REMOVE_LAST\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void dequePeekFirst(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DEQUE_PEEK_FIRST\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void dequePeekLast(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DEQUE_PEEK_LAST\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    // === LINKED LIST ===
    public static void linkedListCreate(String name, String type, int line) {
        recordEvent("{\\"type\\":\\"LINKEDLIST_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"linkedlist\\",\\"dataType\\":\\"" + type + "\\",\\"size\\":0}");
    }

    public static void linkedListAdd(String name, Object val, int index, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"LINKEDLIST_ADD\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"index\\":" + index + ",\\"size\\":" + size + "}");
    }

    public static void linkedListAddFirst(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"LINKEDLIST_ADD_FIRST\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void linkedListAddLast(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"LINKEDLIST_ADD_LAST\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void linkedListRemove(String name, Object val, int index, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"LINKEDLIST_REMOVE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"index\\":" + index + ",\\"size\\":" + size + "}");
    }

    public static void linkedListRemoveFirst(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"LINKEDLIST_REMOVE_FIRST\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void linkedListRemoveLast(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"LINKEDLIST_REMOVE_LAST\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    public static void linkedListSet(String name, int index, Object oldVal, Object newVal, int line) {
        String oldStr = formatValue(oldVal);
        String newStr = formatValue(newVal);
        recordEvent("{\\"type\\":\\"LINKEDLIST_SET\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"index\\":" + index + ",\\"oldValue\\":" + oldStr + ",\\"newValue\\":" + newStr + "}");
    }

    public static void linkedListGet(String name, int index, Object val, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"LINKEDLIST_GET\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"index\\":" + index + ",\\"value\\":" + valStr + "}");
    }

    public static void linkedListClear(String name, int line) {
        recordEvent("{\\"type\\":\\"LINKEDLIST_CLEAR\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"size\\":0}");
    }

    // === HASHMAP ===
    public static void mapCreate(String name, String type, int line) {
        recordEvent("{\\"type\\":\\"MAP_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"map\\",\\"dataType\\":\\"" + type + "\\",\\"size\\":0}");
    }

    public static void mapPut(String name, Object key, Object val, Object oldVal, int hash, int bucket, int size, int line) {
        String keyStr = formatValue(key);
        String valStr = formatValue(val);
        String oldStr = formatValue(oldVal);
        recordEvent("{\\"type\\":\\"MAP_INSERT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"key\\":" + keyStr + ",\\"value\\":" + valStr + ",\\"oldValue\\":" + oldStr + ",\\"hash\\":" + hash + ",\\"bucket\\":" + bucket + ",\\"size\\":" + size + "}");
    }

    public static void mapGet(String name, Object key, Object val, int hash, int bucket, int line) {
        String keyStr = formatValue(key);
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"MAP_LOOKUP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"key\\":" + keyStr + ",\\"value\\":" + valStr + ",\\"hash\\":" + hash + ",\\"bucket\\":" + bucket + "}");
    }

    public static void mapRemove(String name, Object key, Object val, int hash, int bucket, int size, int line) {
        String keyStr = formatValue(key);
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"MAP_DELETE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"key\\":" + keyStr + ",\\"value\\":" + valStr + ",\\"hash\\":" + hash + ",\\"bucket\\":" + bucket + ",\\"size\\":" + size + "}");
    }

    public static void mapClear(String name, int line) {
        recordEvent("{\\"type\\":\\"MAP_CLEAR\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"size\\":0}");
    }

    // === HASHSET ===
    public static void setCreate(String name, String type, int line) {
        recordEvent("{\\"type\\":\\"SET_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"set\\",\\"dataType\\":\\"" + type + "\\",\\"size\\":0}");
    }

    public static void setAdd(String name, Object val, boolean added, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"SET_ADD\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"conditionResult\\":" + added + ",\\"size\\":" + size + "}");
    }

    public static void setRemove(String name, Object val, boolean removed, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"SET_REMOVE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"conditionResult\\":" + removed + ",\\"size\\":" + size + "}");
    }

    public static void setContains(String name, Object val, boolean found, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"SET_LOOKUP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"conditionResult\\":" + found + "}");
    }

    public static void setClear(String name, int line) {
        recordEvent("{\\"type\\":\\"SET_CLEAR\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"size\\":0}");
    }

    // === PRIORITY QUEUE ===
    public static void priorityQueueCreate(String name, String type, int line) {
        recordEvent("{\\"type\\":\\"PRIORITYQUEUE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"priorityqueue\\",\\"dataType\\":\\"" + type + "\\",\\"size\\":0}");
    }

    public static void priorityQueueAdd(String name, Object val, List<?> elements, int size, int line) {
        String valStr = formatValue(val);
        String elemsJson = formatList(elements);
        recordEvent("{\\"type\\":\\"PRIORITYQUEUE_ADD\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"values\\":" + elemsJson + ",\\"size\\":" + size + "}");
    }

    public static void priorityQueuePoll(String name, Object val, List<?> elements, int size, int line) {
        String valStr = formatValue(val);
        String elemsJson = formatList(elements);
        recordEvent("{\\"type\\":\\"PRIORITYQUEUE_POLL\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"values\\":" + elemsJson + ",\\"size\\":" + size + "}");
    }

    public static void priorityQueuePeek(String name, Object val, int size, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"PRIORITYQUEUE_PEEK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + valStr + ",\\"size\\":" + size + "}");
    }

    // === CONTROL FLOW & UTILITIES ===
    public static void condition(String expr, boolean result, int line) {
        String cleanExpr = expr.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        recordEvent("{\\"type\\":\\"CONDITION_EVALUATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"condition\\":\\"" + cleanExpr + "\\",\\"conditionResult\\":" + result + "}");
    }

    public static void loopStart(int line) {
        recordEvent("{\\"type\\":\\"LOOP_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + "}");
    }

    public static void loopIter(String var, Object val, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"LOOP_ITERATION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + var + "\\",\\"value\\":" + valStr + "}");
    }

    public static void loopEnd(int line) {
        recordEvent("{\\"type\\":\\"LOOP_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + "}");
    }

    public static void funcCall(String name, String argsJson, int line) {
        recordEvent("{\\"type\\":\\"FUNCTION_CALL\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"functionName\\":\\"" + name + "\\",\\"arguments\\":" + argsJson + "}");
    }

    public static void funcReturn(String name, Object returnVal, int line) {
        String retStr = formatValue(returnVal);
        recordEvent("{\\"type\\":\\"FUNCTION_RETURN\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"functionName\\":\\"" + name + "\\",\\"returnValue\\":" + retStr + "}");
    }

    public static void exception(Throwable t, int line) {
        String msg = (t.getMessage() != null ? t.getMessage() : t.getClass().getSimpleName())
            .replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\n", " ");
        recordEvent("{\\"type\\":\\"EXCEPTION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"message\\":\\"" + msg + "\\",\\"detail\\":\\"" + t.getClass().getName() + "\\"}");
    }

    public static void finish() {
        recordEvent("{\\"type\\":\\"PROGRAM_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":0,\\"message\\":\\"Program execution completed\\"}");
        System.setOut(originalOut);
        originalOut.println("__CODEFLOW_EVENTS_BEGIN__");
        originalOut.println("[" + String.join(",", events) + "]");
        originalOut.println("__CODEFLOW_EVENTS_END__");
    }

    private static String formatList(List<?> list) {
        if (list == null) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(formatValue(list.get(i)));
        }
        sb.append("]");
        return sb.toString();
    }

    private static String formatValue(Object val) {
        if (val == null) return "null";
        if (val instanceof String) {
            String s = ((String) val).replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\n", "\\\\n");
            return "\\"" + s + "\\"";
        }
        if (val instanceof Character) {
            return "\\"" + val + "\\"";
        }
        return String.valueOf(val);
    }
}
`;
