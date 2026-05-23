export function isInteractive({ stdin = process.stdin, stdout = process.stdout, env = process.env } = {}) {
  return Boolean(stdin?.isTTY && stdout?.isTTY && !env?.CI);
}

export async function askYesNo(options = {}) {
  const {
    message,
    defaultValue = false,
    stdin = process.stdin,
    stdout = process.stdout,
    env = process.env,
    maxAttempts = 2,
  } = options;
  const fallback = Boolean(defaultValue);

  if (!isInteractive({ stdin, stdout, env })) return fallback;

  const suffix = fallback ? 'Y/n' : 'y/N';
  const question = `${message ?? 'Continue?'} [${suffix}] `;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const answer = normalizeAnswer(await readPromptLine(stdin, stdout, question));
    if (answer === '') return fallback;
    if (['y', 'yes'].includes(answer)) return true;
    if (['n', 'no'].includes(answer)) return false;
    if (attempt < maxAttempts) stdout.write('Please answer yes or no.\n');
  }
  return fallback;
}

export async function askChoice(options = {}) {
  const {
    message,
    choices = [],
    defaultValue,
    stdin = process.stdin,
    stdout = process.stdout,
    env = process.env,
    maxAttempts = 2,
  } = options;
  const normalizedChoices = normalizeChoices(choices);
  const fallback = resolveChoiceDefault(normalizedChoices, defaultValue);

  if (!isInteractive({ stdin, stdout, env })) return fallback;

  const values = normalizedChoices.map((choice) => choice.value);
  const question = `${message ?? 'Choose'} (${values.join('/')}) [${fallback}] `;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const answer = normalizeAnswer(await readPromptLine(stdin, stdout, question));
    if (answer === '') return fallback;
    const match = normalizedChoices.find((choice) => choice.value.toLocaleLowerCase('en-US') === answer);
    if (match) return match.value;
    if (attempt < maxAttempts) stdout.write(`Please choose one of: ${values.join(', ')}.\n`);
  }
  return fallback;
}

const inputStates = new WeakMap();

async function readPromptLine(stdin, stdout, question) {
  stdout.write(question);
  return nextInputLine(stdin);
}

function nextInputLine(stdin) {
  const state = inputState(stdin);
  if (state.lines.length > 0) return Promise.resolve(state.lines.shift());
  if (state.ended) return Promise.resolve('');
  return new Promise((resolve) => {
    state.waiters.push(resolve);
  });
}

function inputState(stdin) {
  const cached = inputStates.get(stdin);
  if (cached) return cached;

  const state = { buffer: '', ended: false, lines: [], waiters: [] };
  inputStates.set(stdin, state);
  stdin.setEncoding?.('utf8');
  stdin.on('data', (chunk) => receiveInputChunk(state, chunk));
  stdin.on('end', () => endInput(state));
  stdin.on('error', () => endInput(state));
  return state;
}

function receiveInputChunk(state, chunk) {
  state.buffer += String(chunk);
  let newlineIndex = state.buffer.indexOf('\n');
  while (newlineIndex !== -1) {
    const line = state.buffer.slice(0, newlineIndex).replace(/\r$/, '');
    state.buffer = state.buffer.slice(newlineIndex + 1);
    deliverInputLine(state, line);
    newlineIndex = state.buffer.indexOf('\n');
  }
}

function endInput(state) {
  if (state.ended) return;
  state.ended = true;
  if (state.buffer.length > 0) {
    deliverInputLine(state, state.buffer.replace(/\r$/, ''));
    state.buffer = '';
  }
  while (state.waiters.length > 0) state.waiters.shift()('');
}

function deliverInputLine(state, line) {
  const waiter = state.waiters.shift();
  if (waiter) waiter(line);
  else state.lines.push(line);
}

function normalizeAnswer(answer) {
  return String(answer ?? '').trim().toLocaleLowerCase('en-US');
}

function normalizeChoices(choices) {
  const normalized = choices.map((choice) => {
    if (typeof choice === 'string') return { value: choice };
    return { value: String(choice?.value ?? '') };
  }).filter((choice) => choice.value.length > 0);

  if (normalized.length === 0) throw new Error('askChoice requires at least one choice.');
  return normalized;
}

function resolveChoiceDefault(choices, defaultValue) {
  const fallback = defaultValue ?? choices[0].value;
  if (!choices.some((choice) => choice.value === fallback)) {
    throw new Error(`askChoice default must be one of: ${choices.map((choice) => choice.value).join(', ')}.`);
  }
  return fallback;
}
