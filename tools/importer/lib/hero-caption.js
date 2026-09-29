/* eslint-disable */

/**
 * Import onLoad step (runs on the live source page, before the transform).
 * The hero image caption is only rendered when its info bubble is opened, so
 * it is read from the page's own HTML (<doc-image-caption caption="...">
 * holding the credit) and kept on the hero for the hero parser.
 * @param {Document} document the source page
 */
export default async function loadHeroCaption(document) {
  const hero = document.querySelector('.hero');
  if (!hero || !/^https?:/.test(document.location.href)) return;
  try {
    const resp = await fetch(document.location.href, { credentials: 'same-origin' });
    const source = new DOMParser().parseFromString(await resp.text(), 'text/html');
    const caption = source.querySelector('.hero doc-image-caption');
    if (!caption) return;
    hero.setAttribute('data-import-caption', caption.getAttribute('caption') || '');
    hero.setAttribute('data-import-credit', (caption.querySelector('.hide-content') || caption).innerHTML);
  } catch (e) {
    console.warn('Hero caption not read', e);
  }
}
