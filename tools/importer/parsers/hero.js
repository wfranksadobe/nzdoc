/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the DOC hero.
 * Source: .hero (image, h1 title box, optional row of link buttons; the
 * highlighted button uses the gold background class). An overlaid programme
 * logo (linked image) is not part of the model and is left out.
 * Target model (xwalk): image | title | text (bullet list, bold = highlighted).
 * Three content rows by explicit project decision (overrides the default
 * two-row hero convention).
 */
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';

function hinted(document, field, ...content) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  content.forEach((c) => frag.appendChild(c));
  return frag;
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });
  element.replaceWith(block);
}
