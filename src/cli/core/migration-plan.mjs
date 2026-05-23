import { classifyAgentsMigration } from './agents-migration.mjs';
import { hashBuffer } from './hash.mjs';
import { findHistoricalFileHash, loadHistoricalHashRegistry } from './historical-hashes.mjs';
import {
  LOCKFILE_RELATIVE_PATH,
  buildLockfile,
  buildLockfileFileRecord,
  lockfileToJson,
  manifestSha256,
} from './lockfile.mjs';
import { validateManifestFileEntry } from './manifest.mjs';
import { validateRelativePath } from './paths.mjs';

export const MIGRATION_ACTIONS = Object.freeze({
  ADOPT_IDENTICAL: 'adopt-identical',
  REPLACE_KNOWN_STALE: 'replace-known-stale',
  CREATE_MISSING: 'create-missing',
  PRESERVE_PROJECT_OWNED: 'preserve-project-owned',
  NEEDS_REVIEW: 'needs-review',
  UNSAFE_CONFLICT: 'unsafe-conflict',
  AGENTS_INSERT: 'agents-insert',
  AGENTS_ADOPT: 'agents-adopt',
  AGENTS_REPLACE: 'agents-replace',
  LOCKFILE_WRITE: 'lockfile-write',
  NOOP: 'noop',
});

export const MIGRATION_PLAN_MODES = Object.freeze(['apply', 'dry-run', 'diff']);

export const MIGRATION_RULES = Object.freeze({
  AGENTS_NOT_REQUIRED: 'agents.not-required',
  AGENTS_CONTENT_MISSING: 'agents.content-missing',
  FILE_CURRENT_IDENTICAL: 'file.current-identical',
  FILE_KNOWN_HISTORICAL: 'file.known-historical',
  FILE_MISSING: 'file.missing',
  FILE_NON_MANIFEST_MANAGED_ROOT: 'file.non-manifest-managed-root',
  FILE_PROJECT_OWNED: 'file.project-owned',
  TARGET_DIRECTORY: 'target.directory',
  TARGET_INVALID_PATH: 'target.invalid-path',
  TARGET_SYMLINK: 'target.symlink',
  TARGET_UNSAFE_TYPE: 'target.unsafe-type',
  LOCKFILE_WRITE: 'lockfile.write',
  NOOP: 'migration.noop',
});

const ACTION_ORDER = new Map(Object.values(MIGRATION_ACTIONS).map((action, index) => [action, index]));
const AGENTS_PATH = 'AGENTS.md';
const DEFAULT_NOW = '1970-01-01T00:00:00.000Z';
const MANAGED_ROOTS = Object.freeze(['.opencode/skills/', '.opencode/commands/', '.opencode/reference/']);
const PLUGIN_CONFIG_PATH = '.opencode/oh-my-openagent.jsonc';

