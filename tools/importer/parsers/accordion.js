/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the DOC accordion (source: .accordionblock > .doc-accordion).
 * Target (xwalk): Accordion block, 2 columns; one row per Accordion Item:
 *   title cell (summary) | content cell (text, rich text).
 *
 * In-page links to anchors inside an item (e.g. "#northland",
 * "#entry-locations-2026") are pointed at what exists after migration: the
 * heading holding the anchor (by the id published headings get from their
 * text), else the nearest heading before it, else the item itself. The
 * accordion opens the item when such a link is followed.
 */

// same as toClassName in scripts/aem.js, which the accordion uses for item ids
function toId(name) {
  return name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// the id published pages give a heading, from its text (punctuation dropped,
// spaces to hyphens, no leading digits)
function headingId(heading) {
  return heading.textContent.trim().toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-')
    .replace(/^[\d-]+/, '');
}

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

/**
 * Where each anchor inside an item content points after migration.
 * @returns {Map<string, string>} anchor id -> new link target (without #)
 */
function anchorTargets(content, itemId) {
  const targets = new Map();
  if (!content) return targets;
  const headings = [...content.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  content.querySelectorAll('[id], a[name]').forEach((anchor) => {
    const id = anchor.id || anchor.getAttribute('name');
    const own = anchor.closest('h1, h2, h3, h4, h5, h6');
    // eslint-disable-next-line no-bitwise
    const before = headings.filter((h) => h.compareDocumentPosition(anchor) & 4).pop();
    const heading = own || before;
    targets.set(id, heading ? headingId(heading) : itemId);
  });
  return targets;
}

/**
 * The conversion to AEM content takes the first row of a table as its heading
 * and drops it. So the header row becomes an ordinary row of bold cells, after
 * an empty first row for the conversion to drop; the page turns them back
 * into a table header (see decorateTables in scripts.js).
 */
function keepHeaderRow(document, table) {
  const body = table.querySelector('tbody') || table;
  const rows = [...table.querySelectorAll('tr')];
  const header = rows.find((row) => row.querySelector('th'));
  table.querySelectorAll('th').forEach((th) => {
    const td = document.createElement('td');
    const strong = document.createElement('strong');
    strong.append(...th.childNodes);
    td.append(strong);
    th.replaceWith(td);
  });
  if (header) body.prepend(header);
  table.querySelector('thead')?.remove();
  const columns = Math.max(...rows.map((row) => row.children.length));
  const spacer = document.createElement('tr');
  for (let i = 0; i < columns; i += 1) spacer.append(document.createElement('td'));
  body.prepend(spacer);
}

/** The item content without source-only wrappers, empty paragraphs and anchors. */
function contentCell(document, content) {
  const cell = document.createElement('div');
  cell.append(document.createComment(' field:text '));
  if (!content) return cell;
  const body = content.cloneNode(true);
  // tables sit in scroll wrappers on the source
  body.querySelectorAll('div').forEach((div) => div.replaceWith(...div.childNodes));
  // named anchors (link targets) carry no content
  body.querySelectorAll('a:not([href])').forEach((a) => a.replaceWith(...a.childNodes));
  body.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img')) p.remove();
  });
  body.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
  body.querySelectorAll('table').forEach((table) => {
    ['class', 'border', 'width', 'height', 'cellpadding', 'cellspacing'].forEach((attr) => table.removeAttribute(attr));
    keepHeaderRow(document, table);
  });
  cell.append(...body.childNodes);
  return cell;
}

function titleCell(document, title) {
  const cell = document.createElement('div');
  cell.append(document.createComment(' field:summary '), document.createTextNode(title));
  return cell;
}

/**
 * The anchor a link points to on this page ("#x", or this page's URL + "#x",
 * as the importer may have made links absolute), else null.
 */
function samePageAnchor(a, pageUrl) {
  const raw = (a.getAttribute('href') || '').trim();
  if (raw.startsWith('#')) return raw.slice(1) || null;
  try {
    const url = new URL(raw, pageUrl);
    const page = new URL(pageUrl);
    const path = (u) => u.pathname.replace(/\/$/, '');
    return url.hash && url.origin === page.origin && path(url) === path(page) ? url.hash.slice(1) : null;
  } catch (e) {
    return null;
  }
}

export default function parse(element, { document, url, params, html }) {
  const pageUrl = params?.originalURL || url;
  const items = [...element.querySelectorAll('.accordion-item')];
  // the import document has dropped the (empty) anchors links point to, so
  // read them from the source page as fetched, item by item
  const source = html ? new DOMParser().parseFromString(html, 'text/html') : null;
  const sourceItems = source ? [...source.querySelectorAll('.doc-accordion .accordion-item')] : [];
  const cells = items.map((item, index) => {
    const title = text(item.querySelector('button h2, h2'));
    const content = item.querySelector('.accordion-content');
    const id = toId(title);

    // in-page links into this item
    const sourceContent = sourceItems.length === items.length
      ? sourceItems[index].querySelector('.accordion-content') : content;
    const targets = anchorTargets(sourceContent, id);
    const buttonId = item.querySelector('button')?.id;
    if (buttonId && !targets.has(buttonId)) targets.set(buttonId, id);
    document.querySelectorAll('a[href]').forEach((a) => {
      const target = targets.get(samePageAnchor(a, pageUrl));
      if (target) a.setAttribute('href', `#${target}`);
    });

    // one row per item: title | content
    return [titleCell(document, title), contentCell(document, content)];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });
  element.replaceWith(block);
}
