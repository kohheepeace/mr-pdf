import { generatePDF, generatePDFOptions } from './utils';

export const mrpdf = async (options: generatePDFOptions) => {
  const required = ['initialDocURLs', 'contentSelector', 'paginationSelector'];
  console.log(options?.initialDocURLs);
  let missing: string[] = [];
  required.forEach(
    (key) =>
      (missing = !Object.keys(options).includes(key)
        ? [...missing, key]
        : missing),
  );

  if (missing.length) {
    console.error(`You're missing the following fields: ${missing}`);
    return null;
  }

  return await generatePDF(options);
};

export default mrpdf;
