/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import cardsParser from './parsers/cards.js';
import columnsParser from './parsers/columns.js';
import feedbackParser from './parsers/feedback.js';

// TRANSFORMER IMPORTS
import docCleanupTransformer from './transformers/doc-cleanup.js';

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  cards: cardsParser,
  columns: columnsParser,
  feedback: feedbackParser,
};

// TRANSFORMER REGISTRY (doc-cleanup also creates the section breaks between kept blocks)
const transformers = [
  docCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
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

// DAM folders for migrated images
const HERO_DAM_FOLDER = '/content/dam/nzdoc/heros';
const BLOG_DAM_FOLDER = '/content/dam/nzdoc/blogs';
// DOC blog uploads: /wp-content/uploads/<year>/<month>/<file>
const BLOG_UPLOAD_PATTERN = /\/wp-content\/uploads\/(\d{4})\//;

function fileName(src) {
  return new URL(src).pathname.split('/').pop();
}

function firstCellText(el) {
  const cell = el.querySelector('th, td');
  return cell ? cell.textContent.trim() : '';
}

/**
 * Points migrated images at their DAM folders, keeping the file name:
 *  - hero images and Short Walks card images -> heros
 *  - DOC blog images -> blogs/<year of upload>
 * Every other use of the same image (e.g. the metadata image) follows.
 * @param {Element} main - the transformed page
 * @returns {Array} { source, dam } pairs for the images that were mapped
 */
function mapImagesToDam(main) {
  const mapped = new Map();
  const toHeros = (img) => {
    const src = img.getAttribute('src');
    mapped.set(src, `${HERO_DAM_FOLDER}/${fileName(src)}`);
  };
  main.querySelectorAll('table').forEach((table) => {
    const name = firstCellText(table);
    if (/^hero\b/i.test(name)) table.querySelectorAll('img').forEach(toHeros);
    if (/^cards\b/i.test(name)) {
      [...table.querySelectorAll('tr')].slice(1)
        .filter((row) => firstCellText(row) === 'short-walks')
        .forEach((row) => row.querySelectorAll('img').forEach(toHeros));
    }
  });
  main.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    const blog = new URL(src).pathname.match(BLOG_UPLOAD_PATTERN);
    if (!mapped.has(src) && blog) mapped.set(src, `${BLOG_DAM_FOLDER}/${blog[1]}/${fileName(src)}`);
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

    // 4. afterTransform (keep only parsed blocks, add section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    const damImages = mapImagesToDam(main);

    // 6. path: the homepage maps to /index
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
        damImages: damImages.map((i) => `${i.source} -> ${i.dam}`).join('; '),
      },
    }];
  },
};