export function planMigration(options = {}) {
  const manifest = requireManifest(options.manifest);
  const mode = normalizeMode(options.mode ?? 'dry-run');
  const previousLockfile = options.lockfile ?? options.previousLockfile ?? null;
  const profile = options.profile ?? previousLockfile?.profile ?? defaultProfile(manifest);
  const now = options.now ?? previousLockfile?.updatedAt ?? previousLockfile?.installedAt ?? DEFAULT_NOW;
  const targetSnapshot = normalizeTargetFiles(options.targetFiles ?? {});
  const targetFiles = targetSnapshot.files;
  const historicalHashRegistry = historicalRegistryFromOptions(options);
  const manifestDigest = options.manifestSha256 ?? manifestSha256(manifest);
  const actions = [];
  const oldRecordsByPath = indexLockfileFiles(previousLockfile);
  const conflicts = [];
  const reviews = [];
  const nextFileRecords = [];
  const localOnly = new Set(previousLockfile?.overrides?.localOnly ?? []);
  const skip = new Set(previousLockfile?.overrides?.skip ?? []);
  const activeManifestPaths = new Set();

  for (const unsafeEntry of targetSnapshot.unsafeEntries) {
    recordUnsafeConflict(actions, conflicts, {
      path: unsafeEntry.path,
      profile,
      reason: unsafeEntry.reason,
      ruleId: unsafeEntry.ruleId,
      targetSha256: unsafeEntry.sha256,
    });
  }

  for (const entry of sortedManifestFiles(manifest)) {
    if (isOptInEntry(entry)) {
      skip.add(entry.path);
      continue;
    }
    if (!entry.profiles.includes(profile)) continue;

    activeManifestPaths.add(entry.path);
    planManifestFile({
      actions,
      entry,
      conflicts,
      historicalHashRegistry,
      localOnly,
      nextFileRecords,
      oldRecord: oldRecordsByPath.get(entry.path),
      now,
      profile,
      reviews,
      targetFile: targetFiles.get(entry.path) ?? null,
    });
  }

  planNonManifestManagedRootFiles({
    actions,
    activeManifestPaths,
    conflicts,
    localOnly,
    profile,
    reviews,
    targetFiles,
  });

  const agentsPlan = planAgents({ manifest, options, previousLockfile, profile, targetFiles, historicalHashRegistry });
  if (agentsPlan) {
    recordAction(actions, agentsPlan.action, { write: agentsPlan.write });
    if (agentsPlan.review) reviews.push(agentsPlan.action);
    if (agentsPlan.conflict) conflicts.push(agentsPlan.action);
  }

  if (actions.length === 0) {
    recordAction(actions, {
      action: MIGRATION_ACTIONS.NOOP,
      kind: 'migration',
      path: '<migration>',
      profile,
      reason: 'no migration actions were needed',
      ruleId: MIGRATION_RULES.NOOP,
    });
  }

  const blocked = conflicts.length > 0;
  let lockfile = null;
  let lockfileContent = null;
  if (!blocked) {
    const lockfileAgentsBlock = agentsPlan?.lockfileAgentsBlock ?? previousLockfile?.agentsBlock ?? null;
    lockfile = buildLockfile({
      agentsBlock: lockfileAgentsBlock,
      files: nextFileRecords,
      manifest: { ...manifest, agentsBlock: lockfileAgentsBlock },
      manifestSha256: manifestDigest,
      now,
      overrides: {
        skip: [...skip],
        localOnly: [...localOnly],
      },
      previousLockfile,
      profile,
      toolkit: {
        version: options.toolkit?.version ?? manifest.toolkit?.version ?? null,
        packageVersion: options.toolkit?.packageVersion ?? manifest.toolkit?.packageVersion ?? manifest.toolkit?.version ?? null,
        sourceCommit: options.toolkit?.sourceCommit ?? manifest.source?.gitCommit ?? null,
      },
    });
    lockfileContent = lockfileToJson(lockfile);
    const previousLockfileContent = previousLockfile ? lockfileToJson(previousLockfile) : null;
    if (lockfileContent !== previousLockfileContent) {
      recordAction(actions, {
        action: MIGRATION_ACTIONS.LOCKFILE_WRITE,
        kind: 'lockfile',
        path: LOCKFILE_RELATIVE_PATH,
        profile,
        reason: 'write migration ownership lockfile',
        ruleId: MIGRATION_RULES.LOCKFILE_WRITE,
        sha256: hashBuffer(Buffer.from(lockfileContent, 'utf8')).sha256,
      }, { write: true });
    }
  }

  const finalizedActions = finalizeActions(sortActions(actions), { blocked, mode });
  const finalizedLocalOnly = [...localOnly].sort((left, right) => left.localeCompare(right, 'en-US'));
  const plannedWrites = finalizedActions
    .filter((action) => action.write)
    .map((action) => plannedWriteForAction(action, { lockfileContent }));

  return {
    ok: !blocked,
    blocked,
    mode,
    profile,
    actions: finalizedActions,
    conflicts: sortActions(conflicts),
    reviews: sortActions(reviews),
    localOnly: finalizedLocalOnly,
    plannedWrites,
    lockfile,
    lockfileContent,
  };
}

