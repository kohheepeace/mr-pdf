import chalk = require('chalk');
import puppeteer = require('puppeteer');

let contentHTML = '';
export interface generatePDFOptions {
  initialDocURLs: Array<string>;
  excludeURLs?: Array<string>;
  outputPDFFilename?: string;
  pdfMargin?: puppeteer.PDFOptions['margin'];
  contentSelector: string;
  paginationSelector: string;
  pdfFormat?: puppeteer.PDFFormat;
  excludeSelectors?: Array<string>;
  cssStyle?: string;
  puppeteerArgs?: puppeteer.LaunchOptions;
  coverTitle?: string;
  coverImage?: string;
  disableTOC?: boolean;
  coverSub?: string;
}

export async function generatePDF({
  initialDocURLs,
  excludeURLs,
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
  disableTOC = false,
  coverSub,
}: generatePDFOptions): Promise<Buffer> {
  const browser = await puppeteer.launch(puppeteerArgs);
  const page = await browser.newPage();

  for (const url of initialDocURLs) {
    let nextPageURL = url;

    // Create a list of HTML for the content section of all pages by looping
    while (nextPageURL) {
      console.log();
      console.log(chalk.cyan(`Retrieving html from ${nextPageURL}`));
      console.log();

      // Go to the page specified by nextPageURL
      await page.goto(`${nextPageURL}`, {
        waitUntil: 'networkidle0',
        timeout: 0,
      });
      // Get the HTML string of the content section.
      const html = await page.evaluate(
        ({ contentSelector }) => {
          const element: HTMLElement | null = document.querySelector(
            contentSelector,
          );
          if (element) {
            // Add pageBreak for PDF
            element.style.pageBreakAfter = 'always';

            // Open <details> tag
            const detailsArray = element.getElementsByTagName('details');
            Array.from(detailsArray).forEach((element) => {
              element.open = true;
            });

            return element.outerHTML;
          } else {
            return '';
          }
        },
        { contentSelector },
      );

      // Make joined content html
      if (excludeURLs && excludeURLs.includes(nextPageURL)) {
        console.log(chalk.green('This URL is excluded.'));
      } else {
        contentHTML += html;
        console.log(chalk.green('Success'));
      }

      // Find next page url before DOM operations
      nextPageURL = await page.evaluate((paginationSelector) => {
        const element = document.querySelector(paginationSelector);
        if (element) {
          return (element as HTMLLinkElement).href;
        } else {
          return '';
        }
      }, paginationSelector);
    }
  }

  // Download buffer of coverImage if exists
  let imgBase64 = '';
  let isSVG = false;
  if (coverImage) {
    const imgSrc = await page.goto(coverImage);
    isSVG = imgSrc?.headers()?.['content-type'] === 'image/svg+xml';
    const imgSrcBuffer = await imgSrc?.buffer();
    imgBase64 = imgSrcBuffer?.toString('base64') || '';
  }

  // Go to initial page
  await page.goto(`${initialDocURLs[0]}`, { waitUntil: 'networkidle0' });

  const coverHTML = `
  <div
    class="pdf-cover"
    style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      page-break-after: always;  
      text-align: center;
    "
  >
    ${coverTitle ? `<h1 class="cover-title">${coverTitle}</h1>` : ''}
    ${coverSub ? `<h3 class="cover-subtitle">${coverSub}</h3>` : ''}
    ${
      coverImage
        ? `<img class="cover-img" src="data:image/${
            isSVG ? 'svg+xml' : 'png'
          };base64, ${imgBase64}" alt="" width="140"height="140" />`
        : ''
    }
  </div>`;

  // Add Toc
  const { modifiedContentHTML, tocHTML } = generateToc(contentHTML);

  // Restructuring the html of a document
  await page.evaluate(
    ({ coverHTML, tocHTML, modifiedContentHTML, disableTOC }) => {
      // Empty body content
      const body = document.body;
      body.innerHTML = '';

      // Add Cover
      body.innerHTML += coverHTML;

      // Add toc
      if (!disableTOC) body.innerHTML += tocHTML;

      // Add body content
      body.innerHTML += modifiedContentHTML;
    },
    { coverHTML, tocHTML, modifiedContentHTML, disableTOC },
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

  const file = await page.pdf({
    path: outputPDFFilename,
    format: pdfFormat,
    printBackground: true,
    margin: pdfMargin,
  });

  return file;
}

function generateToc(contentHtml: string) {
  const headers: Array<{
    header: string;
    level: number;
    id: string;
  }> = [];

  // Create TOC only for h1~h3
  const modifiedContentHTML = contentHtml.replace(
    /<h[1-3](.+?)<\/h[1-3]( )*>/g,
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

    // level is h<level>
    const level = Number(matchedStr[matchedStr.indexOf('h') + 1]);

    headers.push({
      header: headerText,
      level,
      id: headerId,
    });

    const modifiedContentHTML = matchedStr.replace(/<h[1-3].*?>/g, (header) => {
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
    <h1 class="toc-header">Table of contents:</h1>
    <ul class="toc-list">${toc}</ul>
  </div>
  `;

  return { modifiedContentHTML, tocHTML };
}
