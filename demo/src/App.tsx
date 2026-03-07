import { useState } from "react";
import {
	Terminal,
	useTerminal,
	type CommandHandler,
	type TerminalLine,
} from "react-terminal";

const WELCOME_LINES: TerminalLine[] = [
	{
		id: "w1",
		content: "\x1b[1;36mreact-terminal\x1b[0m v1.0.0",
		type: "system",
		timestamp: Date.now(),
	},
	{
		id: "w2",
		content: "Type \x1b[33mhelp\x1b[0m to see available commands.",
		type: "system",
		timestamp: Date.now(),
	},
];

function BasicDemo() {
	const commands: Record<string, CommandHandler> = {
		help: () =>
			[
				"\x1b[1mAvailable commands:\x1b[0m",
				"  \x1b[33mhelp\x1b[0m      Show this message",
				"  \x1b[33mecho\x1b[0m      Echo arguments back",
				"  \x1b[33mdate\x1b[0m      Show current date",
				"  \x1b[33mclear\x1b[0m     Clear the terminal",
				"  \x1b[33mcolors\x1b[0m    Show ANSI color demo",
				"  \x1b[33mfetch\x1b[0m     Simulate an API call",
			].join("\n"),
		echo: (args) => args.join(" "),
		date: () => `\x1b[32m${new Date().toLocaleString()}\x1b[0m`,
		clear: (_args, terminal) => {
			terminal.clear();
		},
		colors: () =>
			[
				"\x1b[1mANSI Color Support:\x1b[0m",
				"",
				"\x1b[31mRed\x1b[0m \x1b[32mGreen\x1b[0m \x1b[33mYellow\x1b[0m \x1b[34mBlue\x1b[0m \x1b[35mMagenta\x1b[0m \x1b[36mCyan\x1b[0m",
				"\x1b[91mBright Red\x1b[0m \x1b[92mBright Green\x1b[0m \x1b[93mBright Yellow\x1b[0m",
				"",
				"\x1b[1mBold\x1b[0m \x1b[2mDim\x1b[0m \x1b[3mItalic\x1b[0m \x1b[4mUnderline\x1b[0m \x1b[9mStrikethrough\x1b[0m",
				"",
				"\x1b[41m Red BG \x1b[0m \x1b[42m Green BG \x1b[0m \x1b[44m Blue BG \x1b[0m",
				"\x1b[38;2;255;165;0mRGB Orange\x1b[0m \x1b[38;5;200m256-Color Pink\x1b[0m",
			].join("\n"),
		fetch: async (_args, terminal) => {
			terminal.writeln("\x1b[2mFetching data...\x1b[0m");
			await new Promise((r) => setTimeout(r, 1500));
			terminal.writeln(
				"\x1b[32m✓\x1b[0m Response: \x1b[1m{ status: 200, data: \"Hello!\" }\x1b[0m",
			);
		},
	};

	return (
		<Terminal
			commands={commands}
			initialLines={WELCOME_LINES}
			title="react-terminal"
			style={{ height: 380 }}
		/>
	);
}

function HeadlessDemo() {
	const terminal = useTerminal({
		commands: {
			ping: () => "\x1b[32mpong!\x1b[0m",
			add: (args) => {
				const nums = args.map(Number).filter((n) => !Number.isNaN(n));
				if (nums.length < 2) return "\x1b[31mUsage: add <n1> <n2>\x1b[0m";
				return `\x1b[1m${nums.reduce((a, b) => a + b, 0)}\x1b[0m`;
			},
			hello: (args) =>
				`\x1b[36mHello, ${args[0] || "world"}!\x1b[0m`,
		},
		prompt: "> ",
	});

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => terminal.controls.writeln("\x1b[33m[log]\x1b[0m External output injected")}
					className="px-3 py-1.5 text-sm bg-neutral-800 text-neutral-200 rounded hover:bg-neutral-700 transition-colors"
				>
					Inject Output
				</button>
				<button
					type="button"
					onClick={() => terminal.controls.clear()}
					className="px-3 py-1.5 text-sm bg-neutral-800 text-neutral-200 rounded hover:bg-neutral-700 transition-colors"
				>
					Clear
				</button>
				<button
					type="button"
					onClick={() => terminal.controls.focus()}
					className="px-3 py-1.5 text-sm bg-neutral-800 text-neutral-200 rounded hover:bg-neutral-700 transition-colors"
				>
					Focus
				</button>
			</div>
			<Terminal
				terminal={terminal}
				title="Headless Mode"
				style={{ height: 250 }}
			/>
		</div>
	);
}

