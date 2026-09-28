/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the DOC breadcrumb (source: nav[aria-label="Breadcrumb"]).
 * Target model (xwalk): items (richtext bullet list). Ancestors are links,
 * the last item is the current page (plain text). Home links to the local
 * homepage; other ancestors point to the source site until migrated.
 */
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

export default function parse(element, { document }) {
  const ul = document.createElement('ul');
  [...element.querySelectorAll('a')].forEach((a) => {
    const href = a.getAttribute('href');
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = href === '/' ? '/' : new URL(href, SOURCE_ORIGIN).href;
    link.textContent = text(a);
    li.append(link);
    ul.append(li);
  });
  // the current page is the trail text that is not a link
  const rest = element.cloneNode(true);
  rest.querySelectorAll('a, svg').forEach((el) => el.remove());
  const current = text(rest);
  if (current) {
    const li = document.createElement('li');
    li.textContent = current;
    ul.append(li);
  }

  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(' field:items '));
  frag.appendChild(ul);
  const block = WebImporter.Blocks.createBlock(document, { name: 'Breadcrumb', cells: [[frag]] });
  element.replaceWith(block);
}
