import chalk = require('chalk');
import puppeteer = require('puppeteer');

let contentHTML = '';
export interface generatePDFOptions {
  initialDocsURL: string;
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
  initialDocsURL,
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

  let nextPageURL = initialDocsURL;

  // Download buffer of coverImage
  const imgSrc = await page.goto(coverImage);
  const imgSrcBuffer = await imgSrc?.buffer();
  const imgBase64: string = imgSrcBuffer?.toString('base64') || '';

  // Create a list of HTML for the content section of all pages by looping
  while (nextPageURL) {
    console.log();
    console.log(chalk.cyan(`Retrieving html from ${nextPageURL}`));
    console.log();

    // Go to the page specified by nextPageURL
    await page.goto(`${nextPageURL}`, { waitUntil: 'networkidle0' });

    // Get the HTML of the content section.
    const html = await page.evaluate(
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
    nextPageURL = await page.evaluate((paginationSelector) => {
      const element = document.querySelector(paginationSelector);
      if (element) {
        return (element as HTMLLinkElement).href;
      } else {
        return '';
      }
    }, paginationSelector);

    // Make joined content html
    contentHTML += html;
    console.log(chalk.green('Success'));
  }

  // Go to initial page
  await page.goto(`${initialDocsURL}`, { waitUntil: 'networkidle0' });

  const coverHTML = `
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
    <h1 class="cover-title">${coverTitle}</h1>
    <img
      class="cover-img"
      src="data:image/png;base64, ${imgBase64}"
      alt=""
      width="140"
      height="140"
    />
  </div>`;

  // Add Toc
  const { modifiedContentHTML, tocHTML } = generateToc(contentHTML);

  // Restructuring the html of a document
  await page.evaluate(
    ({ coverHTML, tocHTML, modifiedContentHTML }) => {
      // Empty body content
      const body = document.body;
      body.innerHTML = '';

      // Add Cover
      body.innerHTML += coverHTML;

      // Add toc
      body.innerHTML += tocHTML;

      // Add body content
      body.innerHTML += modifiedContentHTML;
    },
    { coverHTML, tocHTML, modifiedContentHTML },
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

function generateToc(contentHtml: string) {
  const headers: Array<{
    header: string;
    level: number;
    id: string;
  }> = [];

  const modifiedContentHTML = contentHtml.replace(
    /<h[1-6](.+?)<\/h[1-6]( )*>/g,
    htmlReplacer,
  );

  function htmlReplacer(matchedStr: string) {
    // docusaurus inserts #s into headers for direct links to the header
    const headerText = matchedStr
      .replace(/<a[^>]*>#<\/a( )*>/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    const headerId = `${Math.random().toString(36).substr(2, 5)}-${
      headers.length
    }`;

    headers.push({
      header: headerText,
      level: Number(matchedStr[matchedStr.indexOf('h') + 1]),
      id: headerId,
    });

    const modifiedContentHTML = matchedStr.replace(/<h[1-6].*?>/g, (header) => {
      if (header.match(/id( )*=( )*"/g)) {
        return header.replace(/id( )*=( )*"/g, `id="${headerId} `);
      } else {
        return header.substring(0, header.length - 1) + ` id="${headerId}">`;
      }
    });

    return modifiedContentHTML;
  }

  const toc = headers
    .map(
      (header) =>
        `<li class="toc-item toc-item-${header.level}" style="margin-left:${
          (header.level - 1) * 20
        }px"><a href="#${header.id}">${header.header}</a></li>`,
    )
    .join('\n');

  const tocHTML = `
  <div class="toc-page" style="page-break-after: always;">
    <h2 class="toc-header">Table of contents:</h2>
    <ul class="toc-list">${toc}</ul>
  </div>
  `;

  return { modifiedContentHTML, tocHTML };
}