function StreamingDemo() {
	const commands: Record<string, CommandHandler> = {
		stream: async (_args, terminal) => {
			const lines = [
				"\x1b[2m[1/4]\x1b[0m Analyzing codebase...",
				"\x1b[2m[2/4]\x1b[0m Generating response...",
				"\x1b[2m[3/4]\x1b[0m Applying optimizations...",
				"\x1b[2m[4/4]\x1b[0m \x1b[32mComplete!\x1b[0m",
			];
			for (const line of lines) {
				terminal.writeln(line);
				await new Promise((r) => setTimeout(r, 800));
			}
			terminal.writeln("");
			terminal.writeln(
				"\x1b[1;32m✓\x1b[0m Task completed successfully",
			);
		},
		typewriter: async (_args, terminal) => {
			const text = "The quick brown fox jumps over the lazy dog.";
			for (const char of text) {
				terminal.write(char);
				await new Promise((r) => setTimeout(r, 40));
			}
			terminal.writeln("");
		},
	};

	return (
		<Terminal
			commands={commands}
			initialLines={[
				{
					id: "s1",
					content:
						'Try \x1b[33mstream\x1b[0m or \x1b[33mtypewriter\x1b[0m',
					type: "system",
					timestamp: Date.now(),
				},
			]}
			title="Streaming / AI Mode"
			style={{ height: 300 }}
		/>
	);
}

function ThemedDemo() {
	const [theme, setTheme] = useState<"dark" | "light">("light");

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => setTheme("dark")}
					className={`px-3 py-1.5 text-sm rounded transition-colors ${
						theme === "dark"
							? "bg-neutral-200 text-neutral-900"
							: "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
					}`}
				>
					Dark
				</button>
				<button
					type="button"
					onClick={() => setTheme("light")}
					className={`px-3 py-1.5 text-sm rounded transition-colors ${
						theme === "light"
							? "bg-neutral-200 text-neutral-900"
							: "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
					}`}
				>
					Light
				</button>
			</div>
			<Terminal
				theme={theme}
				commands={{
					hello: () => "\x1b[36mHello from the themed terminal!\x1b[0m",
				}}
				initialLines={[
					{
						id: "t1",
						content: `Currently using \x1b[1m${theme}\x1b[0m theme`,
						type: "system",
						timestamp: Date.now(),
					},
				]}
				title={`${theme.charAt(0).toUpperCase()}${theme.slice(1)} Theme`}
				style={{ height: 200 }}
			/>
		</div>
	);
}

export function App() {
	return (
		<div className="min-h-screen bg-neutral-950 text-neutral-100">
			<header className="max-w-3xl mx-auto px-6 pt-20 pb-12">
				<h1 className="text-4xl font-bold tracking-tight">
					react-terminal
				</h1>
				<p className="mt-3 text-lg text-neutral-400 max-w-xl">
					Lightweight terminal UI for React with streaming output,
					ANSI colors, command history, and AI/LLM mode.
					Headless hook + styled component.
				</p>
				<div className="mt-6 flex gap-4 text-sm">
					<a
						href="https://github.com/mulkatz/react-terminal"
						className="text-neutral-400 hover:text-neutral-200 transition-colors"
					>
						GitHub
					</a>
					<a
						href="https://www.npmjs.com/package/react-terminal"
						className="text-neutral-400 hover:text-neutral-200 transition-colors"
					>
						npm
					</a>
				</div>
			</header>

			<main className="max-w-3xl mx-auto px-6 space-y-16 pb-24">
				<section>
					<h2 className="text-xl font-semibold mb-2">Interactive Terminal</h2>
					<p className="text-sm text-neutral-500 mb-4">
						Built-in commands, ANSI colors, tab completion, and command history.
						Try <code className="text-neutral-300">help</code>,{" "}
						<code className="text-neutral-300">colors</code>, or{" "}
						<code className="text-neutral-300">fetch</code>.
					</p>
					<BasicDemo />
				</section>

				<section>
					<h2 className="text-xl font-semibold mb-2">Headless Mode</h2>
					<p className="text-sm text-neutral-500 mb-4">
						Use <code className="text-neutral-300">useTerminal()</code> hook
						for full control. Inject output, clear, and focus programmatically.
					</p>
					<HeadlessDemo />
				</section>

				<section>
					<h2 className="text-xl font-semibold mb-2">
						Streaming / AI Mode
					</h2>
					<p className="text-sm text-neutral-500 mb-4">
						Async command handlers with streaming output.
						Perfect for AI/LLM integrations.
					</p>
					<StreamingDemo />
				</section>

				<section>
					<h2 className="text-xl font-semibold mb-2">Theming</h2>
					<p className="text-sm text-neutral-500 mb-4">
						Switch between dark and light themes.
						Full CSS customization via class overrides.
					</p>
					<ThemedDemo />
				</section>
			</main>

			<footer className="text-center text-sm text-neutral-600 py-8">
				MIT License &middot; Franz Benthin
			</footer>
		</div>
	);
}
