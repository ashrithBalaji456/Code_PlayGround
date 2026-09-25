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

    public static void matrixCreate(String name, int[][] mat, int line) {
        StringBuilder sb = new StringBuilder("[");
        if (mat != null) {
            for (int i = 0; i < mat.length; i++) {
                if (i > 0) sb.append(",");
                sb.append("[");
                if (mat[i] != null) {
                    for (int j = 0; j < mat[i].length; j++) {
                        if (j > 0) sb.append(",");
                        sb.append(mat[i][j]);
                    }
                }
                sb.append("]");
            }
        }
        sb.append("]");
        recordEvent("{\\"type\\":\\"MATRIX_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"matrix\\",\\"dataType\\":\\"int[][]\\",\\"values\\":" + sb.toString() + "}");
    }

    public static void matrixUpdate(String name, int r, int c, int oldVal, int newVal, int line) {
        recordEvent("{\\"type\\":\\"MATRIX_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"matrix\\",\\"row\\":" + r + ",\\"col\\":" + c + ",\\"oldValue\\":" + oldVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void matrixAccess(String name, int r, int c, int val, int line) {
        recordEvent("{\\"type\\":\\"MATRIX_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"matrix\\",\\"row\\":" + r + ",\\"col\\":" + c + ",\\"value\\":" + val + "}");
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

    // === BINARY TREE & BST ===
    public static void treeCreate(String structId, String varName, String type, int line) {
        recordEvent("{\\"type\\":\\"TREE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"variable\\":\\"" + varName + "\\",\\"structureType\\":\\"tree\\",\\"dataType\\":\\"" + type + "\\",\\"size\\":0}");
    }

    public static void treeNodeCreate(String structId, String nodeId, Object val, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"TREE_NODE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"value\\":" + valStr + "}");
    }

    public static void treeNodeDelete(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"TREE_NODE_DELETE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void treeLinkLeft(String structId, String parentNodeId, String childNodeId, int line) {
        recordEvent("{\\"type\\":\\"TREE_LINK_LEFT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"parentNodeId\\":\\"" + parentNodeId + "\\",\\"childNodeId\\":\\"" + childNodeId + "\\"}");
    }

    public static void treeLinkRight(String structId, String parentNodeId, String childNodeId, int line) {
        recordEvent("{\\"type\\":\\"TREE_LINK_RIGHT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"parentNodeId\\":\\"" + parentNodeId + "\\",\\"childNodeId\\":\\"" + childNodeId + "\\"}");
    }

    public static void treeUnlinkLeft(String structId, String parentNodeId, int line) {
        recordEvent("{\\"type\\":\\"TREE_UNLINK_LEFT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"parentNodeId\\":\\"" + parentNodeId + "\\"}");
    }

    public static void treeUnlinkRight(String structId, String parentNodeId, int line) {
        recordEvent("{\\"type\\":\\"TREE_UNLINK_RIGHT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"parentNodeId\\":\\"" + parentNodeId + "\\"}");
    }

    public static void treeNodeVisit(String structId, String nodeId, Object val, String traversalType, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"TREE_NODE_VISIT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"value\\":" + valStr + ",\\"traversal\\":\\"" + traversalType + "\\"}");
    }

    public static void treeRootUpdate(String structId, String rootNodeId, int line) {
        recordEvent("{\\"type\\":\\"TREE_ROOT_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + rootNodeId + "\\"}");
    }

    public static void treeClear(String structId, int line) {
        recordEvent("{\\"type\\":\\"TREE_CLEAR\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    public static void bstCreate(String structId, String varName, String type, int line) {
        recordEvent("{\\"type\\":\\"BST_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"variable\\":\\"" + varName + "\\",\\"structureType\\":\\"bst\\",\\"dataType\\":\\"" + type + "\\",\\"size\\":0}");
    }

    public static void bstInsert(String structId, String nodeId, Object val, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"BST_INSERT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"value\\":" + valStr + "}");
    }

    public static void bstCompare(String structId, String nodeId, Object val, Object nodeVal, String op, boolean res, int line) {
        String valStr = formatValue(val);
        String nodeValStr = formatValue(nodeVal);
        recordEvent("{\\"type\\":\\"BST_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"leftVal\\":" + valStr + ",\\"rightVal\\":" + nodeValStr + ",\\"operator\\":\\"" + op + "\\",\\"conditionResult\\":" + res + "}");
    }

    public static void bstSearchStart(String structId, Object targetVal, int line) {
        String valStr = formatValue(targetVal);
        recordEvent("{\\"type\\":\\"BST_SEARCH_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + valStr + "}");
    }

    public static void bstMoveLeft(String structId, String fromNodeId, String toNodeId, int line) {
        recordEvent("{\\"type\\":\\"BST_MOVE_LEFT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"parentNodeId\\":\\"" + fromNodeId + "\\",\\"childNodeId\\":\\"" + toNodeId + "\\"}");
    }

    public static void bstMoveRight(String structId, String fromNodeId, String toNodeId, int line) {
        recordEvent("{\\"type\\":\\"BST_MOVE_RIGHT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"parentNodeId\\":\\"" + fromNodeId + "\\",\\"childNodeId\\":\\"" + toNodeId + "\\"}");
    }

    public static void bstNodeFound(String structId, String nodeId, Object val, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"BST_NODE_FOUND\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"value\\":" + valStr + "}");
    }

    public static void bstSearchEnd(String structId, Object targetVal, boolean found, int line) {
        String valStr = formatValue(targetVal);
        recordEvent("{\\"type\\":\\"BST_SEARCH_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + valStr + ",\\"conditionResult\\":" + found + "}");
    }

    public static void bstDelete(String structId, String nodeId, Object val, String caseDesc, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"BST_DELETE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"value\\":" + valStr + ",\\"detail\\":\\"" + caseDesc + "\\"}");
    }

    // === HEAP ===
    public static void heapCreate(String structId, String varName, String type, boolean isMin, int line) {
        recordEvent("{\\"type\\":\\"HEAP_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"variable\\":\\"" + varName + "\\",\\"structureType\\":\\"heap\\",\\"dataType\\":\\"" + type + "\\",\\"heapType\\":\\"" + (isMin ? "MIN" : "MAX") + "\\",\\"size\\":0}");
    }

    public static void heapInsert(String structId, Object val, List<?> elements, int line) {
        String valStr = formatValue(val);
        String elemsJson = formatList(elements);
        recordEvent("{\\"type\\":\\"HEAP_INSERT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + valStr + ",\\"values\\":" + elemsJson + ",\\"size\\":" + elements.size() + "}");
    }

    public static void heapCompare(String structId, int idx1, int idx2, Object val1, Object val2, String op, boolean res, int line) {
        String val1Str = formatValue(val1);
        String val2Str = formatValue(val2);
        recordEvent("{\\"type\\":\\"HEAP_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"fromIndex\\":" + idx1 + ",\\"toIndex\\":" + idx2 + ",\\"leftVal\\":" + val1Str + ",\\"rightVal\\":" + val2Str + ",\\"operator\\":\\"" + op + "\\",\\"conditionResult\\":" + res + "}");
    }

    public static void heapSwap(String structId, int idx1, int idx2, Object val1, Object val2, List<?> elements, int line) {
        String val1Str = formatValue(val1);
        String val2Str = formatValue(val2);
        String elemsJson = formatList(elements);
        recordEvent("{\\"type\\":\\"HEAP_SWAP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"fromIndex\\":" + idx1 + ",\\"toIndex\\":" + idx2 + ",\\"leftVal\\":" + val1Str + ",\\"rightVal\\":" + val2Str + ",\\"values\\":" + elemsJson + ",\\"size\\":" + elements.size() + "}");
    }

    public static void heapifyUp(String structId, int idx, Object val, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"HEAPIFY_UP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + idx + ",\\"value\\":" + valStr + "}");
    }

    public static void heapifyDown(String structId, int idx, Object val, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"HEAPIFY_DOWN\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + idx + ",\\"value\\":" + valStr + "}");
    }

    public static void heapRemove(String structId, Object val, List<?> elements, int line) {
        String valStr = formatValue(val);
        String elemsJson = formatList(elements);
        recordEvent("{\\"type\\":\\"HEAP_REMOVE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + valStr + ",\\"values\\":" + elemsJson + ",\\"size\\":" + elements.size() + "}");
    }

    public static void heapPeek(String structId, Object val, int line) {
        String valStr = formatValue(val);
        recordEvent("{\\"type\\":\\"HEAP_PEEK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + valStr + "}");
    }

    // === TRIE ===
    public static void trieCreate(String structId, String varName, int line) {
        recordEvent("{\\"type\\":\\"TRIE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"variable\\":\\"" + varName + "\\",\\"structureType\\":\\"trie\\",\\"dataType\\":\\"Trie\\",\\"size\\":0}");
    }

    public static void trieNodeCreate(String structId, String nodeId, String ch, String parentNodeId, int line) {
        recordEvent("{\\"type\\":\\"TRIE_NODE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"char\\":\\"" + ch + "\\",\\"parentNodeId\\":\\"" + parentNodeId + "\\"}");
    }

    public static void trieEdgeCreate(String structId, String parentNodeId, String childNodeId, String ch, int line) {
        recordEvent("{\\"type\\":\\"TRIE_EDGE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"parentNodeId\\":\\"" + parentNodeId + "\\",\\"childNodeId\\":\\"" + childNodeId + "\\",\\"char\\":\\"" + ch + "\\"}");
    }

    public static void trieWordComplete(String structId, String nodeId, String word, int line) {
        recordEvent("{\\"type\\":\\"TRIE_WORD_COMPLETE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"word\\":\\"" + word + "\\"}");
    }

    public static void trieSearchStart(String structId, String word, int line) {
        recordEvent("{\\"type\\":\\"TRIE_SEARCH_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"word\\":\\"" + word + "\\"}");
    }

    public static void trieSearchStep(String structId, String nodeId, String ch, int line) {
        recordEvent("{\\"type\\":\\"TRIE_SEARCH_STEP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"char\\":\\"" + ch + "\\"}");
    }

    public static void trieWordFound(String structId, String word, boolean found, int line) {
        recordEvent("{\\"type\\":\\"" + (found ? "TRIE_WORD_FOUND" : "TRIE_WORD_NOT_FOUND") + "\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"word\\":\\"" + word + "\\",\\"conditionResult\\":" + found + "}");
    }

    public static void trieClear(String structId, int line) {
        recordEvent("{\\"type\\":\\"TRIE_CLEAR\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    // === GRAPH & GRAPH ALGORITHMS (Phase 4) ===
    public static void graphCreate(String structId, String varName, boolean directed, boolean weighted, int line) {
        recordEvent("{\\"type\\":\\"GRAPH_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"variable\\":\\"" + varName + "\\",\\"structureType\\":\\"graph\\",\\"dataType\\":\\"Graph\\",\\"directed\\":" + directed + ",\\"weighted\\":" + weighted + ",\\"size\\":0}");
    }

    public static void graphNodeCreate(String structId, String nodeId, Object value, int line) {
        String valStr = formatValue(value);
        recordEvent("{\\"type\\":\\"GRAPH_NODE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"value\\":" + valStr + "}");
    }

    public static void graphNodeDelete(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"GRAPH_NODE_DELETE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void graphNodeAccess(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"GRAPH_NODE_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void graphEdgeCreate(String structId, String edgeId, String srcId, String tgtId, boolean directed, boolean weighted, double weight, int line) {
        recordEvent("{\\"type\\":\\"GRAPH_EDGE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"edgeId\\":\\"" + edgeId + "\\",\\"sourceNodeId\\":\\"" + srcId + "\\",\\"targetNodeId\\":\\"" + tgtId + "\\",\\"directed\\":" + directed + ",\\"weighted\\":" + weighted + ",\\"weight\\":" + weight + "}");
    }

    public static void graphEdgeDelete(String structId, String edgeId, int line) {
        recordEvent("{\\"type\\":\\"GRAPH_EDGE_DELETE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"edgeId\\":\\"" + edgeId + "\\"}");
    }

    public static void graphEdgeAccess(String structId, String edgeId, int line) {
        recordEvent("{\\"type\\":\\"GRAPH_EDGE_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"edgeId\\":\\"" + edgeId + "\\"}");
    }

    public static void graphEdgeWeightUpdate(String structId, String edgeId, double newWeight, int line) {
        recordEvent("{\\"type\\":\\"GRAPH_EDGE_WEIGHT_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"edgeId\\":\\"" + edgeId + "\\",\\"weight\\":" + newWeight + "}");
    }

    public static void graphNeighborsAccess(String structId, String nodeId, List<?> neighbors, int line) {
        String neighJson = formatList(neighbors);
        recordEvent("{\\"type\\":\\"GRAPH_NEIGHBORS_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"neighbors\\":" + neighJson + "}");
    }

    public static void graphNodeVisit(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"GRAPH_NODE_VISIT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void graphEdgeTraverse(String structId, String edgeId, String srcId, String tgtId, int line) {
        recordEvent("{\\"type\\":\\"GRAPH_EDGE_TRAVERSE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"edgeId\\":\\"" + edgeId + "\\",\\"sourceNodeId\\":\\"" + srcId + "\\",\\"targetNodeId\\":\\"" + tgtId + "\\"}");
    }

    public static void graphClear(String structId, int line) {
        recordEvent("{\\"type\\":\\"GRAPH_CLEAR\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    // BFS
    public static void bfsStart(String structId, String startNodeId, int line) {
        recordEvent("{\\"type\\":\\"BFS_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"startNodeId\\":\\"" + startNodeId + "\\"}");
    }

    public static void bfsNodeDiscover(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"BFS_NODE_DISCOVER\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void bfsNodeVisit(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"BFS_NODE_VISIT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void bfsEdgeTraverse(String structId, String edgeId, String srcId, String tgtId, int line) {
        recordEvent("{\\"type\\":\\"BFS_EDGE_TRAVERSE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"edgeId\\":\\"" + edgeId + "\\",\\"sourceNodeId\\":\\"" + srcId + "\\",\\"targetNodeId\\":\\"" + tgtId + "\\"}");
    }

    public static void bfsEnqueue(String structId, String queueVar, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"BFS_ENQUEUE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"variable\\":\\"" + queueVar + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void bfsDequeue(String structId, String queueVar, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"BFS_DEQUEUE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"variable\\":\\"" + queueVar + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void bfsEnd(String structId, int line) {
        recordEvent("{\\"type\\":\\"BFS_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    // DFS
    public static void dfsStart(String structId, String startNodeId, int line) {
        recordEvent("{\\"type\\":\\"DFS_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"startNodeId\\":\\"" + startNodeId + "\\"}");
    }

    public static void dfsNodeDiscover(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"DFS_NODE_DISCOVER\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void dfsNodeVisit(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"DFS_NODE_VISIT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void dfsEdgeTraverse(String structId, String edgeId, String srcId, String tgtId, int line) {
        recordEvent("{\\"type\\":\\"DFS_EDGE_TRAVERSE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"edgeId\\":\\"" + edgeId + "\\",\\"sourceNodeId\\":\\"" + srcId + "\\",\\"targetNodeId\\":\\"" + tgtId + "\\"}");
    }

    public static void dfsCall(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"DFS_CALL\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void dfsReturn(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"DFS_RETURN\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void dfsBacktrack(String structId, String fromNodeId, String toNodeId, int line) {
        recordEvent("{\\"type\\":\\"DFS_BACKTRACK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"sourceNodeId\\":\\"" + fromNodeId + "\\",\\"targetNodeId\\":\\"" + toNodeId + "\\"}");
    }

    public static void dfsAlreadyVisited(String structId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"DFS_ALREADY_VISITED\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"cycle\\":true}");
    }

    public static void dfsEnd(String structId, int line) {
        recordEvent("{\\"type\\":\\"DFS_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    // DIJKSTRA
    public static void dijkstraStart(String structId, String startNodeId, int line) {
        recordEvent("{\\"type\\":\\"DIJKSTRA_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"startNodeId\\":\\"" + startNodeId + "\\"}");
    }

    public static void distanceInitialize(String structId, String nodeId, Object dist, int line) {
        String dStr = formatValue(dist);
        recordEvent("{\\"type\\":\\"DISTANCE_INITIALIZE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"distance\\":" + dStr + "}");
    }

    public static void dijkstraNodeSelect(String structId, String nodeId, Object dist, int line) {
        String dStr = formatValue(dist);
        recordEvent("{\\"type\\":\\"DIJKSTRA_NODE_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"distance\\":" + dStr + "}");
    }

    public static void dijkstraEdgeRelax(String structId, String edgeId, String srcId, String tgtId, Object currDist, double edgeWeight, Object tgtDist, boolean willRelax, int line) {
        String cDistStr = formatValue(currDist);
        String tDistStr = formatValue(tgtDist);
        recordEvent("{\\"type\\":\\"DIJKSTRA_EDGE_RELAX\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"edgeId\\":\\"" + edgeId + "\\",\\"sourceNodeId\\":\\"" + srcId + "\\",\\"targetNodeId\\":\\"" + tgtId + "\\",\\"leftVal\\":" + cDistStr + ",\\"weight\\":" + edgeWeight + ",\\"rightVal\\":" + tDistStr + ",\\"conditionResult\\":" + willRelax + "}");
    }

    public static void distanceUpdate(String structId, String nodeId, Object oldDist, Object newDist, int line) {
        String oDistStr = formatValue(oldDist);
        String nDistStr = formatValue(newDist);
        recordEvent("{\\"type\\":\\"DISTANCE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"oldDistance\\":" + oDistStr + ",\\"newDistance\\":" + nDistStr + "}");
    }

    public static void dijkstraQueueInsert(String structId, String nodeId, Object dist, int line) {
        String dStr = formatValue(dist);
        recordEvent("{\\"type\\":\\"DIJKSTRA_QUEUE_INSERT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"distance\\":" + dStr + "}");
    }

    public static void dijkstraQueueRemove(String structId, String nodeId, Object dist, int line) {
        String dStr = formatValue(dist);
        recordEvent("{\\"type\\":\\"DIJKSTRA_QUEUE_REMOVE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"distance\\":" + dStr + "}");
    }

    public static void dijkstraNodeFinalize(String structId, String nodeId, Object finalDist, int line) {
        String dStr = formatValue(finalDist);
        recordEvent("{\\"type\\":\\"DIJKSTRA_NODE_FINALIZE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"distance\\":" + dStr + "}");
    }

    public static void dijkstraEnd(String structId, List<?> shortestPath, Object totalDist, int line) {
        String pathJson = formatList(shortestPath);
        String dStr = formatValue(totalDist);
        recordEvent("{\\"type\\":\\"DIJKSTRA_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"path\\":" + pathJson + ",\\"distance\\":" + dStr + "}");
    }

    // ==========================================
    // PHASE 5: ALGORITHMS & PATTERNS
    // ==========================================

    // --- SEARCHING ---
    public static void linearSearchStart(String structId, Object target, int line) {
        String tStr = formatValue(target);
        recordEvent("{\\"type\\":\\"LINEAR_SEARCH_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"target\\":" + tStr + "}");
    }

    public static void linearSearchAccess(String structId, int index, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"LINEAR_SEARCH_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + index + ",\\"value\\":" + vStr + "}");
    }

    public static void linearSearchCompare(String structId, int index, Object val, Object target, boolean match, int line) {
        String vStr = formatValue(val);
        String tStr = formatValue(target);
        recordEvent("{\\"type\\":\\"LINEAR_SEARCH_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + index + ",\\"value\\":" + vStr + ",\\"target\\":" + tStr + ",\\"conditionResult\\":" + match + "}");
    }

    public static void linearSearchMatch(String structId, int index, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"LINEAR_SEARCH_MATCH\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + index + ",\\"value\\":" + vStr + "}");
    }

    public static void linearSearchNotFound(String structId, Object target, int line) {
        String tStr = formatValue(target);
        recordEvent("{\\"type\\":\\"LINEAR_SEARCH_NOT_FOUND\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"target\\":" + tStr + "}");
    }

    public static void linearSearchEnd(String structId, boolean found, int index, int line) {
        recordEvent("{\\"type\\":\\"LINEAR_SEARCH_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"conditionResult\\":" + found + ",\\"index\\":" + index + "}");
    }

    // BINARY SEARCH
    public static void binarySearchStart(String structId, Object target, int line) {
        String tStr = formatValue(target);
        recordEvent("{\\"type\\":\\"BINARY_SEARCH_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"target\\":" + tStr + "}");
    }

    public static void binarySearchRange(String structId, int low, int high, int line) {
        recordEvent("{\\"type\\":\\"BINARY_SEARCH_RANGE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"low\\":" + low + ",\\"high\\":" + high + "}");
    }

    public static void binarySearchMid(String structId, int mid, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"BINARY_SEARCH_MID\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"mid\\":" + mid + ",\\"value\\":" + vStr + "}");
    }

    public static void binarySearchCompare(String structId, int mid, Object val, Object target, int cmp, int line) {
        String vStr = formatValue(val);
        String tStr = formatValue(target);
        recordEvent("{\\"type\\":\\"BINARY_SEARCH_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"mid\\":" + mid + ",\\"value\\":" + vStr + ",\\"target\\":" + tStr + ",\\"conditionResult\\":" + (cmp == 0) + ",\\"operator\\":\\"" + (cmp < 0 ? "<" : (cmp > 0 ? ">" : "==")) + "\\"}");
    }

    public static void binarySearchRangeUpdate(String structId, int low, int high, int line) {
        recordEvent("{\\"type\\":\\"BINARY_SEARCH_RANGE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"low\\":" + low + ",\\"high\\":" + high + "}");
    }

    public static void binarySearchFound(String structId, int index, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"BINARY_SEARCH_FOUND\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + index + ",\\"value\\":" + vStr + "}");
    }

    public static void binarySearchNotFound(String structId, Object target, int line) {
        String tStr = formatValue(target);
        recordEvent("{\\"type\\":\\"BINARY_SEARCH_NOT_FOUND\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"target\\":" + tStr + "}");
    }

    public static void binarySearchEnd(String structId, boolean found, int index, int line) {
        recordEvent("{\\"type\\":\\"BINARY_SEARCH_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"conditionResult\\":" + found + ",\\"index\\":" + index + "}");
    }

    // --- SORTING ---
    public static void sortStart(String algo, String structId, int line) {
        recordEvent("{\\"type\\":\\"SORT_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"algorithmName\\":\\"" + algo + "\\"}");
    }

    public static void sortCompare(String structId, int idx1, int idx2, Object v1, Object v2, boolean result, int line) {
        String s1 = formatValue(v1);
        String s2 = formatValue(v2);
        recordEvent("{\\"type\\":\\"SORT_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"fromIndex\\":" + idx1 + ",\\"toIndex\\":" + idx2 + ",\\"leftVal\\":" + s1 + ",\\"rightVal\\":" + s2 + ",\\"conditionResult\\":" + result + "}");
    }

    public static void sortSwap(String structId, int idx1, int idx2, Object v1, Object v2, int line) {
        String s1 = formatValue(v1);
        String s2 = formatValue(v2);
        recordEvent("{\\"type\\":\\"SORT_SWAP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"fromIndex\\":" + idx1 + ",\\"toIndex\\":" + idx2 + ",\\"leftVal\\":" + s1 + ",\\"rightVal\\":" + s2 + "}");
    }

    public static void sortAssign(String structId, int idx, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"SORT_ASSIGN\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + idx + ",\\"value\\":" + vStr + "}");
    }

    public static void sortRange(String structId, int start, int end, int line) {
        recordEvent("{\\"type\\":\\"SORT_RANGE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"rangeStart\\":" + start + ",\\"rangeEnd\\":" + end + "}");
    }

    public static void sortPartition(String structId, int pivotIdx, Object pivotVal, int left, int right, int line) {
        String pStr = formatValue(pivotVal);
        recordEvent("{\\"type\\":\\"SORT_PARTITION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"pivotIndex\\":" + pivotIdx + ",\\"pivotValue\\":" + pStr + ",\\"rangeStart\\":" + left + ",\\"rangeEnd\\":" + right + "}");
    }

    public static void sortMerge(String structId, int l, int m, int r, int line) {
        recordEvent("{\\"type\\":\\"SORT_MERGE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"low\\":" + l + ",\\"mid\\":" + m + ",\\"high\\":" + r + "}");
    }

    public static void sortComplete(String structId, int line) {
        recordEvent("{\\"type\\":\\"SORT_COMPLETE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    // Quick Sort Specialized
    public static void quickSortStart(String structId, int left, int right, int line) {
        recordEvent("{\\"type\\":\\"QUICK_SORT_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"rangeStart\\":" + left + ",\\"rangeEnd\\":" + right + "}");
    }

    public static void quickSortRange(String structId, int left, int right, int line) {
        recordEvent("{\\"type\\":\\"QUICK_SORT_RANGE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"rangeStart\\":" + left + ",\\"rangeEnd\\":" + right + "}");
    }

    public static void quickSortPivot(String structId, int pivotIdx, Object pivotVal, int line) {
        String pStr = formatValue(pivotVal);
        recordEvent("{\\"type\\":\\"QUICK_SORT_PIVOT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"pivotIndex\\":" + pivotIdx + ",\\"pivotValue\\":" + pStr + "}");
    }

    public static void quickSortCompare(String structId, int idx, Object val, Object pivotVal, boolean less, int line) {
        String vStr = formatValue(val);
        String pStr = formatValue(pivotVal);
        recordEvent("{\\"type\\":\\"QUICK_SORT_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + idx + ",\\"value\\":" + vStr + ",\\"pivotValue\\":" + pStr + ",\\"conditionResult\\":" + less + "}");
    }

    public static void quickSortPartition(String structId, int pivotIdx, int left, int right, int line) {
        recordEvent("{\\"type\\":\\"QUICK_SORT_PARTITION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"pivotIndex\\":" + pivotIdx + ",\\"rangeStart\\":" + left + ",\\"rangeEnd\\":" + right + "}");
    }

    public static void quickSortSwap(String structId, int idx1, int idx2, Object v1, Object v2, int line) {
        String s1 = formatValue(v1);
        String s2 = formatValue(v2);
        recordEvent("{\\"type\\":\\"QUICK_SORT_SWAP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"fromIndex\\":" + idx1 + ",\\"toIndex\\":" + idx2 + ",\\"leftVal\\":" + s1 + ",\\"rightVal\\":" + s2 + "}");
    }

    public static void quickSortRecurse(String structId, int left, int right, int line) {
        recordEvent("{\\"type\\":\\"QUICK_SORT_RECURSE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"rangeStart\\":" + left + ",\\"rangeEnd\\":" + right + "}");
    }

    public static void quickSortReturn(String structId, int line) {
        recordEvent("{\\"type\\":\\"QUICK_SORT_RETURN\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    public static void quickSortEnd(String structId, int line) {
        recordEvent("{\\"type\\":\\"QUICK_SORT_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    // --- ARRAY PATTERNS ---
    // Two Pointers
    public static void twoPointerStart(String structId, int left, int right, int line) {
        recordEvent("{\\"type\\":\\"TWO_POINTER_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"low\\":" + left + ",\\"high\\":" + right + "}");
    }

    public static void twoPointerCompare(String structId, int left, int right, Object v1, Object v2, int line) {
        String s1 = formatValue(v1);
        String s2 = formatValue(v2);
        recordEvent("{\\"type\\":\\"TWO_POINTER_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"fromIndex\\":" + left + ",\\"toIndex\\":" + right + ",\\"leftVal\\":" + s1 + ",\\"rightVal\\":" + s2 + "}");
    }

    public static void twoPointerMoveLeft(String structId, int newLeft, int line) {
        recordEvent("{\\"type\\":\\"TWO_POINTER_MOVE_LEFT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"low\\":" + newLeft + "}");
    }

    public static void twoPointerMoveRight(String structId, int newRight, int line) {
        recordEvent("{\\"type\\":\\"TWO_POINTER_MOVE_RIGHT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"high\\":" + newRight + "}");
    }

    public static void twoPointerUpdate(String structId, int left, int right, Object sum, int line) {
        String sStr = formatValue(sum);
        recordEvent("{\\"type\\":\\"TWO_POINTER_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"low\\":" + left + ",\\"high\\":" + right + ",\\"currentSum\\":" + sStr + "}");
    }

    public static void twoPointerEnd(String structId, int line) {
        recordEvent("{\\"type\\":\\"TWO_POINTER_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    // Sliding Window
    public static void windowStart(String structId, int start, int end, Object sum, int line) {
        String sStr = formatValue(sum);
        recordEvent("{\\"type\\":\\"WINDOW_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"windowStart\\":" + start + ",\\"windowEnd\\":" + end + ",\\"currentSum\\":" + sStr + "}");
    }

    public static void windowExpand(String structId, int end, Object addedVal, Object currentSum, int line) {
        String vStr = formatValue(addedVal);
        String sStr = formatValue(currentSum);
        recordEvent("{\\"type\\":\\"WINDOW_EXPAND\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"windowEnd\\":" + end + ",\\"value\\":" + vStr + ",\\"currentSum\\":" + sStr + "}");
    }

    public static void windowShrink(String structId, int start, Object removedVal, Object currentSum, int line) {
        String vStr = formatValue(removedVal);
        String sStr = formatValue(currentSum);
        recordEvent("{\\"type\\":\\"WINDOW_SHRINK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"windowStart\\":" + start + ",\\"value\\":" + vStr + ",\\"currentSum\\":" + sStr + "}");
    }

    public static void windowAccess(String structId, int index, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"WINDOW_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + index + ",\\"value\\":" + vStr + "}");
    }

    public static void windowUpdate(String structId, int start, int end, int size, Object sum, Object best, int line) {
        String sStr = formatValue(sum);
        String bStr = formatValue(best);
        recordEvent("{\\"type\\":\\"WINDOW_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"windowStart\\":" + start + ",\\"windowEnd\\":" + end + ",\\"windowSize\\":" + size + ",\\"currentSum\\":" + sStr + ",\\"bestSum\\":" + bStr + "}");
    }

    public static void windowResult(String structId, Object best, int line) {
        String bStr = formatValue(best);
        recordEvent("{\\"type\\":\\"WINDOW_RESULT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"bestSum\\":" + bStr + "}");
    }

    public static void windowEnd(String structId, int line) {
        recordEvent("{\\"type\\":\\"WINDOW_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    // Prefix Sum
    public static void prefixSumStart(String arrId, String prefixId, int line) {
        recordEvent("{\\"type\\":\\"PREFIX_SUM_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + prefixId + "\\",\\"arrayId\\":\\"" + arrId + "\\"}");
    }

    public static void prefixSumAccess(String arrId, int index, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"PREFIX_SUM_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + arrId + "\\",\\"index\\":" + index + ",\\"value\\":" + vStr + "}");
    }

    public static void prefixSumUpdate(String prefixId, int index, Object val, Object prevVal, Object arrVal, int line) {
        String vStr = formatValue(val);
        String pStr = formatValue(prevVal);
        String aStr = formatValue(arrVal);
        recordEvent("{\\"type\\":\\"PREFIX_SUM_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + prefixId + "\\",\\"index\\":" + index + ",\\"value\\":" + vStr + ",\\"leftVal\\":" + pStr + ",\\"rightVal\\":" + aStr + "}");
    }

    public static void prefixSumEnd(String prefixId, int line) {
        recordEvent("{\\"type\\":\\"PREFIX_SUM_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + prefixId + "\\"}");
    }

    // Difference Array
    public static void differenceArrayStart(String arrId, String diffId, int line) {
        recordEvent("{\\"type\\":\\"DIFFERENCE_ARRAY_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + diffId + "\\",\\"arrayId\\":\\"" + arrId + "\\"}");
    }

    public static void differenceArrayUpdate(String diffId, int l, int r, Object delta, int line) {
        String dStr = formatValue(delta);
        recordEvent("{\\"type\\":\\"DIFFERENCE_ARRAY_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + diffId + "\\",\\"rangeStart\\":" + l + ",\\"rangeEnd\\":" + r + ",\\"value\\":" + dStr + "}");
    }

    public static void differenceArrayReconstruct(String diffId, String resId, int index, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DIFFERENCE_ARRAY_RECONSTRUCT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + resId + "\\",\\"arrayId\\":\\"" + diffId + "\\",\\"index\\":" + index + ",\\"value\\":" + vStr + "}");
    }

    public static void differenceArrayEnd(String resId, int line) {
        recordEvent("{\\"type\\":\\"DIFFERENCE_ARRAY_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + resId + "\\"}");
    }

    // Kadane
    public static void kadaneStart(String structId, int line) {
        recordEvent("{\\"type\\":\\"KADANE_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    public static void kadaneUpdate(String structId, int currIdx, Object currVal, Object currentSum, Object bestSum, int line) {
        String vStr = formatValue(currVal);
        String csStr = formatValue(currentSum);
        String bsStr = formatValue(bestSum);
        recordEvent("{\\"type\\":\\"KADANE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + currIdx + ",\\"value\\":" + vStr + ",\\"currentSum\\":" + csStr + ",\\"bestSum\\":" + bsStr + "}");
    }

    public static void kadaneBestUpdate(String structId, Object bestSum, int bestStart, int bestEnd, int line) {
        String bsStr = formatValue(bestSum);
        recordEvent("{\\"type\\":\\"KADANE_BEST_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"bestSum\\":" + bsStr + ",\\"bestStart\\":" + bestStart + ",\\"bestEnd\\":" + bestEnd + "}");
    }

    public static void kadaneRangeUpdate(String structId, int currentStart, int currentEnd, int line) {
        recordEvent("{\\"type\\":\\"KADANE_RANGE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"currentStart\\":" + currentStart + ",\\"rangeEnd\\":" + currentEnd + "}");
    }

    public static void kadaneEnd(String structId, Object bestSum, int bestStart, int bestEnd, int line) {
        String bsStr = formatValue(bestSum);
        recordEvent("{\\"type\\":\\"KADANE_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"bestSum\\":" + bsStr + ",\\"bestStart\\":" + bestStart + ",\\"bestEnd\\":" + bestEnd + "}");
    }

    // --- RECURSION ---
    public static void recursionStart(String fnName, String argsJson, int line) {
        recordEvent("{\\"type\\":\\"RECURSION_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"functionName\\":\\"" + fnName + "\\",\\"arguments\\":" + argsJson + "}");
    }

    public static void recursionCall(String callId, String parentId, String fnName, String argsJson, int depth, int line) {
        recordEvent("{\\"type\\":\\"RECURSION_CALL\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"callId\\":\\"" + callId + "\\",\\"parentNodeId\\":\\"" + (parentId != null ? parentId : "") + "\\",\\"functionName\\":\\"" + fnName + "\\",\\"arguments\\":" + argsJson + ",\\"depth\\":" + depth + "}");
    }

    public static void recursionBaseCase(String callId, Object retVal, int line) {
        String rStr = formatValue(retVal);
        recordEvent("{\\"type\\":\\"RECURSION_BASE_CASE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"callId\\":\\"" + callId + "\\",\\"returnValue\\":" + rStr + "}");
    }

    public static void recursionReturn(String callId, Object retVal, int line) {
        String rStr = formatValue(retVal);
        recordEvent("{\\"type\\":\\"RECURSION_RETURN\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"callId\\":\\"" + callId + "\\",\\"returnValue\\":" + rStr + "}");
    }

    public static void recursionBacktrack(String callId, int line) {
        recordEvent("{\\"type\\":\\"RECURSION_BACKTRACK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"callId\\":\\"" + callId + "\\"}");
    }

    public static void recursionEnd(String fnName, Object finalResult, int line) {
        String rStr = formatValue(finalResult);
        recordEvent("{\\"type\\":\\"RECURSION_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"functionName\\":\\"" + fnName + "\\",\\"returnValue\\":" + rStr + "}");
    }

    // --- BACKTRACKING ---
    public static void backtrackStart(String name, int line) {
        recordEvent("{\\"type\\":\\"BACKTRACK_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"algorithmName\\":\\"" + name + "\\"}");
    }

    public static void backtrackChoice(String choice, Object stateVal, int line) {
        String sStr = formatValue(stateVal);
        recordEvent("{\\"type\\":\\"BACKTRACK_CHOICE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"choice\\":\\"" + choice + "\\",\\"stateValue\\":" + sStr + "}");
    }

    public static void backtrackEnter(String choice, int line) {
        recordEvent("{\\"type\\":\\"BACKTRACK_ENTER\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"choice\\":\\"" + choice + "\\"}");
    }

    public static void backtrackSuccess(String solution, int line) {
        recordEvent("{\\"type\\":\\"BACKTRACK_SUCCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"choice\\":\\"" + solution + "\\"}");
    }

    public static void backtrackFailure(String reason, int line) {
        recordEvent("{\\"type\\":\\"BACKTRACK_FAILURE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"message\\":\\"" + reason + "\\"}");
    }

    public static void backtrackUndo(String choice, Object stateVal, int line) {
        String sStr = formatValue(stateVal);
        recordEvent("{\\"type\\":\\"BACKTRACK_UNDO\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"choice\\":\\"" + choice + "\\",\\"stateValue\\":" + sStr + "}");
    }

    public static void backtrackReturn(String choice, int line) {
        recordEvent("{\\"type\\":\\"BACKTRACK_RETURN\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"choice\\":\\"" + choice + "\\"}");
    }

    public static void backtrackEnd(int line) {
        recordEvent("{\\"type\\":\\"BACKTRACK_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + "}");
    }

    // --- DYNAMIC PROGRAMMING ---
    public static void dpStart(String dpId, String type, int rows, int cols, int line) {
        recordEvent("{\\"type\\":\\"DP_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"dpId\\":\\"" + dpId + "\\",\\"dpType\\":\\"" + type + "\\",\\"low\\":" + rows + ",\\"high\\":" + cols + "}");
    }

    public static void dpStateCreate(String dpId, String type, int rows, int cols, int line) {
        recordEvent("{\\"type\\":\\"DP_STATE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"dpId\\":\\"" + dpId + "\\",\\"dpType\\":\\"" + type + "\\",\\"low\\":" + rows + ",\\"high\\":" + cols + "}");
    }

    public static void dpStateAccess(String dpId, int row, int col, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DP_STATE_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"dpId\\":\\"" + dpId + "\\",\\"row\\":" + row + ",\\"col\\":" + col + ",\\"value\\":" + vStr + "}");
    }

    public static void dpStateUpdate(String dpId, int row, int col, Object val, String transitionFormula, String prevCellsJson, int line) {
        String vStr = formatValue(val);
        String formula = transitionFormula.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        recordEvent("{\\"type\\":\\"DP_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"dpId\\":\\"" + dpId + "\\",\\"row\\":" + row + ",\\"col\\":" + col + ",\\"value\\":" + vStr + ",\\"transitionFormula\\":\\"" + formula + "\\",\\"path\\":" + prevCellsJson + "}");
    }

    public static void dpTransition(String dpId, int row, int col, Object val, String formula, int line) {
        String vStr = formatValue(val);
        String f = formula.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        recordEvent("{\\"type\\":\\"DP_TRANSITION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"dpId\\":\\"" + dpId + "\\",\\"row\\":" + row + ",\\"col\\":" + col + ",\\"value\\":" + vStr + ",\\"transitionFormula\\":\\"" + f + "\\"}");
    }

    public static void dpCacheHit(String dpId, Object key, Object val, int line) {
        String kStr = formatValue(key);
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DP_CACHE_HIT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"dpId\\":\\"" + dpId + "\\",\\"key\\":" + kStr + ",\\"value\\":" + vStr + ",\\"isHit\\":true}");
    }

    public static void dpCacheMiss(String dpId, Object key, int line) {
        String kStr = formatValue(key);
        recordEvent("{\\"type\\":\\"DP_CACHE_MISS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"dpId\\":\\"" + dpId + "\\",\\"key\\":" + kStr + ",\\"isHit\\":false}");
    }

    public static void dpBaseCase(String dpId, int row, int col, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DP_BASE_CASE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"dpId\\":\\"" + dpId + "\\",\\"row\\":" + row + ",\\"col\\":" + col + ",\\"value\\":" + vStr + "}");
    }

    public static void dpEnd(String dpId, Object finalResult, int line) {
        String rStr = formatValue(finalResult);
        recordEvent("{\\"type\\":\\"DP_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"dpId\\":\\"" + dpId + "\\",\\"value\\":" + rStr + "}");
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
