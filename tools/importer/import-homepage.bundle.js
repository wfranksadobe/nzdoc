/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero.js
  var SOURCE_ORIGIN = "https://www.doc.govt.nz";
  function hinted(document, field, ...content) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    content.forEach((c) => frag.appendChild(c));
    return frag;
  }
  function parse(element, { document }) {
    const img = element.querySelector("img.hero__image, .hero__image-container img, img");
    const heading = element.querySelector("h1");
    const links = [...element.querySelectorAll("a")];
    const cells = [];
    if (img) {
      const picture = document.createElement("picture");
      const image = document.createElement("img");
      image.src = new URL(img.getAttribute("src"), SOURCE_ORIGIN).href;
      image.alt = img.getAttribute("alt") || "";
      picture.append(image);
      cells.push([hinted(document, "image", picture)]);
    } else {
      cells.push([""]);
    }
    cells.push(heading ? [hinted(document, "title", document.createTextNode(heading.textContent.trim()))] : [""]);
    if (links.length) {
      const ul = document.createElement("ul");
      links.forEach((a) => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = new URL(a.getAttribute("href"), SOURCE_ORIGIN).href;
        link.textContent = a.textContent.trim();
        if (/bg-doc-gold/.test(a.className)) {
          const strong = document.createElement("strong");
          strong.append(link);
          li.append(strong);
        } else {
          li.append(link);
        }
        ul.append(li);
      });
      cells.push([hinted(document, "text", ul)]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/feedback.js
  function text(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function hintedCell(document, fields) {
    const frag = document.createDocumentFragment();
    fields.forEach(([field, value]) => {
      if (!value) return;
      frag.appendChild(document.createComment(` field:${field} `));
      const p = document.createElement("p");
      p.textContent = value;
      frag.appendChild(p);
    });
    return frag;
  }
  function parse2(element, { document }) {
    const question = text(element.querySelector("#stepQuestion .font-bold, #stepQuestion div > div:first-child"));
    const yes = text(element.querySelector("#btnFeedbackYes"));
    const no = text(element.querySelector("#btnFeedbackNo"));
    const thanks = text(element.querySelector("#stepThanks"));
    const heading = text(element.querySelector("#stepForm h2"));
    const label = text(element.querySelector("#stepForm label"));
    const submit = text(element.querySelector("#stepForm button[type=submit], #stepForm button"));
    const cells = [
      [hintedCell(document, [["question", question]])],
      [hintedCell(document, [["answer_yes", yes], ["answer_no", no]])],
      [hintedCell(document, [["thanksMessage", thanks]])],
      [hintedCell(document, [["form_heading", heading], ["form_label", label], ["form_submit", submit]])]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "Feedback", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/doc-cleanup.js
  var TITLE_PREFIX = "EMA: ";
  function transform(hookName, element, payload) {
    const { document } = payload;
    if (hookName === "beforeTransform") {
      const title = document.querySelector("title");
      if (title && !title.textContent.startsWith(TITLE_PREFIX)) {
        title.textContent = `${TITLE_PREFIX}${title.textContent.trim()}`;
      }
      return;
    }
    if (hookName === "afterTransform") {
      const blocks = [...element.querySelectorAll("table")];
      const kept = [];
      blocks.forEach((table, i) => {
        if (i > 0) kept.push(document.createElement("hr"));
        kept.push(table);
      });
      element.replaceChildren(...kept);
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    hero: parse,
    feedback: parse2
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "DOC homepage - staged migration: hero and page feedback only",
    urls: [
      "https://www.doc.govt.nz/"
    ],
    blocks: [
      { name: "hero", instances: [".hero"] },
      { name: "feedback", instances: [".feedbackContainer"] }
    ],
    sections: [
      { id: "section-1", name: "Hero", selector: [".hero"], blocks: ["hero"], defaultContent: [] },
      { id: "section-2", name: "Feedback", selector: [".feedbackContainer"], blocks: ["feedback"], defaultContent: [] }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
