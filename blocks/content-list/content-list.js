import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function hrefOf(el) {
  if (!el) return '';
  const a = el.tagName === 'A' ? el : el.querySelector('a');
  return a ? a.href : el.textContent.trim();
}

/**
 * Reads title, description and image of a referenced page from its HTML head.
 * @param {string} href page URL
 * @returns {Promise<Object|null>} page summary, or null when unavailable
 */
async function fetchPageSummary(href) {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    const resp = await fetch(url.pathname);
    if (!resp.ok) return null;
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    const meta = (name) => doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content || '';
    return {
      title: meta('og:title') || doc.title,
      description: meta('description') || meta('og:description'),
      image: meta('og:image'),
      imageAlt: meta('og:image:alt'),
    };
  } catch (e) {
    return null;
  }
}

/**
 * Builds one content item: linked title plus the page's image and description.
 * @param {Element} source authored item (link)
 * @returns {Element} item
 */
function buildItem(source) {
  const href = hrefOf(source);
  const item = document.createElement('li');
  item.className = 'content-list-item';
  moveInstrumentation(source, item);
  const heading = document.createElement('h3');
  const link = document.createElement('a');
  link.href = href;
  link.textContent = source.textContent.trim() || href;
  heading.append(link);
  const text = document.createElement('p');
  item.append(heading, text);

  fetchPageSummary(href).then((summary) => {
    if (!summary) return;
    if (summary.title) link.textContent = summary.title;
    if (summary.description) text.textContent = summary.description;
    if (summary.image) {
      const image = document.createElement('div');
      image.className = 'content-list-image';
      const src = new URL(summary.image, window.location.href);
      if (src.origin === window.location.origin) {
        image.append(createOptimizedPicture(src.href, summary.imageAlt, false, [{ width: '400' }]));
      } else {
        const img = document.createElement('img');
        img.src = src.href;
        img.alt = summary.imageAlt;
        img.loading = 'lazy';
        image.append(img);
      }
      item.prepend(image);
    }
  });
  return item;
}

/**
 * Content List: up to four referenced pages shown as teasers, then an
 * optional More button. Rows: content items | more.
 * @param {Element} block the content list block
 */
export default function decorate(block) {
  const [itemsRow, moreRow] = [...block.children];
  const itemsCell = itemsRow?.firstElementChild || itemsRow;
  const sources = itemsCell
    ? [...itemsCell.querySelectorAll('a')].filter((a) => hrefOf(a))
    : [];

  const nodes = [];
  if (sources.length) {
    const list = document.createElement('ul');
    list.className = 'content-list-items';
    sources.forEach((source) => list.append(buildItem(source)));
    nodes.push(list);
  }

  const moreHref = hrefOf(moreRow);
  if (moreHref) {
    const footer = document.createElement('div');
    footer.className = 'content-list-footer';
    const more = document.createElement('a');
    more.className = 'content-list-more';
    more.href = moreHref;
    more.textContent = 'More';
    moveInstrumentation(moreRow, more);
    footer.append(more);
    nodes.push(footer);
  }

  block.replaceChildren(...nodes);
}
