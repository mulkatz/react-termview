import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Terminal } from "../terminal";

describe("Terminal component", () => {
	it("renders with default props", () => {
		render(<Terminal />);
		expect(screen.getByRole("log")).toBeDefined();
		expect(screen.getByLabelText("Terminal input")).toBeDefined();
	});

	it("renders title bar with title", () => {
		render(<Terminal title="My Terminal" />);
		expect(screen.getByText("My Terminal")).toBeDefined();
	});

	it("hides title bar when showTitleBar is false", () => {
		render(<Terminal showTitleBar={false} />);
		expect(screen.queryByText("Terminal")).toBeNull();
	});

	it("renders initial lines", () => {
		const lines = [
			{
				id: "1",
				content: "Welcome",
				type: "system" as const,
				timestamp: Date.now(),
			},
		];
		render(<Terminal initialLines={lines} />);
		expect(screen.getByText("Welcome")).toBeDefined();
	});

	it("applies dark theme by default", () => {
		render(<Terminal />);
		const terminal = screen.getByRole("log");
		expect(terminal.className).toContain("rt-terminal--dark");
	});

	it("applies light theme", () => {
		render(<Terminal theme="light" />);
		const terminal = screen.getByRole("log");
		expect(terminal.className).toContain("rt-terminal--light");
	});

	it("renders custom title bar", () => {
		render(<Terminal titleBar={<div>Custom Title</div>} />);
		expect(screen.getByText("Custom Title")).toBeDefined();
	});

	it("applies custom className", () => {
		render(<Terminal className="my-term" />);
		const terminal = screen.getByRole("log");
		expect(terminal.className).toContain("my-term");
	});

	it("renders prompt", () => {
		render(<Terminal prompt="> " />);
		expect(screen.getByText(">")).toBeDefined();
	});

	it("renders ANSI colored text in lines", () => {
		const lines = [
			{
				id: "1",
				content: "\x1b[31mred text\x1b[0m",
				type: "output" as const,
				timestamp: Date.now(),
			},
		];
		render(<Terminal initialLines={lines} />);
		const redSpan = screen.getByText("red text");
		expect(redSpan.style.color).toBeTruthy();
	});
});
