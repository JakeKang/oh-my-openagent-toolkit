import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { agentsBlockSha256, inspectAgentsManagedBlock } from '../core/agents-block.mjs';
import { hashFile } from '../core/hash.mjs';
import { LOCKFILE_RELATIVE_PATH, LockfileError, manifestSha256, parseLockfileContent } from '../core/lockfile.mjs';
import { MANIFEST_PATH } from '../core/manifest.mjs';
import { resolveOutputPath, resolvePackageRoot, resolveTargetRoot } from '../core/paths.mjs';

export const DOCTOR_RULES = Object.freeze({
  RUNTIME_NODE: 'doctor.runtime.node',
  RUNTIME_BUN: 'doctor.runtime.bun',
  PACKAGE_VERSION: 'doctor.package.version',
  SOURCE_MANIFEST: 'doctor.source.manifest',
  TARGET_ROOT: 'doctor.target.root',
  TARGET_OPENCODE: 'doctor.target.opencode',
  NOT_INSTALLED: 'doctor.not-installed',
  LOCKFILE_PARSE: 'doctor.lockfile.parse',
  LOCKFILE_INVALID: 'doctor.lockfile.invalid',
  MANIFEST_MATCH: 'doctor.manifest.match',
  FILE_HASHES: 'doctor.hashes',
  AGENTS_MARKERS: 'doctor.agents.markers',
  PLUGIN_CONFIG: 'doctor.plugin.config',
  LOCAL_ONLY: 'doctor.local-only',
});

const RULE_ORDER = Object.freeze(Object.values(DOCTOR_RULES));
const AGENTS_PATH = 'AGENTS.md';
const PLUGIN_CONFIG_PATH = '.opencode/oh-my-openagent.jsonc';

export async function runDoctorCommand(argv = [], options = {}) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  let flags;
  try {
    flags = parseDoctorFlags(argv);
  } catch (error) {
    writeLine(stderr, error.message);
    writeLine(stderr, doctorUsage());
    return 2;
  }

  const packageRoot = options.packageRoot ?? resolvePackageRoot(import.meta.url);
  const targetRoot = resolveTargetRoot(argv, options.cwd ?? process.cwd());

  try {
    const report = diagnoseTarget({ packageRoot, targetRoot });
    printReport(stdout, report, { json: flags.json });
    return report.status === 'healthy' ? 0 : 1;
  } catch (error) {
    writeLine(stderr, `doctor failed: ${error.message}`);
    return 1;
  }
}

function parseDoctorFlags(argv) {
  const flags = { json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') flags.json = true;
    else if (arg === '--target') {
      index += 1;
      requireFlagValue(argv[index], '--target');
    } else if (arg.startsWith('--target=')) {
      requireFlagValue(arg.slice('--target='.length), '--target');
    } else {
      throw new Error(`Unknown doctor option: ${arg}`);
    }
  }
  return flags;
}

