import { type CSSProperties, useEffect, useRef } from "react";
import { parseAnsi } from "./ansi";
import type { AnsiStyle, TerminalProps } from "./types";
import { useTerminal } from "./use-terminal";

function ansiStyleToCSS(style: AnsiStyle): CSSProperties {
	const css: CSSProperties = {};
	if (style.color) css.color = style.color;
	if (style.bgColor) css.backgroundColor = style.bgColor;
	if (style.bold) css.fontWeight = "bold";
	if (style.dim) css.opacity = 0.6;
	if (style.italic) css.fontStyle = "italic";
	if (style.underline) css.textDecoration = "underline";
	if (style.strikethrough)
		css.textDecoration = css.textDecoration
			? `${css.textDecoration} line-through`
			: "line-through";
	return css;
}

function AnsiText({ text }: { text: string }) {
	const segments = parseAnsi(text);
	const firstSegment = segments[0];
	if (
		segments.length === 1 &&
		firstSegment &&
		Object.keys(firstSegment.style).length === 0
	) {
		return <>{text}</>;
	}
	return (
		<>
			{segments.map((seg, i) => {
				const css = ansiStyleToCSS(seg.style);
				return Object.keys(css).length > 0 ? (
					<span key={i} style={css}>
						{seg.text}
					</span>
				) : (
					<span key={i}>{seg.text}</span>
				);
			})}
		</>
	);
}

export function Terminal(props: TerminalProps) {
	const {
		commands,
		onUnknownCommand,
		initialLines,
		prompt = "$ ",
		maxLines,
		maxHistory,
		editable,
		onLine,
		terminal: externalTerminal,
		className = "",
		style,
		theme = "dark",
		titleBar,
		showTitleBar = true,
		title = "Terminal",
	} = props;

	const internalTerminal = useTerminal({
		commands,
		onUnknownCommand,
		initialLines,
		prompt,
		maxLines,
		maxHistory,
		editable,
		onLine,
	});

	const terminal = externalTerminal ?? internalTerminal;
	const scrollRef = useRef<HTMLDivElement>(null);

	const lineCount = terminal.lines.length;
	useEffect(() => {
		const el = scrollRef.current;
		if (el && lineCount > 0) {
			el.scrollTop = el.scrollHeight;
		}
	}, [lineCount]);

	const themeClass =
		theme === "light" ? "rt-terminal--light" : "rt-terminal--dark";

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: click focuses input, keyboard handled by input element
		<div
			className={`rt-terminal ${themeClass} ${className}`}
			style={style}
			onClick={() => terminal.inputRef.current?.focus()}
			role="log"
			aria-label="Terminal"
			aria-live="polite"
		>
			{showTitleBar && (
				<div className="rt-titlebar">
					{titleBar ?? (
						<>
							<div className="rt-titlebar__dots">
								<span className="rt-dot rt-dot--red" />
								<span className="rt-dot rt-dot--yellow" />
								<span className="rt-dot rt-dot--green" />
							</div>
							<span className="rt-titlebar__title">{title}</span>
							<div className="rt-titlebar__spacer" />
						</>
					)}
				</div>
			)}

			<div className="rt-body" ref={scrollRef}>
				{terminal.lines.map((line) => (
					<div key={line.id} className={`rt-line rt-line--${line.type}`}>
						<AnsiText text={line.content} />
					</div>
				))}

				{(editable ?? true) && (
					<div className="rt-input-line">
						<span className="rt-prompt">{prompt}</span>
						<div className="rt-input-wrapper">
							<input
								ref={terminal.inputRef}
								className="rt-input"
								type="text"
								value={terminal.input}
								onChange={(e) => terminal.setInput(e.target.value)}
								onKeyDown={terminal.handleKeyDown}
								spellCheck={false}
								autoComplete="off"
								autoCapitalize="off"
								aria-label="Terminal input"
							/>
							{terminal.suggestions.length > 0 && (
								<ul className="rt-suggestions">
									{terminal.suggestions.map((s, i) => (
										<li
											key={s}
											className={`rt-suggestion ${i === terminal.activeSuggestion ? "rt-suggestion--active" : ""}`}
											aria-selected={i === terminal.activeSuggestion}
										>
											{s}
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				)}
			</div>

			{terminal.isStreaming && (
				<div className="rt-streaming" aria-live="assertive">
					<span className="rt-streaming__dot" />
				</div>
			)}
		</div>
	);
}
