import { moveInstrumentation } from '../../scripts/scripts.js';

const CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z"/></svg>';

/**
 * Breadcrumb trail from an authored list: linked items are ancestor pages,
 * the last item is the current page.
 * @param {Element} block the breadcrumb block
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  const source = block.querySelector('ul, ol');
  const entries = source
    ? [...source.children]
    : [...block.querySelectorAll('a')].map((a) => a.closest('p') || a);

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const list = document.createElement('ol');
  entries.forEach((entry, i) => {
    const item = document.createElement('li');
    const link = entry.querySelector('a') || (entry.tagName === 'A' ? entry : null);
    const isCurrent = i === entries.length - 1;
    if (link && !isCurrent) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent.trim();
      item.append(a);
      item.insertAdjacentHTML('beforeend', CHEVRON);
    } else {
      const current = document.createElement('span');
      current.textContent = entry.textContent.trim();
      if (isCurrent) current.setAttribute('aria-current', 'page');
      item.append(current);
      if (!isCurrent) item.insertAdjacentHTML('beforeend', CHEVRON);
    }
    list.append(item);
  });
  nav.append(list);
  if (row) moveInstrumentation(row, nav);
  block.replaceChildren(nav);
}
