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

let captionCount = 0;

/**
 * The authored caption: description (the image title) and credit (rights).
 * Both sit in one cell; when only one is set, a credit is told apart by its
 * link or "photographer | owner" form.
 * @param {Element} row caption row
 * @returns {{description: Element|null, credit: Element|null}} caption parts
 */
function captionParts(row) {
  const cell = row?.firstElementChild || row;
  if (!cell) return { description: null, credit: null };
  const parts = [...cell.children].filter((el) => el.textContent.trim());
  if (!parts.length && cell.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    parts.push(p);
  }
  if (parts.length >= 2) return { description: parts[0], credit: parts[1] };
  const [only] = parts;
  if (!only) return { description: null, credit: null };
  const isCredit = only.querySelector('a') || only.textContent.includes('|');
  return isCredit ? { description: null, credit: only } : { description: only, credit: null };
}

/**
 * The image info button (top right) and the caption bubble it opens.
 * @param {Element} row caption row
 * @returns {Element|null} caption, when there is one
 */
function buildCaption(row) {
  const { description, credit } = captionParts(row);
  if (!description && !credit) return null;
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
  moveInstrumentation(row, bubble);
  if (description) {
    const p = document.createElement('p');
    p.className = 'hero-caption-description';
    p.append(...description.childNodes);
    bubble.append(p);
  }
  if (credit) {
    const p = document.createElement('p');
    p.className = 'hero-caption-credit';
    const label = document.createElement('b');
    label.textContent = 'Image: ';
    p.append(label, ...credit.childNodes);
    bubble.append(p);
  }

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
 * overlaid at the bottom, and an optional image info bubble at the top right.
 * Rows: image (+ alt) | title | text (bullet list) | caption (description,
 * credit).
 * @param {Element} block the hero block
 */
export default function decorate(block) {
  const [imageRow, titleRow, textRow, captionRow] = [...block.children];

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
  const caption = buildCaption(captionRow);
  block.replaceChildren(media, content, ...(caption ? [caption] : []));
}
