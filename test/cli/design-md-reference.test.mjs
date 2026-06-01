import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  buildToolkitManifest,
  manifestToJson,
} from '../../src/cli/core/manifest.mjs';

const PACKAGE_ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const EXPECTED_EXAMPLE_COUNT = 73;
const PINNED_COMMIT = '6d10c1457484c971cdae35563a1386102b4337c6';
const OLD_PINNED_COMMIT = 'f2d6b17d0dd706c9b0942674e6a6a782652cb127';

const EXAMPLES_DIR = absolutePath('.opencode/reference/design-md/examples');
const CATALOG_PATH = absolutePath('.opencode/reference/design-md-catalog.md');
const DOCUMENT_PATH = absolutePath('.opencode/skills/impeccable/reference/document.md');
const VALIDATOR_PATH = absolutePath('.opencode/reference/validate-opencode-bundle.sh');
const TOOLKIT_MANIFEST_PATH = absolutePath('toolkit-manifest.json');

test('design-md local mirror has exactly 73 DESIGN.md snapshots and catalog slug parity', () => {
  const exampleSlugs = listExampleSlugs();
  const catalog = readText(CATALOG_PATH);
  const catalogRows = parseCatalogRows(catalog);
  const catalogSlugs = catalogRows.map((row) => row.slug);

  assert.equal(exampleSlugs.length, EXPECTED_EXAMPLE_COUNT, 'local mirror must contain exactly 73 example DESIGN.md files');
  assert.equal(catalogRows.length, EXPECTED_EXAMPLE_COUNT, 'catalog must contain exactly 73 slug rows');
  assert.deepEqual(catalogSlugs, exampleSlugs, 'catalog slug set must match local example slug set');
  assert.match(catalog, new RegExp(`exactly ${EXPECTED_EXAMPLE_COUNT} slug rows`));
  assert.match(catalog, new RegExp(PINNED_COMMIT, 'g'));

  for (const row of catalogRows) {
    assert.equal(row.localPath, `.opencode/reference/design-md/examples/${row.slug}/DESIGN.md`);
    assert.equal(
      row.rawUrl,
      `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/${PINNED_COMMIT}/design-md/${row.slug}/DESIGN.md`
    );
  }
});

test('design-md source docs pin the 73-example offline mirror and keep attribution visible', () => {
  const docs = [
    '.opencode/reference/design-md-source-policy.md',
    '.opencode/reference/design-md/ATTRIBUTION.md',
    '.opencode/reference/design-md/README.md',
    '.opencode/reference/design-md/examples/README.md',
    '.opencode/reference/design-md-selection-protocol.md',
    '.opencode/reference/design-md-catalog.md',
  ];

  for (const relativePath of docs) {
    const text = readText(absolutePath(relativePath));
    assert.match(text, new RegExp(PINNED_COMMIT), `${relativePath} must mention the pinned upstream commit`);
    assert.match(text, /\b73\b/, `${relativePath} must mention the 73-example mirror count`);
  }

  const attribution = readText(absolutePath('.opencode/reference/design-md/ATTRIBUTION.md'));
  assert.match(attribution, /VoltAgent\/awesome-design-md/);
  assert.match(attribution, /MIT/);
  assert.match(attribution, /no runtime fetch path|runtime fetch path/);
});