function planManifestFile(context) {
  const {
    actions,
    entry,
    conflicts,
    historicalHashRegistry,
    localOnly,
    nextFileRecords,
    now,
    oldRecord,
    profile,
    reviews,
    targetFile,
  } = context;

  if (!targetFile) {
    recordManagedFile(actions, nextFileRecords, entry, {
      action: MIGRATION_ACTIONS.CREATE_MISSING,
      installedAt: now,
      profile,
      reason: 'manifest file is missing from the target',
      ruleId: MIGRATION_RULES.FILE_MISSING,
      write: true,
    });
    return;
  }

  if (targetFile.unsafe) {
    recordUnsafeConflict(actions, conflicts, {
      path: entry.path,
      profile,
      reason: targetFile.reason,
      ruleId: targetFile.ruleId,
      sourceSha256: entry.sha256,
      targetSha256: targetFile.sha256,
    });
    return;
  }

  if (targetFile.sha256 === entry.sha256) {
    if (isCurrentLockfileRecord(oldRecord, entry, profile)) {
      recordManagedFile(actions, nextFileRecords, entry, {
        action: MIGRATION_ACTIONS.NOOP,
        installedAt: oldRecord.installedAt ?? now,
        lockfileRecord: oldRecord,
        profile,
        reason: 'target file is already owned by the lockfile and matches the current manifest payload',
        ruleId: MIGRATION_RULES.FILE_CURRENT_IDENTICAL,
        targetSha256: targetFile.sha256,
      });
      return;
    }

    recordManagedFile(actions, nextFileRecords, entry, {
      action: MIGRATION_ACTIONS.ADOPT_IDENTICAL,
      installedAt: oldRecord?.installedAt ?? now,
      profile,
      reason: 'target file matches the current manifest payload',
      ruleId: MIGRATION_RULES.FILE_CURRENT_IDENTICAL,
      targetSha256: targetFile.sha256,
    });
    return;
  }

  const historicalMatch = findHistoricalFileHash(entry.path, targetFile.sha256, historicalHashRegistry);
  if (historicalMatch) {
    recordManagedFile(actions, nextFileRecords, entry, {
      action: MIGRATION_ACTIONS.REPLACE_KNOWN_STALE,
      details: { historicalMatch },
      installedAt: now,
      previousSha256: targetFile.sha256,
      profile,
      reason: 'target file matches a known historical toolkit payload',
      ruleId: MIGRATION_RULES.FILE_KNOWN_HISTORICAL,
      targetSha256: targetFile.sha256,
      write: true,
    });
    return;
  }

  localOnly.add(entry.path);
  const action = withoutUndefined({
    action: MIGRATION_ACTIONS.NEEDS_REVIEW,
    kind: 'file',
    mode: entry.mode,
    path: entry.path,
    profile,
    reason: 'target file does not match current or known historical toolkit payloads',
    review: true,
    ruleId: MIGRATION_RULES.FILE_PROJECT_OWNED,
    sourceSha256: entry.sha256,
    strategy: entry.strategy,
    targetSha256: targetFile.sha256,
  });
  recordAction(actions, action);
  reviews.push(action);
}

