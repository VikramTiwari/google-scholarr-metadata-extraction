const playwright = require("playwright");

let count = 0;
let startURL =
	"https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=tensorflow&oq=te"; // TODO: find a way to get these start URLs
const citationSelector = '[title="Cite"]';
const bibtextSelector = "#gs_citi > a:nth-child(1)";
const nextSearchResultSelector = ".gs_ico_nav_next";
const results = [];

async function getNewStartURL(page) {
	const nextResultPageURL = await page.evaluate(nextSearchResultSelector => {
		return document.querySelector(nextSearchResultSelector).parentNode.href;
	}, nextSearchResultSelector);
	console.log("nextResultPageURL", nextResultPageURL);
	return nextResultPageURL;
}

async function getBibText(context, page, citationButton) {
	await citationButton.click();
	await page.waitForSelector(bibtextSelector);
	const link = await page.evaluate(bibtextSelector => {
		const element = document.querySelector(bibtextSelector);
		return element.href;
	}, bibtextSelector);
	const params = new URL(link).searchParams;
	const paperId = params.get("q").split(":")[1];
	const bibTextPage = await context.newPage(link);
	const bibText = await bibTextPage.evaluate(() => document.body.innerText);
	results.push({ paperId, bibText });
}

(async () => {
	const browser = await playwright.chromium.launch({ headless: false });
	const context = await browser.defaultContext();
	// const context = await browser.newContext(); // for incognito

	while (startURL && count < 2) {
		// TODO change this
		const page = await context.newPage(startURL);
		await page.waitForSelector(citationSelector);
		const citationButtons = await page.$$(citationSelector);
		console.log(
			`Found ${citationButtons.length} citation buttons on this page`
		);
		console.log("Starting to get bibtext");
		for (let index = 0; index < citationButtons.length; index++) {
			const citationButton = citationButtons[index];
			await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second wait after every query
			await getBibText(context, page, citationButton);
		}
		startURL = await getNewStartURL(page);
		count = count + 1;
		console.log("results", results.length);
	}
})();
