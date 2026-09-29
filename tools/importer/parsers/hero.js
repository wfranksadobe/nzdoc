/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the DOC hero.
 * Source: .hero (image, h1 title box, optional row of link buttons; the
 * highlighted button uses the gold background class). An overlaid programme
 * logo (linked image) is not part of the model and is left out.
 * Target model (xwalk): image (+ alt) | title | text (bullet list, bold =
 * highlighted) | image info (the image's DAM asset, whose dc:title and
 * dc:rights the image info bubble shows). Content rows by explicit project
 * decision (overrides the default two-row hero convention).
 */
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';
// all page hero images are stored in one DAM folder (as the import scripts map them)
const HERO_DAM_FOLDER = '/content/dam/nzdoc/heros';

function hinted(document, field, ...content) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  content.forEach((c) => frag.appendChild(c));
  return frag;
}

/** The image info row: a reference to the hero image's DAM asset, or ''. */
function imageInfoCell(document, img) {
  if (!img) return '';
  const file = new URL(img.getAttribute('src'), SOURCE_ORIGIN).pathname.split('/').pop();
  const path = `${HERO_DAM_FOLDER}/${file}`;
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = path;
  a.textContent = path;
  p.append(a);
  return hinted(document, 'imageInfo', p);
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

  cells.push([imageInfoCell(document, img)]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });
  element.replaceWith(block);
}
