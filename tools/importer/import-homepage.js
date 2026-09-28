/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import feedbackParser from './parsers/feedback.js';

// TRANSFORMER IMPORTS
import docCleanupTransformer from './transformers/doc-cleanup.js';

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  feedback: feedbackParser,
};

// TRANSFORMER REGISTRY (doc-cleanup also creates the section breaks between kept blocks)
const transformers = [
  docCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'DOC homepage - staged migration: hero and page feedback only',
  urls: [
    'https://www.doc.govt.nz/',
  ],
  blocks: [
    { name: 'hero', instances: ['.hero'] },
    { name: 'feedback', instances: ['.feedbackContainer'] },
  ],
  sections: [
    { id: 'section-1', name: 'Hero', selector: ['.hero'], blocks: ['hero'], defaultContent: [] },
    { id: 'section-2', name: 'Feedback', selector: ['.feedbackContainer'], blocks: ['feedback'], defaultContent: [] },
  ],
};

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

    // 4. afterTransform (keep only parsed blocks, add section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    const heroImages = mapHeroImagesToDam(main);

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
        heroImages: heroImages.map((i) => `${i.source} -> ${i.dam}`).join('; '),
      },
    }];
  },
};
