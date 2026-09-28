/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the DOC page feedback widget (source: .feedbackContainer in the footer).
 * Target model (xwalk): question | answer_yes + answer_no | thanksMessage |
 * form_heading + form_label + form_submit.
 */
function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

function hintedCell(document, fields) {
  const frag = document.createDocumentFragment();
  fields.forEach(([field, value]) => {
    if (!value) return;
    frag.appendChild(document.createComment(` field:${field} `));
    const p = document.createElement('p');
    p.textContent = value;
    frag.appendChild(p);
  });
  return frag;
}

export default function parse(element, { document }) {
  const question = text(element.querySelector('#stepQuestion .font-bold, #stepQuestion div > div:first-child'));
  const yes = text(element.querySelector('#btnFeedbackYes'));
  const no = text(element.querySelector('#btnFeedbackNo'));
  const thanks = text(element.querySelector('#stepThanks'));
  const heading = text(element.querySelector('#stepForm h2'));
  const label = text(element.querySelector('#stepForm label'));
  const submit = text(element.querySelector('#stepForm button[type=submit], #stepForm button'));

  const cells = [
    [hintedCell(document, [['question', question]])],
    [hintedCell(document, [['answer_yes', yes], ['answer_no', no]])],
    [hintedCell(document, [['thanksMessage', thanks]])],
    [hintedCell(document, [['form_heading', heading], ['form_label', label], ['form_submit', submit]])],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'Feedback', cells });
  element.replaceWith(block);
}
