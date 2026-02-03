import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatTable, formatJson, output } from "../../src/output.js";

describe("output", () => {
  describe("formatTable", () => {
    it("returns message when data is empty", () => {
      const result = formatTable([], [{ key: "id", header: "ID" }]);
      expect(result).toBe("No results found.");
    });

    it("formats single column table", () => {
      const data = [{ id: "1" }, { id: "2" }];
      const columns = [{ key: "id", header: "ID" }];

      const result = formatTable(data, columns);
      const lines = result.split("\n");

      expect(lines[0]).toBe("ID");
      expect(lines[1]).toBe("--");
      expect(lines[2]).toBe("1 ");
      expect(lines[3]).toBe("2 ");
    });

    it("formats multiple columns with proper alignment", () => {
      const data = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ];
      const columns = [
        { key: "id", header: "ID" },
        { key: "name", header: "NAME" },
      ];

      const result = formatTable(data, columns);
      const lines = result.split("\n");

      expect(lines[0]).toBe("ID  NAME ");
      expect(lines[1]).toBe("--  -----");
      expect(lines[2]).toBe("1   Alice");
      expect(lines[3]).toBe("2   Bob  ");
    });

    it("handles missing values", () => {
      const data = [{ id: "1" }, { id: "2", name: "Bob" }];
      const columns = [
        { key: "id", header: "ID" },
        { key: "name", header: "NAME" },
      ];

      const result = formatTable(data, columns);
      const lines = result.split("\n");

      expect(lines[2]).toContain("1 ");
      expect(lines[3]).toContain("Bob");
    });

    it("respects custom column widths", () => {
      const data = [{ id: "1" }];
      const columns = [{ key: "id", header: "ID", width: 10 }];

      const result = formatTable(data, columns);
      const lines = result.split("\n");

      expect(lines[0]).toBe("ID        ");
      expect(lines[1]).toBe("----------");
    });

    it("expands columns for long values", () => {
      const data = [{ id: "very-long-id-value" }];
      const columns = [{ key: "id", header: "ID" }];

      const result = formatTable(data, columns);
      const lines = result.split("\n");

      expect(lines[0].length).toBe("very-long-id-value".length);
    });
  });

  describe("formatJson", () => {
    it("formats object as indented JSON", () => {
      const data = { id: "1", name: "test" };
      const result = formatJson(data);

      expect(result).toBe(JSON.stringify(data, null, 2));
    });

    it("formats array as indented JSON", () => {
      const data = [{ id: "1" }, { id: "2" }];
      const result = formatJson(data);

      expect(result).toBe(JSON.stringify(data, null, 2));
    });

    it("handles null", () => {
      const result = formatJson(null);
      expect(result).toBe("null");
    });

    it("handles primitives", () => {
      expect(formatJson("string")).toBe('"string"');
      expect(formatJson(123)).toBe("123");
      expect(formatJson(true)).toBe("true");
    });
  });

  describe("output", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("outputs JSON when json option is true", () => {
      const data = { id: "1" };
      output(data, { json: true });

      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });

    it("outputs table for array of objects", () => {
      const data = [{ id: "1", name: "test" }];
      output(data, { json: false });

      expect(consoleSpy).toHaveBeenCalled();
      const outputStr = consoleSpy.mock.calls[0][0];
      expect(outputStr).toContain("ID");
      expect(outputStr).toContain("NAME");
    });

    it("outputs key-value pairs for single object", () => {
      const data = { id: "1", name: "test" };
      output(data, { json: false });

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy.mock.calls[0][0]).toContain("id");
      expect(consoleSpy.mock.calls[0][0]).toContain("1");
      expect(consoleSpy.mock.calls[1][0]).toContain("name");
      expect(consoleSpy.mock.calls[1][0]).toContain("test");
    });

    it("outputs array items on separate lines for non-object arrays", () => {
      const data = ["item1", "item2"];
      output(data, { json: false });

      expect(consoleSpy).toHaveBeenCalledWith("item1\nitem2");
    });

    it("outputs primitive values directly", () => {
      output("test string", { json: false });
      expect(consoleSpy).toHaveBeenCalledWith("test string");

      consoleSpy.mockClear();
      output(123, { json: false });
      expect(consoleSpy).toHaveBeenCalledWith(123);
    });
  });
});
