import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';

const skillRoots = ['.github/skills', '.agents/skills', '.claude/skills'];

export function findSkillFiles(target, root = process.cwd()) {
  if (target) {
    const requested = resolve(root, target);
    if (existsSync(requested)) {
      return [statSync(requested).isDirectory() ? join(requested, 'SKILL.md') : requested];
    }
    const matches = skillRoots
      .map(directory => join(root, directory, target, 'SKILL.md'))
      .filter(file => existsSync(file));
    if (matches.length === 1) return matches;
    if (matches.length > 1) throw new Error(`More than one skill matches "${target}". Specify a path.`);
    throw new Error(`Skill not found: ${target}`);
  }

  const files = skillRoots.flatMap(directory => {
    const location = join(root, directory);
    if (!existsSync(location)) return [];
    return readdirSync(location, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => join(location, entry.name, 'SKILL.md'))
      .filter(file => existsSync(file));
  }).sort();
  if (!files.length) throw new Error('No repository skills found.');
  return files;
}

export function validateSkill(file) {
  if (basename(file) !== 'SKILL.md') return ['The file must be named SKILL.md.'];
  const lines = readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0].trimEnd() !== '---') return ['YAML frontmatter must start on the first line.'];
  const end = lines.findIndex((line, index) => index > 0 && line.trimEnd() === '---');
  if (end < 0) return ['YAML frontmatter must have a closing --- delimiter.'];

  const document = parseDocument(lines.slice(1, end).join('\n'));
  if (document.errors.length) {
    return document.errors.map(error => `Invalid YAML: ${error.message}`);
  }
  const metadata = document.toJS({ maxAliasCount: 100 });
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || metadata instanceof Map) {
    return ['YAML frontmatter must be a mapping of field names to values.'];
  }

  const errors = [];
  if (typeof metadata.name !== 'string' || !/^[a-z0-9-]{1,64}$/.test(metadata.name)) {
    errors.push('name must contain 1 to 64 lowercase letters, digits, or hyphens.');
  } else if (metadata.name !== basename(dirname(file))) {
    errors.push('name must match the skill directory name.');
  }
  if (typeof metadata.description !== 'string' || !metadata.description.trim() || metadata.description.length > 1024) {
    errors.push('description must be a nonempty string of at most 1024 characters.');
  }
  for (const field of ['user-invocable', 'disable-model-invocation']) {
    if (Object.hasOwn(metadata, field) && typeof metadata[field] !== 'boolean') {
      errors.push(`${field} must be a boolean.`);
    }
  }
  if (Object.hasOwn(metadata, 'argument-hint') && typeof metadata['argument-hint'] !== 'string') {
    errors.push('argument-hint must be a string.');
  }
  if (!lines.slice(end + 1).join('\n').trim()) errors.push('The skill must have body content.');
  return errors;
}

export function main(args = process.argv.slice(2)) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('Usage: node scripts/check-skills.mjs [skill-name|skill-directory|SKILL.md-path]');
    console.log('With no argument, check all skills in .github/skills, .agents/skills, and .claude/skills.');
    return 0;
  }
  try {
    if (args.length > 1 || args[0]?.startsWith('-')) {
      throw new Error('Specify one skill name or path, or omit the argument to check all skills.');
    }
    const files = findSkillFiles(args[0]);
    let failed = false;
    for (const file of files) {
      let errors;
      try {
        errors = validateSkill(file);
      } catch (error) {
        errors = [error.message];
      }
      if (errors.length) {
        failed = true;
        console.error(`FAIL: ${file}`);
        for (const error of errors) console.error(`  ${error}`);
      } else {
        console.log(`PASS: ${file}`);
      }
    }
    console.log(`Checked ${files.length} ${files.length === 1 ? 'skill' : 'skills'}.`);
    return failed ? 1 : 0;
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.exitCode = main();
}