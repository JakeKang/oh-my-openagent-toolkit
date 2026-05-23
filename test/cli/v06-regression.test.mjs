import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { LOCKFILE_RELATIVE_PATH } from '../../src/cli/core/lockfile.mjs';
import { runCli } from '../../src/cli/main.mjs';
import { createTempTargetFromFixture } from './helpers/temp-target.mjs';

const PACKAGE_ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const BIN = path.join(PACKAGE_ROOT, 'bin', 'omo-toolkit.mjs');
const ROUTE_DOMAIN = '.opencode/commands/route-domain.md';
const PLUGIN_CONFIG = '.opencode/oh-my-openagent.jsonc';
const SUPPORT_POLICY = '.opencode/reference/support-policy.md';

test('migrate dry-run recognizes legacy all-identical targets and writes nothing', () => {
  const temp = createTempTargetFromFixture('empty-target');
  try {
    const install = runBin(['init', '--apply', '--target', temp.target]);
    assert.equal(install.status, 0, install.stderr);
    fs.rmSync(path.join(temp.target, LOCKFILE_RELATIVE_PATH));

    const before = snapshotTarget(temp.target);
    const result = runBin(['migrate', '--dry-run', '--target', temp.target]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /adopt-identical \.opencode\/commands\/route-domain\.md file\.current-identical/);
    assert.match(result.stdout, /adopt-identical \.opencode\/oh-my-openagent\.jsonc file\.current-identical/);
    assert.match(result.stdout, /agents-adopt AGENTS\.md agents\.current-managed-block/);
    assert.doesNotMatch(result.stdout, /\[write\]/);
    assert.deepEqual(snapshotTarget(temp.target), before);
  } finally {
    temp.cleanup();
  }
});

test('migrate dry-run reports mixed identical, known-stale, unknown, localOnly, and AGENTS review states without writes', async () => {
  const temp = createTempTargetFromFixture('unmarked-toolkit-agents');
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'omo-v06-regression-package-'));
  try {
    writeFile(temp.target, ROUTE_DOMAIN, fs.readFileSync(path.join(PACKAGE_ROOT, ROUTE_DOMAIN), 'utf8'));
    writeFile(temp.target, PLUGIN_CONFIG, fs.readFileSync(path.join(PACKAGE_ROOT, PLUGIN_CONFIG), 'utf8'));
    writeFile(temp.target, SUPPORT_POLICY, '# Project support policy\n');
    writeFile(temp.target, '.opencode/skills/project-local/SKILL.md', '# Project Local Skill\n');
    writeMixedMigrationPackage(packageRoot);
    const before = snapshotTarget(temp.target);

    const result = await captureRunCli(['migrate', '--dry-run', '--target', temp.target], { packageRoot });

    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /replace-known-stale \.opencode\/commands\/route-domain\.md file\.known-historical/);
    assert.match(result.stdout, /adopt-identical \.opencode\/oh-my-openagent\.jsonc file\.current-identical/);
    assert.match(result.stdout, /needs-review \.opencode\/reference\/support-policy\.md file\.project-owned/);
    assert.match(result.stdout, /preserve-project-owned \.opencode\/skills\/project-local\/SKILL\.md file\.non-manifest-managed-root/);
    assert.match(result.stdout, /needs-review AGENTS\.md agents\.unmarked-toolkit-text/);
    assert.doesNotMatch(result.stdout, /\[write\]/);
    assert.deepEqual(snapshotTarget(temp.target), before);
  } finally {
    temp.cleanup();
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
});

test('migrate apply blocks duplicate and partial AGENTS marker conflicts without writes', () => {
  for (const [fixture, rule] of [
    ['duplicate-agents-block', 'agents.duplicate-block'],
    ['partial-agents-block', 'agents.partial-block'],
  ]) {
    const temp = createTempTargetFromFixture(fixture);
    try {
      const before = snapshotTarget(temp.target);
      const result = runBin(['migrate', '--apply', '--target', temp.target]);

      assert.equal(result.status, 2, fixture);
      assert.match(result.stdout, new RegExp(`unsafe-conflict AGENTS\\.md ${escapeRegExp(rule)}`));
      assert.equal(fs.existsSync(path.join(temp.target, LOCKFILE_RELATIVE_PATH)), false);
      assert.deepEqual(snapshotTarget(temp.target), before);
    } finally {
      temp.cleanup();
    }
  }
});

