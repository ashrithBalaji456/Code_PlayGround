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
