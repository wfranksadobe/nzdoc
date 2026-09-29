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

// every credit ends with the (static) DOC copyright link
const COPYRIGHT = { label: 'DOC', href: 'https://www.doc.govt.nz/footer-links/copyright/' };
// the image's XMP metadata sits at the start of the file
const XMP_BYTES = 65536;

let captionCount = 0;

/**
 * The original image file behind a displayed image: the site's optimised
 * versions (and AEM renditions while editing) drop the file's metadata.
 * @param {HTMLImageElement} img displayed image
 * @returns {string} original file URL, or ''
 */
function originalImageUrl(img) {
  // the fallback source (not the chosen webp one), as the original's format
  const src = img?.getAttribute('src') || img?.currentSrc;
  if (!src) return '';
  const url = new URL(src, window.location.href);
  url.search = '';
  url.pathname = url.pathname.replace(/\/_?jcr_content\/renditions\/.*$/, '').replace(/\/jcr:content\/renditions\/.*$/, '');
  return url.href;
}

/**
 * A language-alternative (or plain) Dublin Core value from an XMP packet.
 * @param {Document} xmp parsed XMP
 * @param {string} name element name (title, rights)
 * @returns {string} value
 */
function dcValue(xmp, name) {
  const el = xmp.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', name)[0];
  if (!el) return '';
  const items = [...el.getElementsByTagNameNS('http://www.w3.org/1999/02/22-rdf-syntax-ns#', 'li')];
  const item = items.find((li) => li.getAttribute('xml:lang') === 'x-default') || items[0];
  return (item || el).textContent.trim();
}

/**
 * The image's title and rights (dc:title, dc:rights), read from the XMP
 * metadata embedded in the image file, which AEM Assets holds for the asset.
 * @param {HTMLImageElement} img displayed image
 * @returns {Promise<{title: string, rights: string}|null>} metadata, or null
 */
async function fetchImageInfo(img) {
  const url = originalImageUrl(img);
  if (!url) return null;
  try {
    const resp = await fetch(url, { headers: { Range: `bytes=0-${XMP_BYTES - 1}` } });
    if (!resp.ok) return null;
    const bytes = new Uint8Array(await resp.arrayBuffer()).subarray(0, XMP_BYTES);
    const text = new TextDecoder('utf-8').decode(bytes);
    const start = text.indexOf('<x:xmpmeta');
    const end = text.indexOf('</x:xmpmeta>', start);
    if (start < 0 || end < 0) return null;
    const xmp = new DOMParser().parseFromString(text.slice(start, end + 12), 'application/xml');
    if (xmp.querySelector('parsererror')) return null;
    return { title: dcValue(xmp, 'title'), rights: dcValue(xmp, 'rights') };
  } catch (e) {
    return null;
  }
}

/**
 * The image info button (top right) and the caption bubble it opens.
 * @param {{title: string, rights: string}} info the image's title and rights
 * @param {Element} [row] authored row the caption belongs to (editor binding)
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
 * showing the image's title and rights (its DAM dc:title / dc:rights).
 * Rows: image (+ alt) | title | text (bullet list).
 * @param {Element} block the hero block
 */
export default function decorate(block) {
  const [imageRow, titleRow, textRow] = [...block.children];

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

  // the image info bubble, once the image's metadata is in
  const img = media.querySelector('img');
  if (img) {
    fetchImageInfo(img).then((info) => {
      const caption = buildCaption(info);
      if (caption) block.append(caption);
    });
  }
}
