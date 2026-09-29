/* eslint-disable */
/* global WebImporter */

/**
 * DOC migrated links (afterTransform).
 * Links to source pages that have already been migrated point at the
 * migrated page instead: its AEM page path (/content/nzdoc/...), the same
 * form as the content references, which publishes as the site path. Links to
 * pages not migrated yet point at the source site (relative source links are
 * made absolute). In-page links (#...) and the homepage ("/") stay as they are.
 * payload.migratedUrls: the source URLs of all migrated pages (every URL of
 * every template in page-templates.json, passed in by the import script).
 */
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';
const SITE_ROOT = '/content/nzdoc';

const pathOf = (url) => url.pathname.replace(/\/$/, '') || '/';

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const migrated = new Set((payload.migratedUrls || []).map((url) => pathOf(new URL(url))));
  element.querySelectorAll('a[href]').forEach((a) => {
    const raw = a.getAttribute('href').trim();
    if (!raw || raw.startsWith('#') || raw === '/') return;
    let href;
    try {
      href = new URL(raw, SOURCE_ORIGIN);
    } catch (e) {
      return;
    }
    if (href.origin !== SOURCE_ORIGIN) return;
    const path = pathOf(href);
    // the same page on the source only: not a filtered view or an anchor in it
    if (path !== '/' && migrated.has(path) && !href.search && !href.hash) {
      a.setAttribute('href', `${SITE_ROOT}${path}`);
    } else {
      a.setAttribute('href', href.href);
    }
  });
}