test('migrate dry-run preserves valid managed AGENTS and reviewed manifest paths without writing', () => {
  const temp = createTempTargetFromFixture('empty-target');
  try {
    const install = runBin(['init', '--apply', '--target', temp.target]);
    assert.equal(install.status, 0, install.stderr);
    const routeOverride = '# Project route override\n';
    fs.writeFileSync(path.join(temp.target, ROUTE_DOMAIN), routeOverride);
    addLocalOnlyOverride(temp.target, ROUTE_DOMAIN);
    const before = snapshotTarget(temp.target);

    const result = runBin(['migrate', '--dry-run', '--target', temp.target]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /needs-review \.opencode\/commands\/route-domain\.md file\.project-owned/);
    assert.match(result.stdout, /noop AGENTS\.md agents\.current-managed-block/);
    assert.doesNotMatch(result.stdout, /replace-known-stale \.opencode\/commands\/route-domain\.md/);
    assert.equal(fs.readFileSync(path.join(temp.target, ROUTE_DOMAIN), 'utf8'), routeOverride);
    assert.deepEqual(snapshotTarget(temp.target), before);
  } finally {
    temp.cleanup();
  }
});

test('migrate apply blocks symlink escapes where a manifest file is expected without writes', { skip: process.platform === 'win32' }, () => {
  const temp = createTempTargetFromFixture('empty-target');
  try {
    fs.mkdirSync(path.dirname(path.join(temp.target, ROUTE_DOMAIN)), { recursive: true });
    fs.symlinkSync('..', path.join(temp.target, ROUTE_DOMAIN), 'dir');
    const before = snapshotTarget(temp.target);

    const result = runBin(['migrate', '--apply', '--target', temp.target]);

    assert.equal(result.status, 2);
    assert.match(result.stdout, /unsafe-conflict \.opencode\/commands\/route-domain\.md target\.symlink/);
    assert.equal(fs.existsSync(path.join(temp.target, LOCKFILE_RELATIVE_PATH)), false);
    assert.deepEqual(snapshotTarget(temp.target), before);
  } finally {
    temp.cleanup();
  }
});

test('init apply fails safely on read-only targets', { skip: typeof process.getuid === 'function' && process.getuid() === 0 }, () => {
  const temp = createTempTargetFromFixture('empty-target');
  try {
    fs.chmodSync(temp.target, 0o555);
    const result = runBin(['init', '--apply', '--target', temp.target]);
    fs.chmodSync(temp.target, 0o755);

    assert.notEqual(result.status, 0);
    assert.equal(fs.existsSync(path.join(temp.target, LOCKFILE_RELATIVE_PATH)), false);
  } finally {
    fs.chmodSync(temp.target, 0o755);
    temp.cleanup();
  }
});

test('update reports missing lockfile with existing .opencode as invalid state', () => {
  const temp = createTempTargetFromFixture('empty-target');
  try {
    fs.mkdirSync(path.join(temp.target, '.opencode'), { recursive: true });
    writeFile(temp.target, ROUTE_DOMAIN, 'legacy route command\n');
    const before = snapshotTarget(temp.target);

    const result = runBin(['update', '--check', '--target', temp.target]);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /update\.missing-lockfile/);
    assert.deepEqual(snapshotTarget(temp.target), before);
  } finally {
    temp.cleanup();
  }
});

test('init --guided in CI non-TTY previews and writes nothing', () => {
  const temp = createTempTargetFromFixture('empty-target');
  try {
    const before = snapshotTarget(temp.target);
    const result = runBin(['init', '--guided', '--target', temp.target], { env: { CI: 'true' } });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /outside an interactive TTY/);
    assert.match(result.stdout, /Init plan \(dry-run, profile full\):/);
    assert.doesNotMatch(result.stdout, /Applied init plan\./);
    assert.equal(fs.existsSync(path.join(temp.target, LOCKFILE_RELATIVE_PATH)), false);
    assert.deepEqual(snapshotTarget(temp.target), before);
  } finally {
    temp.cleanup();
  }
});

