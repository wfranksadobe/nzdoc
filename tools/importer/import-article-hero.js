/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import breadcrumbParser from './parsers/breadcrumb.js';
import heroParser from './parsers/hero.js';
import feedbackParser from './parsers/feedback.js';
import columnsTextVideoParser from './parsers/columns-text-video.js';

// TRANSFORMER IMPORTS
import docCleanupTransformer from './transformers/doc-cleanup.js';

// PARSER REGISTRY
const parsers = {
  breadcrumb: breadcrumbParser,
  hero: heroParser,
  feedback: feedbackParser,
  columns: columnsTextVideoParser,
};

// TRANSFORMER REGISTRY (doc-cleanup also creates the section breaks between kept blocks)
const transformers = [
  docCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "article-hero",
  "description": "DOC articles and landing pages (homepage Featured / Media releases, Short Walks) - staged migration: breadcrumb, hero, subtitle, overview text with video, and page feedback only",
  "urls": [
    "https://www.doc.govt.nz/news/issues/bird-flu-updates/",
    "https://www.doc.govt.nz/parks-and-recreation/things-to-do/fishing/whitebaiting/",
    "https://www.doc.govt.nz/about-us/our-role/managing-conservation/conservation-amendment-bill/",
    "https://www.doc.govt.nz/news/events/national-events/national-wild-goat-hunting-competition/",
    "https://www.doc.govt.nz/news/media-releases/2026-media-releases/funding-boost-for-bird-flu-surveillance/",
    "https://www.doc.govt.nz/news/media-releases/2026-media-releases/government-invests-in-cleaning-up-contaminated-crown-land/",
    "https://www.doc.govt.nz/news/media-releases/2026-media-releases/4wd-group-plants-native-trees-to-fix-damage/",
    "https://www.doc.govt.nz/news/media-releases/2026-media-releases/toxoplasmosis-confirmed-as-cause-of-death-of-pregnant-hectors-dolphin/",
    "https://www.doc.govt.nz/parks-and-recreation/things-to-do/walking-and-tramping/short-walks/"
  ],
  "blocks": [
    {
      "name": "breadcrumb",
      "instances": [
        "nav[aria-label=\"Breadcrumb\"]"
      ]
    },
    {
      "name": "hero",
      "instances": [
        ".hero"
      ]
    },
    {
      "name": "columns",
      "instances": [
        ".doc-standard-overview__container:has(.doc-standard-overview__right-column iframe)"
      ],
      "note": "overview text beside a video only (text-only overviews are not migrated yet)"
    },
    {
      "name": "embed",
      "instances": [],
      "note": "created by the columns parser (sibling after Columns, shown in its second column)"
    },
    {
      "name": "feedback",
      "instances": [
        ".feedbackContainer"
      ],
      "note": "only on pages with page feedback on the source (not the media releases)"
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
      "name": "Subtitle and overview",
      "selector": [
        ".doc-standard-overview__intro"
      ],
      "blocks": [
        "columns",
        "embed"
      ],
      "defaultContent": [
        ".doc-standard-overview__intro-text .lead"
      ],
      "note": "the intro lead becomes a single h2 title directly under the hero, followed by the overview text + video columns where the source has them"
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

// the page subtitle: the source intro lead, migrated as a single title
const SUBTITLE_SELECTOR = '.doc-standard-overview__intro-text .lead';

/**
 * Turns the source intro lead (a styled span) into the subtitle title (h2),
 * keeping its class so the subtitle section's default content still finds it.
 * @param {Document} document - the source document
 * @returns {string} subtitle text, or '' when the page has none
 */
function buildSubtitle(document) {
  const lead = document.querySelector(SUBTITLE_SELECTOR);
  if (!lead) return '';
  const title = document.createElement('h2');
  title.className = lead.className;
  title.textContent = lead.textContent.replace(/\s+/g, ' ').trim();
  lead.replaceWith(title);
  return title.textContent;
}

// all page hero images are stored in one DAM folder
const HERO_DAM_FOLDER = '/content/dam/nzdoc/heros';

/**
 * Points every hero image (and any other use of the same image, e.g. the
 * metadata image) at the shared hero DAM folder, keeping the file name.
 * @param {Element} main - the transformed page
 * @returns {Array} { source, dam } pairs for the images that were mapped
 */
function mapHeroImagesToDam(main) {
  const mapped = new Map();
  main.querySelectorAll('table').forEach((table) => {
    const name = table.querySelector('th, td');
    if (!name || !/^hero\b/i.test(name.textContent.trim())) return;
    table.querySelectorAll('img').forEach((img) => {
      const source = img.getAttribute('src');
      const file = new URL(source).pathname.split('/').pop();
      mapped.set(source, `${HERO_DAM_FOLDER}/${file}`);
    });
  });
  main.querySelectorAll('img').forEach((img) => {
    const dam = mapped.get(img.getAttribute('src'));
    if (dam) img.setAttribute('src', dam);
  });
  return [...mapped].map(([source, dam]) => ({ source, dam }));
}

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - the DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - the DOM document
 * @param {Object} template - the embedded PAGE_TEMPLATE
 * @returns {Array} block instances found on the page, in template order
 */
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

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (title prefix)
    executeTransformers('beforeTransform', main, payload);

    // 2-3. find and parse blocks
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

    // 3b. subtitle (section default content)
    const subtitle = buildSubtitle(document);

    // 4. afterTransform (keep only parsed blocks and the subtitle, add section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    const heroImages = mapHeroImagesToDam(main);

    // 6. path (the homepage would map to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
        subtitle,
        heroImages: heroImages.map((i) => `${i.source} -> ${i.dam}`).join('; '),
      },
    }];
  },
};
