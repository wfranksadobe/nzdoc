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

/**
 * Hero: full-width image with the title box and optional link buttons
 * overlaid at the bottom. Rows: image | title | text (bullet list).
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
}
