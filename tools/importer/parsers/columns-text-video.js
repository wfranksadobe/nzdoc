/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the DOC page overview with text beside a video
 * (source: .doc-standard-overview__container with a right-hand video column).
 * Produces a Columns block (1 row, 2 columns): the text in the first column,
 * the second column left empty, followed by an Embed block with the YouTube
 * URL of the video.
 *
 * Nested blocks can't be carried through the import (the importer flattens
 * them and md2jcr garbles nested tables), so the Embed is written as a
 * sibling right after the Columns block (explicit project decision: the
 * video sits in the second column); the columns block places it into the
 * empty column when rendering. In the Universal Editor an Embed can also be
 * added straight into a column.
 */
const SOURCE_ORIGIN = 'https://www.doc.govt.nz';
const YOUTUBE_PLAYER = '/embed/';

function hinted(document, field, node) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  frag.appendChild(node);
  return frag;
}

/**
 * The YouTube watch URL for an embedded player (/embed/<id>?...), or the
 * player URL without its parameters for anything else.
 */
function videoUrl(src) {
  const url = new URL(src, SOURCE_ORIGIN);
  if (url.hostname.includes('youtube') && url.pathname.startsWith(YOUTUBE_PLAYER)) {
    const id = url.pathname.slice(YOUTUBE_PLAYER.length).split('/')[0];
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return `${url.origin}${url.pathname}`;
}

export default function parse(element, { document }) {
  const textColumn = element.querySelector('.doc-standard-overview__column:not(.doc-standard-overview__right-column)');
  const iframe = element.querySelector('.doc-standard-overview__right-column iframe');

  // first column: the text, with links pointing at the source site
  const text = document.createElement('div');
  if (textColumn) {
    textColumn.querySelectorAll('p, ul, ol, h2, h3, h4, blockquote')
      .forEach((node) => {
        if (node.parentElement.closest('p, ul, ol, blockquote')) return;
        if (!node.textContent.trim()) return;
        const copy = node.cloneNode(true);
        copy.querySelectorAll('a[href]').forEach((a) => {
          a.setAttribute('href', new URL(a.getAttribute('href'), SOURCE_ORIGIN).href);
        });
        text.append(copy);
      });
  }

  const columns = WebImporter.Blocks.createBlock(document, {
    name: 'Columns',
    cells: [[text, '']],
  });

  if (!iframe) {
    element.replaceWith(columns);
    return;
  }

  const uri = videoUrl(iframe.getAttribute('src'));
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = uri;
  a.textContent = uri;
  p.append(a);
  // embed_placeholder, embed_placeholderAlt and embed_uri share one cell (embed_ group)
  const embed = WebImporter.Blocks.createBlock(document, {
    name: 'Embed',
    cells: [[hinted(document, 'embed_uri', p)]],
  });

  element.replaceWith(columns, embed);
}
