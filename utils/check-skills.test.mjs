import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { findSkillFiles, validateSkill } from './check-skills.mjs';

const cli = fileURLToPath(new URL('./check-skills.mjs', import.meta.url));

function workspace(context) {
  const root = mkdtempSync(join(tmpdir(), 'check-skills-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function skill(root, name, metadata = `name: ${name}\ndescription: 'Check a skill.'`, location = '.github/skills') {
  const file = join(root, location, name, 'SKILL.md');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `---\n${metadata}\n---\n\n# Procedure\n\nCheck the page.\n`);
  return file;
}

test('validate YAML, optional fields, Unicode, and Windows line endings', context => {
  const file = skill(workspace(context), 'valid', 'name: valid\ndescription: "Check caf\\u00e9 content."\nuser-invocable: true\ndisable-model-invocation: false\nargument-hint: "Page name"');
  assert.deepEqual(validateSkill(file), []);
  writeFileSync(file, '---\r\nname: valid\r\ndescription: Check the page.\r\n---\r\n\r\nCheck it.\r\n');
  assert.deepEqual(validateSkill(file), []);
});

test('reject invalid metadata and missing body content', context => {
  const root = workspace(context);
  const cases = [
    ['name: Wrong\ndescription: Check.', /name must contain/],
    ['name: different\ndescription: Check.', /directory name/],
    ['name: invalid', /description must/],
    ['name: invalid\ndescription: 42', /description must/],
    ['name: invalid\ndescription: " "', /description must/],
    [`name: invalid\ndescription: "${'a'.repeat(1025)}"`, /description must/],
    ['name: invalid\ndescription: Check.\nuser-invocable: "true"', /must be a boolean/],
    ['name: invalid\ndescription: Check.\ndisable-model-invocation: 1', /must be a boolean/],
    ['name: invalid\ndescription: Check.\nargument-hint: false', /must be a string/],
    ['name: invalid\nname: invalid\ndescription: Check.', /Invalid YAML/],
    ['name: [', /Invalid YAML/],
    ['- invalid', /must be a mapping/],
    ['null', /must be a mapping/]
  ];
  for (const [metadata, expected] of cases) {
    assert.match(validateSkill(skill(root, 'invalid', metadata)).join('\n'), expected);
  }
  const file = skill(root, 'invalid');
  for (const [source, expected] of [
    ['# No metadata', /first line/],
    ['---\nname: invalid', /closing/],
    ['---\nname: invalid\ndescription: Check.\n---\n', /body content/]
  ]) {
    writeFileSync(file, source);
    assert.match(validateSkill(file).join('\n'), expected);
  }
  assert.match(validateSkill(join(root, 'README.md')).join('\n'), /named SKILL.md/);
});

test('find all supported repository roots and select by name or path', context => {
  const root = workspace(context);
  const files = [skill(root, 'first'), skill(root, 'second', undefined, '.agents/skills'), skill(root, 'third', undefined, '.claude/skills')];
  assert.deepEqual(findSkillFiles(undefined, root), [...files].sort());
  assert.deepEqual(findSkillFiles('second', root), [files[1]]);
  assert.deepEqual(findSkillFiles(dirname(files[0]), root), [files[0]]);
  assert.deepEqual(findSkillFiles(files[0], root), [files[0]]);
  assert.throws(() => findSkillFiles('missing', root), /not found/);
  skill(root, 'first', undefined, '.agents/skills');
  assert.throws(() => findSkillFiles('first', root), /More than one/);
  assert.throws(() => findSkillFiles(undefined, workspace(context)), /No repository skills/);
});

test('CLI reports results and returns the correct exit code', context => {
  const root = workspace(context);
  skill(root, 'valid');
  skill(root, 'invalid', 'name: invalid');
  const run = args => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
  const selected = run(['valid']);
  assert.equal(selected.status, 0);
  assert.match(selected.stdout, /Checked 1 skill\./);
  const all = run([]);
  assert.equal(all.status, 1);
  assert.match(all.stderr, /description must/);
  assert.match(all.stdout, /Checked 2 skills\./);
  assert.equal(run(['missing']).status, 1);
  assert.equal(run(['--unknown']).status, 1);
  assert.equal(run(['valid', 'invalid']).status, 1);
  assert.equal(run(['--help']).status, 0);
});