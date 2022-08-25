#!/usr/bin/env node

import { generatePDF, generatePDFOptions, isAddressInfo } from './utils';
import chalk = require('chalk');
import program = require('commander');
import express = require('express');
import {
  commaSeparatedList,
  generatePuppeteerPDFMargin,
} from './commander-options';
program
  .name('mr-pdf')
  .requiredOption(
    '--initialDocURLs <urls>',
    'set urls to start generating PDF from',
    commaSeparatedList,
  )
  .option(
    '--excludeURLs <urls>',
    'urls to be excluded in PDF',
    commaSeparatedList,
  )
  .requiredOption(
    '--contentSelector <selector>',
    'used to find the part of main content',
  )
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
  .option('--outputPDFFilename <filename>', 'name of output PDF file')
  .option(
    '--pdfMargin <margin>',
    'set margin around PDF file',
    generatePuppeteerPDFMargin,
  )
  .option('--pdfFormat <format>', 'pdf format ex: A3, A4...')
  .option('--coverTitle <title>', 'title for PDF cover')
  .option('--coverImage <src>', 'image for PDF cover. *.svg file not working!')
  .option('--disableTOC', 'disable table of contents')
  .option('--coverSub <subtitle>', 'subtitle for PDF cover')
  .option('--waitForRender <timeout>', 'wait for document render')
  .option('--headerTemplate <html>', 'html template for page header')
  .option('--footerTemplate <html>', 'html template for page footer')
  .option('--buildDirPath <path>', 'location of build directory')
  .option('--firstDocPath <path>', 'location of first doc path')
  .action(async (options: generatePDFOptions) => {
    const app = express();
    const httpServer = await app.listen();
    const address = httpServer.address();
    if (!address || !isAddressInfo(address)) {
      httpServer.close();
      throw new Error(
        'Something went wrong spinning up the express webserver.',
      );
    }
    app.use('/', express.static(options.buildDirPath));

    if (options.buildDirPath) {
      try {
        generatePDF({
          ...options,
          initialDocURLs: [
            `http://127.0.0.1:${address.port}/${options.firstDocPath}`,
          ],
        })
          .then(() => {
            console.log(chalk.green('Finish generating PDF!'));
            process.exit(0);
          })
          .catch((err: { stack: any }) => {
            console.error(chalk.red(err.stack));
            process.exit(1);
          });
      } catch (err) {
        httpServer.close();
      }
    } else {
      generatePDF(options)
        .then(() => {
          console.log(chalk.green('Finish generating PDF!'));
          process.exit(0);
        })
        .catch((err: { stack: any }) => {
          console.error(chalk.red(err.stack));
          process.exit(1);
        });
    }
  });

program.parse(process.argv);
