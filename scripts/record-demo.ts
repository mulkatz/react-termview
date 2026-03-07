import { chromium } from "playwright";

const URL = "http://localhost:5173";

async function main() {
	// Warmup: pre-load page so fonts and styles are cached
	const warmup = await chromium.launch();
	const warmCtx = await warmup.newContext();
	const warmPage = await warmCtx.newPage();
	await warmPage.goto(URL, { waitUntil: "networkidle" });
	await warmPage.waitForTimeout(1000);
	await warmCtx.close();
	await warmup.close();

	// Record
	const browser = await chromium.launch();
	const context = await browser.newContext({
		recordVideo: { dir: "./tmp-video", size: { width: 800, height: 500 } },
		viewport: { width: 800, height: 500 },
	});

	const page = await context.newPage();
	await page.goto(URL, { waitUntil: "networkidle" });
	await page.waitForTimeout(500);

	// Focus the first terminal and type commands
	const input = page.locator('.rt-input').first();
	await input.click();
	await page.waitForTimeout(300);

	// Type "help"
	await input.pressSequentially("help", { delay: 60 });
	await page.waitForTimeout(200);
	await input.press("Enter");
	await page.waitForTimeout(1000);

	// Type "colors"
	await input.pressSequentially("colors", { delay: 60 });
	await page.waitForTimeout(200);
	await input.press("Enter");
	await page.waitForTimeout(1500);

	// Type "fetch"
	await input.pressSequentially("fetch", { delay: 60 });
	await page.waitForTimeout(200);
	await input.press("Enter");
	await page.waitForTimeout(2500);

	await context.close();
	await browser.close();
}

main().catch(console.error);
