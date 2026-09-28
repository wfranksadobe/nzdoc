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

  // tools/importer/import-article-hero.js
  var import_article_hero_exports = {};
  __export(import_article_hero_exports, {
    default: () => import_article_hero_default
  });

  // tools/importer/parsers/breadcrumb.js
  var SOURCE_ORIGIN = "https://www.doc.govt.nz";
  function text(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function parse(element, { document }) {
    const ul = document.createElement("ul");
    [...element.querySelectorAll("a")].forEach((a) => {
      const href = a.getAttribute("href");
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = href === "/" ? "/" : new URL(href, SOURCE_ORIGIN).href;
      link.textContent = text(a);
      li.append(link);
      ul.append(li);
    });
    const rest = element.cloneNode(true);
    rest.querySelectorAll("a, svg").forEach((el) => el.remove());
    const current = text(rest);
    if (current) {
      const li = document.createElement("li");
      li.textContent = current;
      ul.append(li);
    }
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(" field:items "));
    frag.appendChild(ul);
    const block = WebImporter.Blocks.createBlock(document, { name: "Breadcrumb", cells: [[frag]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero.js
  var SOURCE_ORIGIN2 = "https://www.doc.govt.nz";
  function hinted(document, field, ...content) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    content.forEach((c) => frag.appendChild(c));
    return frag;
  }
  function parse2(element, { document }) {
    const img = element.querySelector("img.hero__image, .hero__image-container img, img");
    const heading = element.querySelector("h1");
    const links = [...element.querySelectorAll("a")];
    const cells = [];
    if (img) {
      const picture = document.createElement("picture");
      const image = document.createElement("img");
      image.src = new URL(img.getAttribute("src"), SOURCE_ORIGIN2).href;
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
        link.href = new URL(a.getAttribute("href"), SOURCE_ORIGIN2).href;
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

  // tools/importer/transformers/doc-cleanup.js
  var TITLE_PREFIX = "EMA: ";
  function blockName(table) {
    const cell = table.querySelector("th, td");
    return cell ? cell.textContent.trim().toLowerCase().replace(/\s+/g, "-") : "";
  }
  function transform(hookName, element, payload) {
    const { document, template } = payload;
    if (hookName === "beforeTransform") {
      const title = document.querySelector("title");
      if (title && !title.textContent.startsWith(TITLE_PREFIX)) {
        title.textContent = `${TITLE_PREFIX}${title.textContent.trim()}`;
      }
      return;
    }
    if (hookName === "afterTransform") {
      const templateBlocks = ((template == null ? void 0 : template.blocks) || []).map((b) => b.name);
      const blocks = [...element.querySelectorAll("table")].filter((table) => !table.parentElement.closest("table")).filter((table) => !templateBlocks.length || templateBlocks.includes(blockName(table)));
      const sectionOf = (table) => {
        const name = blockName(table);
        const index = ((template == null ? void 0 : template.sections) || []).findIndex((s) => s.blocks.includes(name));
        return index === -1 ? name : index;
      };
      const kept = [];
      let current;
      blocks.forEach((table) => {
        const section = sectionOf(table);
        if (kept.length && section !== current) kept.push(document.createElement("hr"));
        current = section;
        kept.push(table);
      });
      element.replaceChildren(...kept);
    }
  }

  // tools/importer/import-article-hero.js
  var parsers = {
    breadcrumb: parse,
    hero: parse2
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    "name": "article-hero",
    "description": "DOC articles (homepage Featured / Media releases) - staged migration: breadcrumb and hero only",
    "urls": [
      "https://www.doc.govt.nz/news/issues/bird-flu-updates/",
      "https://www.doc.govt.nz/parks-and-recreation/things-to-do/fishing/whitebaiting/",
      "https://www.doc.govt.nz/about-us/our-role/managing-conservation/conservation-amendment-bill/",
      "https://www.doc.govt.nz/news/events/national-events/national-wild-goat-hunting-competition/",
      "https://www.doc.govt.nz/news/media-releases/2026-media-releases/funding-boost-for-bird-flu-surveillance/",
      "https://www.doc.govt.nz/news/media-releases/2026-media-releases/government-invests-in-cleaning-up-contaminated-crown-land/",
      "https://www.doc.govt.nz/news/media-releases/2026-media-releases/4wd-group-plants-native-trees-to-fix-damage/",
      "https://www.doc.govt.nz/news/media-releases/2026-media-releases/toxoplasmosis-confirmed-as-cause-of-death-of-pregnant-hectors-dolphin/"
    ],
    "blocks": [
      {
        "name": "breadcrumb",
        "instances": [
          'nav[aria-label="Breadcrumb"]'
        ]
      },
      {
        "name": "hero",
        "instances": [
          ".hero"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Breadcrumb and hero",
        "selector": [
          ".hero"
        ],
        "blocks": [
          "breadcrumb",
          "hero"
        ],
        "defaultContent": []
      }
    ]
  };
  var HERO_DAM_FOLDER = "/content/dam/nzdoc/heros";
  function mapHeroImagesToDam(main) {
    const mapped = /* @__PURE__ */ new Map();
    main.querySelectorAll("table").forEach((table) => {
      const name = table.querySelector("th, td");
      if (!name || !/^hero\b/i.test(name.textContent.trim())) return;
      table.querySelectorAll("img").forEach((img) => {
        const source = img.getAttribute("src");
        const file = new URL(source).pathname.split("/").pop();
        mapped.set(source, `${HERO_DAM_FOLDER}/${file}`);
      });
    });
    main.querySelectorAll("img").forEach((img) => {
      const dam = mapped.get(img.getAttribute("src"));
      if (dam) img.setAttribute("src", dam);
    });
    return [...mapped].map(([source, dam]) => ({ source, dam }));
  }
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
  var import_article_hero_default = {
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
      const heroImages = mapHeroImagesToDam(main);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name),
          heroImages: heroImages.map((i) => `${i.source} -> ${i.dam}`).join("; ")
        }
      }];
    }
  };
  return __toCommonJS(import_article_hero_exports);
})();
