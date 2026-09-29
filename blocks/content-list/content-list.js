import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// AEM site root: page references may use the repository path
const SITE_ROOT = '/content/nzdoc';

function hrefOf(el) {
  if (!el) return '';
  const a = el.tagName === 'A' ? el : el.querySelector('a');
  return a ? a.getAttribute('href') : el.textContent.trim();
}

/**
 * Paths to try for a referenced page, best match first for where this page is
 * viewed: the repository path on AEM author, /content/... on the local
 * preview, the published path (repository root stripped) otherwise.
 * @param {string} href page reference
 * @returns {string[]} same-origin candidate paths
 */
function candidatePaths(href) {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return [];
  const path = url.pathname.replace(/\.html$/, '');
  if (!path.startsWith(`${SITE_ROOT}/`)) return [path];
  const rest = path.slice(SITE_ROOT.length);
  const here = window.location.pathname;
  let paths = [rest, `/content${rest}`];
  if (here.startsWith(`${SITE_ROOT}/`)) paths = [`${path}.html`, rest];
  else if (here.startsWith('/content/')) paths = [`/content${rest}`, rest];
  return [...new Set(paths)];
}

/**
 * The page subtitle: the title that opens the section directly after the
 * section with the hero.
 * @param {Element} hero the page's hero block
 * @returns {string} subtitle text, or ''
 */
function subtitleOf(hero) {
  const title = hero?.closest('main > div')?.nextElementSibling?.firstElementChild;
  return /^H[1-6]$/.test(title?.tagName) ? title.textContent.trim() : '';
}

/**
 * Reads the teaser for a referenced page: image and title from the page's
 * hero block, then the page subtitle.
 * @param {string} href page reference
 * @returns {Promise<Object|null>} teaser, or null when the page can't be read
 */
async function fetchTeaser(href) {
  // eslint-disable-next-line no-restricted-syntax
  for (const path of candidatePaths(href)) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch(path);
      if (resp.ok) {
        // eslint-disable-next-line no-await-in-loop
        const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
        const meta = (name) => [...doc.querySelectorAll(`meta[name="${name}" i], meta[property="${name}" i]`)]
          .pop()?.content || '';
        // hero rows: image | title | text
        const hero = doc.querySelector('.hero');
        const [imageRow, titleRow] = [...(hero?.children || [])];
        const img = imageRow?.querySelector('img');
        // image paths in the page are relative to the page, not to this one
        const src = img?.getAttribute('src') || meta('og:image');
        return {
          path,
          title: titleRow?.textContent.trim() || meta('og:title') || doc.title,
          subtitle: subtitleOf(hero),
          image: src ? new URL(src, resp.url).href : '',
          imageAlt: img?.getAttribute('alt') || '',
        };
      }
    } catch (e) {
      // try the next candidate
    }
  }
  return null;
}

function buildImage(src, alt) {
  const image = document.createElement('div');
  image.className = 'content-list-image';
  const url = new URL(src, window.location.href);
  if (url.origin === window.location.origin) {
    image.append(createOptimizedPicture(url.href, alt, false, [{ width: '400' }]));
  } else {
    const img = document.createElement('img');
    img.src = url.href;
    img.alt = alt;
    img.loading = 'lazy';
    image.append(img);
  }
  return image;
}

/**
 * Builds one content item from a page reference: the page's hero image and
 * title, then its subtitle.
 * @param {Element} source authored item (its row, holding the page link)
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
  link.textContent = (source.querySelector('a') || source).textContent.trim() || href;
  heading.append(link);
  item.append(heading);
  // a Content Item just added in the editor has no page yet
  if (!href) {
    link.removeAttribute('href');
    link.textContent = 'Choose a page';
    return item;
  }

  fetchTeaser(href).then((teaser) => {
    if (!teaser) return;
    link.href = teaser.path;
    if (teaser.title) link.textContent = teaser.title;
    if (teaser.image) item.prepend(buildImage(teaser.image, teaser.imageAlt));
    if (teaser.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.textContent = teaser.subtitle;
      item.append(subtitle);
    }
  });
  return item;
}

// shown items; further items stay authored (and visible, dimmed, while editing)
const MAX_ITEMS = 4;

/**
 * The authored rows: the list's More link, then one row per Content Item.
 * Lists authored before Content Items existed hold all links in their first
 * row and More in their second; those are read as before.
 * @param {Element} block the content list block
 * @returns {{moreRow: Element, itemRows: Element[]}} rows
 */
function authoredRows(block) {
  const rows = [...block.children];
  if (rows.length === 2 && rows[0].querySelectorAll('a').length > 1) {
    return { moreRow: rows[1], itemRows: [...rows[0].querySelectorAll('a')] };
  }
  const [moreRow, ...itemRows] = rows;
  // in the editor, items are components; the More row is a property of the list
  if (moreRow?.dataset.aueType === 'component') return { moreRow: null, itemRows: rows };
  return { moreRow, itemRows };
}

/**
 * Content List: referenced pages shown as teasers (the first four), then an
 * optional More button. Rows: more | one row per Content Item.
 * @param {Element} block the content list block
 */
export default function decorate(block) {
  const { moreRow, itemRows } = authoredRows(block);
  const editing = !!block.closest('[data-aue-resource]') || !!block.dataset.aueResource;
  const sources = itemRows.filter((row) => hrefOf(row) || row.dataset.aueResource);

  const nodes = [];
  if (sources.length) {
    const list = document.createElement('ul');
    list.className = 'content-list-items';
    sources.forEach((source, i) => {
      if (i >= MAX_ITEMS && !editing) return;
      const item = buildItem(source);
      if (i >= MAX_ITEMS) item.classList.add('content-list-item-hidden');
      list.append(item);
    });
    nodes.push(list);
  }

  const moreHref = moreRow ? hrefOf(moreRow) : '';
  if (moreHref) {
    const footer = document.createElement('div');
    footer.className = 'content-list-footer';
    const more = document.createElement('a');
    more.className = 'content-list-more';
    more.href = moreHref;
    more.textContent = 'More';
    moveInstrumentation(moreRow.querySelector('[data-aue-prop]') || moreRow, more);
    footer.append(more);
    nodes.push(footer);
  }

  block.replaceChildren(...nodes);
}