function planNonManifestManagedRootFiles(context) {
  const { actions, activeManifestPaths, conflicts, localOnly, profile, reviews, targetFiles } = context;
  for (const [path, targetFile] of [...targetFiles.entries()].sort(compareTargetFileEntries)) {
    if (path === AGENTS_PATH || path === LOCKFILE_RELATIVE_PATH || activeManifestPaths.has(path)) continue;
    if (!isManagedInstallPath(path)) continue;

    if (targetFile.unsafe) {
      recordUnsafeConflict(actions, conflicts, {
        path,
        profile,
        reason: targetFile.reason,
        ruleId: targetFile.ruleId,
        targetSha256: targetFile.sha256,
      });
      continue;
    }

    localOnly.add(path);
    const action = withoutUndefined({
      action: MIGRATION_ACTIONS.PRESERVE_PROJECT_OWNED,
      kind: 'file',
      path,
      profile,
      reason: 'managed install root contains a non-manifest project file',
      review: true,
      ruleId: MIGRATION_RULES.FILE_NON_MANIFEST_MANAGED_ROOT,
      targetSha256: targetFile.sha256,
    });
    recordAction(actions, action);
    reviews.push(action);
  }
}

function planAgents({ manifest, options, previousLockfile, profile, targetFiles, historicalHashRegistry }) {
  if (!profileUsesAgentsBlock(manifest, profile)) {
    return {
      action: {
        action: MIGRATION_ACTIONS.NOOP,
        kind: 'agents',
        path: AGENTS_PATH,
        profile,
        reason: 'AGENTS managed block is not required for this profile',
        ruleId: MIGRATION_RULES.AGENTS_NOT_REQUIRED,
      },
      lockfileAgentsBlock: null,
      write: false,
    };
  }

  const agentsSource = agentsContentFromOptions(options, targetFiles);
  if (agentsSource.missingContent) {
    return {
      action: {
        action: MIGRATION_ACTIONS.UNSAFE_CONFLICT,
        kind: 'agents',
        path: AGENTS_PATH,
        profile,
        reason: 'AGENTS.md content is required to classify migration safety',
        ruleId: MIGRATION_RULES.AGENTS_CONTENT_MISSING,
        state: 'content-missing',
      },
      conflict: true,
      lockfileAgentsBlock: null,
      write: false,
    };
  }

  const result = classifyAgentsMigration(agentsSource.content, {
    agentsExists: agentsSource.exists,
    exists: agentsSource.exists,
    historicalHashRegistry,
    historicalRegistry: historicalHashRegistry,
  });
  const alreadyOwnedAgentsBlock = result.action === MIGRATION_ACTIONS.AGENTS_ADOPT
    && previousLockfile?.agentsBlock?.sha256 === result.agentsBlock?.sha256;
  const action = withoutUndefined({
    action: alreadyOwnedAgentsBlock ? MIGRATION_ACTIONS.NOOP : result.action,
    agentsBlock: result.agentsBlock,
    content: result.content,
    details: emptyObject(result.details) ? undefined : result.details,
    kind: result.kind,
    path: result.path,
    previousAgentsBlock: result.previousAgentsBlock,
    profile,
    reason: result.reason,
    review: result.review || undefined,
    ruleId: result.ruleId,
    state: result.state,
  });

  return {
    action,
    conflict: result.blocked,
    lockfileAgentsBlock: result.blocked || result.review
      ? null
      : alreadyOwnedAgentsBlock ? previousLockfile.agentsBlock : result.agentsBlock,
    review: result.review,
    write: result.write,
  };
}

function recordUnsafeConflict(actions, conflicts, options) {
  const action = withoutUndefined({
    action: MIGRATION_ACTIONS.UNSAFE_CONFLICT,
    kind: 'file',
    path: options.path,
    profile: options.profile,
    reason: options.reason,
    ruleId: options.ruleId,
    sourceSha256: options.sourceSha256,
    targetSha256: options.targetSha256,
  });
  recordAction(actions, action);
  conflicts.push(action);
}

