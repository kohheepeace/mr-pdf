const chalk = require('chalk');
const program = require('commander');
import puppeteer = require('puppeteer');
import { generatePdf, generatePdfOptions } from './index';

function commaSeparatedList(value: string, dummyPrevious: any): Array<string> {
  return value.split(',');
}

function generatePuppeteerPdfMargin(
  value: string,
  dummyPrevious: any,
): puppeteer.PDFOptions['margin'] {
  const marginStrings = value.split(',');

  const marginTop = marginStrings[0];
  const marginRight = marginStrings[1];
  const marginBottom = marginStrings[2];
  const marginLeft = marginStrings[3];

  const generatedMargins = {
    top: marginTop,
    right: marginRight,
    bottom: marginBottom,
    left: marginLeft,
  };

  return generatedMargins;
}

program
  .name('mr-pdf')
  .version(require('../package.json').version)
  .requiredOption('--initialUrl <url>', 'set url to start generating PDF from')
  .requiredOption('--paginationSelector <selector>', 'used to find next url')
  .option(
    '--excludeSelectors <selectors>',
    'exclude selector ex: .nav',
    commaSeparatedList,
  )
  .option(
    '--cssStyle <cssString>',
    'css style to adjust PDF output ex: body{padding-top: 0;}',
  )
  .option('--outputPdfFilename <filename>', 'name of output PDF file')
  .option(
    '--pdfMargin <margin>',
    'set margin around PDF file',
    generatePuppeteerPdfMargin,
  )
  .option('--pdfFormat <format>', 'pdf format ex: A3, A4...')
  .action((options: generatePdfOptions) => {
    generatePdf(options)
      .then(() => {
        console.log(chalk.green('Finish generating PDF!'));
        process.exit(0);
      })
      .catch((err: { stack: any }) => {
        console.error(chalk.red(err.stack));
        process.exit(1);
      });
  });

program.parse(process.argv);
