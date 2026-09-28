/* eslint-disable */
/* global WebImporter */

/**
 * DOC page transformer (staged migration).
 * beforeTransform: prefix the page title with "EMA: ".
 * afterTransform: keep only the parsed blocks, one section each, and drop
 * everything else from the page (the rest of the page is migrated later).
 */
const TITLE_PREFIX = 'EMA: ';

export default function transform(hookName, element, payload) {
  const { document } = payload;

  if (hookName === 'beforeTransform') {
    const title = document.querySelector('title');
    if (title && !title.textContent.startsWith(TITLE_PREFIX)) {
      title.textContent = `${TITLE_PREFIX}${title.textContent.trim()}`;
    }
    return;
  }

  if (hookName === 'afterTransform') {
    const blocks = [...element.querySelectorAll('table')];
    const kept = [];
    blocks.forEach((table, i) => {
      if (i > 0) kept.push(document.createElement('hr'));
      kept.push(table);
    });
    element.replaceChildren(...kept);
  }
}