function recordManagedFile(actions, nextFileRecords, entry, options) {
  const targetSha256 = options.action === MIGRATION_ACTIONS.CREATE_MISSING || options.action === MIGRATION_ACTIONS.REPLACE_KNOWN_STALE
    ? entry.sha256
    : options.targetSha256 ?? entry.sha256;
  const action = withoutUndefined({
    action: options.action,
    details: options.details,
    kind: 'file',
    mode: entry.mode,
    path: entry.path,
    previousSha256: options.previousSha256,
    profile: options.profile,
    reason: options.reason,
    ruleId: options.ruleId,
    sourceSha256: entry.sha256,
    strategy: entry.strategy,
    targetSha256,
  });
  recordAction(actions, action, { write: options.write ?? false });
  nextFileRecords.push(options.lockfileRecord ?? buildLockfileFileRecord(entry, {
    installedAt: options.installedAt,
    lastAction: options.action,
    profile: options.profile,
    sha256: entry.sha256,
    sourceSha256: entry.sha256,
  }));
}

function recordAction(actions, action, options = {}) {
  actions.push({ ...withoutUndefined(action), _write: options.write === true });
}

function finalizeActions(actions, { blocked, mode }) {
  const canWrite = !blocked && mode === 'apply';
  return actions.map((action) => {
    const { _write, ...publicAction } = action;
    return { ...publicAction, write: canWrite && _write === true };
  });
}

function plannedWriteForAction(action, { lockfileContent }) {
  if (action.action === MIGRATION_ACTIONS.LOCKFILE_WRITE) {
    return {
      action: action.action,
      content: lockfileContent,
      kind: action.kind,
      path: action.path,
      sha256: action.sha256,
    };
  }
  if (action.kind === 'agents') {
    return {
      action: action.action,
      agentsBlock: action.agentsBlock,
      content: action.content,
      kind: action.kind,
      path: action.path,
    };
  }
  return {
    action: action.action,
    kind: action.kind,
    mode: action.mode,
    path: action.path,
    sha256: action.sourceSha256,
    sourceSha256: action.sourceSha256,
  };
}

function historicalRegistryFromOptions(options) {
  if (Object.hasOwn(options, 'historicalHashRegistry')) return options.historicalHashRegistry;
  if (Object.hasOwn(options, 'historicalRegistry')) return options.historicalRegistry;
  return loadHistoricalHashRegistry();
}

function normalizeMode(mode) {
  if (!MIGRATION_PLAN_MODES.includes(mode)) throw new Error(`Unsupported migration plan mode: ${mode}`);
  return mode;
}

function requireManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('Migration planner requires a manifest object.');
  if (!Array.isArray(manifest.files)) throw new Error('Migration planner requires manifest.files.');
  return manifest;
}

function sortedManifestFiles(manifest) {
  return manifest.files
    .map((entry) => validateManifestFileEntry(entry))
    .sort((left, right) => left.path.localeCompare(right.path, 'en-US'));
}

function indexLockfileFiles(lockfile) {
  const records = new Map();
  for (const record of lockfile?.files ?? []) {
    validateRelativePath(record.path);
    records.set(record.path, record);
  }
  return records;
}

function isCurrentLockfileRecord(record, entry, profile) {
  return record?.sha256 === entry.sha256
    && record.sourceSha256 === entry.sha256
    && record.mode === entry.mode
    && record.profile === profile
    && record.strategy === (entry.strategy ?? 'managed');
}

function normalizeTargetFiles(input) {
  const files = new Map();
  const unsafeEntries = [];
  for (const [path, value] of targetFileEntries(input)) {
    const rawPath = typeof path === 'string' ? path : String(path);
    try {
      validateRelativePath(rawPath);
    } catch (error) {
      unsafeEntries.push({
        path: rawPath || '<invalid-target-path>',
        reason: 'target snapshot path is not a safe relative POSIX path',
        ruleId: MIGRATION_RULES.TARGET_INVALID_PATH,
      });
      continue;
    }
    if (value === null || value === false || value?.exists === false) continue;
    files.set(rawPath, normalizeTargetFileValue(rawPath, value));
  }
  return { files, unsafeEntries };
}

