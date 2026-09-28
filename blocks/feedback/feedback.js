import { moveInstrumentation } from '../../scripts/scripts.js';

function show(el, visible) {
  el.hidden = !visible;
}

/**
 * Returns the authored values of a cell: one element per grouped field
 * (paragraphs), or the cell itself when it holds a single plain value.
 * @param {Element} row block row
 * @returns {Element[]} value elements
 */
function values(row) {
  if (!row) return [];
  const cell = row.firstElementChild || row;
  const parts = [...cell.children].filter((el) => el.textContent.trim());
  return parts.length ? parts : [cell];
}

/**
 * Creates an element with the text of an authored value, keeping its
 * Universal Editor instrumentation on the new element.
 * @param {string} tag element tag
 * @param {Element} source authored value element
 * @param {string} className optional class
 * @returns {Element} element
 */
function fromValue(tag, source, className = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (source) {
    el.textContent = source.textContent.trim();
    moveInstrumentation(source, el);
  }
  return el;
}

/**
 * Page feedback: question with a positive and a negative answer.
 * Positive shows the thank-you message; negative opens a comment form.
 * There is no feedback endpoint yet, so the form acknowledges without sending.
 * Rows: question | answers (positive, negative) | thank-you | form (heading, label, submit)
 * @param {Element} block the feedback block
 */
export default function decorate(block) {
  const [questionRow, answersRow, thanksRow, formRow] = [...block.children];
  const [question] = values(questionRow);
  const [thanks] = values(thanksRow);
  const [heading, fieldLabel, submitLabel] = values(formRow);

  const questionStep = document.createElement('div');
  questionStep.className = 'feedback-question-step';
  const actions = document.createElement('div');
  actions.className = 'feedback-actions';
  questionStep.append(fromValue('p', question, 'feedback-question'), actions);

  const thanksStep = document.createElement('p');
  thanksStep.className = 'feedback-thanks';
  thanksStep.setAttribute('role', 'status');
  thanksStep.append(fromValue('span', thanks));
  show(thanksStep, false);

  const formStep = document.createElement('div');
  formStep.className = 'feedback-form';
  show(formStep, false);
  const form = document.createElement('form');
  const label = fromValue('label', fieldLabel);
  label.htmlFor = 'feedback-comment';
  const field = document.createElement('textarea');
  field.id = 'feedback-comment';
  field.name = 'comment';
  field.rows = 5;
  const submit = fromValue('button', submitLabel);
  submit.type = 'submit';
  form.append(label, field, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    show(formStep, false);
    show(thanksStep, true);
  });
  formStep.append(fromValue('h2', heading), form);

  values(answersRow).forEach((answer, i) => {
    const button = fromValue('button', answer);
    button.type = 'button';
    button.addEventListener('click', () => {
      // the first answer is positive; any other answer asks for more detail
      const askForDetail = i > 0;
      show(questionStep, false);
      show(formStep, askForDetail);
      show(thanksStep, !askForDetail);
    });
    actions.append(button);
  });

  block.replaceChildren(questionStep, formStep, thanksStep);
}
