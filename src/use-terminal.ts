import { useCallback, useMemo, useRef, useState } from "react";
import { stripAnsi } from "./ansi";
import type {
	CommandHandler,
	TerminalControls,
	TerminalLine,
	UseTerminalOptions,
	UseTerminalReturn,
} from "./types";

let lineCounter = 0;

function createLine(content: string, type: TerminalLine["type"]): TerminalLine {
	return {
		id: `line-${++lineCounter}-${Date.now()}`,
		content,
		type,
		timestamp: Date.now(),
	};
}

export function useTerminal(
	options: UseTerminalOptions = {},
): UseTerminalReturn {
	const {
		commands = {},
		onUnknownCommand,
		initialLines = [],
		prompt = "$ ",
		maxLines = 1000,
		maxHistory = 100,
		editable = true,
		onLine,
	} = options;

	const [lines, setLines] = useState<TerminalLine[]>(initialLines);
	const [input, setInput] = useState("");
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [activeSuggestion, setActiveSuggestion] = useState(0);
	const [isStreaming, setIsStreaming] = useState(false);

	const commandHistory = useRef<string[]>([]);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const streamAbort = useRef<AbortController | null>(null);
	const onLineRef = useRef(onLine);
	onLineRef.current = onLine;

	const addLine = useCallback(
		(content: string, type: TerminalLine["type"]) => {
			const line = createLine(content, type);
			setLines((prev) => {
				const next = [...prev, line];
				return next.length > maxLines ? next.slice(-maxLines) : next;
			});
			onLineRef.current?.(line);
		},
		[maxLines],
	);

	const controls: TerminalControls = useMemo(
		() => ({
			write(text: string) {
				setLines((prev) => {
					if (prev.length === 0) {
						const line = createLine(text, "output");
						onLineRef.current?.(line);
						return [line];
					}
					// biome-ignore lint/style/noNonNullAssertion: length checked above
					const last = prev[prev.length - 1]!;
					return [
						...prev.slice(0, -1),
						{ ...last, content: last.content + text },
					];
				});
			},
			writeln(text: string) {
				addLine(text, "output");
			},
			clear() {
				setLines([]);
			},
			focus() {
				inputRef.current?.focus();
			},
		}),
		[addLine],
	);

	const executeCommand = useCallback(
		async (rawInput: string) => {
			const trimmed = rawInput.trim();
			addLine(`${prompt}${trimmed}`, "input");

			if (!trimmed) return;

			commandHistory.current = [
				trimmed,
				...commandHistory.current.filter((c) => c !== trimmed),
			].slice(0, maxHistory);

			const parts = trimmed.split(/\s+/);
			// biome-ignore lint/style/noNonNullAssertion: split always returns at least one element
			const cmd = parts[0]!;
			const args = parts.slice(1);

			const handler: CommandHandler | undefined = commands[cmd];
			if (handler) {
				setIsStreaming(true);
				try {
					const result = await handler(args, controls);
					if (typeof result === "string") {
						addLine(result, "output");
					}
				} catch (err) {
					addLine(err instanceof Error ? err.message : String(err), "error");
				} finally {
					setIsStreaming(false);
				}
			} else if (onUnknownCommand) {
				setIsStreaming(true);
				try {
					const result = await onUnknownCommand(args, controls);
					if (typeof result === "string") {
						addLine(result, "output");
					}
				} catch (err) {
					addLine(err instanceof Error ? err.message : String(err), "error");
				} finally {
					setIsStreaming(false);
				}
			} else {
				addLine(`command not found: ${cmd}`, "error");
			}
		},
		[addLine, commands, controls, maxHistory, onUnknownCommand, prompt],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (!editable) return;

			if (e.key === "Enter") {
				e.preventDefault();
				if (suggestions.length > 0) {
					// biome-ignore lint/style/noNonNullAssertion: activeSuggestion is within bounds
					setInput(`${suggestions[activeSuggestion]!} `);
					setSuggestions([]);
					setActiveSuggestion(0);
					return;
				}
				const currentInput = input;
				setInput("");
				setHistoryIndex(-1);
				setSuggestions([]);
				executeCommand(currentInput);
				return;
			}

			if (e.key === "ArrowUp") {
				e.preventDefault();
				if (suggestions.length > 0) {
					setActiveSuggestion((prev) =>
						prev > 0 ? prev - 1 : suggestions.length - 1,
					);
					return;
				}
				const history = commandHistory.current;
				if (history.length === 0) return;
				const newIndex =
					historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
				setHistoryIndex(newIndex);
				setInput(history[newIndex] ?? "");
				return;
			}

			if (e.key === "ArrowDown") {
				e.preventDefault();
				if (suggestions.length > 0) {
					setActiveSuggestion((prev) =>
						prev < suggestions.length - 1 ? prev + 1 : 0,
					);
					return;
				}
				if (historyIndex <= 0) {
					setHistoryIndex(-1);
					setInput("");
					return;
				}
				const newIndex = historyIndex - 1;
				setHistoryIndex(newIndex);
				setInput(commandHistory.current[newIndex] ?? "");
				return;
			}

			if (e.key === "Tab") {
				e.preventDefault();
				const cmdNames = Object.keys(commands);
				if (!input) {
					setSuggestions(cmdNames);
					setActiveSuggestion(0);
					return;
				}
				const matches = cmdNames.filter((c) => c.startsWith(stripAnsi(input)));
				if (matches.length === 1) {
					// biome-ignore lint/style/noNonNullAssertion: length checked above
					setInput(`${matches[0]!} `);
					setSuggestions([]);
				} else if (matches.length > 1) {
					setSuggestions(matches);
					setActiveSuggestion(0);
				}
				return;
			}

			if (e.key === "Escape") {
				setSuggestions([]);
				setActiveSuggestion(0);
				return;
			}

			if (e.key === "c" && e.ctrlKey) {
				e.preventDefault();
				if (streamAbort.current) {
					streamAbort.current.abort();
					streamAbort.current = null;
				}
				addLine(`${prompt}${input}^C`, "input");
				setInput("");
				setIsStreaming(false);
				return;
			}

			if (e.key === "l" && e.ctrlKey) {
				e.preventDefault();
				controls.clear();
				return;
			}

			setSuggestions([]);
			setActiveSuggestion(0);
		},
		[
			activeSuggestion,
			addLine,
			commands,
			controls,
			editable,
			executeCommand,
			historyIndex,
			input,
			prompt,
			suggestions,
		],
	);

	return {
		lines,
		input,
		historyIndex,
		controls,
		setInput,
		handleKeyDown,
		suggestions,
		activeSuggestion,
		inputRef,
		isStreaming,
	};
}