function targetFileEntries(input) {
  if (input instanceof Map) return input.entries();
  if (Array.isArray(input)) return input.map((entry) => [entry.path, entry]);
  if (input && typeof input === 'object') return Object.entries(input);
  throw new Error('targetFiles must be an object, array, or Map.');
}

function normalizeTargetFileValue(path, value) {
  const targetFile = Buffer.isBuffer(value) || typeof value === 'string'
    ? { content: value }
    : { ...value };
  const unsafeTarget = unsafeTargetMetadata(targetFile);
  if (unsafeTarget) return { ...targetFile, ...unsafeTarget, unsafe: true };
  if (targetFile.content !== undefined && targetFile.sha256 === undefined) {
    targetFile.sha256 = hashBuffer(toBuffer(targetFile.content)).sha256;
  }
  if (typeof targetFile.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(targetFile.sha256)) {
    throw new Error(`Target file requires a SHA-256 hex digest or content: ${path}`);
  }
  return targetFile;
}

function unsafeTargetMetadata(targetFile) {
  const type = targetFile.type ?? targetFile.kind ?? targetFile.entryType ?? null;
  if (targetFile.isDirectory === true || type === 'directory' || type === 'dir') {
    return {
      reason: 'target snapshot entry is a directory where a file is expected',
      ruleId: MIGRATION_RULES.TARGET_DIRECTORY,
    };
  }
  if (targetFile.isSymbolicLink === true || targetFile.isSymlink === true || type === 'symlink' || type === 'symbolic-link') {
    return {
      reason: 'target snapshot entry is a symlink where a file is expected',
      ruleId: MIGRATION_RULES.TARGET_SYMLINK,
    };
  }
  if (type && type !== 'file') {
    return {
      reason: 'target snapshot entry type is unsafe for migration planning',
      ruleId: MIGRATION_RULES.TARGET_UNSAFE_TYPE,
    };
  }
  return null;
}

function agentsContentFromOptions(options, targetFiles) {
  if (Object.hasOwn(options, 'agentsContent')) {
    const exists = options.agentsContent !== null && options.agentsContent !== false;
    return { content: exists ? String(options.agentsContent ?? '') : '', exists };
  }
  const targetFile = targetFiles.get(AGENTS_PATH);
  if (!targetFile) return { content: '', exists: false };
  if (targetFile.content === undefined) return { missingContent: true };
  return { content: String(targetFile.content), exists: true };
}

function profileUsesAgentsBlock(manifest, profile) {
  if (manifest.profiles?.[profile]?.agentsBlock === false) return false;
  if (Array.isArray(manifest.agentsBlock?.profiles)) return manifest.agentsBlock.profiles.includes(profile);
  return profile === 'core' || profile === 'full';
}

function isOptInEntry(entry) {
  return entry.strategy === 'opt-in' || entry.profiles.includes('opt-in');
}

function isManagedInstallPath(path) {
  return path === PLUGIN_CONFIG_PATH || MANAGED_ROOTS.some((root) => path.startsWith(root));
}

function defaultProfile(manifest) {
  if (manifest.profiles?.core) return 'core';
  if (manifest.profiles?.full) return 'full';
  return 'core';
}

function sortActions(actions) {
  return [...actions].sort(compareActions);
}

function compareActions(left, right) {
  const pathComparison = String(left.path).localeCompare(String(right.path), 'en-US');
  if (pathComparison !== 0) return pathComparison;
  return (ACTION_ORDER.get(left.action) ?? Number.MAX_SAFE_INTEGER) - (ACTION_ORDER.get(right.action) ?? Number.MAX_SAFE_INTEGER);
}

function compareTargetFileEntries([leftPath], [rightPath]) {
  return leftPath.localeCompare(rightPath, 'en-US');
}

function emptyObject(value) {
  return !value || Object.keys(value).length === 0;
}

function toBuffer(value) {
  return Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
}

function withoutUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined));
}