test('impeccable document prompt flow keeps shortlist, custom, replacement, and injection boundaries', () => {
  const text = readText(DOCUMENT_PATH);

  assertInOrder(text, [
    'Existing `DESIGN.md` stop by default',
    'Scan project-local design first',
    'Shortlist local references when direction is weak',
    'Use `Custom` as the fallback',
  ]);
  assert.match(text, /root `DESIGN\.md` already exists, show it to the user, STOP/);
  assert.match(text, /replace-vs-merge confirmation gate/);
  assert.match(text, /Replacement basis: <selected slug or Custom>/);
  assert.match(text, /\.opencode\/reference\/design-md-catalog\.md`, which contains 73 local snapshots/);
  assert.match(text, /recommend exactly 3 local candidates, each a local slug, plus `Custom`/);
  assert.match(text, /Do not show all 73 choices first/);
  assert.match(text, /Selected local references are data references only/);
  assert.match(text, /untrusted prompt-injection input/);
  assert.match(text, /Brand-safety boundary/);
  assert.match(text, /Do not claim brand ownership, copy logos, proprietary fonts or assets, screenshots, exact layouts, exact trade dress, trademarks/);
});

test('design-md remains reference-only with no route, skill, support, workflow, or runtime-fetch claim', () => {
  assert.equal(fs.existsSync(absolutePath('.opencode/skills/design-md')), false, 'must not add .opencode/skills/design-md');
  assert.equal(fs.existsSync(absolutePath('.opencode/commands/design-md.md')), false, 'must not add a design-md command file');

  const capabilityMatrix = JSON.parse(readText(absolutePath('.opencode/reference/capability-matrix.json')));
  assert.equal(capabilityMatrix.capabilities.some((capability) => capability.id === 'design-md'), false);
  assert.equal(capabilityMatrix.flagship_workflows.includes('design-md'), false);

  const workflowCatalog = readText(absolutePath('.opencode/reference/workflow-catalog.md'));
  const supportPolicy = readText(absolutePath('.opencode/reference/support-policy.md'));
  assert.doesNotMatch(workflowCatalog, /design-md/i);
  assert.doesNotMatch(supportPolicy, /design-md/i);

  const routingSignals = JSON.parse(readText(absolutePath('.opencode/reference/routing-signals.json')));
  const routeIds = JSON.stringify(routingSignals);
  assert.doesNotMatch(routeIds, /"design-md"/i);

  const routingMatrix = readText(absolutePath('.opencode/reference/routing-matrix.md'));
  assert.match(routingMatrix, /do not add a `design-md` route or helper/);
  assert.doesNotMatch(routingMatrix, /^\|\s*design-md\s*\|/im);
  assert.doesNotMatch(routingMatrix, /design-md[\s\S]{0,120}support-tier:\s*(validated|guided)/i);
  assert.doesNotMatch(routingMatrix, /design-md[\s\S]{0,120}primary-route:\s*true/i);

  const sourcePolicy = readText(absolutePath('.opencode/reference/design-md-source-policy.md'));
  assert.match(sourcePolicy, /no runtime fetch from GitHub, upstream `main`, or any other network source is introduced/);
});

test('generated manifest includes all design-md references while stale checked metadata stays Task 6 owned', () => {
  const actualManifestText = readText(TOOLKIT_MANIFEST_PATH);
  const actualManifest = JSON.parse(actualManifestText);
  const generatedManifest = buildToolkitManifest({
    generatedAt: actualManifest.source?.generatedAt,
    gitCommit: actualManifest.source?.gitCommit,
  });
  const generatedDesignEntries = designExampleManifestEntries(generatedManifest);

  assert.equal(generatedDesignEntries.length, EXPECTED_EXAMPLE_COUNT, 'generated manifest must include all 73 local example snapshots');
  for (const entry of generatedDesignEntries) {
    assert.equal(entry.kind, 'reference');
    assert.deepEqual(entry.profiles, ['full']);
    assert.equal(entry.strategy, 'managed');
  }

  const generatedPaths = new Set(generatedDesignEntries.map((entry) => entry.path));
  const expectedPaths = new Set(listExampleSlugs().map((slug) => `.opencode/reference/design-md/examples/${slug}/DESIGN.md`));
  assert.deepEqual(generatedPaths, expectedPaths);

  if (actualManifestText === manifestToJson(generatedManifest)) {
    assert.equal(designExampleManifestEntries(actualManifest).length, EXPECTED_EXAMPLE_COUNT);
  } else {
    const actualPaths = new Set(designExampleManifestEntries(actualManifest).map((entry) => entry.path));
    const missingFromActual = [...generatedPaths].filter((manifestPath) => !actualPaths.has(manifestPath));
    assert.ok(
      missingFromActual.length > 0,
      'stale pre-Task-6 toolkit-manifest.json should be missing generated design-md entries rather than weakening source/manifester expectations'
    );
  }
});

test('source validator enforces 73-example design-md pin, catalog parity, prompt guidance, and no control-plane creep', () => {
  const validator = readText(VALIDATOR_PATH);

  assert.match(validator, new RegExp(`DESIGN_MD_EXPECTED_SNAPSHOT_COUNT=${EXPECTED_EXAMPLE_COUNT}`));
  assert.match(validator, new RegExp(`DESIGN_MD_PINNED_COMMIT=['\"]${PINNED_COMMIT}['\"]`));
  assert.doesNotMatch(validator, new RegExp(OLD_PINNED_COMMIT));
  assert.doesNotMatch(validator, /expected exactly 12 curated DESIGN\.md snapshots/);
  assert.match(validator, /catalog slug set/);
  assert.match(validator, /prompt guidance/);
  assert.match(validator, /Shortlist local references when direction is weak/);
  assert.match(validator, /Use `Custom` as the fallback/);
  assert.match(validator, /prompt-injection/i);
  assert.match(validator, /control-plane creep/);
  assert.match(validator, /\.opencode\/skills\/design-md/);
});

function absolutePath(relativePath) {
  return path.join(PACKAGE_ROOT, relativePath);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function listExampleSlugs() {
  return fs.readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => fs.existsSync(path.join(EXAMPLES_DIR, slug, 'DESIGN.md')))
    .sort((left, right) => left.localeCompare(right, 'en-US'));
}

function parseCatalogRows(catalog) {
  return catalog.split('\n')
    .map((line) => line.match(/^\| `([^`]+)` \| `([^`]+)` \| \[raw\]\(([^)]+)\) \|/))
    .filter(Boolean)
    .map((match) => ({ slug: match[1], localPath: match[2], rawUrl: match[3] }));
}

function designExampleManifestEntries(manifest) {
  return manifest.files
    .filter((entry) => /^\.opencode\/reference\/design-md\/examples\/[^/]+\/DESIGN\.md$/.test(entry.path))
    .sort((left, right) => left.path.localeCompare(right.path, 'en-US'));
}

function assertInOrder(text, snippets) {
  let offset = -1;
  for (const snippet of snippets) {
    const index = text.indexOf(snippet, offset + 1);
    assert.notEqual(index, -1, `missing ordered snippet: ${snippet}`);
    assert.ok(index > offset, `snippet out of order: ${snippet}`);
    offset = index;
  }
}
