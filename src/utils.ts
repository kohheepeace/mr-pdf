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
  coverTitle: string;
  coverImage: string;
}

export async function generatePDF({
  initialDocsUrl,
  outputPDFFilename = 'mr-pdf.pdf',
  pdfMargin = { top: 32, right: 32, bottom: 32, left: 32 },
  contentSelector,
  paginationSelector,
  pdfFormat,
  excludeSelectors,
  cssStyle,
  puppeteerArgs,
  coverTitle,
  coverImage,
}: generatePDFOptions): Promise<void> {
  const browser = await puppeteer.launch({ args: puppeteerArgs });
  const page = await browser.newPage();

  let nextPageUrl = initialDocsUrl;

  // Download buffer of coverImage
  const imgSrc = await page.goto(coverImage);
  const imgSrcBuffer = await imgSrc?.buffer();
  const imgBase64: string = imgSrcBuffer?.toString('base64') || '';

  // Create a list of HTML for the content section of all pages by looping
  while (nextPageUrl) {
    console.log();
    console.log(chalk.cyan(`Retrieving html from ${nextPageUrl}`));
    console.log();

    // Go to the page specified by nextPageUrl
    await page.goto(`${nextPageUrl}`, { waitUntil: 'networkidle0' });

    // Get the HTML of the content section.
    const htmlString = await page.evaluate(
      ({ contentSelector }) => {
        const element: HTMLElement | null = document.querySelector(
          contentSelector,
        );
        if (element) {
          element.style.pageBreakAfter = 'always';
          return element.outerHTML;
        } else {
          return '';
        }
      },
      { contentSelector },
    );

    // Find next page url before DOM operations
    try {
      nextPageUrl = await page.$eval(paginationSelector, (element) => {
        return (element as HTMLLinkElement).href;
      });
    } catch (e) {
      nextPageUrl = '';
    }

    htmlList.push(htmlString);
    console.log(chalk.green('Success'));
  }

  // Go to initial page
  await page.goto(`${initialDocsUrl}`, { waitUntil: 'networkidle0' });

  // Restructuring the html of a document
  await page.evaluate(
    ({ htmlList, coverTitle, imgBase64 }) => {
      // Empty body content
      const body = document.body;
      body.innerHTML = '';

      // Add Cover Page
      body.innerHTML = `
      <div
        class="pdf-cover"
        style="
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
        "
      >
      <h1>${coverTitle}</h1>
      <img
        src="data:image/png;base64, ${imgBase64}"
        alt=""
        width="140"
        height="140"
      />
    </div>`;

      // Insert htmlList to body
      htmlList.map((html: string) => {
        body.innerHTML += html;
      });
    },
    { htmlList, coverTitle, imgBase64 },
  );

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