function requireFlagValue(value, flag) {
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

function diagnoseTarget({ packageRoot, targetRoot }) {
  const checks = [];
  const suggestedCommands = new Set();
  const commands = nextCommands(targetRoot);
  const packageJson = readJson(path.join(packageRoot, 'package.json'));
  const version = fs.readFileSync(path.join(packageRoot, 'VERSION'), 'utf8').trim();
  const manifestPath = path.join(packageRoot, MANIFEST_PATH);
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : null;

  add(checks, DOCTOR_RULES.RUNTIME_NODE, nodeMajorVersion() >= 20 ? 'pass' : 'fail', 'Node.js runtime version check.', {
    actual: process.versions.node,
    expected: '>=20',
    suggestedCommands: nodeMajorVersion() >= 20 ? [] : ['Install Node.js 20 or newer, then rerun doctor.'],
  }, suggestedCommands);

  add(checks, DOCTOR_RULES.PACKAGE_VERSION, packageJson.version === version ? 'pass' : 'fail', 'package.json version matches VERSION.', {
    packageVersion: packageJson.version,
    versionFile: version,
    suggestedCommands: packageJson.version === version ? [] : ['Regenerate or reinstall the toolkit package, then rerun doctor.'],
  }, suggestedCommands);

  add(checks, DOCTOR_RULES.SOURCE_MANIFEST, manifest ? 'pass' : 'fail', 'Source toolkit manifest is present.', {
    path: MANIFEST_PATH,
    manifestSha256: manifest ? manifestSha256(manifest) : null,
    suggestedCommands: manifest ? [] : ['Restore toolkit-manifest.json from the toolkit package, then rerun doctor.'],
  }, suggestedCommands);

  const targetExists = fs.existsSync(targetRoot);
  const targetWritable = targetExists && isWritableDirectory(targetRoot);
  add(checks, DOCTOR_RULES.TARGET_ROOT, targetExists && targetWritable ? 'pass' : 'fail', targetExists ? 'Target root exists and is writable.' : 'Target root does not exist.', {
    targetRoot,
    exists: targetExists,
    writable: targetWritable,
    suggestedCommands: targetExists && targetWritable ? [] : [commands.initDryRun],
  }, suggestedCommands);

  const opencodePath = path.join(targetRoot, '.opencode');
  add(checks, DOCTOR_RULES.TARGET_OPENCODE, fs.existsSync(opencodePath) ? 'pass' : 'info', '.opencode directory status.', {
    path: '.opencode',
    exists: fs.existsSync(opencodePath),
  }, suggestedCommands);

  const lockfileResult = readLockfile(targetRoot);
  if (lockfileResult.state === 'missing') {
    add(checks, DOCTOR_RULES.NOT_INSTALLED, 'fail', 'Toolkit lockfile is missing; target is not installed.', {
      path: LOCKFILE_RELATIVE_PATH,
      suggestedCommands: fs.existsSync(opencodePath) ? [commands.migrateDryRun, commands.initDryRun] : [commands.initDryRun],
    }, suggestedCommands);
  } else if (lockfileResult.state === 'invalid') {
    add(checks, DOCTOR_RULES.LOCKFILE_INVALID, 'fail', 'Toolkit lockfile is invalid and cannot be parsed.', {
      path: LOCKFILE_RELATIVE_PATH,
      code: lockfileResult.code,
      suggestedCommands: [commands.initDryRun],
    }, suggestedCommands);
  } else {
    add(checks, DOCTOR_RULES.LOCKFILE_PARSE, 'pass', 'Toolkit lockfile parsed successfully.', {
      path: LOCKFILE_RELATIVE_PATH,
      profile: lockfileResult.lockfile.profile,
      files: lockfileResult.lockfile.files.length,
    }, suggestedCommands);
  }

  if (manifest && lockfileResult.lockfile) {
    diagnoseInstalledTarget({ targetRoot, manifest, lockfile: lockfileResult.lockfile, checks, suggestedCommands, commands });
  }

  const bunAvailable = hasBun();
  add(checks, DOCTOR_RULES.RUNTIME_BUN, bunAvailable ? 'pass' : 'info', 'Optional Bun runtime availability.', {
    optional: true,
    available: bunAvailable,
  }, suggestedCommands);

  if (suggestedCommands.size === 0) suggestedCommands.add(commands.validate);
  const status = checks.some((check) => check.status === 'fail') ? 'unhealthy' : 'healthy';
  return {
    status,
    targetRoot,
    rules: RULE_ORDER,
    diagnostics: checks,
    checks,
    suggestedCommands: [...suggestedCommands],
  };
}

function diagnoseInstalledTarget({ targetRoot, manifest, lockfile, checks, suggestedCommands, commands }) {
  const expectedManifestSha256 = manifestSha256(manifest);
  const manifestMatches = lockfile.manifest.sha256 === expectedManifestSha256;
  add(checks, DOCTOR_RULES.MANIFEST_MATCH, manifestMatches ? 'pass' : 'fail', 'Lockfile manifest identity matches this toolkit package.', {
    path: LOCKFILE_RELATIVE_PATH,
    expectedSha256: expectedManifestSha256,
    actualSha256: lockfile.manifest.sha256,
    suggestedCommands: manifestMatches ? [] : [commands.updateCheck],
  }, suggestedCommands);

  const hashSummary = hashManagedFiles(targetRoot, lockfile);
  add(checks, DOCTOR_RULES.FILE_HASHES, hashSummary.failed === 0 ? 'pass' : 'fail', 'Lock-owned file hashes match the lockfile.', {
    checked: hashSummary.checked,
    failed: hashSummary.failed,
    missing: hashSummary.missing,
    mismatched: hashSummary.mismatched,
    suggestedCommands: hashSummary.failed === 0 ? [] : [commands.validate, commands.updateCheck],
  }, suggestedCommands);

  const agents = inspectAgents(targetRoot, lockfile, manifest);
  add(checks, DOCTOR_RULES.AGENTS_MARKERS, agents.ok ? 'pass' : 'fail', agents.message, {
    path: AGENTS_PATH,
    ...agents.details,
    suggestedCommands: agents.ok ? [] : [commands.validate],
  }, suggestedCommands);

  const plugin = inspectPluginConfig(targetRoot, lockfile);
  add(checks, DOCTOR_RULES.PLUGIN_CONFIG, plugin.ok ? 'pass' : 'fail', plugin.message, {
    path: PLUGIN_CONFIG_PATH,
    ...plugin.details,
    suggestedCommands: plugin.ok ? [] : [commands.validate],
  }, suggestedCommands);

  const localOnly = inspectLocalOnly(lockfile);
  add(checks, DOCTOR_RULES.LOCAL_ONLY, localOnly.paths.length > 0 ? 'info' : 'pass', localOnly.message, {
    preservedPaths: localOnly.paths,
    count: localOnly.paths.length,
  }, suggestedCommands);
}

function inspectLocalOnly(lockfile) {
  const paths = [...(lockfile.overrides?.localOnly ?? [])].sort((left, right) => left.localeCompare(right, 'en-US'));
  return {
    paths,
    message: paths.length > 0 ? 'Project-owned localOnly paths are preserved.' : 'No project-owned localOnly paths are recorded.',
  };
}

function readLockfile(targetRoot) {
  const lockfilePath = resolveOutputPath(targetRoot, LOCKFILE_RELATIVE_PATH);
  if (!fs.existsSync(lockfilePath)) return { state: 'missing', lockfile: null };
  try {
    return { state: 'valid', lockfile: parseLockfileContent(fs.readFileSync(lockfilePath, 'utf8')) };
  } catch (error) {
    return {
      state: 'invalid',
      lockfile: null,
      code: error instanceof LockfileError ? error.code : error.message,
    };
  }
}

function hashManagedFiles(targetRoot, lockfile) {
  const summary = { checked: 0, failed: 0, missing: [], mismatched: [] };
  for (const record of lockfile.files ?? []) {
    summary.checked += 1;
    const absolutePath = resolveOutputPath(targetRoot, record.path);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      summary.failed += 1;
      summary.missing.push(record.path);
      continue;
    }
    const actualSha256 = hashFile(absolutePath).sha256;
    if (actualSha256 !== record.sha256) {
      summary.failed += 1;
      summary.mismatched.push({ path: record.path, expectedSha256: record.sha256, actualSha256 });
    }
  }
  return summary;
}

