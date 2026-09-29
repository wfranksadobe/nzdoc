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
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // tools/importer/import-article-full.js
  var import_article_full_exports = {};
  __export(import_article_full_exports, {
    default: () => import_article_full_default
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
  var CAPTION_ATTR = "data-import-caption";
  var CREDIT_ATTR = "data-import-credit";
  function hinted(document, field, ...content) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    content.forEach((c) => frag.appendChild(c));
    return frag;
  }
  function captionCell(document, element) {
    if (!element.hasAttribute(CAPTION_ATTR) && !element.hasAttribute(CREDIT_ATTR)) return "";
    const cell = document.createDocumentFragment();
    const description = (element.getAttribute(CAPTION_ATTR) || "").trim();
    if (description) {
      const p = document.createElement("p");
      p.textContent = description;
      cell.append(hinted(document, "caption_description", p));
    }
    const credit = document.createElement("div");
    credit.innerHTML = element.getAttribute(CREDIT_ATTR) || "";
    [...credit.querySelectorAll("b, strong")].filter((b) => /^image:?$/i.test(b.textContent.trim())).forEach((b) => (b.closest("span") || b).remove());
    credit.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", new URL(a.getAttribute("href"), SOURCE_ORIGIN2).href));
    if (credit.textContent.trim()) {
      const p = document.createElement("p");
      p.innerHTML = credit.innerHTML.replace(/\s+/g, " ").trim();
      cell.append(hinted(document, "caption_credit", p));
    }
    return cell.childNodes.length ? cell : "";
  }
  function parse2(element, { document }) {
    const img = element.querySelector("img.hero__image") || element.querySelector(".hero__image-container img") || element.querySelector("img");
    const heading = element.querySelector("h1");
    const links = [...element.querySelectorAll("a")].filter((a) => a.textContent.trim() && !a.querySelector("img"));
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
    cells.push([captionCell(document, element)]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/feedback.js
  function text2(el) {
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
  function parse3(element, { document }) {
    const question = text2(element.querySelector("#stepQuestion .font-bold, #stepQuestion div > div:first-child"));
    const yes = text2(element.querySelector("#btnFeedbackYes"));
    const no = text2(element.querySelector("#btnFeedbackNo"));
    const thanks = text2(element.querySelector("#stepThanks"));
    const heading = text2(element.querySelector("#stepForm h2"));
    const label = text2(element.querySelector("#stepForm label"));
    const submit = text2(element.querySelector("#stepForm button[type=submit], #stepForm button"));
    const cells = [
      [hintedCell(document, [["question", question]])],
      [hintedCell(document, [["answer_yes", yes], ["answer_no", no]])],
      [hintedCell(document, [["thanksMessage", thanks]])],
      [hintedCell(document, [["form_heading", heading], ["form_label", label], ["form_submit", submit]])]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "Feedback", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function toId(name) {
    return name.toLowerCase().replace(/[^0-9a-z]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }
  function headingId(heading) {
    return heading.textContent.trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "").replace(/ /g, "-").replace(/^[\d-]+/, "");
  }
  function text3(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function anchorTargets(content, itemId) {
    const targets = /* @__PURE__ */ new Map();
    if (!content) return targets;
    const headings = [...content.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    content.querySelectorAll("[id], a[name]").forEach((anchor) => {
      const id = anchor.id || anchor.getAttribute("name");
      const own = anchor.closest("h1, h2, h3, h4, h5, h6");
      const before = headings.filter((h) => h.compareDocumentPosition(anchor) & 4).pop();
      const heading = own || before;
      targets.set(id, heading ? headingId(heading) : itemId);
    });
    return targets;
  }
  function keepHeaderRow(document, table) {
    var _a;
    const body = table.querySelector("tbody") || table;
    const rows = [...table.querySelectorAll("tr")];
    const header = rows.find((row) => row.querySelector("th"));
    table.querySelectorAll("th").forEach((th) => {
      const td = document.createElement("td");
      const strong = document.createElement("strong");
      strong.append(...th.childNodes);
      td.append(strong);
      th.replaceWith(td);
    });
    if (header) body.prepend(header);
    (_a = table.querySelector("thead")) == null ? void 0 : _a.remove();
    const columns = Math.max(...rows.map((row) => row.children.length));
    const spacer = document.createElement("tr");
    for (let i = 0; i < columns; i += 1) spacer.append(document.createElement("td"));
    body.prepend(spacer);
  }
  function contentCell(document, content) {
    const cell = document.createElement("div");
    cell.append(document.createComment(" field:text "));
    if (!content) return cell;
    const body = content.cloneNode(true);
    body.querySelectorAll("div").forEach((div) => div.replaceWith(...div.childNodes));
    body.querySelectorAll("a:not([href])").forEach((a) => a.replaceWith(...a.childNodes));
    body.querySelectorAll("p").forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector("img")) p.remove();
    });
    body.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
    body.querySelectorAll("table").forEach((table) => {
      ["class", "border", "width", "height", "cellpadding", "cellspacing"].forEach((attr) => table.removeAttribute(attr));
      keepHeaderRow(document, table);
    });
    cell.append(...body.childNodes);
    return cell;
  }
  function titleCell(document, title) {
    const cell = document.createElement("div");
    cell.append(document.createComment(" field:summary "), document.createTextNode(title));
    return cell;
  }
  function samePageAnchor(a, pageUrl) {
    const raw = (a.getAttribute("href") || "").trim();
    if (raw.startsWith("#")) return raw.slice(1) || null;
    try {
      const url = new URL(raw, pageUrl);
      const page = new URL(pageUrl);
      const path = (u) => u.pathname.replace(/\/$/, "");
      return url.hash && url.origin === page.origin && path(url) === path(page) ? url.hash.slice(1) : null;
    } catch (e) {
      return null;
    }
  }
  function parse4(element, { document, url, params, html }) {
    const pageUrl = (params == null ? void 0 : params.originalURL) || url;
    const items = [...element.querySelectorAll(".accordion-item")];
    const source = html ? new DOMParser().parseFromString(html, "text/html") : null;
    const sourceItems = source ? [...source.querySelectorAll(".doc-accordion .accordion-item")] : [];
    const cells = items.map((item, index) => {
      var _a;
      const title = text3(item.querySelector("button h2, h2"));
      const content = item.querySelector(".accordion-content");
      const id = toId(title);
      const sourceContent = sourceItems.length === items.length ? sourceItems[index].querySelector(".accordion-content") : content;
      const targets = anchorTargets(sourceContent, id);
      const buttonId = (_a = item.querySelector("button")) == null ? void 0 : _a.id;
      if (buttonId && !targets.has(buttonId)) targets.set(buttonId, id);
      document.querySelectorAll("a[href]").forEach((a) => {
        const target = targets.get(samePageAnchor(a, pageUrl));
        if (target) a.setAttribute("href", `#${target}`);
      });
      return [titleCell(document, title), contentCell(document, content)];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Accordion", cells });
    element.replaceWith(block);
  }

  // tools/importer/lib/hero-caption.js
  function loadHeroCaption(document) {
    return __async(this, null, function* () {
      const hero = document.querySelector(".hero");
      if (!hero || !/^https?:/.test(document.location.href)) return;
      try {
        const resp = yield fetch(document.location.href, { credentials: "same-origin" });
        const source = new DOMParser().parseFromString(yield resp.text(), "text/html");
        const caption = source.querySelector(".hero doc-image-caption");
        if (!caption) return;
        hero.setAttribute("data-import-caption", caption.getAttribute("caption") || "");
        hero.setAttribute("data-import-credit", (caption.querySelector(".hide-content") || caption).innerHTML);
      } catch (e) {
        console.warn("Hero caption not read", e);
      }
    });
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
  var SOURCE_ORIGIN3 = "https://www.doc.govt.nz";
  var SITE_ROOT = "/content/nzdoc";
  var pathOf = (url) => url.pathname.replace(/\/$/, "") || "/";
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const migrated = new Set((payload.migratedUrls || []).map((url) => pathOf(new URL(url))));
    element.querySelectorAll("a[href]").forEach((a) => {
      const raw = a.getAttribute("href").trim();
      if (!raw || raw.startsWith("#") || raw === "/") return;
      if (raw.startsWith("/content/")) return;
      let href;
      try {
        href = new URL(raw, SOURCE_ORIGIN3);
      } catch (e) {
        return;
      }
      if (href.origin !== SOURCE_ORIGIN3) return;
      const path = pathOf(href);
      if (path !== "/" && migrated.has(path) && !href.search && !href.hash) {
        a.setAttribute("href", `${SITE_ROOT}${path}`);
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

  // tools/importer/import-article-full.js
  var parsers = {
    breadcrumb: parse,
    hero: parse2,
    feedback: parse3,
    accordion: parse4
  };
  var transformers = [
    transform,
    transform2
  ];
  var MIGRATED_URLS = page_templates_default.templates.flatMap((template) => template.urls);
  var PAGE_TEMPLATE = {
    "name": "article-full",
    "description": "DOC articles migrated in full: breadcrumb, hero, subtitle, body (text, accordion, text) and page feedback",
    "urls": [
      "https://www.doc.govt.nz/news/events/national-events/national-wild-goat-hunting-competition/"
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
      },
      {
        "name": "accordion",
        "instances": [
          ".pagedoc .accordionblock"
        ]
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
        "name": "Breadcrumb and hero",
        "selector": [
          ".hero"
        ],
        "blocks": [
          "breadcrumb",
          "hero"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Subtitle",
        "selector": [
          ".doc-standard-overview__intro"
        ],
        "blocks": [],
        "defaultContent": [
          ".doc-standard-overview__intro-text .lead"
        ],
        "note": "the intro lead becomes a single h2 title, directly under the hero"
      },
      {
        "id": "section-3",
        "name": "Body",
        "selector": [
          ".pagedoc"
        ],
        "blocks": [
          "accordion"
        ],
        "defaultContent": [
          ".pagedoc > h2",
          ".pagedoc > h3",
          ".pagedoc > h4",
          ".pagedoc > p",
          ".pagedoc > ul",
          ".pagedoc > ol",
          ".pagedoc > blockquote",
          ".pagedoc .textblock > *"
        ],
        "note": "text, then the accordion, then text (in page order)"
      },
      {
        "id": "section-4",
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
  var SUBTITLE_SELECTOR = ".doc-standard-overview__intro-text .lead";
  function buildSubtitle(document) {
    const lead = document.querySelector(SUBTITLE_SELECTOR);
    if (!lead) return "";
    const title = document.createElement("h2");
    title.className = lead.className;
    title.textContent = lead.textContent.replace(/\s+/g, " ").trim();
    lead.replaceWith(title);
    return title.textContent;
  }
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
  var import_article_full_default = {
    onLoad: (_0) => __async(void 0, [_0], function* ({ document }) {
      return loadHeroCaption(document);
    }),
    transform: (payload) => {
      const { document, url, params, html } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params, html });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        }
      });
      const subtitle = buildSubtitle(document);
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
          subtitle,
          heroImages: heroImages.map((i) => `${i.source} -> ${i.dam}`).join("; ")
        }
      }];
    }
  };
  return __toCommonJS(import_article_full_exports);
})();
