import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { PassThrough, Readable, Writable } from 'node:stream';
import test from 'node:test';

import { askChoice, askYesNo, isInteractive } from '../../src/cli/core/prompt.mjs';

test('isInteractive requires stdin TTY, stdout TTY, and non-CI env', () => {
  assert.equal(isInteractive({ stdin: ttyInput(''), stdout: ttyOutput(), env: {} }), true);
  assert.equal(isInteractive({ stdin: ttyInput(''), stdout: plainOutput(), env: {} }), false);
  assert.equal(isInteractive({ stdin: plainInput(''), stdout: ttyOutput(), env: {} }), false);
  assert.equal(isInteractive({ stdin: ttyInput(''), stdout: ttyOutput(), env: { CI: '1' } }), false);
});

test('askYesNo returns deterministic defaults without prompting outside TTY', async () => {
  const output = plainOutput();

  assert.equal(await askYesNo({ message: 'Install MCP?', defaultValue: false, stdin: plainInput('yes\n'), stdout: output, env: {} }), false);
  assert.equal(await askYesNo({ message: 'Migrate?', defaultValue: true, stdin: ttyInput('no\n'), stdout: output, env: { CI: 'true' } }), true);
  assert.equal(output.text, '');
});

test('askYesNo accepts yes, no, empty default, and invalid fallback', async () => {
  assert.equal(await askYesNo({ message: 'Apply?', defaultValue: false, stdin: ttyInput('yes\n'), stdout: ttyOutput(), env: {} }), true);
  assert.equal(await askYesNo({ message: 'Apply?', defaultValue: true, stdin: ttyInput('n\n'), stdout: ttyOutput(), env: {} }), false);
  assert.equal(await askYesNo({ message: 'Apply?', defaultValue: true, stdin: ttyInput('\n'), stdout: ttyOutput(), env: {} }), true);
  assert.equal(await askYesNo({ message: 'Apply?', defaultValue: false, stdin: ttyInput('maybe\nstill maybe\n'), stdout: ttyOutput(), env: {} }), false);
});

test('askChoice defaults deterministically in non-TTY and retries invalid interactive input', async () => {
  assert.equal(await askChoice({ message: 'Profile?', choices: ['core', 'full'], defaultValue: 'full', stdin: plainInput('core\n'), stdout: plainOutput(), env: {} }), 'full');
  assert.equal(await askChoice({ message: 'Profile?', choices: ['core', 'full'], defaultValue: 'full', stdin: ttyInput('bad\ncore\n'), stdout: ttyOutput(), env: {} }), 'core');
  assert.equal(await askChoice({ message: 'Profile?', choices: ['core', 'full'], defaultValue: 'full', stdin: ttyInput('bad\nworse\n'), stdout: ttyOutput(), env: {} }), 'full');
});

test('guided init defaults are documented as deterministic prompt defaults', async () => {
  const nonTty = { stdin: plainInput(''), stdout: plainOutput(), env: {} };
  const legacyDetected = true;
  const yesFlag = false;

  assert.equal(await askChoice({ ...nonTty, message: 'Profile?', choices: ['core', 'full'], defaultValue: 'full' }), 'full');
  assert.equal(await askYesNo({ ...nonTty, message: 'Install MCP?', defaultValue: false }), false);
  assert.equal(await askYesNo({ ...nonTty, message: 'Install root docs?', defaultValue: false }), false);
  assert.equal(await askYesNo({ ...nonTty, message: 'Migrate legacy install?', defaultValue: legacyDetected }), true);
  assert.equal(await askYesNo({ ...nonTty, message: 'Apply changes?', defaultValue: yesFlag }), false);
});

test('prompt module has no import-time stdout or stderr side effects', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', "import './src/cli/core/prompt.mjs';"], {
    cwd: new URL('../..', import.meta.url),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

function ttyInput(content) {
  const stream = new PassThrough();
  stream.isTTY = true;
  setImmediate(() => {
    stream.end(content);
  });
  return stream;
}

function plainInput(content) {
  return Readable.from([content]);
}

function ttyOutput() {
  const output = plainOutput();
  output.isTTY = true;
  return output;
}

function plainOutput() {
  let text = '';
  const output = new Writable({
    write(chunk, _encoding, callback) {
      text += chunk.toString();
      callback();
    },
  });
  Object.defineProperty(output, 'text', { get: () => text });
  return output;
}
