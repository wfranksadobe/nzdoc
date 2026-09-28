import { decorateBlock, loadBlock } from '../../scripts/aem.js';

/**
 * Blocks authored inside a column (e.g. Content List) are not picked up by the
 * page's block decoration, which only looks at section level, so decorate and
 * load them here.
 * @param {Element} col column cell
 * @returns {Promise[]} loading nested blocks
 */
function loadNestedBlocks(col) {
  return [...col.querySelectorAll(':scope > div[class]')]
    .filter((el) => !el.dataset.blockStatus && el.firstElementChild?.tagName === 'DIV')
    .map((nested) => {
      decorateBlock(nested);
      return loadBlock(nested);
    });
}

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  const loading = [];
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      // setup image columns
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
      const nested = loadNestedBlocks(col);
      // a column holding a content list is shown as a titled panel
      if (col.querySelector(':scope > .content-list')) {
        col.classList.add('columns-panel-col');
        row.classList.add('columns-panel-row');
      }
      loading.push(...nested);
    });
  });
  await Promise.all(loading);
}
