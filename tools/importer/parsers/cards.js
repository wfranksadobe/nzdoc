/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the DOC homepage top panel (source: .doc-homepage-layout__content_top).
 * Produces a Cards block with one Card item per source card. Card model (one
 * cell per property): type | image | title | date | contentHeading | link | text | more.
 *  - Short Walks card (.card): type short-walks, image, title, link, text
 *  - Blog widget (.widget): type blog, title, date, content title, link, image, text, more
 */
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';
// blog date as shown on the source, e.g. "08 September 2026"
const DATE_PATTERN = new RegExp('^[0-9]{1,2} [A-Za-z]+ [0-9]{4}$');

function abs(href) {
  return new URL(href, SOURCE_ORIGIN).href;
}

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

function hinted(document, field, ...content) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  content.forEach((c) => frag.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return frag;
}

function picture(document, img) {
  const pic = document.createElement('picture');
  const image = document.createElement('img');
  image.src = abs(img.getAttribute('src'));
  image.alt = img.getAttribute('alt') || '';
  pic.append(image);
  return pic;
}

function link(document, href, label) {
  const a = document.createElement('a');
  a.href = abs(href);
  a.textContent = label || abs(href);
  return a;
}

function paragraphs(document, container) {
  const frag = document.createDocumentFragment();
  [...container.querySelectorAll('p')].forEach((p) => {
    const copy = document.createElement('p');
    copy.textContent = text(p);
    frag.append(copy);
  });
  return frag;
}

function row(document, values) {
  // cell order must match the card model
  return ['type', 'image', 'title', 'date', 'contentHeading', 'link', 'text', 'more']
    .map((field) => (values[field] ? hinted(document, field, values[field]) : ''));
}

function shortWalks(document, card) {
  const img = card.querySelector('img');
  const titleLink = card.querySelector('a.card_link, a');
  return row(document, {
    type: 'short-walks',
    image: img ? picture(document, img) : null,
    title: text(card.querySelector('h2')),
    link: titleLink ? link(document, titleLink.getAttribute('href'), text(card.querySelector('h2'))) : null,
    text: paragraphs(document, card),
  });
}

/**
 * The date sits right before the post title; the importer may unwrap its
 * span, leaving a bare text node, so check text nodes as well as elements.
 */
function blogDate(card) {
  if (!card) return '';
  const candidates = [...card.querySelectorAll('*')].flatMap((el) => [...el.childNodes])
    .map((node) => (node.nodeType === 3 || node.nodeType === 1 ? node.textContent.replace(/\s+/g, ' ').trim() : ''));
  return candidates.find((t) => DATE_PATTERN.test(t)) || '';
}

function blog(document, widget) {
  const card = widget.querySelector('.card');
  const img = card?.querySelector('img');
  const postLink = card?.querySelector('h3 a');
  const more = widget.querySelector('.widget__footer a');
  return row(document, {
    type: 'blog',
    image: img ? picture(document, img) : null,
    title: text(widget.querySelector('.widget__title h2, h2')),
    date: blogDate(card),
    contentHeading: text(postLink),
    link: postLink ? link(document, postLink.getAttribute('href'), text(postLink)) : null,
    text: card ? paragraphs(document, card) : null,
    more: more ? link(document, more.getAttribute('href'), 'More') : null,
  });
}

export default function parse(element, { document }) {
  const cells = [];
  [...element.children].forEach((child) => {
    if (child.classList.contains('widget')) cells.push(blog(document, child));
    else if (child.classList.contains('card')) cells.push(shortWalks(document, child));
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });
  element.replaceWith(block);
}
