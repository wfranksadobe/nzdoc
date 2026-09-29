/* eslint-disable */
/* global WebImporter */

/**
 * DOC migrated links (afterTransform).
 * Links to source pages that have already been migrated point at the
 * migrated page instead: its AEM page path (/content/nzdoc/...), the same
 * form as the content references, which publishes as the site path. Links to
 * pages not migrated yet keep pointing at the source site.
 * payload.migratedUrls: the source URLs of all migrated pages (every URL of
 * every template in page-templates.json, passed in by the import script).
 */
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';
const SITE_ROOT = '/content/nzdoc';

const pathOf = (url) => url.pathname.replace(/\/$/, '') || '/';

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const migrated = new Set((payload.migratedUrls || []).map((url) => pathOf(new URL(url))));
  if (!migrated.size) return;
  element.querySelectorAll('a[href]').forEach((a) => {
    let href;
    try {
      href = new URL(a.getAttribute('href'), SOURCE_ORIGIN);
    } catch (e) {
      return;
    }
    // same page on the source only: no filtered views or anchors
    if (href.origin !== SOURCE_ORIGIN || href.search || href.hash) return;
    const path = pathOf(href);
    // the homepage is linked as "/" already
    if (path === '/' || !migrated.has(path)) return;
    a.setAttribute('href', `${SITE_ROOT}${path}`);
  });
}
