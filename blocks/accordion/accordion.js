/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

import { toClassName } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const CHEVRON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4z"/></svg>';

/**
 * Expand all / Collapse all, each shown while it has something to do.
 * @param {Element[]} items accordion items (details)
 * @returns {Element} controls
 */
function buildControls(items) {
  const controls = document.createElement('div');
  controls.className = 'accordion-controls';
  const expand = document.createElement('button');
  expand.type = 'button';
  expand.textContent = 'Expand all';
  const divider = document.createElement('span');
  divider.className = 'accordion-controls-divider';
  divider.setAttribute('aria-hidden', 'true');
  const collapse = document.createElement('button');
  collapse.type = 'button';
  collapse.textContent = 'Collapse all';
  controls.append(expand, divider, collapse);

  const update = () => {
    const open = items.filter((item) => item.open).length;
    expand.hidden = open === items.length;
    collapse.hidden = open === 0;
    divider.hidden = expand.hidden || collapse.hidden;
  };
  expand.addEventListener('click', () => items.forEach((item) => { item.open = true; }));
  collapse.addEventListener('click', () => items.forEach((item) => { item.open = false; }));
  items.forEach((item) => item.addEventListener('toggle', update));
  update();
  return controls;
}

/**
 * Opens the item holding an in-page link target, so following the link
 * (or arriving with it in the address) shows it.
 * @param {Element} block the accordion
 * @param {string} hash link target (#id)
 * @returns {Element|null} the target, when it is in this accordion
 */
function openTarget(block, hash) {
  if (!hash || hash.length < 2) return null;
  let target;
  try {
    target = document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch (e) {
    return null;
  }
  const item = target && block.contains(target) ? target.closest('details') : null;
  if (item) item.open = true;
  return item ? target : null;
}

/**
 * The item title: a heading holding the summary (and its editor binding).
 * @param {Element} label summary cell
 * @returns {Element} title
 */
function buildTitle(label) {
  const title = document.createElement('h2');
  title.className = 'accordion-item-title';
  moveInstrumentation(label, title);
  const only = label.children.length === 1 ? label.firstElementChild : null;
  if (only && !only.children.length) {
    moveInstrumentation(only, title);
    title.append(...only.childNodes);
  } else {
    title.append(...label.childNodes);
  }
  return title;
}

export default function decorate(block) {
  const items = [...block.children].map((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    const title = buildTitle(label);
    const icon = document.createElement('span');
    icon.className = 'accordion-item-icon';
    icon.innerHTML = CHEVRON;
    summary.append(title, icon);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    moveInstrumentation(row, details);
    details.className = 'accordion-item';
    const id = toClassName(title.textContent);
    if (id && !document.getElementById(id)) details.id = id;
    details.append(summary, body);
    row.replaceWith(details);
    return details;
  });

  if (items.length) block.prepend(buildControls(items));

  // in-page links into an item open it first
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link) openTarget(block, link.getAttribute('href'));
  });
  window.addEventListener('hashchange', () => openTarget(block, window.location.hash)?.scrollIntoView());
  const target = openTarget(block, window.location.hash);
  if (target) setTimeout(() => target.scrollIntoView(), 0);
}
