import puppeteer = require('puppeteer');

declare function mrpdf(options: {
  initialDocURLs: Array<string>;
  excludeURLs?: Array<string>;
  outputPDFFilename?: string;
  pdfMargin?: puppeteer.PDFOptions['margin'];
  contentSelector: string;
  paginationSelector: string;
  pdfFormat?: puppeteer.PDFFormat;
  excludeSelectors?: Array<string>;
  cssStyle?: string;
  puppeteerArgs?: Array<string>;
  coverTitle?: string;
  coverImage?: string;
  disableTOC?: boolean;
  coverSub?: string;
}): Buffer;

export default mrpdf;
