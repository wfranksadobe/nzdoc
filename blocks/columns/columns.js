import { decorateBlock, loadBlock } from '../../scripts/aem.js';

// blocks that can sit in a column (the column filter in _columns.json)
const NESTED_BLOCKS = ['content-list', 'embed'];

const nestedBlockOf = (el) => NESTED_BLOCKS
  .map((name) => el.querySelector(`:scope > .${name}`))
  .find(Boolean);

const isNestedBlockWrapper = (el) => NESTED_BLOCKS
  .some((name) => el?.classList.contains(`${name}-wrapper`));

const isEmptyColumn = (col) => !col.textContent.trim()
  && !col.querySelector('img, iframe, :scope > div[class]');

/**
 * Content lists and embeds written right after the Columns block (as
 * imported, since nested blocks can't be carried through the import) belong
 * to its columns, in order: empty columns first, then columns holding no
 * nested block yet.
 * @param {Element} block the columns block
 * @param {Element[]} cols first-row columns
 */
function adoptFollowingBlocks(block, cols) {
  const open = cols.filter((col) => !nestedBlockOf(col));
  const targets = [...open.filter(isEmptyColumn), ...open.filter((col) => !isEmptyColumn(col))];
  let next = block.parentElement?.nextElementSibling;
  while (targets.length && isNestedBlockWrapper(next)) {
    const wrapper = next;
    next = next.nextElementSibling;
    const nested = nestedBlockOf(wrapper);
    if (nested) targets.shift().append(nested);
    wrapper.remove();
  }
}

/**
 * Blocks inside a column (e.g. Content List, Embed) are not loaded by the page's block
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
  adoptFollowingBlocks(block, cols);

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
        // these panels sit on the page background, not on a section panel
        block.parentElement?.classList.add('columns-panels-wrapper');
      }
      loading.push(...nested);
    });
  });
  await Promise.all(loading);
}
