// footer chrome that is driven by code, not authored content
const FOOTER_CONFIG = {
  govtLogo: { href: 'https://www.govt.nz/', label: 'New Zealand Government' },
  backToTop: { label: 'Back to Top', dockOffset: 10, edgeOffset: 20 },
};

const ICONS = {
  chevronUp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6l-6 6z"/></svg>',
};

/**
 * Fetches the footer fragment. Metadata-independent: /content first (local preview),
 * then the site root (published fragment).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  return container;
}

function buildGovtLogo() {
  const link = document.createElement('a');
  link.className = 'footer-govt-logo';
  link.href = FOOTER_CONFIG.govtLogo.href;
  link.setAttribute('aria-label', FOOTER_CONFIG.govtLogo.label);
  return link;
}

/**
 * Builds the green band: centered channel links, then the government logo
 * next to the remaining link groups.
 * @param {Element[]} linkSections authored sections containing link lists
 * @returns {Element} main footer band
 */
function buildMain(linkSections) {
  const band = document.createElement('div');
  band.className = 'footer-main';
  const inner = document.createElement('div');
  inner.className = 'footer-main-inner';

  const [channels, ...rest] = linkSections;
  if (channels) {
    const row = document.createElement('div');
    row.className = 'footer-channels';
    row.append(...channels.querySelectorAll(':scope > ul'));
    inner.append(row);
  }

  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';
  const groups = document.createElement('div');
  groups.className = 'footer-link-groups';
  rest.flatMap((section) => [...section.querySelectorAll(':scope > ul')]).forEach((list, i) => {
    if (i > 0) {
      const divider = document.createElement('span');
      divider.className = 'footer-divider';
      divider.setAttribute('aria-hidden', 'true');
      groups.append(divider);
    }
    groups.append(list);
  });
  bottom.append(buildGovtLogo(), groups);
  inner.append(bottom);

  band.append(inner);
  return band;
}

/**
 * Fixed back-to-top button: hidden at the top of the page, docked just
 * inside the top of the given band once the band scrolls into view.
 * @param {Element} dockTarget element to dock against
 * @returns {Element} button
 */
function buildBackToTop(dockTarget) {
  const { label, dockOffset, edgeOffset } = FOOTER_CONFIG.backToTop;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'footer-back-to-top';
  button.setAttribute('aria-label', label);
  button.innerHTML = ICONS.chevronUp;
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const update = () => {
    button.classList.toggle('is-visible', window.scrollY > 0);
    const { height } = button.getBoundingClientRect();
    const dockTop = dockTarget.getBoundingClientRect().top + dockOffset;
    const bottom = Math.max(edgeOffset, window.innerHeight - dockTop - height);
    button.style.bottom = `${bottom}px`;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  requestAnimationFrame(update);
  return button;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const linkSections = [...fragment.querySelectorAll(':scope > div')].filter((s) => s.querySelector('a'));

  const footer = document.createElement('div');
  footer.className = 'footer-wrapper';
  const main = buildMain(linkSections);
  footer.append(main, buildBackToTop(main));
  block.append(footer);
}
