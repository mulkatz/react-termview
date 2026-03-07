import type { CSSProperties, ReactNode } from "react";

export interface TerminalLine {
	id: string;
	content: string;
	type: "input" | "output" | "error" | "system";
	timestamp: number;
}

export type CommandHandler = (
	args: string[],
	terminal: TerminalControls,
) => undefined | string | Promise<undefined | string>;

export interface TerminalControls {
	write: (text: string) => void;
	writeln: (text: string) => void;
	clear: () => void;
	focus: () => void;
}

export interface StreamOptions {
	/** Delay between characters in ms (default: 0 = instant) */
	charDelay?: number;
	/** Delay between lines in ms (default: 0 = instant) */
	lineDelay?: number;
}

export interface UseTerminalOptions {
	/** Map of command names to handlers */
	commands?: Record<string, CommandHandler>;
	/** Called when user enters an unregistered command */
	onUnknownCommand?: CommandHandler;
	/** Initial lines to display */
	initialLines?: TerminalLine[];
	/** Command prompt string (default: "$ ") */
	prompt?: string;
	/** Maximum number of lines to keep in history (default: 1000) */
	maxLines?: number;
	/** Maximum number of commands to keep in history (default: 100) */
	maxHistory?: number;
	/** Whether the terminal accepts input (default: true) */
	editable?: boolean;
	/** Called when a line is added */
	onLine?: (line: TerminalLine) => void;
}

export interface UseTerminalReturn {
	lines: TerminalLine[];
	input: string;
	historyIndex: number;
	controls: TerminalControls;
	setInput: (value: string) => void;
	handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	suggestions: string[];
	activeSuggestion: number;
	inputRef: React.RefObject<HTMLInputElement | null>;
	isStreaming: boolean;
}

export interface TerminalProps {
	/** Terminal hook options (used if no `terminal` prop is passed) */
	commands?: Record<string, CommandHandler>;
	onUnknownCommand?: CommandHandler;
	initialLines?: TerminalLine[];
	prompt?: string;
	maxLines?: number;
	maxHistory?: number;
	editable?: boolean;
	onLine?: (line: TerminalLine) => void;

	/** Or pass your own useTerminal return value */
	terminal?: UseTerminalReturn;

	/** Styling */
	className?: string;
	style?: CSSProperties;
	theme?: "dark" | "light";

	/** Custom title bar content */
	titleBar?: ReactNode;
	/** Show default title bar (default: true) */
	showTitleBar?: boolean;
	/** Title text */
	title?: string;
}

/** Parsed ANSI segment */
export interface AnsiSegment {
	text: string;
	style: AnsiStyle;
}

export interface AnsiStyle {
	color?: string;
	bgColor?: string;
	bold?: boolean;
	dim?: boolean;
	italic?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
}
