import type { AnsiSegment, AnsiStyle } from "./types";

const ANSI_REGEX = /\x1b\[([0-9;]*)m/g;

const COLORS_16: Record<number, string> = {
	30: "#1a1a2e",
	31: "#e74c3c",
	32: "#2ecc71",
	33: "#f1c40f",
	34: "#3498db",
	35: "#9b59b6",
	36: "#1abc9c",
	37: "#ecf0f1",
	90: "#636e72",
	91: "#ff6b6b",
	92: "#55efc4",
	93: "#ffeaa7",
	94: "#74b9ff",
	95: "#a29bfe",
	96: "#81ecec",
	97: "#ffffff",
};

const BG_COLORS_16: Record<number, string> = {
	40: "#1a1a2e",
	41: "#e74c3c",
	42: "#2ecc71",
	43: "#f1c40f",
	44: "#3498db",
	45: "#9b59b6",
	46: "#1abc9c",
	47: "#ecf0f1",
	100: "#636e72",
	101: "#ff6b6b",
	102: "#55efc4",
	103: "#ffeaa7",
	104: "#74b9ff",
	105: "#a29bfe",
	106: "#81ecec",
	107: "#ffffff",
};

function parse256Color(
	codes: number[],
	i: number,
): [string | undefined, number] {
	if (codes[i + 1] === 5 && codes[i + 2] !== undefined) {
		const idx = codes[i + 2] as number;
		if (idx < 8) {
			const base = codes[i] === 38 ? 30 : 40;
			const map = codes[i] === 38 ? COLORS_16 : BG_COLORS_16;
			return [map[base + idx], i + 3];
		}
		if (idx < 16) {
			const base = codes[i] === 38 ? 82 : 92;
			const map = codes[i] === 38 ? COLORS_16 : BG_COLORS_16;
			return [map[base + idx], i + 3];
		}
		if (idx < 232) {
			const n = idx - 16;
			const r = Math.floor(n / 36) * 51;
			const g = (Math.floor(n / 6) % 6) * 51;
			const b = (n % 6) * 51;
			return [`rgb(${r},${g},${b})`, i + 3];
		}
		const gray = (idx - 232) * 10 + 8;
		return [`rgb(${gray},${gray},${gray})`, i + 3];
	}
	if (codes[i + 1] === 2 && codes[i + 4] !== undefined) {
		const r = codes[i + 2] as number;
		const g = codes[i + 3] as number;
		const b = codes[i + 4] as number;
		return [`rgb(${r},${g},${b})`, i + 5];
	}
	return [undefined, i + 1];
}

function applyCode(style: AnsiStyle, codes: number[]): AnsiStyle {
	const next = { ...style };
	let i = 0;
	while (i < codes.length) {
		const code = codes[i] as number;
		if (code === 0) {
			return {};
		}
		if (code === 1) next.bold = true;
		else if (code === 2) next.dim = true;
		else if (code === 3) next.italic = true;
		else if (code === 4) next.underline = true;
		else if (code === 9) next.strikethrough = true;
		else if (code === 22) {
			next.bold = undefined;
			next.dim = undefined;
		} else if (code === 23) next.italic = undefined;
		else if (code === 24) next.underline = undefined;
		else if (code === 29) next.strikethrough = undefined;
		else if (code === 39) next.color = undefined;
		else if (code === 49) next.bgColor = undefined;
		else if (code >= 30 && code <= 37) next.color = COLORS_16[code];
		else if (code >= 90 && code <= 97) next.color = COLORS_16[code];
		else if (code >= 40 && code <= 47) next.bgColor = BG_COLORS_16[code];
		else if (code >= 100 && code <= 107) next.bgColor = BG_COLORS_16[code];
		else if (code === 38 || code === 48) {
			const [color, nextI] = parse256Color(codes, i);
			if (code === 38) next.color = color;
			else next.bgColor = color;
			i = nextI;
			continue;
		}
		i++;
	}
	return next;
}

export function parseAnsi(text: string): AnsiSegment[] {
	const segments: AnsiSegment[] = [];
	let style: AnsiStyle = {};
	let lastIndex = 0;

	const regex = /\x1b\[([0-9;]*)m/g;
	let match: RegExpExecArray | null;
	for (match = regex.exec(text); match !== null; match = regex.exec(text)) {
		if (match.index > lastIndex) {
			segments.push({ text: text.slice(lastIndex, match.index), style });
		}
		const codeStr = match[1] ?? "0";
		const codes = codeStr.split(";").map(Number);
		style = applyCode(style, codes);
		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < text.length) {
		segments.push({ text: text.slice(lastIndex), style });
	}

	return segments;
}

export function stripAnsi(text: string): string {
	return text.replace(ANSI_REGEX, "");
}
