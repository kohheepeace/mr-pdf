import chalk = require('chalk');
import puppeteer = require('puppeteer');

const htmlList: Array<string> = [];
export interface generatePDFOptions {
  initialDocsUrl: string;
  outputPDFFilename: string;
  pdfMargin: puppeteer.PDFOptions['margin'];
  contentSelector: string;
  paginationSelector: string;
  pdfFormat: puppeteer.PDFFormat;
  excludeSelectors: Array<string>;
  cssStyle: string;
  puppeteerArgs: Array<string>;
}

export async function generatePDF({
  initialDocsUrl,
  outputPDFFilename = 'mr-pdf.pdf',
  pdfMargin,
  contentSelector,
  paginationSelector,
  pdfFormat,
  excludeSelectors,
  cssStyle,
  puppeteerArgs,
}: generatePDFOptions): Promise<void> {
  const browser = await puppeteer.launch({ args: puppeteerArgs });
  const page = await browser.newPage();

  let nextPageUrl = initialDocsUrl;

  // Create a list of HTML for the content section of all pages by looping
  while (nextPageUrl) {
    console.log();
    console.log(chalk.cyan(`Retrieving html from ${nextPageUrl}`));
    console.log();

    // Go to the page specified by nextPageUrl
    await page.goto(`${nextPageUrl}`, { waitUntil: 'networkidle0' });

    // Get the HTML of the content section.
    const html = await page.$eval(contentSelector, (element) => {
      return element.outerHTML;
    });

    // Find next page url before DOM operations
    try {
      nextPageUrl = await page.$eval(paginationSelector, (element) => {
        return (element as HTMLLinkElement).href;
      });
    } catch (e) {
      nextPageUrl = '';
    }

    htmlList.push(html);
    console.log(chalk.green('Success'));
  }

  // Go to initial page
  await page.goto(`${initialDocsUrl}`, { waitUntil: 'networkidle0' });

  // Restructuring the html of a document
  await page.evaluate((htmlList) => {
    // Empty body content
    const body = document.body;
    body.innerHTML = '';

    // Insert htmlList to body
    htmlList.map((html: string) => {
      body.innerHTML += html;
    });
  }, htmlList);

  // Remove unnecessary HTML by using excludeSelectors
  excludeSelectors &&
    excludeSelectors.map(async (excludeSelector) => {
      // "selector" is equal to "excludeSelector"
      // https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-pageevaluatepagefunction-args
      await page.evaluate((selector) => {
        const matches = document.querySelectorAll(selector);
        matches.forEach((match) => match.remove());
      }, excludeSelector);
    });

  // Add CSS to HTML
  if (cssStyle) {
    await page.addStyleTag({ content: cssStyle });
  }

  await page.pdf({
    path: outputPDFFilename,
    format: pdfFormat,
    printBackground: true,
    margin: pdfMargin,
  });
}