function writeMixedMigrationPackage(packageRoot) {
  const changedRoute = '# Changed route command\n';
  const currentConfig = fs.readFileSync(path.join(PACKAGE_ROOT, PLUGIN_CONFIG), 'utf8');
  writeFile(packageRoot, ROUTE_DOMAIN, changedRoute);
  writeFile(packageRoot, PLUGIN_CONFIG, currentConfig);
  writeFile(packageRoot, SUPPORT_POLICY, '# Desired support policy\n');
  fs.writeFileSync(path.join(packageRoot, 'toolkit-manifest.json'), `${JSON.stringify({
    schema: 1,
    toolkit: { version: '0.6.0-regression' },
    source: { gitCommit: 'test' },
    profiles: {
      full: { default: true, agentsBlock: true },
      core: { default: true, agentsBlock: true },
    },
    files: [
      manifestFile('command', ROUTE_DOMAIN, changedRoute),
      manifestFile('plugin-config', PLUGIN_CONFIG, currentConfig),
      manifestFile('reference', SUPPORT_POLICY, '# Desired support policy\n'),
    ],
  }, null, 2)}\n`);
}

function manifestFile(kind, relativePath, content) {
  return {
    kind,
    mode: '100644',
    owner: 'toolkit',
    path: relativePath,
    profiles: ['full', 'core'],
    sha256: sha256(content),
    size: Buffer.byteLength(content),
    strategy: 'managed',
  };
}

function addLocalOnlyOverride(target, relativePath) {
  const lockfilePath = path.join(target, LOCKFILE_RELATIVE_PATH);
  const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  lockfile.files = lockfile.files.filter((entry) => entry.path !== relativePath);
  lockfile.overrides ??= {};
  lockfile.overrides.skip ??= [];
  lockfile.overrides.localOnly = [...new Set([...(lockfile.overrides.localOnly ?? []), relativePath])].sort((left, right) => left.localeCompare(right, 'en-US'));
  fs.writeFileSync(lockfilePath, `${JSON.stringify(lockfile, null, 2)}\n`);
}

function writeFile(root, relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function runBin(args, options = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    cwd: PACKAGE_ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env ?? {}) },
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function captureRunCli(args, options = {}) {
  let stdout = '';
  let stderr = '';
  const code = await runCli(args, {
    cwd: PACKAGE_ROOT,
    packageRoot: options.packageRoot,
    stdout: { write: (chunk) => { stdout += chunk; } },
    stderr: { write: (chunk) => { stderr += chunk; } },
  });
  return { code, stdout, stderr };
}

function snapshotTarget(target) {
  if (path.dirname(path.dirname(target)) !== os.tmpdir()) throw new Error(`Refusing to snapshot non-temp target: ${target}`);
  if (!fs.existsSync(target)) return [];
  return JSON.parse(execFileSync(process.execPath, ['-e', `
    const fs = require('node:fs');
    const crypto = require('node:crypto');
    const path = require('node:path');
    const root = process.argv[1];
    const entries = [];
    function walk(current) {
      for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const absolute = path.join(current, entry.name);
        const relative = path.relative(root, absolute).split(path.sep).join('/');
        if (entry.isDirectory()) { entries.push({ path: relative, type: 'directory' }); walk(absolute); }
        else if (entry.isFile()) entries.push({ path: relative, type: 'file', hash: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex') });
        else if (entry.isSymbolicLink()) entries.push({ path: relative, type: 'symlink', target: fs.readlinkSync(absolute) });
      }
    }
    walk(root);
    process.stdout.write(JSON.stringify(entries));
  `, target], { encoding: 'utf8' }));
}

function sha256(content) {
  return crypto.createHash('sha256').update(Buffer.from(content, 'utf8')).digest('hex');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
