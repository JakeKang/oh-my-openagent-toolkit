import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { LOCKFILE_RELATIVE_PATH } from '../../src/cli/core/lockfile.mjs';
import { createTempTargetFromFixture, fixturePath } from './helpers/temp-target.mjs';

const PACKAGE_ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const BIN = path.join(PACKAGE_ROOT, 'bin', 'omo-toolkit.mjs');
const PLUGIN_CONFIG_PATH = '.opencode/oh-my-openagent.jsonc';

test('doctor reports empty target as not installed without writing', () => {
  const temp = createTempTargetFromFixture('empty-target');
  try {
    const before = snapshotTarget(temp.target);
    const result = runBin(['doctor', '--target', temp.target]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Doctor status: unhealthy/);
    assert.match(result.stdout, /Target root: /);
    assert.match(result.stdout, /doctor\.not-installed/);
    assert.match(result.stdout, new RegExp(`node bin/omo-toolkit\.mjs init --dry-run --target ${escapeRegExp(temp.target)}`));
    assert.deepEqual(snapshotTarget(temp.target), before);
  } finally {
    temp.cleanup();
  }
});

test('doctor exits 0 for valid installed target and does not mutate it', () => {
  const temp = installedTarget();
  try {
    const before = snapshotTarget(temp.target);
    const result = runBin(['doctor', '--target', temp.target]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Doctor status: healthy/);
    assert.match(result.stdout, /PASS doctor\.hashes/);
    assert.match(result.stdout, /PASS doctor\.agents\.markers/);
    assert.deepEqual(snapshotTarget(temp.target), before);
  } finally {
    temp.cleanup();
  }
});

test('doctor --json emits machine-readable diagnostics', () => {
  const temp = installedTarget();
  try {
    const result = runBin(['doctor', '--json', '--target', temp.target]);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, 'healthy');
    assert.equal(report.targetRoot, temp.target);
    assert.ok(report.rules.includes('doctor.not-installed'));
    assert.ok(Array.isArray(report.diagnostics));
    assert.ok(Array.isArray(report.checks));
    assert.ok(report.suggestedCommands.includes(`node bin/omo-toolkit.mjs validate --target ${temp.target}`));
  } finally {
    temp.cleanup();
  }
});

test('doctor reports invalid lockfile with actionable diagnostic', () => {
  const temp = createTempTargetFromFixture('empty-target');
  try {
    fs.mkdirSync(path.join(temp.target, '.opencode'), { recursive: true });
    fs.copyFileSync(fixturePath('invalid-lockfile', '.omo', 'lockfile.json'), path.join(temp.target, LOCKFILE_RELATIVE_PATH));
    const result = runBin(['doctor', '--target', temp.target]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /FAIL doctor\.lockfile\.invalid/);
    assert.match(result.stdout, /init --dry-run/);
  } finally {
    temp.cleanup();
  }
});

test('doctor reports top-level plugin paths as config issue', () => {
  const temp = installedTarget();
  try {
    fs.copyFileSync(fixturePath('bad-plugin-config', PLUGIN_CONFIG_PATH), path.join(temp.target, PLUGIN_CONFIG_PATH));
    rewriteLockRecordHash(temp.target, PLUGIN_CONFIG_PATH);
    const result = runBin(['doctor', '--target', temp.target]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /FAIL doctor\.plugin\.config Plugin config must not define top-level paths\./);
  } finally {
    temp.cleanup();
  }
});

function installedTarget() {
  const temp = createTempTargetFromFixture('empty-target');
  const result = runBin(['init', '--apply', '--target', temp.target]);
  assert.equal(result.status, 0, result.stderr);
  return temp;
}

function runBin(args) {
  return spawnSync(process.execPath, [BIN, ...args], {
    cwd: PACKAGE_ROOT,
    encoding: 'utf8',
  });
}

function rewriteLockRecordHash(target, relativePath) {
  const lockfilePath = path.join(target, LOCKFILE_RELATIVE_PATH);
  const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  const record = lockfile.files.find((entry) => entry.path === relativePath);
  assert.ok(record, `expected lock record for ${relativePath}`);
  record.sha256 = sha256(fs.readFileSync(path.join(target, relativePath)));
  fs.writeFileSync(lockfilePath, `${JSON.stringify(lockfile, null, 2)}\n`);
}

function snapshotTarget(target) {
  if (path.dirname(path.dirname(target)) !== os.tmpdir()) throw new Error(`Refusing to snapshot non-temp target: ${target}`);
  return JSON.parse(execFileSync(process.execPath, ['-e', `
    const fs = require('node:fs');
    const crypto = require('node:crypto');
    const path = require('node:path');
    const root = process.argv[1];
    const entries = [];
    function walk(current) {
      for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
        const absolute = path.join(current, entry.name);
        const relative = path.relative(root, absolute).split(path.sep).join('/');
        if (entry.isDirectory()) { entries.push({ path: relative, type: 'directory' }); walk(absolute); }
        else if (entry.isFile()) entries.push({ path: relative, type: 'file', hash: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex') });
      }
    }
    walk(root);
    process.stdout.write(JSON.stringify(entries));
  `, target], { encoding: 'utf8' }));
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
