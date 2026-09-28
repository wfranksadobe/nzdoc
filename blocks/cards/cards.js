import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// one cell per card property, in model order
const FIELDS = ['type', 'image', 'title', 'date', 'contentHeading', 'link', 'text', 'more'];

function textOf(cell) {
  return cell ? cell.textContent.trim() : '';
}

/**
 * Reads a link property: an authored anchor, or a manually entered URL.
 * @param {Element} cell property cell
 * @returns {string} href or empty string
 */
function hrefOf(cell) {
  if (!cell) return '';
  const a = cell.querySelector('a');
  return a ? a.href : textOf(cell);
}

function element(tag, className, source) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (source) moveInstrumentation(source, el);
  return el;
}

function titleBar(cell) {
  const bar = element('div', 'cards-card-title');
  const heading = element('h2', '', cell);
  heading.textContent = textOf(cell);
  bar.append(heading);
  return bar;
}

function imageOf(cell, width) {
  const img = cell?.querySelector('img');
  if (!img) return null;
  const wrapper = element('div', 'cards-card-image', cell);
  // only same-site images can go through the image optimisation service
  if (new URL(img.src, window.location.href).origin === window.location.origin) {
    const picture = createOptimizedPicture(img.src, img.alt, false, [{ width }]);
    moveInstrumentation(img, picture.querySelector('img'));
    wrapper.append(picture);
  } else {
    wrapper.append(img.closest('picture') || img);
  }
  return wrapper;
}

function bodyOf(cell) {
  const body = element('div', 'cards-card-body', cell);
  if (cell) body.append(...cell.childNodes);
  return body;
}

/**
 * Optional More button, only rendered when a link is supplied.
 * @param {Element} cell more property cell
 * @param {string} context accessible context for the link
 * @returns {Element|null} footer
 */
function moreOf(cell, context) {
  const href = hrefOf(cell);
  if (!href) return null;
  const footer = element('div', 'cards-card-footer');
  const link = element('a', 'cards-card-more', cell);
  link.href = href;
  link.textContent = 'More';
  if (context) {
    const hidden = element('span', 'cards-visually-hidden');
    hidden.textContent = ` ${context}`;
    link.append(hidden);
  }
  footer.append(link);
  return footer;
}

/** Short Walks: large image, linked title bar, text */
function buildShortWalks(li, cells) {
  li.classList.add('cards-card-short-walks');
  const image = imageOf(cells.image, '750');
  if (image) li.append(image);
  const href = hrefOf(cells.link);
  const title = titleBar(cells.title);
  if (href) {
    const link = element('a', 'cards-card-link', cells.link);
    link.href = href;
    link.append(title);
    li.append(link);
  } else {
    li.append(title);
  }
  li.append(bodyOf(cells.text));
  const more = moreOf(cells.more, textOf(cells.title));
  if (more) li.append(more);
}

/** Blog: card title bar, date, linked content title, half-width image beside text, More */
function buildBlog(li, cells) {
  li.classList.add('cards-card-blog');
  li.append(titleBar(cells.title));

  const content = element('div', 'cards-card-content');
  const date = textOf(cells.date);
  if (date) {
    const dateEl = element('p', 'cards-card-date', cells.date);
    dateEl.textContent = date;
    content.append(dateEl);
  }
  const headingText = textOf(cells.contentHeading);
  if (headingText) {
    const heading = element('h3', 'cards-card-heading', cells.contentHeading);
    const href = hrefOf(cells.link);
    if (href) {
      const link = element('a', 'cards-card-link', cells.link);
      link.href = href;
      link.textContent = headingText;
      heading.append(link);
    } else {
      heading.textContent = headingText;
    }
    content.append(heading);
  }
  const body = bodyOf(cells.text);
  const image = imageOf(cells.image, '400');
  if (image) body.prepend(image);
  content.append(body);
  li.append(content);

  const more = moreOf(cells.more, textOf(cells.title));
  if (more) li.append(more);
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const cells = Object.fromEntries(FIELDS.map((name, i) => [name, row.children[i]]));
    if (textOf(cells.type) === 'blog') buildBlog(li, cells);
    else buildShortWalks(li, cells);
    ul.append(li);
  });
  block.replaceChildren(ul);
}
