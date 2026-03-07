import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTerminal } from "../use-terminal";

describe("useTerminal", () => {
	it("initializes with empty state", () => {
		const { result } = renderHook(() => useTerminal());
		expect(result.current.lines).toEqual([]);
		expect(result.current.input).toBe("");
		expect(result.current.isStreaming).toBe(false);
		expect(result.current.suggestions).toEqual([]);
	});

	it("initializes with provided lines", () => {
		const initialLines = [
			{
				id: "1",
				content: "Welcome",
				type: "system" as const,
				timestamp: Date.now(),
			},
		];
		const { result } = renderHook(() => useTerminal({ initialLines }));
		expect(result.current.lines).toEqual(initialLines);
	});

	it("updates input value", () => {
		const { result } = renderHook(() => useTerminal());
		act(() => {
			result.current.setInput("hello");
		});
		expect(result.current.input).toBe("hello");
	});

	it("executes registered commands", async () => {
		const handler = vi.fn().mockReturnValue("output");
		const { result } = renderHook(() =>
			useTerminal({ commands: { echo: handler } }),
		);

		act(() => {
			result.current.setInput("echo test");
		});

		await act(async () => {
			result.current.handleKeyDown({
				key: "Enter",
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});

		expect(handler).toHaveBeenCalledWith(
			["test"],
			expect.objectContaining({ write: expect.any(Function) }),
		);
		// Input line + output line
		expect(result.current.lines).toHaveLength(2);
		expect(result.current.lines[1]?.content).toBe("output");
	});

	it("shows error for unknown commands", async () => {
		const { result } = renderHook(() => useTerminal());

		act(() => {
			result.current.setInput("nonexistent");
		});

		await act(async () => {
			result.current.handleKeyDown({
				key: "Enter",
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});

		expect(result.current.lines[1]?.type).toBe("error");
		expect(result.current.lines[1]?.content).toContain("nonexistent");
	});

	it("calls onUnknownCommand when provided", async () => {
		const handler = vi.fn().mockReturnValue("handled");
		const { result } = renderHook(() =>
			useTerminal({ onUnknownCommand: handler }),
		);

		act(() => {
			result.current.setInput("anything arg1");
		});

		await act(async () => {
			result.current.handleKeyDown({
				key: "Enter",
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});

		expect(handler).toHaveBeenCalled();
		expect(result.current.lines[1]?.content).toBe("handled");
	});

	it("navigates command history with arrow keys", async () => {
		const { result } = renderHook(() =>
			useTerminal({ commands: { test: () => {} } }),
		);

		// Execute two commands
		act(() => result.current.setInput("test first"));
		await act(async () => {
			result.current.handleKeyDown({
				key: "Enter",
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});

		act(() => result.current.setInput("test second"));
		await act(async () => {
			result.current.handleKeyDown({
				key: "Enter",
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});

		// Press ArrowUp to get last command
		act(() => {
			result.current.handleKeyDown({
				key: "ArrowUp",
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});
		expect(result.current.input).toBe("test second");

		// Press ArrowUp again
		act(() => {
			result.current.handleKeyDown({
				key: "ArrowUp",
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});
		expect(result.current.input).toBe("test first");

		// Press ArrowDown
		act(() => {
			result.current.handleKeyDown({
				key: "ArrowDown",
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});
		expect(result.current.input).toBe("test second");
	});

	it("provides tab completion suggestions", () => {
		const { result } = renderHook(() =>
			useTerminal({
				commands: { help: () => {}, history: () => {}, clear: () => {} },
			}),
		);

		act(() => result.current.setInput("h"));
		act(() => {
			result.current.handleKeyDown({
				key: "Tab",
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});

		expect(result.current.suggestions).toEqual(["help", "history"]);
	});

	it("auto-completes single match on tab", () => {
		const { result } = renderHook(() =>
			useTerminal({
				commands: { help: () => {}, clear: () => {} },
			}),
		);

		act(() => result.current.setInput("c"));
		act(() => {
			result.current.handleKeyDown({
				key: "Tab",
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});

		expect(result.current.input).toBe("clear ");
		expect(result.current.suggestions).toEqual([]);
	});

	it("clears terminal with controls.clear()", () => {
		const { result } = renderHook(() =>
			useTerminal({
				initialLines: [
					{
						id: "1",
						content: "test",
						type: "output",
						timestamp: Date.now(),
					},
				],
			}),
		);

		expect(result.current.lines).toHaveLength(1);
		act(() => result.current.controls.clear());
		expect(result.current.lines).toEqual([]);
	});

	it("writes output with controls.writeln()", () => {
		const { result } = renderHook(() => useTerminal());

		act(() => result.current.controls.writeln("hello"));
		expect(result.current.lines).toHaveLength(1);
		expect(result.current.lines[0]?.content).toBe("hello");
	});

	it("respects maxLines limit", () => {
		const { result } = renderHook(() => useTerminal({ maxLines: 3 }));

		act(() => {
			for (let i = 0; i < 5; i++) {
				result.current.controls.writeln(`line ${i}`);
			}
		});

		expect(result.current.lines).toHaveLength(3);
		expect(result.current.lines[0]?.content).toBe("line 2");
	});

	it("calls onLine callback", () => {
		const onLine = vi.fn();
		const { result } = renderHook(() => useTerminal({ onLine }));

		act(() => result.current.controls.writeln("test"));
		expect(onLine).toHaveBeenCalledWith(
			expect.objectContaining({ content: "test", type: "output" }),
		);
	});

	it("handles Ctrl+L to clear", () => {
		const { result } = renderHook(() =>
			useTerminal({
				initialLines: [
					{
						id: "1",
						content: "test",
						type: "output",
						timestamp: Date.now(),
					},
				],
			}),
		);

		act(() => {
			result.current.handleKeyDown({
				key: "l",
				ctrlKey: true,
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});

		expect(result.current.lines).toEqual([]);
	});

	it("handles Ctrl+C to cancel", () => {
		const { result } = renderHook(() => useTerminal());

		act(() => result.current.setInput("long command"));
		act(() => {
			result.current.handleKeyDown({
				key: "c",
				ctrlKey: true,
				preventDefault: vi.fn(),
			} as unknown as React.KeyboardEvent<HTMLInputElement>);
		});

		expect(result.current.input).toBe("");
		expect(result.current.lines[0]?.content).toContain("^C");
	});
});
