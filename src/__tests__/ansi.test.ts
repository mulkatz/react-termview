import { describe, expect, it } from "vitest";
import { parseAnsi, stripAnsi } from "../ansi";

describe("parseAnsi", () => {
	it("returns plain text as single segment", () => {
		const result = parseAnsi("hello world");
		expect(result).toEqual([{ text: "hello world", style: {} }]);
	});

	it("parses basic foreground colors", () => {
		const result = parseAnsi("\x1b[31mred text\x1b[0m");
		expect(result).toHaveLength(1);
		expect(result[0]?.text).toBe("red text");
		expect(result[0]?.style.color).toBe("#e74c3c");
	});

	it("parses bold and italic", () => {
		const result = parseAnsi("\x1b[1;3mbold italic\x1b[0m");
		expect(result[0]?.style.bold).toBe(true);
		expect(result[0]?.style.italic).toBe(true);
	});

	it("parses background colors", () => {
		const result = parseAnsi("\x1b[44mblue bg\x1b[0m");
		expect(result[0]?.style.bgColor).toBe("#3498db");
	});

	it("parses 256-color foreground", () => {
		const result = parseAnsi("\x1b[38;5;196mred 256\x1b[0m");
		expect(result[0]?.style.color).toBeDefined();
	});

	it("parses RGB color", () => {
		const result = parseAnsi("\x1b[38;2;255;128;0morange\x1b[0m");
		expect(result[0]?.style.color).toBe("rgb(255,128,0)");
	});

	it("parses dim text", () => {
		const result = parseAnsi("\x1b[2mdim\x1b[0m");
		expect(result[0]?.style.dim).toBe(true);
	});

	it("parses underline and strikethrough", () => {
		const result = parseAnsi("\x1b[4;9mdecorated\x1b[0m");
		expect(result[0]?.style.underline).toBe(true);
		expect(result[0]?.style.strikethrough).toBe(true);
	});

	it("handles reset codes correctly", () => {
		const result = parseAnsi("\x1b[1mbold\x1b[22mnormal\x1b[0m");
		expect(result[0]?.style.bold).toBe(true);
		expect(result[1]?.style.bold).toBeUndefined();
	});

	it("parses bright colors", () => {
		const result = parseAnsi("\x1b[91mbright red\x1b[0m");
		expect(result[0]?.style.color).toBe("#ff6b6b");
	});

	it("handles multiple segments", () => {
		const result = parseAnsi("\x1b[31mred\x1b[0m normal \x1b[32mgreen\x1b[0m");
		expect(result).toHaveLength(3);
		expect(result[0]?.text).toBe("red");
		expect(result[0]?.style.color).toBe("#e74c3c");
		expect(result[1]?.text).toBe(" normal ");
		expect(result[1]?.style).toEqual({});
		expect(result[2]?.text).toBe("green");
		expect(result[2]?.style.color).toBe("#2ecc71");
	});

	it("handles empty string", () => {
		expect(parseAnsi("")).toEqual([]);
	});

	it("parses grayscale 256 colors", () => {
		const result = parseAnsi("\x1b[38;5;240mgray\x1b[0m");
		expect(result[0]?.style.color).toMatch(/^rgb\(/);
	});
});

describe("stripAnsi", () => {
	it("removes all ANSI codes", () => {
		expect(stripAnsi("\x1b[31mred\x1b[0m text")).toBe("red text");
	});

	it("returns plain text unchanged", () => {
		expect(stripAnsi("hello")).toBe("hello");
	});

	it("handles complex nested codes", () => {
		expect(stripAnsi("\x1b[1;31;44mbold red on blue\x1b[0m")).toBe(
			"bold red on blue",
		);
	});
});
