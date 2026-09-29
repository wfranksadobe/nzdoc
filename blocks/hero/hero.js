import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Turns an authored bullet list into link buttons.
 * A bold item (strong/b around or inside the link) is highlighted.
 * @param {Element} list authored ul/ol
 * @returns {Element} decorated list
 */
function buildLinks(list) {
  const links = document.createElement('ul');
  links.className = 'hero-links';
  [...list.children].forEach((li) => {
    const item = document.createElement('li');
    if (li.querySelector('strong, b')) item.classList.add('hero-link-highlight');
    const source = li.querySelector('a');
    const el = document.createElement(source ? 'a' : 'span');
    el.className = 'hero-link';
    el.textContent = li.textContent.trim();
    if (source) {
      el.href = source.href;
      if (source.title) el.title = source.title;
    }
    moveInstrumentation(li, item);
    item.append(el);
    links.append(item);
  });
  return links;
}

const INFO_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>';
const CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"/></svg>';

// DAM asset metadata (dc:title, dc:rights) is read from AEM: the publish tier
// on the site, the author tier itself while editing
const AEM_PUBLISH = 'https://publish-p154716-e1630108.adobeaemcloud.com';
const DAM_ROOT = '/content/dam/';
// every credit ends with the (static) DOC copyright link
const COPYRIGHT = { label: 'DOC', href: 'https://www.doc.govt.nz/footer-links/copyright/' };

let captionCount = 0;

/**
 * The DAM path the Image info field points to, from its link or text.
 * @param {Element} row image info row
 * @returns {string} asset path (/content/dam/...), or ''
 */
function assetPathOf(row) {
  if (!row) return '';
  const link = row.querySelector('a');
  const values = [link?.getAttribute('href'), link?.textContent, row.textContent];
  const found = values.map((value) => (value || '').trim())
    .map((value) => {
      try {
        return decodeURI(new URL(value, window.location.href).pathname);
      } catch (e) {
        return value;
      }
    })
    .find((value) => value.includes(DAM_ROOT));
  return found ? found.slice(found.indexOf(DAM_ROOT)).replace(/\.html$/, '') : '';
}

const firstValue = (value) => String((Array.isArray(value) ? value[0] : value) || '').trim();

/**
 * The asset's title and rights from its DAM metadata.
 * @param {string} path asset path
 * @returns {Promise<{title: string, rights: string}|null>} metadata, or null
 */
async function fetchImageInfo(path) {
  const onAuthor = window.location.hostname.startsWith('author-');
  const base = onAuthor ? '' : AEM_PUBLISH;
  try {
    const resp = await fetch(`${base}${encodeURI(path)}/jcr:content/metadata.json`, onAuthor ? { credentials: 'include' } : {});
    if (!resp.ok) return null;
    const metadata = await resp.json();
    return { title: firstValue(metadata['dc:title']), rights: firstValue(metadata['dc:rights']) };
  } catch (e) {
    return null;
  }
}

/**
 * The image info button (top right) and the caption bubble it opens.
 * @param {{title: string, rights: string}} info the image's DAM title and rights
 * @param {Element} row image info row (for the editor binding)
 * @returns {Element|null} caption, when there is one
 */
function buildCaption(info, row) {
  if (!info || (!info.title && !info.rights)) return null;
  captionCount += 1;
  const id = `hero-caption-${captionCount}`;

  const caption = document.createElement('div');
  caption.className = 'hero-caption';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'hero-caption-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', id);

  const bubble = document.createElement('div');
  bubble.className = 'hero-caption-bubble';
  bubble.id = id;
  if (row) moveInstrumentation(row, bubble);
  if (info.title) {
    const p = document.createElement('p');
    p.className = 'hero-caption-description';
    p.textContent = info.title;
    bubble.append(p);
  }
  // Image: <rights> | DOC
  const credit = document.createElement('p');
  credit.className = 'hero-caption-credit';
  const label = document.createElement('b');
  label.textContent = 'Image: ';
  const copyright = document.createElement('a');
  copyright.href = COPYRIGHT.href;
  copyright.textContent = COPYRIGHT.label;
  credit.append(label, ...(info.rights ? [`${info.rights} | `] : []), copyright);
  bubble.append(credit);

  const setOpen = (open) => {
    bubble.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = `<span class="hero-caption-label">${open ? 'Hide' : 'Show'} image caption</span>${open ? CLOSE_ICON : INFO_ICON}`;
  };
  toggle.addEventListener('click', () => setOpen(bubble.hidden));
  caption.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !bubble.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  setOpen(false);

  caption.append(toggle, bubble);
  return caption;
}

/**
 * Hero: full-width image with the title box and optional link buttons
 * overlaid at the bottom, and an optional image info bubble at the top right
 * showing the image's DAM title and rights.
 * Rows: image (+ alt) | title | text (bullet list) | image info (DAM asset).
 * @param {Element} block the hero block
 */
export default function decorate(block) {
  const [imageRow, titleRow, textRow, infoRow] = [...block.children];

  const media = document.createElement('div');
  media.className = 'hero-media';
  const picture = imageRow?.querySelector('picture, img');
  if (picture) media.append(picture);
  if (imageRow) moveInstrumentation(imageRow, media);

  const content = document.createElement('div');
  content.className = 'hero-content';
  const inner = document.createElement('div');
  inner.className = 'hero-content-inner';

  const titleText = titleRow?.textContent.trim();
  if (titleText) {
    const titleBox = document.createElement('div');
    titleBox.className = 'hero-title';
    const heading = document.createElement('h1');
    heading.textContent = titleText;
    moveInstrumentation(titleRow, heading);
    titleBox.append(heading);
    inner.append(titleBox);
  }

  const list = textRow?.querySelector('ul, ol');
  if (list && list.children.length) {
    const links = buildLinks(list);
    moveInstrumentation(textRow, links);
    inner.append(links);
  } else {
    // no links: the title box sits flush with the bottom of the image
    block.classList.add('hero-no-text');
  }

  content.append(inner);
  block.replaceChildren(media, content);

  // the image info bubble, once the image's DAM metadata is in
  const assetPath = assetPathOf(infoRow);
  if (assetPath) {
    fetchImageInfo(assetPath).then((info) => {
      const caption = buildCaption(info, infoRow);
      if (caption) block.append(caption);
    });
  }
}
