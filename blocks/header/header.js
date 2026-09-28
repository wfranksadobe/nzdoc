// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

// header chrome that is driven by code, not authored content
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';
const HEADER_CONFIG = {
  brand: { href: '/', src: '/icons/doc-logo-white.svg', alt: 'Department of Conservation | Te Papa Atawhai' },
  badge: { href: `${SOURCE_ORIGIN}/always-be-naturing`, src: '/icons/always-be-naturing.svg', alt: 'Always Be Naturing' },
  login: { href: `${SOURCE_ORIGIN}/footer-links/online-service-accounts/`, label: 'Log in' },
  search: {
    action: `${SOURCE_ORIGIN}/search-results/`, param: 'query', label: 'Search', placeholder: 'Search...',
  },
};

// matches an accent colour suffix on a top-level label, e.g. "Nature |507F39|"
const ACCENT_PATTERN = /\s*\|\s*#?([0-9a-f]{6}|[0-9a-f]{3})\s*\|\s*/i;

const ICONS = {
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="m15 19l-1.425-1.4l4.6-4.6H2v-2h16.175L13.6 6.4L15 5l7 7z"/></svg>',
  login: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 21v-2h7V5h-7V3h7q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm-2-4l-1.375-1.45l2.55-2.55H3v-2h8.175l-2.55-2.55L10 7l5 5z"/></svg>',
};

/**
 * Fetches the nav fragment. Metadata-independent: /content first (local preview),
 * then the site root (published fragment).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchNavFragment() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative media against the fragment location, not the current page
  container.querySelectorAll('img[src], source[srcset]').forEach((el) => {
    const attr = el.tagName === 'IMG' ? 'src' : 'srcset';
    const value = el.getAttribute(attr);
    if (!/^(https?:|data:|\/)/.test(value)) el.setAttribute(attr, new URL(value, resp.url).href);
  });
  return container;
}

function slugify(text) {
  return text.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function setPanel(item, open) {
  item.setAttribute('aria-expanded', open ? 'true' : 'false');
  item.querySelector('.nav-item-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeAllPanels(navSections, except = null) {
  navSections.querySelectorAll('.nav-item[aria-expanded="true"]').forEach((item) => {
    if (item !== except) setPanel(item, false);
  });
}

/**
 * Wraps each text link in a span and appends an icon.
 * @param {Element} list list of links
 * @param {string} icon svg markup
 */
function addLinkIcons(list, icon) {
  list.querySelectorAll('a').forEach((a) => {
    const text = document.createElement('span');
    text.textContent = a.textContent.trim();
    a.replaceChildren(text);
    a.insertAdjacentHTML('beforeend', icon);
  });
}

/**
 * Builds the dropdown panel from the nested content of a top-level item:
 * the first list is rendered as primary links, every following
 * "paragraph + list" pair as a titled group of pill links.
 * @param {Element} item top-level list item
 * @param {string} label top-level label
 * @param {string} id panel id
 * @returns {Element} panel
 */
function buildPanel(item, label, id) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  panel.id = id;
  const inner = document.createElement('div');
  inner.className = 'nav-panel-inner';
  const [primary, ...groups] = [...item.querySelectorAll(':scope > ul')];
  if (primary) {
    primary.className = 'nav-panel-links';
    primary.setAttribute('aria-label', `${label} submenu`);
    addLinkIcons(primary, ICONS.arrow);
    inner.append(primary);
  }
  groups.forEach((list) => {
    const group = document.createElement('div');
    group.className = 'nav-panel-group';
    const heading = list.previousElementSibling;
    if (heading && heading.tagName === 'P') {
      heading.className = 'nav-panel-heading';
      list.setAttribute('aria-label', `${label} ${heading.textContent.trim().toLowerCase()} links`);
      group.append(heading);
    }
    list.className = 'nav-panel-pills';
    group.append(list);
    inner.append(group);
  });
  panel.append(inner);
  return panel;
}

/**
 * Turns each top-level list item into a split link (text link + chevron toggle)
 * with a dropdown panel.
 * @param {Element} section the nav sections container
 */
