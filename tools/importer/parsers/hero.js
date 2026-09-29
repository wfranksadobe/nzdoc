/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the DOC hero.
 * Source: .hero (image, h1 title box, optional row of link buttons; the
 * highlighted button uses the gold background class). An overlaid programme
 * logo (linked image) is not part of the model and is left out.
 * Target model (xwalk): image (+ alt) | title | text (bullet list, bold =
 * highlighted) | caption (description + credit, the image info bubble).
 * Content rows by explicit project decision (overrides the default two-row
 * hero convention).
 *
 * The image caption is only rendered when its bubble is opened, so it is read
 * from the source page's own HTML: <doc-image-caption caption="..."> holding
 * the credit ("Image: " label, then photographer | owner link). The import's
 * onLoad step (lib/hero-caption.js, on the live page) fetches that HTML and
 * keeps the caption on the hero (data-import-caption / data-import-credit).
 */
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';
const CAPTION_ATTR = 'data-import-caption';
const CREDIT_ATTR = 'data-import-credit';

function hinted(document, field, ...content) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  content.forEach((c) => frag.appendChild(c));
  return frag;
}

/** The caption row (description + credit) kept on the hero at load, or ''. */
function captionCell(document, element) {
  if (!element.hasAttribute(CAPTION_ATTR) && !element.hasAttribute(CREDIT_ATTR)) return '';
  const cell = document.createDocumentFragment();
  const description = (element.getAttribute(CAPTION_ATTR) || '').trim();
  if (description) {
    const p = document.createElement('p');
    p.textContent = description;
    cell.append(hinted(document, 'caption_description', p));
  }
  const credit = document.createElement('div');
  credit.innerHTML = element.getAttribute(CREDIT_ATTR) || '';
  // the "Image:" label is part of the bubble, not the credit
  [...credit.querySelectorAll('b, strong')].filter((b) => /^image:?$/i.test(b.textContent.trim()))
    .forEach((b) => (b.closest('span') || b).remove());
  credit.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', new URL(a.getAttribute('href'), SOURCE_ORIGIN).href));
  if (credit.textContent.trim()) {
    const p = document.createElement('p');
    p.innerHTML = credit.innerHTML.replace(/\s+/g, ' ').trim();
    cell.append(hinted(document, 'caption_credit', p));
  }
  return cell.childNodes.length ? cell : '';
}

export default function parse(element, { document }) {
  // the hero photo, not a programme logo overlaid on it (e.g. Short Walks)
  const img = element.querySelector('img.hero__image')
    || element.querySelector('.hero__image-container img')
    || element.querySelector('img');
  const heading = element.querySelector('h1');
  // link buttons only: a linked logo overlay is not a button
  const links = [...element.querySelectorAll('a')]
    .filter((a) => a.textContent.trim() && !a.querySelector('img'));

  const cells = [];

  if (img) {
    const picture = document.createElement('picture');
    const image = document.createElement('img');
    image.src = new URL(img.getAttribute('src'), SOURCE_ORIGIN).href;
    image.alt = img.getAttribute('alt') || '';
    picture.append(image);
    cells.push([hinted(document, 'image', picture)]);
  } else {
    cells.push(['']);
  }

  cells.push(heading
    ? [hinted(document, 'title', document.createTextNode(heading.textContent.trim()))]
    : ['']);

  if (links.length) {
    const ul = document.createElement('ul');
    links.forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = new URL(a.getAttribute('href'), SOURCE_ORIGIN).href;
      link.textContent = a.textContent.trim();
      // highlighted source button (gold background) -> bold item
      if (/bg-doc-gold/.test(a.className)) {
        const strong = document.createElement('strong');
        strong.append(link);
        li.append(strong);
      } else {
        li.append(link);
      }
      ul.append(li);
    });
    cells.push([hinted(document, 'text', ul)]);
  } else {
    cells.push(['']);
  }

  cells.push([captionCell(document, element)]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });
  element.replaceWith(block);
}
