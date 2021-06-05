## 📌 Introduction

This is a PDF generator from document website such as `docusaurus`, `vuepress`, `mkdocs`.

## ⚡ Usage
```shell
npx mr-pdf --initialDocsURL="https://example.com" --paginationSelector="li > a"
```

## 🍗 CLI Options

**❗NEED DOCS UPDATE!**

- `--initialDocsURL`:               set url to start generating PDF from.

- `--paginationSelector`:  used to find next page to be printed for looping.

- `--excludeSelectors`: exclude selectors from PDF. Separate each selector **with comma and no space**. But you can use space in each selector. ex: `--excludeSelectors=".nav,.next > a"`

- `--cssStyle`: css style to adjust PDF output ex: `--cssStyle="body{padding-top: 0;}"` *If you're project owner you can use `@media print { }` to edit CSS for PDF.

- `--outputPDFFilename`:   name of the output PDF file. Default is `mr-pdf.pdf`.

- `--pdfMargin`: set margin around PDF file. Separate each margin **with comma and no space**. ex: `--pdfMargin="10,20,30,40"`. This sets margin `top: 10px, right: 20px, bottom: 30px, left: 40px`.

- `--pdfFormat`:            pdf format ex: `--pdfFormat="A3"`. Please check this link for available formats [Puppeteer document](https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-pagepdfoptions)


## 🎨 Examples and Demo PDF

### Docusaurus v1
https://docusaurus.io/en/

`initialDocsURL`: https://docusaurus.io/docs/en/installation

`demoPDF`: https://drive.google.com/file/d/1HK5tBKmK0JBsFMNwoYRB9fDs9rkJhGRC/view?usp=sharing


`command`:
```shell
npx mr-pdf --initialDocsURL="https://docusaurus.io/docs/en/installation" --paginationSelector=".docs-prevnext > a.docs-next" --excludeSelectors=".fixedHeaderContainer,footer.nav-footer,#docsNav,nav.onPageNav,a.edit-page-link,div.docs-prevnext" --cssStyle=".navPusher {padding-top: 0;}" --pdfMargin="20"
```

### Docusaurus v2 beta
![20210603060438](https://user-images.githubusercontent.com/29557494/120552058-b4299e00-c431-11eb-833e-1ac1338b0a70.gif)


https://docusaurus.io/

`initialDocURLs`: https://docusaurus.io/docs

`demoPDF`:
https://drive.google.com/file/d/12IXlbRGKxDwUKK_GDy0hyBwcHUUell8D/view?usp=sharing


`command`:
```shell
npx mr-pdf --initialDocURLs="https://docusaurus.io/docs/" --contentSelector="article" --paginationSelector=".pagination-nav__item--next > a" --excludeSelectors=".margin-vert--xl a" --coverImage="https://docusaurus.io/img/docusaurus.png" --coverTitle="Docusaurus v2"
```

### Vuepress
https://vuepress.vuejs.org/

`initialDocsURL`:

https://vuepress.vuejs.org/guide/

`demoPDF`: https://drive.google.com/file/d/1v4EhFARPHPfYZWgx2mJsr5Y0op3LyV6u/view?usp=sharing

`command`:
```shell
npx mr-pdf --initialDocsURL="https://vuepress.vuejs.org/guide/" --paginationSelector=".page-nav .next a" --excludeSelectors="header.navbar,aside.sidebar,footer.page-edit .edit-link,.global-ui,.page-nav"
```

### Mkdocs
https://www.mkdocs.org/

`initialDocsURL`: https://www.mkdocs.org/

`demoPDF`: https://drive.google.com/file/d/1xVVDLmBzPQIbRs9V7Upq2S2QIjysS2-j/view?usp=sharing

`command`: 
```shell
npx mr-pdf --initialDocsURL="https://www.mkdocs.org/" --paginationSelector="ul.navbar-nav li.nav-item a[rel~='next']" --excludeSelectors=".navbar.fixed-top,footer,.homepage .container .row .col-md-3,#toc-collapse" --cssStyle=".col-md-9 {flex: 0 0 100%; max-width: 100%;}"
```

### Material for mkdocs
https://squidfunk.github.io/mkdocs-material/


`initialDocsURL`: https://squidfunk.github.io/mkdocs-material/getting-started/

`demoPDF`: https://drive.google.com/file/d/1oB5fyHIyZ83CUFO9d4VD4q4cJFgGlK-6/view?usp=sharing

`command`: 
```shell
npx mr-pdf --initialDocsURL="https://squidfunk.github.io/mkdocs-material/getting-started/" --paginationSelector="a.md-footer-nav__link--next" --excludeSelectors="header.md-header,.announce,nav.md-tabs,.md-main__inner .md-sidebar--primary,.md-main__inner .md-sidebar--secondary,footer" --cssStyle=".md-content {max-width: 100%!important;}"
```


#### PR to add new docs is welcome here... 😸


## 📄 How this plugin works
This plugin uses [puppeteer](https://github.com/puppeteer/puppeteer) to make PDF of the document website.

![mr-pdf-diagram](https://user-images.githubusercontent.com/29557494/90359040-c8fb9780-e092-11ea-89c7-1868bc32919f.png)


## 🎉 Thanks
This repo's code is coming from https://github.com/KohheePeace/docusaurus-pdf.

Thanks for awesome code made by [@maxarndt](https://github.com/maxarndt) and [@aloisklink](https://github.com/aloisklink).

[@bojl](https://github.com/bojl) approach to make TOC was awesome and breakthrough.
