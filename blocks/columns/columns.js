import { decorateBlock, loadBlock } from '../../scripts/aem.js';

/**
 * Content lists written right after the Columns block (as imported, since
 * nested blocks can't be carried through the import) belong to the columns in
 * order: move the Nth list into the Nth column that doesn't already hold one.
 * @param {Element} block the columns block
 * @param {Element[]} cols first-row columns
 */
function adoptFollowingContentLists(block, cols) {
  const targets = cols.filter((col) => !col.querySelector(':scope > .content-list'));
  let next = block.parentElement?.nextElementSibling;
  while (targets.length && next?.classList.contains('content-list-wrapper')) {
    const wrapper = next;
    next = next.nextElementSibling;
    const list = wrapper.querySelector(':scope > .content-list');
    if (list) targets.shift().append(list);
    wrapper.remove();
  }
}

/**
 * Blocks inside a column (e.g. Content List) are not loaded by the page's block
 * loading, which only looks at section level, so decorate and load them here.
 * @param {Element} col column cell
 * @returns {Promise[]} loading nested blocks
 */
function loadNestedBlocks(col) {
  return [...col.querySelectorAll(':scope > div[class]')]
    .filter((el) => el.firstElementChild?.tagName === 'DIV'
      && !['loading', 'loaded'].includes(el.dataset.blockStatus))
    .map((nested) => {
      decorateBlock(nested);
      return loadBlock(nested);
    });
}

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  adoptFollowingContentLists(block, cols);

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
