/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the DOC homepage bottom panels (source: .doc-homepage-layout__content_bottom).
 * Produces a Columns block with one column per source widget, holding the
 * widget title (h2).
 *
 * Each column also takes a nested Content List block (4 content items + More).
 * Nested blocks can't be carried through the import (the importer flattens them
 * and the AEM conversion garbles nested tables), so Content Lists are added in
 * Universal Editor. Content items are migrated in a later step; the source More
 * links are recorded in the import report.
 */
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

export default function parse(element, { document }) {
  const moreLinks = [];
  const columns = [...element.querySelectorAll(':scope > .widget')].map((widget) => {
    const cell = document.createElement('div');
    const title = widget.querySelector('.widget__title h2, h2');
    if (title) {
      const h2 = document.createElement('h2');
      h2.textContent = text(title);
      cell.append(h2);
    }
    const more = widget.querySelector('.widget__footer a');
    if (more) moreLinks.push(`${text(title)}: ${new URL(more.getAttribute('href'), SOURCE_ORIGIN).href}`);
    return cell;
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [columns] });
  block.dataset.contentListMore = moreLinks.join('; ');
  element.replaceWith(block);
}