function inspectAgents(targetRoot, lockfile, manifest) {
  if (!profileUsesAgentsBlock(manifest, lockfile.profile) && !lockfile.agentsBlock) {
    return { ok: true, message: 'AGENTS managed block is not required for this profile.', details: { required: false } };
  }
  const agentsPath = resolveOutputPath(targetRoot, AGENTS_PATH);
  if (!fs.existsSync(agentsPath) || !fs.statSync(agentsPath).isFile()) {
    return { ok: false, message: 'AGENTS.md is missing the managed block.', details: { state: 'missing-file' } };
  }
  const inspected = inspectAgentsManagedBlock(fs.readFileSync(agentsPath, 'utf8'));
  if (inspected.state !== 'managed' || inspected.code || inspected.beginCount !== 1 || inspected.endCount !== 1) {
    return { ok: false, message: 'AGENTS.md managed block markers are missing or invalid.', details: { state: inspected.state, code: inspected.code ?? null, beginCount: inspected.beginCount, endCount: inspected.endCount } };
  }
  if (!lockfile.agentsBlock) {
    return { ok: false, message: 'Lockfile is missing AGENTS managed block ownership.', details: { state: 'missing-lockfile-ownership' } };
  }
  const actualSha256 = agentsBlockSha256(inspected.rawBody);
  if (actualSha256 !== lockfile.agentsBlock.sha256) {
    return { ok: false, message: 'AGENTS.md managed block hash does not match the lockfile.', details: { expectedSha256: lockfile.agentsBlock.sha256, actualSha256 } };
  }
  return { ok: true, message: 'AGENTS.md managed block is present and owned.', details: { state: 'managed', sha256: actualSha256 } };
}