function decorateSections(section) {
  const list = section.querySelector('ul');
  if (!list) return;
  list.className = 'nav-list';
  [...list.children].forEach((item) => {
    const topLink = item.querySelector(':scope > p > a, :scope > a');
    if (!topLink) return;
    const accent = topLink.textContent.match(ACCENT_PATTERN);
    if (accent) {
      topLink.textContent = topLink.textContent.replace(ACCENT_PATTERN, ' ').trim();
      item.style.setProperty('--nav-accent', `#${accent[1]}`);
    }
    const label = topLink.textContent.trim();
    const panelId = `nav-panel-${slugify(label)}`;
    item.className = 'nav-item';

    const row = document.createElement('div');
    row.className = 'nav-item-row';
    topLink.className = 'nav-item-link';
    const hasPanel = !!item.querySelector(':scope > ul');
    row.append(topLink);

    if (!hasPanel) {
      item.replaceChildren(row);
      return;
    }

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-item-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', panelId);
    toggle.setAttribute('aria-label', `${label} submenu`);
    toggle.innerHTML = ICONS.chevron;
    row.append(toggle);

    const panel = buildPanel(item, label, panelId);
    item.replaceChildren(row, panel);
    item.setAttribute('aria-expanded', 'false');

    // hovering the text link opens the panel; the chevron only toggles on click
    topLink.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      closeAllPanels(section, item);
      setPanel(item, true);
    });
    item.addEventListener('mouseleave', () => {
      if (isDesktop.matches) setPanel(item, false);
    });
    toggle.addEventListener('click', () => {
      const open = item.getAttribute('aria-expanded') !== 'true';
      if (isDesktop.matches) closeAllPanels(section, item);
      setPanel(item, open);
    });
  });
}

function createImageLink({ href, src, alt }) {
  const link = document.createElement('a');
  link.href = href;
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  link.append(img);
  return link;
}

function buildBrand() {
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const p = document.createElement('p');
  p.append(createImageLink(HEADER_CONFIG.brand));
  brand.append(p);
  return brand;
}

/**
 * Builds the tools: image badge and icon login link.
 * @returns {Element} tools container
 */
function buildTools() {
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const badge = document.createElement('p');
  badge.className = 'nav-badge';
  badge.append(createImageLink(HEADER_CONFIG.badge));
  const login = document.createElement('p');
  login.className = 'nav-login';
  const loginLink = document.createElement('a');
  loginLink.href = HEADER_CONFIG.login.href;
  loginLink.innerHTML = ICONS.login;
  const loginText = document.createElement('span');
  loginText.textContent = HEADER_CONFIG.login.label;
  loginLink.append(loginText);
  login.append(loginLink);
  tools.append(badge, login);
  return tools;
}

function buildSearchForm() {
  const {
    action, param, label, placeholder,
  } = HEADER_CONFIG.search;
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = action;
  form.method = 'get';
  const inputLabel = document.createElement('label');
  inputLabel.className = 'nav-search-label';
  inputLabel.htmlFor = 'nav-search-input';
  inputLabel.textContent = label;
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'nav-search-input';
  input.name = param;
  input.placeholder = placeholder;
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'nav-search-button';
  button.setAttribute('aria-label', label);
  form.append(inputLabel, input, button);
  return form;
}

function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  document.body.style.overflowY = (!expanded && !isDesktop.matches) ? 'hidden' : '';
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  // authored content only holds the nav tree; brand, tools and search come from code
  const navSections = fragment?.querySelector(':scope > div') || document.createElement('div');
  navSections.className = 'nav-sections';
  decorateSections(navSections);
  nav.append(buildBrand(), navSections, buildTools(), buildSearchForm());

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = '<button type="button" aria-controls="nav" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>';
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // close panels on outside click and escape
  document.addEventListener('click', (e) => {
    if (navSections && !navSections.contains(e.target)) closeAllPanels(navSections);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (navSections) closeAllPanels(navSections);
    if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') toggleMenu(nav, false);
  });

  // reset state when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    if (navSections) closeAllPanels(navSections);
    toggleMenu(nav, false);
  });

  const strip = document.createElement('div');
  strip.className = 'nav-strip';
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(strip, navWrapper);
}
