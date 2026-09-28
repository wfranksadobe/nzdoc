/* eslint-disable */
/* global WebImporter */

/**
 * DOC page transformer (staged migration).
 * beforeTransform: prefix the page title with "EMA: ".
 * afterTransform: keep only the parsed (top-level) blocks and the sections'
 * default content, grouped into the template's sections, and drop everything
 * else from the page (the rest of the page is migrated later).
 */
const TITLE_PREFIX = 'EMA: ';

function blockName(table) {
  const cell = table.querySelector('th, td');
  return cell ? cell.textContent.trim().toLowerCase().replace(/\s+/g, '-') : '';
}

export default function transform(hookName, element, payload) {
  const { document, template } = payload;

  if (hookName === 'beforeTransform') {
    const title = document.querySelector('title');
    if (title && !title.textContent.startsWith(TITLE_PREFIX)) {
      title.textContent = `${TITLE_PREFIX}${title.textContent.trim()}`;
    }
    return;
  }

  if (hookName === 'afterTransform') {
    // keep only the blocks produced by this template's parsers: source pages can
    // contain their own tables, which must not end up in the migrated page.
    // Nested blocks (e.g. a content list inside columns) stay inside their parent.
    const templateBlocks = (template?.blocks || []).map((b) => b.name);
    const blocks = [...element.querySelectorAll('table')]
      .filter((table) => !table.parentElement.closest('table'))
      .filter((table) => !templateBlocks.length || templateBlocks.includes(blockName(table)));
    // a section's default content is kept too (found by its selectors, without
    // the source classes)
    const defaultContent = (template?.sections || []).map((s) => (s.defaultContent || [])
      .flatMap((selector) => [...element.querySelectorAll(selector)])
      .filter((node) => !node.closest('table')));
    const sectionOf = (node) => {
      const byContent = defaultContent.findIndex((nodes) => nodes.includes(node));
      if (byContent !== -1) return byContent;
      const name = blockName(node);
      const index = (template?.sections || []).findIndex((s) => s.blocks.includes(name));
      return index === -1 ? name : index;
    };
    const nodes = [...blocks, ...defaultContent.flat()]
      // eslint-disable-next-line no-bitwise
      .sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1));
    const kept = [];
    let current;
    nodes.forEach((node) => {
      const section = sectionOf(node);
      if (kept.length && section !== current) kept.push(document.createElement('hr'));
      current = section;
      if (node.tagName !== 'TABLE') node.removeAttribute('class');
      kept.push(node);
    });
    element.replaceChildren(...kept);
  }
}
