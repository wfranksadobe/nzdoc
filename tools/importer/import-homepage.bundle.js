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
    const img = element.querySelector("img.hero__image") || element.querySelector(".hero__image-container img") || element.querySelector("img");
    const heading = element.querySelector("h1");
    const links = [...element.querySelectorAll("a")].filter((a) => a.textContent.trim() && !a.querySelector("img"));
    const cells = [];
    if (img) {
      const picture2 = document.createElement("picture");
      const image = document.createElement("img");
      image.src = new URL(img.getAttribute("src"), SOURCE_ORIGIN).href;
      image.alt = img.getAttribute("alt") || "";
      picture2.append(image);
      cells.push([hinted(document, "image", picture2)]);
    } else {
      cells.push([""]);
    }
    cells.push(heading ? [hinted(document, "title", document.createTextNode(heading.textContent.trim()))] : [""]);
    if (links.length) {
      const ul = document.createElement("ul");
      links.forEach((a) => {
        const li = document.createElement("li");
        const link2 = document.createElement("a");
        link2.href = new URL(a.getAttribute("href"), SOURCE_ORIGIN).href;
        link2.textContent = a.textContent.trim();
        if (/bg-doc-gold/.test(a.className)) {
          const strong = document.createElement("strong");
          strong.append(link2);
          li.append(strong);
        } else {
          li.append(link2);
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

  // tools/importer/parsers/cards.js
  var SOURCE_ORIGIN2 = "https://www.doc.govt.nz";
  var DATE_PATTERN = new RegExp("^[0-9]{1,2} [A-Za-z]+ [0-9]{4}$");
  function abs(href) {
    return new URL(href, SOURCE_ORIGIN2).href;
  }
  function text(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function hinted2(document, field, ...content) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    content.forEach((c) => frag.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return frag;
  }
  function picture(document, img) {
    const pic = document.createElement("picture");
    const image = document.createElement("img");
    image.src = abs(img.getAttribute("src"));
    image.alt = img.getAttribute("alt") || "";
    pic.append(image);
    return pic;
  }
  function link(document, href, label) {
    const a = document.createElement("a");
    a.href = abs(href);
    a.textContent = label || abs(href);
    return a;
  }
  function paragraphs(document, container) {
    const frag = document.createDocumentFragment();
    [...container.querySelectorAll("p")].forEach((p) => {
      const copy = document.createElement("p");
      copy.textContent = text(p);
      frag.append(copy);
    });
    return frag;
  }
  function row(document, values) {
    return ["type", "image", "title", "date", "contentHeading", "link", "text", "more"].map((field) => values[field] ? hinted2(document, field, values[field]) : "");
  }
  function shortWalks(document, card) {
    const img = card.querySelector("img");
    const titleLink = card.querySelector("a.card_link, a");
    return row(document, {
      type: "short-walks",
      image: img ? picture(document, img) : null,
      title: text(card.querySelector("h2")),
      link: titleLink ? link(document, titleLink.getAttribute("href"), text(card.querySelector("h2"))) : null,
      text: paragraphs(document, card)
    });
  }
  function blogDate(card) {
    if (!card) return "";
    const candidates = [...card.querySelectorAll("*")].flatMap((el) => [...el.childNodes]).map((node) => node.nodeType === 3 || node.nodeType === 1 ? node.textContent.replace(/\s+/g, " ").trim() : "");
    return candidates.find((t) => DATE_PATTERN.test(t)) || "";
  }
  function blog(document, widget) {
    const card = widget.querySelector(".card");
    const img = card == null ? void 0 : card.querySelector("img");
    const postLink = card == null ? void 0 : card.querySelector("h3 a");
    const more = widget.querySelector(".widget__footer a");
    return row(document, {
      type: "blog",
      image: img ? picture(document, img) : null,
      title: text(widget.querySelector(".widget__title h2, h2")),
      date: blogDate(card),
      contentHeading: text(postLink),
      link: postLink ? link(document, postLink.getAttribute("href"), text(postLink)) : null,
      text: card ? paragraphs(document, card) : null,
      more: more ? link(document, more.getAttribute("href"), "More") : null
    });
  }
  function parse2(element, { document }) {
    const cells = [];
    [...element.children].forEach((child) => {
      if (child.classList.contains("widget")) cells.push(blog(document, child));
      else if (child.classList.contains("card")) cells.push(shortWalks(document, child));
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  var SOURCE_ORIGIN3 = "https://www.doc.govt.nz";
  var SITE_ROOT = "/content/nzdoc";
  var MAX_ITEMS = 4;
  function text2(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function toContentPath(href) {
    const url = new URL(href, SOURCE_ORIGIN3);
    if (url.origin !== SOURCE_ORIGIN3) return url.href;
    return `${SITE_ROOT}${url.pathname.replace(/\/$/, "")}`;
  }
  function hinted3(document, field, node) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    frag.appendChild(node);
    return frag;
  }
  function linkParagraph(document, href, label) {
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    p.append(a);
    return p;
  }
  function contentList(document, widget) {
    const items = document.createDocumentFragment();
    [...widget.querySelectorAll(".widget__content .card h3 a")].slice(0, MAX_ITEMS).forEach((a, i) => {
      const path = toContentPath(a.getAttribute("href"));
      items.append(hinted3(document, `items_item${i + 1}`, linkParagraph(document, path, path)));
    });
    const more = widget.querySelector(".widget__footer a");
    const moreCell = more ? hinted3(document, "more", linkParagraph(document, new URL(more.getAttribute("href"), SOURCE_ORIGIN3).href, "More")) : "";
    return WebImporter.Blocks.createBlock(document, {
      name: "Content List",
      cells: [[items.childNodes.length ? items : ""], [moreCell]]
    });
  }
  function parse3(element, { document }) {
    const widgets = [...element.querySelectorAll(":scope > .widget")];
    const columns = widgets.map((widget) => {
      const cell = document.createElement("div");
      const title = widget.querySelector(".widget__title h2, h2");
      if (title) {
        const h2 = document.createElement("h2");
        h2.textContent = text2(title);
        cell.append(h2);
      }
      return cell;
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns", cells: [columns] });
    element.replaceWith(block, ...widgets.map((widget) => contentList(document, widget)));
  }

  // tools/importer/parsers/feedback.js
  function text3(el) {
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
  function parse4(element, { document }) {
    const question = text3(element.querySelector("#stepQuestion .font-bold, #stepQuestion div > div:first-child"));
    const yes = text3(element.querySelector("#btnFeedbackYes"));
    const no = text3(element.querySelector("#btnFeedbackNo"));
    const thanks = text3(element.querySelector("#stepThanks"));
    const heading = text3(element.querySelector("#stepForm h2"));
    const label = text3(element.querySelector("#stepForm label"));
    const submit = text3(element.querySelector("#stepForm button[type=submit], #stepForm button"));
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
      const defaultContent = ((template == null ? void 0 : template.sections) || []).map((s) => (s.defaultContent || []).flatMap((selector) => [...element.querySelectorAll(selector)]).filter((node) => !node.closest("table")).filter((node) => node.textContent.trim() || node.querySelector("img, picture")));
      const sectionOf = (node) => {
        const byContent = defaultContent.findIndex((nodes2) => nodes2.includes(node));
        if (byContent !== -1) return byContent;
        const name = blockName(node);
        const index = ((template == null ? void 0 : template.sections) || []).findIndex((s) => s.blocks.includes(name));
        return index === -1 ? name : index;
      };
      const nodes = [...blocks, ...defaultContent.flat()].sort((a, b) => a.compareDocumentPosition(b) & 4 ? -1 : 1);
      const kept = [];
      let current;
      nodes.forEach((node) => {
        const section = sectionOf(node);
        if (kept.length && section !== current) kept.push(document.createElement("hr"));
        current = section;
        if (node.tagName !== "TABLE") node.removeAttribute("class");
        kept.push(node);
      });
      element.replaceChildren(...kept);
    }
  }

  // tools/importer/transformers/migrated-links.js
  var SOURCE_ORIGIN4 = "https://www.doc.govt.nz";
  var SITE_ROOT2 = "/content/nzdoc";
  var pathOf = (url) => url.pathname.replace(/\/$/, "") || "/";
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const migrated = new Set((payload.migratedUrls || []).map((url) => pathOf(new URL(url))));
    element.querySelectorAll("a[href]").forEach((a) => {
      const raw = a.getAttribute("href").trim();
      if (!raw || raw.startsWith("#") || raw === "/") return;
      let href;
      try {
        href = new URL(raw, SOURCE_ORIGIN4);
      } catch (e) {
        return;
      }
      if (href.origin !== SOURCE_ORIGIN4) return;
      const path = pathOf(href);
      if (path !== "/" && migrated.has(path) && !href.search && !href.hash) {
        a.setAttribute("href", `${SITE_ROOT2}${path}`);
      } else {
        a.setAttribute("href", href.href);
      }
    });
  }

  // tools/importer/page-templates.json
  var page_templates_default = {
    templates: [
      {
        name: "homepage",
        description: "DOC homepage - staged migration: hero, homepage panels (cards, columns + content lists) and page feedback",
        urls: [
          "https://www.doc.govt.nz/"
        ],
        blocks: [
          {
            name: "hero",
            instances: [
              ".hero"
            ]
          },
          {
            name: "cards",
            instances: [
              ".doc-homepage-layout__content_top"
            ]
          },
          {
            name: "columns",
            instances: [
              ".doc-homepage-layout__content_bottom"
            ]
          },
          {
            name: "content-list",
            instances: [],
            note: "created by the columns parser (siblings after Columns)"
          },
          {
            name: "feedback",
            instances: [
              ".feedbackContainer"
            ]
          }
        ],
        sections: [
          {
            id: "section-1",
            name: "Hero",
            selector: [
              ".hero"
            ],
            blocks: [
              "hero"
            ],
            defaultContent: []
          },
          {
            id: "section-2",
            name: "Homepage panels",
            selector: [
              ".doc-homepage-layout"
            ],
            blocks: [
              "cards",
              "columns",
              "content-list"
            ],
            defaultContent: []
          },
          {
            id: "section-3",
            name: "Feedback",
            selector: [
              ".feedbackContainer"
            ],
            blocks: [
              "feedback"
            ],
            defaultContent: []
          }
        ]
      },
      {
        name: "article-hero",
        description: "DOC articles and landing pages (homepage Featured / Media releases, Short Walks) - staged migration: breadcrumb, hero, subtitle, overview text with video, and page feedback only",
        urls: [
          "https://www.doc.govt.nz/news/issues/bird-flu-updates/",
          "https://www.doc.govt.nz/parks-and-recreation/things-to-do/fishing/whitebaiting/",
          "https://www.doc.govt.nz/about-us/our-role/managing-conservation/conservation-amendment-bill/",
          "https://www.doc.govt.nz/news/media-releases/2026-media-releases/funding-boost-for-bird-flu-surveillance/",
          "https://www.doc.govt.nz/news/media-releases/2026-media-releases/government-invests-in-cleaning-up-contaminated-crown-land/",
          "https://www.doc.govt.nz/news/media-releases/2026-media-releases/4wd-group-plants-native-trees-to-fix-damage/",
          "https://www.doc.govt.nz/news/media-releases/2026-media-releases/toxoplasmosis-confirmed-as-cause-of-death-of-pregnant-hectors-dolphin/",
          "https://www.doc.govt.nz/parks-and-recreation/things-to-do/walking-and-tramping/short-walks/"
        ],
        blocks: [
          {
            name: "breadcrumb",
            instances: [
              'nav[aria-label="Breadcrumb"]'
            ]
          },
          {
            name: "hero",
            instances: [
              ".hero"
            ]
          },
          {
            name: "columns",
            instances: [
              ".doc-standard-overview__container:has(.doc-standard-overview__right-column iframe)"
            ],
            note: "overview text beside a video only (text-only overviews are not migrated yet)"
          },
          {
            name: "embed",
            instances: [],
            note: "created by the columns parser (sibling after Columns, shown in its second column)"
          },
          {
            name: "feedback",
            instances: [
              ".feedbackContainer"
            ],
            note: "only on pages with page feedback on the source (not the media releases)"
          }
        ],
        sections: [
          {
            id: "section-1",
            name: "Breadcrumb and hero",
            selector: [
              ".hero"
            ],
            blocks: [
              "breadcrumb",
              "hero"
            ],
            defaultContent: []
          },
          {
            id: "section-2",
            name: "Subtitle and overview",
            selector: [
              ".doc-standard-overview__intro"
            ],
            blocks: [
              "columns",
              "embed"
            ],
            defaultContent: [
              ".doc-standard-overview__intro-text .lead"
            ],
            note: "the intro lead becomes a single h2 title directly under the hero, followed by the overview text + video columns where the source has them"
          },
          {
            id: "section-3",
            name: "Feedback",
            selector: [
              ".feedbackContainer"
            ],
            blocks: [
              "feedback"
            ],
            defaultContent: []
          }
        ]
      },
      {
        name: "article-full",
        description: "DOC articles migrated in full: breadcrumb, hero, subtitle, body (text, accordion, text) and page feedback",
        urls: [
          "https://www.doc.govt.nz/news/events/national-events/national-wild-goat-hunting-competition/"
        ],
        blocks: [
          {
            name: "breadcrumb",
            instances: [
              'nav[aria-label="Breadcrumb"]'
            ]
          },
          {
            name: "hero",
            instances: [
              ".hero"
            ]
          },
          {
            name: "accordion",
            instances: [
              ".pagedoc .accordionblock"
            ]
          },
          {
            name: "feedback",
            instances: [
              ".feedbackContainer"
            ]
          }
        ],
        sections: [
          {
            id: "section-1",
            name: "Breadcrumb and hero",
            selector: [
              ".hero"
            ],
            blocks: [
              "breadcrumb",
              "hero"
            ],
            defaultContent: []
          },
          {
            id: "section-2",
            name: "Subtitle",
            selector: [
              ".doc-standard-overview__intro"
            ],
            blocks: [],
            defaultContent: [
              ".doc-standard-overview__intro-text .lead"
            ],
            note: "the intro lead becomes a single h2 title, directly under the hero"
          },
          {
            id: "section-3",
            name: "Body",
            selector: [
              ".pagedoc"
            ],
            blocks: [
              "accordion"
            ],
            defaultContent: [
              ".pagedoc > h2",
              ".pagedoc > h3",
              ".pagedoc > h4",
              ".pagedoc > p",
              ".pagedoc > ul",
              ".pagedoc > ol",
              ".pagedoc > blockquote",
              ".pagedoc .textblock > *"
            ],
            note: "text, then the accordion, then text (in page order)"
          },
          {
            id: "section-4",
            name: "Feedback",
            selector: [
              ".feedbackContainer"
            ],
            blocks: [
              "feedback"
            ],
            defaultContent: []
          }
        ]
      }
    ]
  };

  // tools/importer/import-homepage.js
  var parsers = {
    hero: parse,
    cards: parse2,
    columns: parse3,
    feedback: parse4
  };
  var transformers = [
    transform,
    transform2
  ];
  var MIGRATED_URLS = page_templates_default.templates.flatMap((template) => template.urls);
  var PAGE_TEMPLATE = {
    "name": "homepage",
    "description": "DOC homepage - staged migration: hero, homepage panels (cards, columns + content lists) and page feedback",
    "urls": [
      "https://www.doc.govt.nz/"
    ],
    "blocks": [
      {
        "name": "hero",
        "instances": [
          ".hero"
        ]
      },
      {
        "name": "cards",
        "instances": [
          ".doc-homepage-layout__content_top"
        ]
      },
      {
        "name": "columns",
        "instances": [
          ".doc-homepage-layout__content_bottom"
        ]
      },
      {
        "name": "content-list",
        "instances": [],
        "note": "created by the columns parser (siblings after Columns)"
      },
      {
        "name": "feedback",
        "instances": [
          ".feedbackContainer"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Hero",
        "selector": [
          ".hero"
        ],
        "blocks": [
          "hero"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Homepage panels",
        "selector": [
          ".doc-homepage-layout"
        ],
        "blocks": [
          "cards",
          "columns",
          "content-list"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Feedback",
        "selector": [
          ".feedbackContainer"
        ],
        "blocks": [
          "feedback"
        ],
        "defaultContent": []
      }
    ]
  };
  var HERO_DAM_FOLDER = "/content/dam/nzdoc/heros";
  var BLOG_DAM_FOLDER = "/content/dam/nzdoc/blogs";
  var BLOG_UPLOAD_PATTERN = /\/wp-content\/uploads\/(\d{4})\//;
  function fileName(src) {
    return new URL(src).pathname.split("/").pop();
  }
  function firstCellText(el) {
    const cell = el.querySelector("th, td");
    return cell ? cell.textContent.trim() : "";
  }
  function mapImagesToDam(main) {
    const mapped = /* @__PURE__ */ new Map();
    const toHeros = (img) => {
      const src = img.getAttribute("src");
      mapped.set(src, `${HERO_DAM_FOLDER}/${fileName(src)}`);
    };
    main.querySelectorAll("table").forEach((table) => {
      const name = firstCellText(table);
      if (/^hero\b/i.test(name)) table.querySelectorAll("img").forEach(toHeros);
      if (/^cards\b/i.test(name)) {
        [...table.querySelectorAll("tr")].slice(1).filter((row2) => firstCellText(row2) === "short-walks").forEach((row2) => row2.querySelectorAll("img").forEach(toHeros));
      }
    });
    main.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      const blog2 = new URL(src).pathname.match(BLOG_UPLOAD_PATTERN);
      if (!mapped.has(src) && blog2) mapped.set(src, `${BLOG_DAM_FOLDER}/${blog2[1]}/${fileName(src)}`);
    });
    main.querySelectorAll("img").forEach((img) => {
      const dam = mapped.get(img.getAttribute("src"));
      if (dam) img.setAttribute("src", dam);
    });
    return [...mapped].map(([source, dam]) => ({ source, dam }));
  }
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE, migratedUrls: MIGRATED_URLS });
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
      const damImages = mapImagesToDam(main);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name),
          damImages: damImages.map((i) => `${i.source} -> ${i.dam}`).join("; ")
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
