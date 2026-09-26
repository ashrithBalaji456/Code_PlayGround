export const CODE_FLOW_TRACER_JAVA = `package com.codeflow;

import java.io.*;
import java.util.*;
import java.lang.reflect.*;

public class CodeFlowTracer {
    private static final List<String> events = new ArrayList<>();
    private static int stepCounter = 0;
    private static final int MAX_STEPS = 2500;
    private static PrintStream originalOut = System.out;
    private static final List<String> consoleLines = new ArrayList<>();
    private static final Map<String, Object> trackedVars = new HashMap<>();

    public static void start() {
        stepCounter = 0;
        events.clear();
        consoleLines.clear();
        trackedVars.clear();
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

            @Override
            public void flush() throws IOException {
                if (buffer.size() > 0) {
                    String line = buffer.toString("UTF-8");
                    buffer.reset();
                    consoleLines.add(line);
                    line = line.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\r", "");
                    recordEvent("{\\"type\\":\\"CONSOLE_OUTPUT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":0,\\"message\\":\\"" + line + "\\"}");
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

    // ==========================================
    // UNIVERSAL RUNTIME OBSERVATION METHODS
    // ==========================================

    public static boolean isPrimitiveOrString(Object val) {
        if (val == null) return false;
        return val instanceof Number || val instanceof Boolean || val instanceof Character || val instanceof String;
    }

    public static void trackVar(String name, String declaredType, Object val, int line) {
        boolean isUpdate = trackedVars.containsKey(name);
        Object oldVal = trackedVars.get(name);
        trackedVars.put(name, val);
        String eventType = isUpdate ? "VARIABLE_UPDATE" : "VARIABLE_CREATE";
        String valField = isUpdate ? "newValue" : "value";
        String oldValField = isUpdate ? (",\\\"oldValue\\\":" + (oldVal == null ? "\\\"null\\\"" : (isPrimitiveOrString(oldVal) ? formatValue(oldVal) : ("\\\"@obj-" + System.identityHashCode(oldVal) + "\\\"")))) : "";

        if (val == null) {
            recordEvent("{\\\"type\\\":\\\"" + eventType + "\\\",\\\"step\\\":" + (++stepCounter) + ",\\\"line\\\":" + line + ",\\\"variable\\\":\\\"" + name + "\\\",\\\"dataType\\\":\\\"" + declaredType + "\\\",\\\"" + valField + "\\\":\\\"null\\\",\\\"isReference\\\":false" + oldValField + "}");
            return;
        }

        String objId = "obj-" + System.identityHashCode(val);
        Class<?> clazz = val.getClass();

        if (isPrimitiveOrString(val)) {
            String valStr = formatValue(val);
            recordEvent("{\\\"type\\\":\\\"" + eventType + "\\\",\\\"step\\\":" + (++stepCounter) + ",\\\"line\\\":" + line + ",\\\"variable\\\":\\\"" + name + "\\\",\\\"dataType\\\":\\\"" + declaredType + "\\\",\\\"" + valField + "\\\":" + valStr + ",\\\"isReference\\\":false" + oldValField + "}");
            return;
        }

        recordEvent("{\\\"type\\\":\\\"" + eventType + "\\\",\\\"step\\\":" + (++stepCounter) + ",\\\"line\\\":" + line + ",\\\"variable\\\":\\\"" + name + "\\\",\\\"dataType\\\":\\\"" + declaredType + "\\\",\\\"" + valField + "\\\":\\\"@" + objId + "\\\",\\\"isReference\\\":true,\\\"refTargetId\\\":\\\"" + objId + "\\\",\\\"objectId\\\":\\\"" + objId + "\\\"" + oldValField + "}");

        if (clazz.isArray()) {
            inspectAndEmitArray(name, val, declaredType, objId, line);
            return;
        }

        if (val instanceof Collection) {
            inspectAndEmitCollection(name, (Collection<?>) val, declaredType, objId, line);
            return;
        }

        if (val instanceof Map) {
            inspectAndEmitMap(name, (Map<?, ?>) val, declaredType, objId, line);
            return;
        }

        inspectAndEmitCustomObject(name, val, declaredType, objId, line);
    }

    public static void trackVar(String name, Object val, int line) {
        String dt = val != null ? val.getClass().getSimpleName() : "Object";
        trackVar(name, dt, val, line);
    }

    public static void trackArrayMutation(String arrName, Object arr, int index, int line) {
        if (arr == null) return;
        try {
            Object newVal = Array.get(arr, index);
            String valStr = formatValue(newVal);
            recordEvent("{\\"type\\":\\"ARRAY_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"arrayId\\":\\"" + arrName + "\\",\\"structureId\\":\\"" + arrName + "\\",\\"structureType\\":\\"array\\",\\"index\\":" + index + ",\\"newValue\\":" + valStr + "}");
        } catch (Exception ignored) {}
    }

    public static void trackMutation(Object target, String varName, int line) {
        if (target == null) return;
        trackVar(varName, target.getClass().getSimpleName(), target, line);
    }

    public static void trackObjectMutation(Object target, String rootVar, int line) {
        if (target == null) return;
        trackVar(rootVar, target.getClass().getSimpleName(), target, line);
    }

    public static void funcEnter(String name, String[] paramNames, Object[] paramValues, int line) {
        StringBuilder argsJson = new StringBuilder("{");
        if (paramNames != null && paramValues != null) {
            for (int i = 0; i < paramNames.length; i++) {
                if (i > 0) argsJson.append(",");
                argsJson.append("\\\"").append(paramNames[i]).append("\\\":");
                if (i < paramValues.length) {
                    argsJson.append(formatValue(paramValues[i]));
                } else {
                    argsJson.append("\\\"null\\\"");
                }
            }
        }
        argsJson.append("}");
        recordEvent("{\\"type\\":\\"FUNCTION_CALL\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"functionName\\":\\"" + name + "\\",\\"arguments\\":" + argsJson.toString() + "}");
        if (paramNames != null && paramValues != null) {
            for (int i = 0; i < paramNames.length && i < paramValues.length; i++) {
                trackVar(paramNames[i], paramValues[i] != null ? paramValues[i].getClass().getSimpleName() : "Object", paramValues[i], line);
            }
        }
    }

    public static void funcExit(String name, Object retVal, int line) {
        recordEvent("{\\"type\\":\\"FUNCTION_RETURN\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"functionName\\":\\"" + name + "\\",\\"returnValue\\":" + formatValue(retVal) + "}");
    }

    private static void inspectAndEmitArray(String name, Object arr, String declaredType, String objId, int line) {
        int len = Array.getLength(arr);
        Class<?> compType = arr.getClass().getComponentType();

        if (compType.isArray()) {
            StringBuilder sb = new StringBuilder("[");
            for (int r = 0; r < len; r++) {
                if (r > 0) sb.append(",");
                Object row = Array.get(arr, r);
                if (row == null) {
                    sb.append("[]");
                } else {
                    int cLen = Array.getLength(row);
                    sb.append("[");
                    for (int c = 0; c < cLen; c++) {
                        if (c > 0) sb.append(",");
                        sb.append(formatValue(Array.get(row, c)));
                    }
                    sb.append("]");
                }
            }
            sb.append("]");
            recordEvent("{\\"type\\":\\"MATRIX_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"matrix\\",\\"dataType\\":\\"" + declaredType + "\\",\\"objectId\\":\\"" + objId + "\\",\\"values\\":" + sb.toString() + "}");
            return;
        }

        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < len; i++) {
            if (i > 0) sb.append(",");
            sb.append(formatValue(Array.get(arr, i)));
        }
        sb.append("]");
        recordEvent("{\\"type\\":\\"ARRAY_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"arrayId\\":\\"" + name + "\\",\\"structureType\\":\\"array\\",\\"dataType\\":\\"" + declaredType + "\\",\\"objectId\\":\\"" + objId + "\\",\\"values\\":" + sb.toString() + "}");
    }

    private static void inspectAndEmitCollection(String name, Collection<?> col, String declaredType, String objId, int line) {
        if (col instanceof Queue) {
            StringBuilder sb = new StringBuilder("[");
            int idx = 0;
            for (Object item : col) {
                if (idx > 0) sb.append(",");
                sb.append(formatValue(item));
                idx++;
            }
            sb.append("]");
            recordEvent("{\\"type\\":\\"QUEUE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"queue\\",\\"dataType\\":\\"" + declaredType + "\\",\\"objectId\\":\\"" + objId + "\\",\\"values\\":" + sb.toString() + ",\\"size\\":" + col.size() + "}");
            return;
        }

        if (col instanceof Stack) {
            StringBuilder sb = new StringBuilder("[");
            int idx = 0;
            for (Object item : col) {
                if (idx > 0) sb.append(",");
                sb.append(formatValue(item));
                idx++;
            }
            sb.append("]");
            recordEvent("{\\"type\\":\\"STACK_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"stack\\",\\"dataType\\":\\"" + declaredType + "\\",\\"objectId\\":\\"" + objId + "\\",\\"values\\":" + sb.toString() + ",\\"size\\":" + col.size() + "}");
            return;
        }

        if (col instanceof Set) {
            StringBuilder sb = new StringBuilder("[");
            int idx = 0;
            for (Object item : col) {
                if (idx > 0) sb.append(",");
                sb.append(formatValue(item));
                idx++;
            }
            sb.append("]");
            recordEvent("{\\"type\\":\\"SET_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"set\\",\\"dataType\\":\\"" + declaredType + "\\",\\"objectId\\":\\"" + objId + "\\",\\"values\\":" + sb.toString() + ",\\"size\\":" + col.size() + "}");
            return;
        }

        if (col instanceof List) {
            List<?> list = (List<?>) col;
            boolean isNested = false;
            for (Object elem : list) {
                if (elem instanceof Collection) {
                    isNested = true;
                    break;
                }
            }
            if (isNested || declaredType.contains("List<List") || declaredType.contains("List<java.util.List")) {
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < list.size(); i++) {
                    if (i > 0) sb.append(",");
                    Object elem = list.get(i);
                    if (elem instanceof Collection) {
                        Collection<?> sub = (Collection<?>) elem;
                        sb.append("[");
                        int si = 0;
                        for (Object sItem : sub) {
                            if (si > 0) sb.append(",");
                            sb.append(formatValue(sItem));
                            si++;
                        }
                        sb.append("]");
                    } else {
                        sb.append(formatValue(elem));
                    }
                }
                sb.append("]");
                recordEvent("{\\"type\\":\\"NESTED_COLLECTION_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"dataType\\":\\"" + declaredType + "\\",\\"objectId\\":\\"" + objId + "\\",\\"values\\":" + sb.toString() + ",\\"isGraph\\":true}");
                return;
            }

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(formatValue(list.get(i)));
            }
            sb.append("]");
            recordEvent("{\\"type\\":\\"ARRAY_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"arrayId\\":\\"" + name + "\\",\\"structureType\\":\\"array\\",\\"dataType\\":\\"" + declaredType + "\\",\\"objectId\\":\\"" + objId + "\\",\\"values\\":" + sb.toString() + "}");
            return;
        }

        StringBuilder sb = new StringBuilder("[");
        int idx = 0;
        for (Object item : col) {
            if (idx > 0) sb.append(",");
            sb.append(formatValue(item));
            idx++;
        }
        sb.append("]");
        recordEvent("{\\"type\\":\\"ARRAY_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"arrayId\\":\\"" + name + "\\",\\"structureType\\":\\"array\\",\\"dataType\\":\\"" + declaredType + "\\",\\"objectId\\":\\"" + objId + "\\",\\"values\\":" + sb.toString() + "}");
    }

    private static void inspectAndEmitMap(String name, Map<?, ?> map, String declaredType, String objId, int line) {
        StringBuilder sb = new StringBuilder("[");
        int idx = 0;
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (idx > 0) sb.append(",");
            sb.append("{\\"key\\":").append(formatValue(entry.getKey()))
              .append(",\\"value\\":").append(formatValue(entry.getValue())).append("}");
            idx++;
        }
        sb.append("]");
        recordEvent("{\\"type\\":\\"MAP_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"structureType\\":\\"map\\",\\"dataType\\":\\"" + declaredType + "\\",\\"objectId\\":\\"" + objId + "\\",\\"entries\\":" + sb.toString() + ",\\"size\\":" + map.size() + "}");
    }

    private static void inspectAndEmitCustomObject(String name, Object obj, String declaredType, String objId, int line) {
        if (obj == null) return;
        Class<?> clazz = obj.getClass();
        StringBuilder fieldsJson = new StringBuilder("{");

        if (clazz.getName().startsWith("java.") || clazz.getName().startsWith("javax.") || clazz.getName().startsWith("jdk.")) {
            fieldsJson.append("\\\"value\\\":").append(formatValue(String.valueOf(obj)));
            fieldsJson.append("}");
            recordEvent("{\\\"type\\\":\\\"CUSTOM_OBJECT_UPDATE\\\",\\\"step\\\":" + (++stepCounter) + ",\\\"line\\\":" + line + ",\\\"structureId\\\":\\\"" + name + "\\\",\\\"variable\\\":\\\"" + name + "\\\",\\\"className\\\":\\\"" + clazz.getSimpleName() + "\\\",\\\"objectId\\\":\\\"" + objId + "\\\",\\\"fields\\\":" + fieldsJson.toString() + "}");
            return;
        }

        Field[] fields = clazz.getDeclaredFields();
        boolean hasNext = false;
        boolean hasLeftRight = false;
        int emittedFieldCount = 0;

        for (int i = 0; i < fields.length; i++) {
            Field f = fields[i];
            try {
                f.setAccessible(true);
            } catch (Throwable ignored) {
                continue;
            }
            String fName = f.getName();
            if (fName.equals("next")) hasNext = true;
            if (fName.equals("left") || fName.equals("right")) hasLeftRight = true;
            if (emittedFieldCount > 0) fieldsJson.append(",");
            fieldsJson.append("\\\"").append(fName).append("\\\":");
            try {
                Object fVal = f.get(obj);
                if (fVal == null) {
                    fieldsJson.append("\\\"null\\\"");
                } else if (isPrimitiveOrString(fVal)) {
                    fieldsJson.append(formatValue(fVal));
                } else {
                    fieldsJson.append("\\\"@obj-").append(System.identityHashCode(fVal)).append("\\\"");
                }
            } catch (Throwable e) {
                fieldsJson.append("\\\"?\\\"");
            }
            emittedFieldCount++;
        }
        fieldsJson.append("}");

        recordEvent("{\\\"type\\\":\\\"CUSTOM_OBJECT_UPDATE\\\",\\\"step\\\":" + (++stepCounter) + ",\\\"line\\\":" + line + ",\\\"structureId\\\":\\\"" + name + "\\\",\\\"variable\\\":\\\"" + name + "\\\",\\\"className\\\":\\\"" + clazz.getSimpleName() + "\\\",\\\"objectId\\\":\\\"" + objId + "\\\",\\\"fields\\\":" + fieldsJson.toString() + "}");

        if (hasNext) {
            emitLinkedListChain(name, obj, line);
        }
        if (hasLeftRight) {
            emitBinaryTree(name, obj, line);
        }
    }

    private static void emitLinkedListChain(String name, Object head, int line) {
        if (head == null) return;
        StringBuilder nodesJson = new StringBuilder("{");
        Object curr = head;
        int count = 0;
        Set<Integer> seen = new HashSet<>();
        String headId = "Node#" + System.identityHashCode(head);

        while (curr != null && count < 100) {
            int h = System.identityHashCode(curr);
            if (seen.contains(h)) break;
            seen.add(h);

            String nid = "Node#" + h;
            Object val = null;
            Object nextObj = null;
            try {
                Field vf = getFieldAny(curr.getClass(), "val", "value", "data");
                if (vf != null) { vf.setAccessible(true); val = vf.get(curr); }
                Field nf = getFieldAny(curr.getClass(), "next");
                if (nf != null) { nf.setAccessible(true); nextObj = nf.get(curr); }
            } catch (Exception ignored) {}

            String nextId = nextObj != null ? ("\\\"Node#" + System.identityHashCode(nextObj) + "\\\"") : "null";
            if (count > 0) nodesJson.append(",");
            nodesJson.append("\\\"").append(nid).append("\\\":{")
                     .append("\\\"id\\\":\\\"").append(nid).append("\\\",")
                     .append("\\\"value\\\":").append(formatValue(val)).append(",")
                     .append("\\\"next\\\":").append(nextId).append("}");

            curr = nextObj;
            count++;
        }
        nodesJson.append("}");

        recordEvent("{\\"type\\":\\"LINKED_LIST_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"headId\\":\\"" + headId + "\\",\\"nodes\\":" + nodesJson.toString() + "}");
    }

    private static void emitBinaryTree(String name, Object root, int line) {
        if (root == null) return;
        StringBuilder nodesJson = new StringBuilder("{");
        Set<Integer> seen = new HashSet<>();
        Queue<Object> q = new LinkedList<>();
        q.offer(root);
        int count = 0;
        String rootId = "Node#" + System.identityHashCode(root);

        while (!q.isEmpty() && count < 100) {
            Object curr = q.poll();
            if (curr == null) continue;
            int h = System.identityHashCode(curr);
            if (seen.contains(h)) continue;
            seen.add(h);

            String nid = "Node#" + h;
            Object val = null;
            Object leftObj = null;
            Object rightObj = null;
            try {
                Field vf = getFieldAny(curr.getClass(), "val", "value", "data");
                if (vf != null) { vf.setAccessible(true); val = vf.get(curr); }
                Field lf = getFieldAny(curr.getClass(), "left");
                if (lf != null) { lf.setAccessible(true); leftObj = lf.get(curr); }
                Field rf = getFieldAny(curr.getClass(), "right");
                if (rf != null) { rf.setAccessible(true); rightObj = rf.get(curr); }
            } catch (Exception ignored) {}

            String leftId = leftObj != null ? ("\\\"Node#" + System.identityHashCode(leftObj) + "\\\"") : "null";
            String rightId = rightObj != null ? ("\\\"Node#" + System.identityHashCode(rightObj) + "\\\"") : "null";

            if (count > 0) nodesJson.append(",");
            nodesJson.append("\\\"").append(nid).append("\\\":{")
                     .append("\\\"id\\\":\\\"").append(nid).append("\\\",")
                     .append("\\\"value\\\":").append(formatValue(val)).append(",")
                     .append("\\\"left\\\":").append(leftId).append(",")
                     .append("\\\"right\\\":").append(rightId).append("}");

            if (leftObj != null) q.offer(leftObj);
            if (rightObj != null) q.offer(rightObj);
            count++;
        }
        nodesJson.append("}");

        recordEvent("{\\"type\\":\\"TREE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"rootId\\":\\"" + rootId + "\\",\\"nodes\\":" + nodesJson.toString() + "}");
    }

    private static Field getFieldAny(Class<?> clazz, String... names) {
        for (String n : names) {
            try {
                return clazz.getDeclaredField(n);
            } catch (NoSuchFieldException ignored) {}
        }
        if (clazz.getSuperclass() != null && clazz.getSuperclass() != Object.class) {
            return getFieldAny(clazz.getSuperclass(), names);
        }
        return null;
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
        recordEvent("{\\"type\\":\\"DP_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + dpId + "\\",\\"dpId\\":\\"" + dpId + "\\",\\"value\\":" + rStr + "}");
    }

    // === PHASE 6: ADVANCED ALGORITHMS ===
    // --- Bellman-Ford ---
    public static void bellmanFordStart(String graphId, String srcNode, int line) {
        recordEvent("{\\"type\\":\\"BELLMAN_FORD_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"startNodeId\\":\\"" + srcNode + "\\"}");
    }

    public static void bellmanFordPassStart(String graphId, int pass, int totalPasses, int line) {
        recordEvent("{\\"type\\":\\"BELLMAN_FORD_PASS_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"pass\\":" + pass + ",\\"totalPasses\\":" + totalPasses + "}");
    }

    public static void bellmanFordEdgeRelax(String graphId, String u, String v, double weight, double distU, double distV, int line) {
        recordEvent("{\\"type\\":\\"BELLMAN_FORD_EDGE_RELAX\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + ",\\"oldDistance\\":" + formatDouble(distV) + "}");
    }

    public static void bellmanFordCompare(String graphId, String u, String v, double candidate, double current, boolean canRelax, int line) {
        recordEvent("{\\"type\\":\\"BELLMAN_FORD_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"candidateDistance\\":" + formatDouble(candidate) + ",\\"oldDistance\\":" + formatDouble(current) + ",\\"conditionResult\\":" + canRelax + "}");
    }

    public static void bellmanFordDistanceUpdate(String graphId, String v, double oldDist, double newDist, int line) {
        recordEvent("{\\"type\\":\\"BELLMAN_FORD_DISTANCE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"oldDistance\\":" + formatDouble(oldDist) + ",\\"newDistance\\":" + formatDouble(newDist) + "}");
    }

    public static void bellmanFordPassEnd(String graphId, int pass, int line) {
        recordEvent("{\\"type\\":\\"BELLMAN_FORD_PASS_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"pass\\":" + pass + "}");
    }

    public static void bellmanFordNegativeCycle(String graphId, String u, String v, int line) {
        recordEvent("{\\"type\\":\\"BELLMAN_FORD_NEGATIVE_CYCLE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"cycle\\":true}");
    }

    public static void bellmanFordEnd(String graphId, int line) {
        recordEvent("{\\"type\\":\\"BELLMAN_FORD_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\"}");
    }

    // --- Floyd-Warshall ---
    public static void floydWarshallStart(String graphId, String labelsJson, String matrixJson, int line) {
        recordEvent("{\\"type\\":\\"FLOYD_WARSHALL_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"path\\":" + labelsJson + ",\\"values\\":" + matrixJson + "}");
    }

    public static void floydKUpdate(String graphId, Object k, int line) {
        String kStr = formatValue(k);
        recordEvent("{\\"type\\":\\"FLOYD_K_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"k\\":" + kStr + "}");
    }

    public static void floydDistanceCompare(String graphId, Object i, Object j, Object k, Object currentDist, Object candidateDist, boolean updateNeeded, int line) {
        String iStr = formatValue(i);
        String jStr = formatValue(j);
        String kStr = formatValue(k);
        String curStr = formatValue(currentDist);
        String canStr = formatValue(candidateDist);
        recordEvent("{\\"type\\":\\"FLOYD_DISTANCE_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"iNode\\":" + iStr + ",\\"jNode\\":" + jStr + ",\\"k\\":" + kStr + ",\\"oldDistance\\":" + curStr + ",\\"candidateDistance\\":" + canStr + ",\\"conditionResult\\":" + updateNeeded + "}");
    }

    public static void floydDistanceUpdate(String graphId, Object i, Object j, Object k, Object oldDist, Object newDist, int line) {
        String iStr = formatValue(i);
        String jStr = formatValue(j);
        String kStr = formatValue(k);
        String oldStr = formatValue(oldDist);
        String newStr = formatValue(newDist);
        recordEvent("{\\"type\\":\\"FLOYD_DISTANCE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"iNode\\":" + iStr + ",\\"jNode\\":" + jStr + ",\\"k\\":" + kStr + ",\\"oldDistance\\":" + oldStr + ",\\"newDistance\\":" + newStr + "}");
    }

    public static void floydWarshallEnd(String graphId, int line) {
        recordEvent("{\\"type\\":\\"FLOYD_WARSHALL_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\"}");
    }

    // --- Minimum Spanning Tree: Prim ---
    public static void primStart(String graphId, String startNode, int line) {
        recordEvent("{\\"type\\":\\"PRIM_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"startNodeId\\":\\"" + startNode + "\\"}");
    }

    public static void primNodeSelect(String graphId, String node, int line) {
        recordEvent("{\\"type\\":\\"PRIM_NODE_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\"}");
    }

    public static void primEdgeConsider(String graphId, String u, String v, double weight, int line) {
        recordEvent("{\\"type\\":\\"PRIM_EDGE_CONSIDER\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + "}");
    }

    public static void primEdgeCompare(String graphId, String u, String v, double weight, boolean isBetter, int line) {
        recordEvent("{\\"type\\":\\"PRIM_EDGE_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + ",\\"conditionResult\\":" + isBetter + "}");
    }

    public static void primEdgeAccept(String graphId, String u, String v, double weight, double totalWeight, int line) {
        recordEvent("{\\"type\\":\\"PRIM_EDGE_ACCEPT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + ",\\"distance\\":" + totalWeight + "}");
    }

    public static void primEdgeReject(String graphId, String u, String v, double weight, String reason, int line) {
        recordEvent("{\\"type\\":\\"PRIM_EDGE_REJECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + ",\\"message\\":\\"" + reason + "\\"}");
    }

    public static void primQueueInsert(String graphId, String u, String v, double weight, int line) {
        recordEvent("{\\"type\\":\\"PRIM_QUEUE_INSERT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + "}");
    }

    public static void primQueueRemove(String graphId, String u, String v, double weight, int line) {
        recordEvent("{\\"type\\":\\"PRIM_QUEUE_REMOVE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + "}");
    }

    public static void primEnd(String graphId, double totalMstWeight, int line) {
        recordEvent("{\\"type\\":\\"PRIM_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"distance\\":" + totalMstWeight + "}");
    }

    // --- Minimum Spanning Tree: Kruskal ---
    public static void kruskalStart(String graphId, int totalEdges, int line) {
        recordEvent("{\\"type\\":\\"KRUSKAL_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"size\\":" + totalEdges + "}");
    }

    public static void kruskalEdgeSelect(String graphId, String u, String v, double weight, int line) {
        recordEvent("{\\"type\\":\\"KRUSKAL_EDGE_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + "}");
    }

    public static void kruskalEdgeCompare(String graphId, String u, String v, double weight, int line) {
        recordEvent("{\\"type\\":\\"KRUSKAL_EDGE_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + "}");
    }

    public static void kruskalFind(String graphId, String node, String root, int line) {
        recordEvent("{\\"type\\":\\"KRUSKAL_FIND\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\",\\"parentNodeId\\":\\"" + root + "\\"}");
    }

    public static void kruskalCycleCheck(String graphId, String u, String v, boolean causesCycle, int line) {
        recordEvent("{\\"type\\":\\"KRUSKAL_CYCLE_CHECK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"cycle\\":" + causesCycle + "}");
    }

    public static void kruskalUnion(String graphId, String u, String v, String newRoot, int line) {
        recordEvent("{\\"type\\":\\"KRUSKAL_UNION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"parentNodeId\\":\\"" + newRoot + "\\"}");
    }

    public static void kruskalEdgeAccept(String graphId, String u, String v, double weight, double totalWeight, int line) {
        recordEvent("{\\"type\\":\\"KRUSKAL_EDGE_ACCEPT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + ",\\"distance\\":" + totalWeight + "}");
    }

    public static void kruskalEdgeReject(String graphId, String u, String v, double weight, int line) {
        recordEvent("{\\"type\\":\\"KRUSKAL_EDGE_REJECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"weight\\":" + weight + "}");
    }

    public static void kruskalEnd(String graphId, double totalMstWeight, int line) {
        recordEvent("{\\"type\\":\\"KRUSKAL_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"distance\\":" + totalMstWeight + "}");
    }

    // --- Topological Sort ---
    public static void topologicalSortStart(String graphId, String algorithm, int line) {
        recordEvent("{\\"type\\":\\"TOPOLOGICAL_SORT_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"algorithmName\\":\\"" + algorithm + "\\"}");
    }

    public static void indegreeInitialize(String graphId, String indegreesJson, int line) {
        recordEvent("{\\"type\\":\\"INDEGREE_INITIALIZE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"arguments\\":" + indegreesJson + "}");
    }

    public static void topologicalNodeEnqueue(String graphId, String node, int inDegree, int line) {
        recordEvent("{\\"type\\":\\"TOPOLOGICAL_NODE_ENQUEUE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\",\\"value\\":" + inDegree + "}");
    }

    public static void topologicalNodeDequeue(String graphId, String node, int line) {
        recordEvent("{\\"type\\":\\"TOPOLOGICAL_NODE_DEQUEUE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\"}");
    }

    public static void topologicalEdgeProcess(String graphId, String u, String v, int newInDegree, int line) {
        recordEvent("{\\"type\\":\\"TOPOLOGICAL_EDGE_PROCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\",\\"value\\":" + newInDegree + "}");
    }

    public static void indegreeUpdate(String graphId, String node, int oldVal, int newVal, int line) {
        recordEvent("{\\"type\\":\\"INDEGREE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\",\\"oldValue\\":" + oldVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void topologicalNodeOutput(String graphId, String node, int outputIndex, int line) {
        recordEvent("{\\"type\\":\\"TOPOLOGICAL_NODE_OUTPUT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\",\\"index\\":" + outputIndex + "}");
    }

    public static void topologicalCycleDetected(String graphId, int processedCount, int totalNodes, int line) {
        recordEvent("{\\"type\\":\\"TOPOLOGICAL_CYCLE_DETECTED\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"cycle\\":true,\\"size\\":" + processedCount + "}");
    }

    public static void topologicalSortEnd(String graphId, String orderJson, int line) {
        recordEvent("{\\"type\\":\\"TOPOLOGICAL_SORT_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"path\\":" + orderJson + "}");
    }

    // --- Strongly Connected Components: Kosaraju ---
    public static void kosarajuStart(String graphId, int line) {
        recordEvent("{\\"type\\":\\"KOSARAJU_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\"}");
    }

    public static void kosarajuFirstDfs(String graphId, String node, int line) {
        recordEvent("{\\"type\\":\\"KOSARAJU_FIRST_DFS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\"}");
    }

    public static void kosarajuFinish(String graphId, String node, int line) {
        recordEvent("{\\"type\\":\\"KOSARAJU_FINISH\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\"}");
    }

    public static void kosarajuStackPush(String graphId, String node, int line) {
        recordEvent("{\\"type\\":\\"KOSARAJU_STACK_PUSH\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\"}");
    }

    public static void kosarajuTranspose(String graphId, String transposeGraphId, int line) {
        recordEvent("{\\"type\\":\\"KOSARAJU_TRANSPOSE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"variable\\":\\"" + transposeGraphId + "\\"}");
    }

    public static void kosarajuSecondDfs(String graphId, String node, int componentId, int line) {
        recordEvent("{\\"type\\":\\"KOSARAJU_SECOND_DFS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\",\\"componentId\\":" + componentId + "}");
    }

    public static void kosarajuSccStart(String graphId, int componentId, int line) {
        recordEvent("{\\"type\\":\\"KOSARAJU_SCC_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"componentId\\":" + componentId + "}");
    }

    public static void kosarajuSccNode(String graphId, int componentId, String node, int line) {
        recordEvent("{\\"type\\":\\"KOSARAJU_SCC_NODE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"componentId\\":" + componentId + ",\\"nodeId\\":\\"" + node + "\\"}");
    }

    public static void kosarajuSccEnd(String graphId, int componentId, String nodesJson, int line) {
        recordEvent("{\\"type\\":\\"KOSARAJU_SCC_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"componentId\\":" + componentId + ",\\"path\\":" + nodesJson + "}");
    }

    public static void kosarajuEnd(String graphId, int totalComponents, int line) {
        recordEvent("{\\"type\\":\\"KOSARAJU_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"size\\":" + totalComponents + "}");
    }

    // --- Strongly Connected Components: Tarjan ---
    public static void tarjanStart(String graphId, int line) {
        recordEvent("{\\"type\\":\\"TARJAN_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\"}");
    }

    public static void tarjanDiscover(String graphId, String node, int dfn, int low, int line) {
        recordEvent("{\\"type\\":\\"TARJAN_DISCOVER\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\",\\"fromIndex\\":" + dfn + ",\\"toIndex\\":" + low + "}");
    }

    public static void tarjanStackPush(String graphId, String node, int line) {
        recordEvent("{\\"type\\":\\"TARJAN_STACK_PUSH\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\"}");
    }

    public static void tarjanEdgeProcess(String graphId, String u, String v, int line) {
        recordEvent("{\\"type\\":\\"TARJAN_EDGE_PROCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"sourceNodeId\\":\\"" + u + "\\",\\"targetNodeId\\":\\"" + v + "\\"}");
    }

    public static void tarjanLowLinkUpdate(String graphId, String u, int oldLow, int newLow, int line) {
        recordEvent("{\\"type\\":\\"TARJAN_LOWLINK_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + u + "\\",\\"oldValue\\":" + oldLow + ",\\"newValue\\":" + newLow + "}");
    }

    public static void tarjanSccStart(String graphId, int componentId, String rootNode, int line) {
        recordEvent("{\\"type\\":\\"TARJAN_SCC_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"componentId\\":" + componentId + ",\\"nodeId\\":\\"" + rootNode + "\\"}");
    }

    public static void tarjanStackPop(String graphId, String node, int componentId, int line) {
        recordEvent("{\\"type\\":\\"TARJAN_STACK_POP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"nodeId\\":\\"" + node + "\\",\\"componentId\\":" + componentId + "}");
    }

    public static void tarjanSccNode(String graphId, int componentId, String node, int line) {
        recordEvent("{\\"type\\":\\"TARJAN_SCC_NODE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"componentId\\":" + componentId + ",\\"nodeId\\":\\"" + node + "\\"}");
    }

    public static void tarjanSccEnd(String graphId, int componentId, String nodesJson, int line) {
        recordEvent("{\\"type\\":\\"TARJAN_SCC_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"componentId\\":" + componentId + ",\\"path\\":" + nodesJson + "}");
    }

    public static void tarjanEnd(String graphId, int totalComponents, int line) {
        recordEvent("{\\"type\\":\\"TARJAN_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + graphId + "\\",\\"size\\":" + totalComponents + "}");
    }

    // --- AVL Tree ---
    public static void avlCreate(String treeId, String type, int line) {
        recordEvent("{\\"type\\":\\"AVL_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"structureType\\":\\"tree\\",\\"dataType\\":\\"" + type + "\\"}");
    }

    public static void avlInsert(String treeId, String nodeId, Object value, int line) {
        String vStr = formatValue(value);
        recordEvent("{\\"type\\":\\"AVL_INSERT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"value\\":" + vStr + "}");
    }

    public static void avlDelete(String treeId, String nodeId, Object value, int line) {
        String vStr = formatValue(value);
        recordEvent("{\\"type\\":\\"AVL_DELETE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"value\\":" + vStr + "}");
    }

    public static void avlHeightUpdate(String treeId, String nodeId, int oldHeight, int newHeight, int line) {
        recordEvent("{\\"type\\":\\"AVL_HEIGHT_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"oldValue\\":" + oldHeight + ",\\"newValue\\":" + newHeight + "}");
    }

    public static void avlBalanceCheck(String treeId, String nodeId, int leftH, int rightH, int bf, int line) {
        recordEvent("{\\"type\\":\\"AVL_BALANCE_CHECK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"fromIndex\\":" + leftH + ",\\"toIndex\\":" + rightH + ",\\"balanceFactor\\":" + bf + "}");
    }

    public static void avlRotateLeft(String treeId, String pivotNodeId, String newRootId, int line) {
        recordEvent("{\\"type\\":\\"AVL_ROTATE_LEFT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + pivotNodeId + "\\",\\"childNodeId\\":\\"" + newRootId + "\\",\\"rotationType\\":\\"RR\\"}");
    }

    public static void avlRotateRight(String treeId, String pivotNodeId, String newRootId, int line) {
        recordEvent("{\\"type\\":\\"AVL_ROTATE_RIGHT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + pivotNodeId + "\\",\\"childNodeId\\":\\"" + newRootId + "\\",\\"rotationType\\":\\"LL\\"}");
    }

    public static void avlRotateLeftRight(String treeId, String pivotNodeId, int line) {
        recordEvent("{\\"type\\":\\"AVL_ROTATE_LEFT_RIGHT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + pivotNodeId + "\\",\\"rotationType\\":\\"LR\\"}");
    }

    public static void avlRotateRightLeft(String treeId, String pivotNodeId, int line) {
        recordEvent("{\\"type\\":\\"AVL_ROTATE_RIGHT_LEFT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + pivotNodeId + "\\",\\"rotationType\\":\\"RL\\"}");
    }

    public static void avlRootUpdate(String treeId, String newRootId, int line) {
        recordEvent("{\\"type\\":\\"AVL_ROOT_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + newRootId + "\\"}");
    }

    public static void avlEnd(String treeId, int line) {
        recordEvent("{\\"type\\":\\"AVL_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\"}");
    }

    // --- Binary Search on Answer ---
    public static void answerSearchStart(String name, long low, long high, int line) {
        recordEvent("{\\"type\\":\\"ANSWER_SEARCH_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"low\\":" + low + ",\\"high\\":" + high + "}");
    }

    public static void answerSearchRange(String name, long low, long high, int line) {
        recordEvent("{\\"type\\":\\"ANSWER_SEARCH_RANGE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"low\\":" + low + ",\\"high\\":" + high + "}");
    }

    public static void answerSearchMid(String name, long mid, int line) {
        recordEvent("{\\"type\\":\\"ANSWER_SEARCH_MID\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"mid\\":" + mid + "}");
    }

    public static void answerSearchFeasibilityCheck(String name, long mid, boolean feasible, String explanation, int line) {
        String clean = explanation.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        recordEvent("{\\"type\\":\\"ANSWER_SEARCH_FEASIBILITY_CHECK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"mid\\":" + mid + ",\\"feasible\\":" + feasible + ",\\"message\\":\\"" + clean + "\\"}");
    }

    public static void answerSearchRangeUpdate(String name, long low, long high, long bestSoFar, int line) {
        recordEvent("{\\"type\\":\\"ANSWER_SEARCH_RANGE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"low\\":" + low + ",\\"high\\":" + high + ",\\"value\\":" + bestSoFar + "}");
    }

    public static void answerSearchEnd(String name, long answer, int line) {
        recordEvent("{\\"type\\":\\"ANSWER_SEARCH_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"value\\":" + answer + "}");
    }

    // --- Coordinate Compression ---
    public static void coordCompressStart(String name, int originalCount, int line) {
        recordEvent("{\\"type\\":\\"COORD_COMPRESS_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"size\\":" + originalCount + "}");
    }

    public static void coordCompressMap(String name, Object val, int rank, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"COORD_COMPRESS_MAP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"value\\":" + vStr + ",\\"index\\":" + rank + "}");
    }

    public static void coordCompressApply(String name, int index, Object originalVal, int compressedVal, int line) {
        String vStr = formatValue(originalVal);
        recordEvent("{\\"type\\":\\"COORD_COMPRESS_APPLY\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"index\\":" + index + ",\\"oldValue\\":" + vStr + ",\\"newValue\\":" + compressedVal + "}");
    }

    public static void coordCompressEnd(String name, int uniqueCount, int line) {
        recordEvent("{\\"type\\":\\"COORD_COMPRESS_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"variable\\":\\"" + name + "\\",\\"size\\":" + uniqueCount + "}");
    }

    // --- Monotonic Stack ---
    public static void monoStackStart(String name, String monoType, int line) {
        recordEvent("{\\"type\\":\\"MONO_STACK_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"monoType\\":\\"" + monoType + "\\"}");
    }

    public static void monoStackCompare(String name, Object topVal, Object currentVal, boolean shouldPop, int line) {
        String tStr = formatValue(topVal);
        String cStr = formatValue(currentVal);
        recordEvent("{\\"type\\":\\"MONO_STACK_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"leftVal\\":" + tStr + ",\\"rightVal\\":" + cStr + ",\\"conditionResult\\":" + shouldPop + "}");
    }

    public static void monoStackPop(String name, Object poppedVal, int line) {
        String pStr = formatValue(poppedVal);
        recordEvent("{\\"type\\":\\"MONO_STACK_POP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + pStr + "}");
    }

    public static void monoStackPush(String name, Object pushedVal, int line) {
        String pStr = formatValue(pushedVal);
        recordEvent("{\\"type\\":\\"MONO_STACK_PUSH\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"value\\":" + pStr + "}");
    }

    public static void monoStackResult(String name, int index, Object val, Object nextGreaterOrSmaller, int line) {
        String vStr = formatValue(val);
        String rStr = formatValue(nextGreaterOrSmaller);
        recordEvent("{\\"type\\":\\"MONO_STACK_RESULT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\",\\"index\\":" + index + ",\\"oldValue\\":" + vStr + ",\\"newValue\\":" + rStr + "}");
    }

    public static void monoStackEnd(String name, int line) {
        recordEvent("{\\"type\\":\\"MONO_STACK_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + name + "\\",\\"variable\\":\\"" + name + "\\"}");
    }

    // ==========================================
    // === PHASE 7 ADVANCED DYNAMIC PROGRAMMING ===
    // ==========================================

    // --- Core DP & Table ---
    public static void dpStart(String structId, String algoName, int line) {
        recordEvent("{\\"type\\":\\"DP_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"algorithmName\\":\\"" + algoName + "\\"}");
    }

    public static void dpTableCreate(String structId, String dimsJson, int line) {
        recordEvent("{\\"type\\":\\"DP_TABLE_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"dimensions\\":" + dimsJson + "}");
    }

    public static void dpStateAccess(String structId, String indicesJson, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DP_STATE_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"indices\\":" + indicesJson + ",\\"value\\":" + vStr + "}");
    }

    public static void dpStateCompute(String structId, String indicesJson, String formula, int line) {
        String cleanF = formula.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        recordEvent("{\\"type\\":\\"DP_STATE_COMPUTE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"indices\\":" + indicesJson + ",\\"transitionFormula\\":\\"" + cleanF + "\\"}");
    }

    public static void dpStateCompare(String structId, String indicesJson, Object cand1, Object cand2, Object chosen, int line) {
        String c1 = formatValue(cand1);
        String c2 = formatValue(cand2);
        String ch = formatValue(chosen);
        recordEvent("{\\"type\\":\\"DP_STATE_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"indices\\":" + indicesJson + ",\\"leftVal\\":" + c1 + ",\\"rightVal\\":" + c2 + ",\\"value\\":" + ch + "}");
    }

    public static void dpStateTransition(String structId, String indicesJson, String depsJson, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DP_STATE_TRANSITION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"indices\\":" + indicesJson + ",\\"dependencies\\":" + depsJson + ",\\"value\\":" + vStr + "}");
    }

    public static void dpStateUpdate(String structId, String indicesJson, Object oldVal, Object newVal, int line) {
        String oStr = formatValue(oldVal);
        String nStr = formatValue(newVal);
        recordEvent("{\\"type\\":\\"DP_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"indices\\":" + indicesJson + ",\\"oldValue\\":" + oStr + ",\\"newValue\\":" + nStr + "}");
    }

    public static void dpCacheLookup(String structId, String keyStr, int line) {
        recordEvent("{\\"type\\":\\"DP_CACHE_LOOKUP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"stateKey\\":\\"" + keyStr + "\\"}");
    }

    public static void dpCacheHit(String structId, String keyStr, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"DP_CACHE_HIT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"stateKey\\":\\"" + keyStr + "\\",\\"value\\":" + vStr + "}");
    }

    public static void dpCacheMiss(String structId, String keyStr, int line) {
        recordEvent("{\\"type\\":\\"DP_CACHE_MISS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"stateKey\\":\\"" + keyStr + "\\"}");
    }

    public static void dpReconstructionStart(String structId, int line) {
        recordEvent("{\\"type\\":\\"DP_RECONSTRUCTION_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\"}");
    }

    public static void dpReconstructionStep(String structId, String indicesJson, Object val, String action, int line) {
        String vStr = formatValue(val);
        String cleanAction = action.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        recordEvent("{\\"type\\":\\"DP_RECONSTRUCTION_STEP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"indices\\":" + indicesJson + ",\\"value\\":" + vStr + ",\\"detail\\":\\"" + cleanAction + "\\"}");
    }

    public static void dpReconstructionEnd(String structId, String resultJson, int line) {
        recordEvent("{\\"type\\":\\"DP_RECONSTRUCTION_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"reconstructionPath\\":" + resultJson + "}");
    }

    // --- 0/1 Knapsack ---
    public static void knapsackStart(String structId, int numItems, int capacity, int line) {
        recordEvent("{\\"type\\":\\"KNAPSACK_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"size\\":" + numItems + ",\\"capacity\\":" + capacity + "}");
    }

    public static void knapsackItemSelect(String structId, int itemIdx, int weight, int val, int line) {
        recordEvent("{\\"type\\":\\"KNAPSACK_ITEM_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + itemIdx + ",\\"weight\\":" + weight + ",\\"itemValue\\":" + val + "}");
    }

    public static void knapsackCapacitySelect(String structId, int itemIdx, int cap, int line) {
        recordEvent("{\\"type\\":\\"KNAPSACK_CAPACITY_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + itemIdx + ",\\"capacity\\":" + cap + "}");
    }

    public static void knapsackFitCheck(String structId, int itemIdx, int cap, int weight, boolean fits, int line) {
        recordEvent("{\\"type\\":\\"KNAPSACK_FIT_CHECK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + itemIdx + ",\\"capacity\\":" + cap + ",\\"weight\\":" + weight + ",\\"fit\\":" + fits + "}");
    }

    public static void knapsackExclude(String structId, int itemIdx, int cap, int excludeVal, int line) {
        recordEvent("{\\"type\\":\\"KNAPSACK_EXCLUDE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + itemIdx + ",\\"capacity\\":" + cap + ",\\"value\\":" + excludeVal + "}");
    }

    public static void knapsackInclude(String structId, int itemIdx, int cap, int includeVal, int line) {
        recordEvent("{\\"type\\":\\"KNAPSACK_INCLUDE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + itemIdx + ",\\"capacity\\":" + cap + ",\\"value\\":" + includeVal + "}");
    }

    public static void knapsackCompare(String structId, int itemIdx, int cap, int excludeVal, int includeVal, int chosenVal, int line) {
        recordEvent("{\\"type\\":\\"KNAPSACK_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + itemIdx + ",\\"capacity\\":" + cap + ",\\"leftVal\\":" + excludeVal + ",\\"rightVal\\":" + includeVal + ",\\"value\\":" + chosenVal + "}");
    }

    public static void knapsackStateUpdate(String structId, int itemIdx, int cap, int oldVal, int newVal, int line) {
        recordEvent("{\\"type\\":\\"KNAPSACK_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + itemIdx + ",\\"capacity\\":" + cap + ",\\"oldValue\\":" + oldVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void knapsackEnd(String structId, int maxVal, int line) {
        recordEvent("{\\"type\\":\\"KNAPSACK_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + maxVal + "}");
    }

    // --- Unbounded Knapsack ---
    public static void unboundedKnapsackStart(String structId, int capacity, int line) {
        recordEvent("{\\"type\\":\\"UNBOUNDED_KNAPSACK_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"capacity\\":" + capacity + "}");
    }

    public static void unboundedItemSelect(String structId, int itemIdx, int weight, int val, int line) {
        recordEvent("{\\"type\\":\\"UNBOUNDED_ITEM_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + itemIdx + ",\\"weight\\":" + weight + ",\\"itemValue\\":" + val + "}");
    }

    public static void unboundedCapacitySelect(String structId, int cap, int line) {
        recordEvent("{\\"type\\":\\"UNBOUNDED_CAPACITY_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"capacity\\":" + cap + "}");
    }

    public static void unboundedFitCheck(String structId, int cap, int weight, boolean fits, int line) {
        recordEvent("{\\"type\\":\\"UNBOUNDED_FIT_CHECK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"capacity\\":" + cap + ",\\"weight\\":" + weight + ",\\"fit\\":" + fits + "}");
    }

    public static void unboundedInclude(String structId, int cap, int includeVal, int line) {
        recordEvent("{\\"type\\":\\"UNBOUNDED_INCLUDE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"capacity\\":" + cap + ",\\"value\\":" + includeVal + "}");
    }

    public static void unboundedExclude(String structId, int cap, int excludeVal, int line) {
        recordEvent("{\\"type\\":\\"UNBOUNDED_EXCLUDE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"capacity\\":" + cap + ",\\"value\\":" + excludeVal + "}");
    }

    public static void unboundedCompare(String structId, int cap, int excludeVal, int includeVal, int chosenVal, int line) {
        recordEvent("{\\"type\\":\\"UNBOUNDED_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"capacity\\":" + cap + ",\\"leftVal\\":" + excludeVal + ",\\"rightVal\\":" + includeVal + ",\\"value\\":" + chosenVal + "}");
    }

    public static void unboundedStateUpdate(String structId, int cap, int oldVal, int newVal, int line) {
        recordEvent("{\\"type\\":\\"UNBOUNDED_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"capacity\\":" + cap + ",\\"oldValue\\":" + oldVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void unboundedEnd(String structId, int maxVal, int line) {
        recordEvent("{\\"type\\":\\"UNBOUNDED_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + maxVal + "}");
    }

    // --- Coin Change ---
    public static void coinChangeStart(String structId, String algo, int amount, int line) {
        recordEvent("{\\"type\\":\\"COIN_CHANGE_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"algorithmName\\":\\"" + algo + "\\",\\"amount\\":" + amount + "}");
    }

    public static void coinSelect(String structId, int coin, int line) {
        recordEvent("{\\"type\\":\\"COIN_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"coin\\":" + coin + "}");
    }

    public static void coinAmountSelect(String structId, int coin, int amount, int line) {
        recordEvent("{\\"type\\":\\"COIN_AMOUNT_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"coin\\":" + coin + ",\\"amount\\":" + amount + "}");
    }

    public static void coinFitCheck(String structId, int coin, int amount, boolean fits, int line) {
        recordEvent("{\\"type\\":\\"COIN_FIT_CHECK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"coin\\":" + coin + ",\\"amount\\":" + amount + ",\\"fit\\":" + fits + "}");
    }

    public static void coinCandidate(String structId, int coin, int amount, Object candidateVal, int line) {
        String cStr = formatValue(candidateVal);
        recordEvent("{\\"type\\":\\"COIN_CANDIDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"coin\\":" + coin + ",\\"amount\\":" + amount + ",\\"candidateValue\\":" + cStr + "}");
    }

    public static void coinCompare(String structId, int amount, Object prevVal, Object candVal, Object chosenVal, int line) {
        String pStr = formatValue(prevVal);
        String cStr = formatValue(candVal);
        String chStr = formatValue(chosenVal);
        recordEvent("{\\"type\\":\\"COIN_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"amount\\":" + amount + ",\\"leftVal\\":" + pStr + ",\\"rightVal\\":" + cStr + ",\\"value\\":" + chStr + "}");
    }

    public static void coinStateUpdate(String structId, int amount, Object oldVal, Object newVal, int line) {
        String oStr = formatValue(oldVal);
        String nStr = formatValue(newVal);
        recordEvent("{\\"type\\":\\"COIN_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"amount\\":" + amount + ",\\"oldValue\\":" + oStr + ",\\"newValue\\":" + nStr + "}");
    }

    public static void coinChangeEnd(String structId, Object result, int line) {
        String rStr = formatValue(result);
        recordEvent("{\\"type\\":\\"COIN_CHANGE_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + rStr + "}");
    }

    // --- Subset Sum ---
    public static void subsetSumStart(String structId, int n, int target, int line) {
        recordEvent("{\\"type\\":\\"SUBSET_SUM_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"size\\":" + n + ",\\"target\\":" + target + "}");
    }

    public static void subsetElementSelect(String structId, int idx, int val, int line) {
        recordEvent("{\\"type\\":\\"SUBSET_ELEMENT_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + idx + ",\\"itemValue\\":" + val + "}");
    }

    public static void subsetTargetSelect(String structId, int idx, int s, int line) {
        recordEvent("{\\"type\\":\\"SUBSET_TARGET_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + idx + ",\\"target\\":" + s + "}");
    }

    public static void subsetExclude(String structId, int idx, int s, boolean excludeVal, int line) {
        recordEvent("{\\"type\\":\\"SUBSET_EXCLUDE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + idx + ",\\"target\\":" + s + ",\\"conditionResult\\":" + excludeVal + "}");
    }

    public static void subsetInclude(String structId, int idx, int s, boolean includeVal, int line) {
        recordEvent("{\\"type\\":\\"SUBSET_INCLUDE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + idx + ",\\"target\\":" + s + ",\\"conditionResult\\":" + includeVal + "}");
    }

    public static void subsetCompare(String structId, int idx, int s, boolean res, int line) {
        recordEvent("{\\"type\\":\\"SUBSET_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + idx + ",\\"target\\":" + s + ",\\"conditionResult\\":" + res + "}");
    }

    public static void subsetStateUpdate(String structId, int idx, int s, boolean oldVal, boolean newVal, int line) {
        recordEvent("{\\"type\\":\\"SUBSET_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"itemIndex\\":" + idx + ",\\"target\\":" + s + ",\\"oldValue\\":" + oldVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void subsetSumEnd(String structId, boolean result, int line) {
        recordEvent("{\\"type\\":\\"SUBSET_SUM_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"conditionResult\\":" + result + "}");
    }

    // --- Longest Common Subsequence & Longest Common Substring ---
    public static void lcsStart(String structId, String s1, String s2, int line) {
        String clean1 = s1.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        String clean2 = s2.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        recordEvent("{\\"type\\":\\"LCS_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"detail\\":\\"" + clean1 + "|" + clean2 + "\\"}");
    }

    public static void lcsCharCompare(String structId, int i, int j, char c1, char c2, boolean match, int line) {
        recordEvent("{\\"type\\":\\"LCS_CHARACTER_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + ",\\"iChar\\":\\"" + c1 + "\\",\\"jChar\\":\\"" + c2 + "\\",\\"charMatched\\":" + match + "}");
    }

    public static void lcsMatch(String structId, int i, int j, int diagVal, int newVal, int line) {
        recordEvent("{\\"type\\":\\"LCS_MATCH\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + ",\\"oldValue\\":" + diagVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void lcsMismatch(String structId, int i, int j, int topVal, int leftVal, int maxVal, int line) {
        recordEvent("{\\"type\\":\\"LCS_MISMATCH\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + ",\\"leftVal\\":" + topVal + ",\\"rightVal\\":" + leftVal + ",\\"value\\":" + maxVal + "}");
    }

    public static void lcsDependencySelect(String structId, int i, int j, String chosenDep, int line) {
        recordEvent("{\\"type\\":\\"LCS_DEPENDENCY_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + ",\\"detail\\":\\"" + chosenDep + "\\"}");
    }

    public static void lcsStateUpdate(String structId, int i, int j, int oldVal, int newVal, int line) {
        recordEvent("{\\"type\\":\\"LCS_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + ",\\"oldValue\\":" + oldVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void lcsReconstructionStart(String structId, int i, int j, int line) {
        recordEvent("{\\"type\\":\\"LCS_RECONSTRUCTION_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + "}");
    }

    public static void lcsReconstructionStep(String structId, int i, int j, char c, String action, int line) {
        recordEvent("{\\"type\\":\\"LCS_RECONSTRUCTION_STEP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + ",\\"char\\":\\"" + c + "\\",\\"detail\\":\\"" + action + "\\"}");
    }

    public static void lcsReconstructionEnd(String structId, String lcsString, int line) {
        String clean = lcsString.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        recordEvent("{\\"type\\":\\"LCS_RECONSTRUCTION_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"word\\":\\"" + clean + "\\"}");
    }

    public static void lcsEnd(String structId, int maxLen, int line) {
        recordEvent("{\\"type\\":\\"LCS_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + maxLen + "}");
    }

    public static void lcstrStart(String structId, String s1, String s2, int line) {
        String clean1 = s1.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        String clean2 = s2.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        recordEvent("{\\"type\\":\\"LCSTR_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"detail\\":\\"" + clean1 + "|" + clean2 + "\\"}");
    }

    public static void lcstrCharCompare(String structId, int i, int j, char c1, char c2, boolean match, int line) {
        recordEvent("{\\"type\\":\\"LCSTR_CHARACTER_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + ",\\"iChar\\":\\"" + c1 + "\\",\\"jChar\\":\\"" + c2 + "\\",\\"charMatched\\":" + match + "}");
    }

    public static void lcstrMatch(String structId, int i, int j, int diagVal, int newVal, int line) {
        recordEvent("{\\"type\\":\\"LCSTR_MATCH\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + ",\\"oldValue\\":" + diagVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void lcstrReset(String structId, int i, int j, int line) {
        recordEvent("{\\"type\\":\\"LCSTR_RESET\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + ",\\"newValue\\":0}");
    }

    public static void lcstrStateUpdate(String structId, int i, int j, int oldVal, int newVal, int line) {
        recordEvent("{\\"type\\":\\"LCSTR_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + i + ",\\"col\\":" + j + ",\\"oldValue\\":" + oldVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void lcstrMaxUpdate(String structId, int newMax, int line) {
        recordEvent("{\\"type\\":\\"LCSTR_MAX_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + newMax + "}");
    }

    public static void lcstrEnd(String structId, int maxLen, int line) {
        recordEvent("{\\"type\\":\\"LCSTR_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + maxLen + "}");
    }

    // --- Longest Increasing Subsequence (LIS) ---
    public static void lisStart(String structId, int n, int line) {
        recordEvent("{\\"type\\":\\"LIS_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"size\\":" + n + "}");
    }

    public static void lisIndexSelect(String structId, int i, int line) {
        recordEvent("{\\"type\\":\\"LIS_INDEX_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + i + "}");
    }

    public static void lisCompare(String structId, int i, int j, int valI, int valJ, boolean condition, int line) {
        recordEvent("{\\"type\\":\\"LIS_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"fromIndex\\":" + i + ",\\"toIndex\\":" + j + ",\\"leftVal\\":" + valI + ",\\"rightVal\\":" + valJ + ",\\"conditionResult\\":" + condition + "}");
    }

    public static void lisCandidate(String structId, int i, int j, int candVal, int line) {
        recordEvent("{\\"type\\":\\"LIS_CANDIDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"fromIndex\\":" + i + ",\\"toIndex\\":" + j + ",\\"candidateValue\\":" + candVal + "}");
    }

    public static void lisStateUpdate(String structId, int i, int oldVal, int newVal, int line) {
        recordEvent("{\\"type\\":\\"LIS_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + i + ",\\"oldValue\\":" + oldVal + ",\\"newValue\\":" + newVal + "}");
    }

    public static void lisParentUpdate(String structId, int i, int parentIdx, int line) {
        recordEvent("{\\"type\\":\\"LIS_PARENT_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + i + ",\\"toIndex\\":" + parentIdx + "}");
    }

    public static void lisReconstructionStart(String structId, int startIdx, int line) {
        recordEvent("{\\"type\\":\\"LIS_RECONSTRUCTION_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + startIdx + "}");
    }

    public static void lisReconstructionStep(String structId, int currIdx, int val, int parentIdx, int line) {
        recordEvent("{\\"type\\":\\"LIS_RECONSTRUCTION_STEP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"index\\":" + currIdx + ",\\"value\\":" + val + ",\\"toIndex\\":" + parentIdx + "}");
    }

    public static void lisEnd(String structId, int maxLen, int line) {
        recordEvent("{\\"type\\":\\"LIS_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + maxLen + "}");
    }

    // --- Grid DP ---
    public static void gridDpStart(String structId, String algo, int rows, int cols, int line) {
        recordEvent("{\\"type\\":\\"GRID_DP_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"algorithmName\\":\\"" + algo + "\\",\\"row\\":" + rows + ",\\"col\\":" + cols + "}");
    }

    public static void gridCellSelect(String structId, int r, int c, int line) {
        recordEvent("{\\"type\\":\\"GRID_CELL_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + r + ",\\"col\\":" + c + "}");
    }

    public static void gridObstacleCheck(String structId, int r, int c, boolean isObstacle, int line) {
        recordEvent("{\\"type\\":\\"GRID_OBSTACLE_CHECK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + r + ",\\"col\\":" + c + ",\\"conditionResult\\":" + isObstacle + "}");
    }

    public static void gridDependencyAccess(String structId, int r, int c, String depsJson, int line) {
        recordEvent("{\\"type\\":\\"GRID_DEPENDENCY_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + r + ",\\"col\\":" + c + ",\\"dependencies\\":" + depsJson + "}");
    }

    public static void gridCandidate(String structId, int r, int c, Object topVal, Object leftVal, int line) {
        String tStr = formatValue(topVal);
        String lStr = formatValue(leftVal);
        recordEvent("{\\"type\\":\\"GRID_CANDIDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + r + ",\\"col\\":" + c + ",\\"leftVal\\":" + tStr + ",\\"rightVal\\":" + lStr + "}");
    }

    public static void gridCompare(String structId, int r, int c, Object cand1, Object cand2, Object chosen, int line) {
        String c1 = formatValue(cand1);
        String c2 = formatValue(cand2);
        String ch = formatValue(chosen);
        recordEvent("{\\"type\\":\\"GRID_COMPARE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + r + ",\\"col\\":" + c + ",\\"leftVal\\":" + c1 + ",\\"rightVal\\":" + c2 + ",\\"value\\":" + ch + "}");
    }

    public static void gridStateUpdate(String structId, int r, int c, Object oldVal, Object newVal, int line) {
        String oStr = formatValue(oldVal);
        String nStr = formatValue(newVal);
        recordEvent("{\\"type\\":\\"GRID_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"row\\":" + r + ",\\"col\\":" + c + ",\\"oldValue\\":" + oStr + ",\\"newValue\\":" + nStr + "}");
    }

    public static void gridDpEnd(String structId, Object finalResult, int line) {
        String fStr = formatValue(finalResult);
        recordEvent("{\\"type\\":\\"GRID_DP_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + fStr + "}");
    }

    // --- Interval DP ---
    public static void intervalDpStart(String structId, int n, int line) {
        recordEvent("{\\"type\\":\\"INTERVAL_DP_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"size\\":" + n + "}");
    }

    public static void intervalLengthUpdate(String structId, int len, int line) {
        recordEvent("{\\"type\\":\\"INTERVAL_LENGTH_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"windowSize\\":" + len + "}");
    }

    public static void intervalSelect(String structId, int left, int right, int line) {
        recordEvent("{\\"type\\":\\"INTERVAL_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"leftIndex\\":" + left + ",\\"rightIndex\\":" + right + "}");
    }

    public static void intervalSplitSelect(String structId, int left, int right, int split, int line) {
        recordEvent("{\\"type\\":\\"INTERVAL_SPLIT_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"leftIndex\\":" + left + ",\\"rightIndex\\":" + right + ",\\"splitIndex\\":" + split + "}");
    }

    public static void intervalLeftDependency(String structId, int left, int split, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"INTERVAL_LEFT_DEPENDENCY\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"leftIndex\\":" + left + ",\\"splitIndex\\":" + split + ",\\"value\\":" + vStr + "}");
    }

    public static void intervalRightDependency(String structId, int splitPlus1, int right, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"INTERVAL_RIGHT_DEPENDENCY\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"splitIndex\\":" + splitPlus1 + ",\\"rightIndex\\":" + right + ",\\"value\\":" + vStr + "}");
    }

    public static void intervalCombine(String structId, int left, int right, int split, Object cost, int line) {
        String cStr = formatValue(cost);
        recordEvent("{\\"type\\":\\"INTERVAL_COMBINE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"leftIndex\\":" + left + ",\\"rightIndex\\":" + right + ",\\"splitIndex\\":" + split + ",\\"candidateValue\\":" + cStr + "}");
    }

    public static void intervalStateUpdate(String structId, int left, int right, Object oldVal, Object newVal, int line) {
        String oStr = formatValue(oldVal);
        String nStr = formatValue(newVal);
        recordEvent("{\\"type\\":\\"INTERVAL_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"leftIndex\\":" + left + ",\\"rightIndex\\":" + right + ",\\"oldValue\\":" + oStr + ",\\"newValue\\":" + nStr + "}");
    }

    public static void intervalDpEnd(String structId, Object result, int line) {
        String rStr = formatValue(result);
        recordEvent("{\\"type\\":\\"INTERVAL_DP_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + rStr + "}");
    }

    // --- Tree DP ---
    public static void treeDpStart(String treeId, String rootId, int line) {
        recordEvent("{\\"type\\":\\"TREE_DP_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + rootId + "\\"}");
    }

    public static void treeDpNodeEnter(String treeId, String nodeId, int line) {
        recordEvent("{\\"type\\":\\"TREE_DP_NODE_ENTER\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + nodeId + "\\"}");
    }

    public static void treeDpChildProcess(String treeId, String parentNodeId, String childNodeId, int line) {
        recordEvent("{\\"type\\":\\"TREE_DP_CHILD_PROCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"parentNodeId\\":\\"" + parentNodeId + "\\",\\"childNodeId\\":\\"" + childNodeId + "\\"}");
    }

    public static void treeDpStateAccess(String treeId, String nodeId, Object stateVal, int line) {
        String sStr = formatValue(stateVal);
        recordEvent("{\\"type\\":\\"TREE_DP_STATE_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"value\\":" + sStr + "}");
    }

    public static void treeDpTransition(String treeId, String nodeId, String formula, Object stateVal, int line) {
        String sStr = formatValue(stateVal);
        String cleanF = formula.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
        recordEvent("{\\"type\\":\\"TREE_DP_TRANSITION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"transitionFormula\\":\\"" + cleanF + "\\",\\"value\\":" + sStr + "}");
    }

    public static void treeDpStateUpdate(String treeId, String nodeId, Object oldVal, Object newVal, int line) {
        String oStr = formatValue(oldVal);
        String nStr = formatValue(newVal);
        recordEvent("{\\"type\\":\\"TREE_DP_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"oldValue\\":" + oStr + ",\\"newValue\\":" + nStr + "}");
    }

    public static void treeDpNodeComplete(String treeId, String nodeId, Object finalVal, int line) {
        String fStr = formatValue(finalVal);
        recordEvent("{\\"type\\":\\"TREE_DP_NODE_COMPLETE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"value\\":" + fStr + "}");
    }

    public static void treeDpReturn(String treeId, String nodeId, Object returnVal, int line) {
        String rStr = formatValue(returnVal);
        recordEvent("{\\"type\\":\\"TREE_DP_RETURN\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"nodeId\\":\\"" + nodeId + "\\",\\"returnValue\\":" + rStr + "}");
    }

    public static void treeDpEnd(String treeId, Object finalResult, int line) {
        String fStr = formatValue(finalResult);
        recordEvent("{\\"type\\":\\"TREE_DP_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + treeId + "\\",\\"value\\":" + fStr + "}");
    }

    // --- Bitmask DP ---
    public static void bitmaskDpStart(String structId, int numItems, int line) {
        recordEvent("{\\"type\\":\\"BITMASK_DP_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"size\\":" + numItems + "}");
    }

    public static void bitmaskCreate(String structId, int mask, int line) {
        recordEvent("{\\"type\\":\\"BITMASK_CREATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"mask\\":" + mask + "}");
    }

    public static void bitmaskBitCheck(String structId, int mask, int bitIdx, boolean isSet, int line) {
        recordEvent("{\\"type\\":\\"BITMASK_BIT_CHECK\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"mask\\":" + mask + ",\\"bitIndex\\":" + bitIdx + ",\\"bitSet\\":" + isSet + "}");
    }

    public static void bitmaskBitSet(String structId, int oldMask, int bitIdx, int newMask, int line) {
        recordEvent("{\\"type\\":\\"BITMASK_BIT_SET\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"mask\\":" + oldMask + ",\\"bitIndex\\":" + bitIdx + ",\\"value\\":" + newMask + "}");
    }

    public static void bitmaskBitClear(String structId, int oldMask, int bitIdx, int newMask, int line) {
        recordEvent("{\\"type\\":\\"BITMASK_BIT_CLEAR\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"mask\\":" + oldMask + ",\\"bitIndex\\":" + bitIdx + ",\\"value\\":" + newMask + "}");
    }

    public static void bitmaskStateAccess(String structId, int mask, int idx, Object val, int line) {
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"BITMASK_STATE_ACCESS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"mask\\":" + mask + ",\\"index\\":" + idx + ",\\"value\\":" + vStr + "}");
    }

    public static void bitmaskTransition(String structId, int mask, int nextMask, Object candVal, int line) {
        String cStr = formatValue(candVal);
        recordEvent("{\\"type\\":\\"BITMASK_TRANSITION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"mask\\":" + mask + ",\\"value\\":" + nextMask + ",\\"candidateValue\\":" + cStr + "}");
    }

    public static void bitmaskStateUpdate(String structId, int mask, int idx, Object oldVal, Object newVal, int line) {
        String oStr = formatValue(oldVal);
        String nStr = formatValue(newVal);
        recordEvent("{\\"type\\":\\"BITMASK_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"mask\\":" + mask + ",\\"index\\":" + idx + ",\\"oldValue\\":" + oStr + ",\\"newValue\\":" + nStr + "}");
    }

    public static void bitmaskDpEnd(String structId, Object result, int line) {
        String rStr = formatValue(result);
        recordEvent("{\\"type\\":\\"BITMASK_DP_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + rStr + "}");
    }

    // --- Digit DP ---
    public static void digitDpStart(String structId, int numDigits, int line) {
        recordEvent("{\\"type\\":\\"DIGIT_DP_START\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"size\\":" + numDigits + "}");
    }

    public static void digitPosition(String structId, int pos, boolean tight, boolean started, int sum, int line) {
        recordEvent("{\\"type\\":\\"DIGIT_POSITION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"position\\":" + pos + ",\\"tight\\":" + tight + ",\\"started\\":" + started + ",\\"sum\\":" + sum + "}");
    }

    public static void digitOptionSelect(String structId, int pos, int digit, int line) {
        recordEvent("{\\"type\\":\\"DIGIT_OPTION_SELECT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"position\\":" + pos + ",\\"digit\\":" + digit + "}");
    }

    public static void digitTightUpdate(String structId, int pos, boolean oldTight, boolean newTight, int line) {
        recordEvent("{\\"type\\":\\"DIGIT_TIGHT_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"position\\":" + pos + ",\\"conditionResult\\":" + newTight + "}");
    }

    public static void digitStartedUpdate(String structId, int pos, boolean started, int line) {
        recordEvent("{\\"type\\":\\"DIGIT_STARTED_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"position\\":" + pos + ",\\"started\\":" + started + "}");
    }

    public static void digitCacheLookup(String structId, int pos, boolean tight, int sum, int line) {
        recordEvent("{\\"type\\":\\"DIGIT_CACHE_LOOKUP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"position\\":" + pos + ",\\"tight\\":" + tight + ",\\"sum\\":" + sum + "}");
    }

    public static void digitCacheHit(String structId, int pos, boolean tight, int sum, Object cachedVal, int line) {
        String cStr = formatValue(cachedVal);
        recordEvent("{\\"type\\":\\"DIGIT_CACHE_HIT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"position\\":" + pos + ",\\"tight\\":" + tight + ",\\"sum\\":" + sum + ",\\"value\\":" + cStr + "}");
    }

    public static void digitCacheMiss(String structId, int pos, boolean tight, int sum, int line) {
        recordEvent("{\\"type\\":\\"DIGIT_CACHE_MISS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"position\\":" + pos + ",\\"tight\\":" + tight + ",\\"sum\\":" + sum + "}");
    }

    public static void digitStateTransition(String structId, int pos, int digit, int newSum, int line) {
        recordEvent("{\\"type\\":\\"DIGIT_STATE_TRANSITION\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"position\\":" + pos + ",\\"digit\\":" + digit + ",\\"sum\\":" + newSum + "}");
    }

    public static void digitStateUpdate(String structId, int pos, boolean tight, int sum, Object newVal, int line) {
        String nStr = formatValue(newVal);
        recordEvent("{\\"type\\":\\"DIGIT_STATE_UPDATE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"position\\":" + pos + ",\\"tight\\":" + tight + ",\\"sum\\":" + sum + ",\\"newValue\\":" + nStr + "}");
    }

    public static void digitDpEnd(String structId, Object finalResult, int line) {
        String fStr = formatValue(finalResult);
        recordEvent("{\\"type\\":\\"DIGIT_DP_END\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + structId + "\\",\\"value\\":" + fStr + "}");
    }

    // --- Memoization ---
    public static void memoLookup(String cacheId, Object key, int line) {
        String kStr = formatValue(key);
        recordEvent("{\\"type\\":\\"MEMO_LOOKUP\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + cacheId + "\\",\\"key\\":" + kStr + "}");
    }

    public static void memoHit(String cacheId, Object key, Object val, int line) {
        String kStr = formatValue(key);
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"MEMO_HIT\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + cacheId + "\\",\\"key\\":" + kStr + ",\\"value\\":" + vStr + "}");
    }

    public static void memoMiss(String cacheId, Object key, int line) {
        String kStr = formatValue(key);
        recordEvent("{\\"type\\":\\"MEMO_MISS\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + cacheId + "\\",\\"key\\":" + kStr + "}");
    }

    public static void memoCompute(String cacheId, Object key, int line) {
        String kStr = formatValue(key);
        recordEvent("{\\"type\\":\\"MEMO_COMPUTE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + cacheId + "\\",\\"key\\":" + kStr + "}");
    }

    public static void memoStore(String cacheId, Object key, Object val, int line) {
        String kStr = formatValue(key);
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"MEMO_STORE\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + cacheId + "\\",\\"key\\":" + kStr + ",\\"value\\":" + vStr + "}");
    }

    public static void memoReturn(String cacheId, Object key, Object val, int line) {
        String kStr = formatValue(key);
        String vStr = formatValue(val);
        recordEvent("{\\"type\\":\\"MEMO_RETURN\\",\\"step\\":" + (++stepCounter) + ",\\"line\\":" + line + ",\\"structureId\\":\\"" + cacheId + "\\",\\"key\\":" + kStr + ",\\"value\\":" + vStr + "}");
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
        if (System.out != null) {
            System.out.flush();
        }
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

    private static String formatDouble(double d) {
        if (Double.isInfinite(d)) return "\\"Infinity\\"";
        if (Double.isNaN(d)) return "\\"NaN\\"";
        return String.valueOf(d);
    }

    private static String formatValue(Object val) {
        if (val == null) return "null";
        if (val instanceof Double) {
            Double d = (Double) val;
            if (d.isInfinite()) return "\\"Infinity\\"";
            if (d.isNaN()) return "\\"NaN\\"";
            return String.valueOf(d);
        }
        if (val instanceof Float) {
            Float f = (Float) val;
            if (f.isInfinite()) return "\\"Infinity\\"";
            if (f.isNaN()) return "\\"NaN\\"";
            return String.valueOf(f);
        }
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
