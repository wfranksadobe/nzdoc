/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the DOC homepage bottom panels (source: .doc-homepage-layout__content_bottom).
 * Produces a Columns block with one column per source widget (the widget
 * title), followed by one Content List block per widget: its More link (a
 * property of the list), then one Content Item (link) per content reference.
 *
 * Nested blocks can't be carried through the import (the importer flattens
 * them and md2jcr garbles nested tables), so the Content Lists are written as
 * siblings right after the Columns block; the columns block places each list
 * into its column when rendering.
 *
 * Content references are mapped from source URLs to AEM page paths
 * (https://www.doc.govt.nz/news/x/ -> /content/nzdoc/news/x), the same way
 * image URLs are mapped to DAM paths.
 */
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';
const SITE_ROOT = '/content/nzdoc';
const MAX_ITEMS = 4;

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

function toContentPath(href) {
  const url = new URL(href, SOURCE_ORIGIN);
  if (url.origin !== SOURCE_ORIGIN) return url.href;
  return `${SITE_ROOT}${url.pathname.replace(/\/$/, '')}`;
}

function hinted(document, field, node) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  frag.appendChild(node);
  return frag;
}

function linkParagraph(document, href, label) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label;
  p.append(a);
  return p;
}

function contentList(document, widget) {
  // list property: the More link
  const more = widget.querySelector('.widget__footer a');
  const moreCell = more
    ? hinted(document, 'more', linkParagraph(document, new URL(more.getAttribute('href'), SOURCE_ORIGIN).href, 'More'))
    : '';
  // child items: one Content Item row per referenced page
  const items = [...widget.querySelectorAll('.widget__content .card h3 a')]
    .slice(0, MAX_ITEMS)
    .map((a) => {
      const path = toContentPath(a.getAttribute('href'));
      return [hinted(document, 'link', linkParagraph(document, path, path))];
    });
  // rows: more | content item | content item | ...
  return WebImporter.Blocks.createBlock(document, {
    name: 'Content List',
    cells: [[moreCell], ...items],
  });
}

export default function parse(element, { document }) {
  const widgets = [...element.querySelectorAll(':scope > .widget')];
  const columns = widgets.map((widget) => {
    const cell = document.createElement('div');
    const title = widget.querySelector('.widget__title h2, h2');
    if (title) {
      const h2 = document.createElement('h2');
      h2.textContent = text(title);
      cell.append(h2);
    }
    return cell;
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [columns] });
  element.replaceWith(block, ...widgets.map((widget) => contentList(document, widget)));
}