function inspectPluginConfig(targetRoot, lockfile) {
  if (!ownsPath(lockfile, PLUGIN_CONFIG_PATH)) return { ok: true, message: 'Plugin config is not lock-owned.', details: { owned: false } };
  const configPath = resolveOutputPath(targetRoot, PLUGIN_CONFIG_PATH);
  if (!fs.existsSync(configPath) || !fs.statSync(configPath).isFile()) return { ok: false, message: 'Lock-owned plugin config is missing.', details: { owned: true, exists: false } };
  const parsed = parseJsoncObject(fs.readFileSync(configPath, 'utf8'));
  if (parsed && Object.hasOwn(parsed, 'paths')) {
    return { ok: false, message: 'Plugin config must not define top-level paths.', details: { owned: true, issue: 'top-level paths' } };
  }
  return { ok: true, message: 'Plugin config shape is valid.', details: { owned: true } };
}

function profileUsesAgentsBlock(manifest, profile) {
  if (manifest.profiles?.[profile]?.agentsBlock === false) return false;
  if (Array.isArray(manifest.agentsBlock?.profiles)) return manifest.agentsBlock.profiles.includes(profile);
  return profile === 'core' || profile === 'full';
}

function ownsPath(lockfile, relativePath) {
  return (lockfile.files ?? []).some((record) => record.path === relativePath);
}

function parseJsoncObject(content) {
  try {
    const parsed = JSON.parse(stripJsonc(String(content)));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function stripJsonc(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/,\s*([}\]])/g, '$1');
}

function add(checks, ruleId, status, message, details = {}, suggestedCommands) {
  const check = { ruleId, status, message, ...details };
  checks.push(check);
  for (const command of details.suggestedCommands ?? []) suggestedCommands.add(command);
}

function nextCommands(targetRoot) {
  return {
    initDryRun: `node bin/omo-toolkit.mjs init --dry-run --target ${targetRoot}`,
    migrateDryRun: `node bin/omo-toolkit.mjs migrate --dry-run --target ${targetRoot}`,
    updateCheck: `node bin/omo-toolkit.mjs update --check --target ${targetRoot}`,
    validate: `node bin/omo-toolkit.mjs validate --target ${targetRoot}`,
  };
}

function nodeMajorVersion() {
  return Number.parseInt(process.versions.node.split('.')[0], 10);
}

function hasBun() {
  return spawnSync('bun', ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).status === 0;
}

function isWritableDirectory(directoryPath) {
  try {
    return fs.statSync(directoryPath).isDirectory() && fs.accessSync(directoryPath, fs.constants.W_OK) === undefined;
  } catch {
    return false;
  }
}

function printReport(stdout, report, { json }) {
  if (json) {
    writeLine(stdout, JSON.stringify(report, null, 2));
    return;
  }
  writeLine(stdout, `Doctor status: ${report.status}`);
  writeLine(stdout, `Target root: ${report.targetRoot}`);
  writeLine(stdout, `Rules checked: ${report.rules.join(', ')}`);
  for (const check of report.checks) {
    writeLine(stdout, `${check.status.toUpperCase()} ${check.ruleId} ${check.message}`);
  }
  writeLine(stdout, 'Next commands:');
  for (const command of report.suggestedCommands) writeLine(stdout, `- ${command}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeLine(stream, message = '') {
  stream.write(`${message}\n`);
}

function doctorUsage() {
  return 'Usage: omo-toolkit doctor [--target <path>] [--json]';
}
