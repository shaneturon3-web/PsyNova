#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const HOME = os.homedir();
const OUTPUT_ROOT = path.join(process.cwd(), 'webbox');
const INVENTORY_DIR = path.join(OUTPUT_ROOT, 'inventory');
const REPORTS_DIR = path.join(OUTPUT_ROOT, 'reports');

const SCAN_PATHS = [
  '~',
  '~/Desktop',
  '~/Documents',
  '~/Downloads',
  '~/Projects',
  '~/PsyNova',
  '~/Dropbox',
  '~/Google Drive',
  '~/gdrive',
  '~/OneDrive',
];

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  'venv',
  '__pycache__',
  '.venv',
  '.mypy_cache',
  '.pytest_cache',
  'site-packages',
]);

const KEYWORDS = [
  'psynova',
  'webbox',
  'virtual psychology clinic',
  'notion',
  'cursor',
  'clinic',
  'booking',
  'automation',
  'financial',
  'dashboard',
  'marketing',
  'ai',
  'backup',
  'archive',
];

const PROJECT_MARKERS = [
  'package.json',
  'pyproject.toml',
  'requirements.txt',
  'Pipfile',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'README.md',
  'README',
  '.git',
];

function resolveTilde(p) {
  return p === '~' ? HOME : p.replace(/^~(?=\/|$)/, HOME);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readDirSafe(p) {
  try {
    return fs.readdirSync(p, { withFileTypes: true });
  } catch {
    return [];
  }
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function detectType(files) {
  if (files.has('package.json')) return 'Node/JS project';
  if (files.has('pyproject.toml') || files.has('requirements.txt') || files.has('Pipfile')) return 'Python project';
  if (files.has('Cargo.toml')) return 'Rust project';
  if (files.has('go.mod')) return 'Go project';
  if (files.has('pom.xml')) return 'Java project';
  if (files.has('.git')) return 'Git project';
  return 'General project';
}

function detectTechStack(files) {
  const stack = [];
  if (files.has('package.json')) stack.push('Node.js');
  if (files.has('pyproject.toml') || files.has('requirements.txt') || files.has('Pipfile')) stack.push('Python');
  if (files.has('Cargo.toml')) stack.push('Rust');
  if (files.has('go.mod')) stack.push('Go');
  if (files.has('pom.xml')) stack.push('Java');
  return stack.length ? stack.join(', ') : 'Unknown';
}

function purposeFromName(name, p) {
  const hay = `${name} ${p}`.toLowerCase();
  for (const kw of KEYWORDS) {
    if (hay.includes(kw)) return `Related to ${kw}`;
  }
  return 'General software/project workspace';
}

function cloudSource(p) {
  const lower = p.toLowerCase();
  if (lower.includes('/dropbox/')) return 'Dropbox';
  if (lower.includes('/google drive/') || lower.includes('/gdrive/')) return 'Google Drive';
  if (lower.includes('/onedrive/')) return 'OneDrive';
  return 'Local';
}

function archiveStatus(p, mtimeMs) {
  const lower = p.toLowerCase();
  if (lower.includes('/archive') || lower.includes('/backup') || lower.includes('/old')) return 'archive';
  const ageDays = (Date.now() - mtimeMs) / (1000 * 60 * 60 * 24);
  if (ageDays <= 120) return 'active';
  if (ageDays > 365) return 'archive';
  return 'unknown';
}

function priorityGuess(p, mtimeMs, files) {
  const lower = p.toLowerCase();
  if (lower.includes('psynova') || lower.includes('webbox')) return 'High';
  if (files.has('package.json') || files.has('pyproject.toml')) {
    const ageDays = (Date.now() - mtimeMs) / (1000 * 60 * 60 * 24);
    return ageDays < 180 ? 'Medium' : 'Low';
  }
  return 'Low';
}

function projectSizeBytes(rootDir) {
  let total = 0;
  const stack = [rootDir];
  let scanned = 0;
  const maxEntries = 50000;
  while (stack.length) {
    const current = stack.pop();
    if (!current) break;
    const entries = readDirSafe(current);
    for (const entry of entries) {
      scanned += 1;
      if (scanned > maxEntries) return total;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        stack.push(full);
      } else if (entry.isFile()) {
        try {
          total += fs.statSync(full).size;
        } catch {
          // ignore
        }
      }
    }
  }
  return total;
}

function toSizeLabel(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let n = bytes / 1024;
  let idx = 0;
  while (n >= 1024 && idx < units.length - 1) {
    n /= 1024;
    idx += 1;
  }
  return `${n.toFixed(2)} ${units[idx]}`;
}

function looksLikeProject(dirPath, entries) {
  const names = new Set(entries.map((e) => e.name));
  for (const marker of PROJECT_MARKERS) {
    if (names.has(marker)) return true;
  }
  return false;
}

function collectProjects() {
  const seen = new Set();
  const projects = [];
  for (const rawRoot of SCAN_PATHS) {
    const root = resolveTilde(rawRoot);
    if (!exists(root)) continue;
    const queue = [root];
    let depthSafety = 0;
    while (queue.length) {
      const current = queue.shift();
      if (!current) break;
      depthSafety += 1;
      if (depthSafety > 300000) break;

      const entries = readDirSafe(current);
      if (!entries.length) continue;
      const relFromHome = path.relative(HOME, current);
      const depth = relFromHome.split(path.sep).filter(Boolean).length;
      if (looksLikeProject(current, entries)) {
        if (!seen.has(current)) {
          seen.add(current);
          const files = new Set(entries.map((e) => e.name));
          let st;
          try {
            st = fs.statSync(current);
          } catch {
            st = { mtimeMs: Date.now() };
          }
          const mtime = new Date(st.mtimeMs).toISOString();
          const sizeBytes = projectSizeBytes(current);
          projects.push({
            name: path.basename(current),
            path: current,
            type: detectType(files),
            likely_purpose: purposeFromName(path.basename(current), current),
            last_modified: mtime,
            size_bytes: sizeBytes,
            size: toSizeLabel(sizeBytes),
            tech_stack: detectTechStack(files),
            has_git_repo: files.has('.git'),
            has_package_json: files.has('package.json'),
            has_readme: files.has('README.md') || files.has('README'),
            priority_guess: priorityGuess(current, st.mtimeMs, files),
            lifecycle: archiveStatus(current, st.mtimeMs),
            related_cloud_storage_source: cloudSource(current),
          });
        }
        // If it's a project root, don't recurse too deep inside it.
        continue;
      }

      if (depth > 6) continue;
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (IGNORE_DIRS.has(entry.name)) continue;
        if (entry.name.startsWith('.') && entry.name !== '.cursor') continue;
        queue.push(path.join(current, entry.name));
      }
    }
  }
  return projects.sort((a, b) => b.last_modified.localeCompare(a.last_modified));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeMdInventory(filePath, projects) {
  const lines = [];
  lines.push('# Local Projects Inventory');
  lines.push('');
  lines.push(`Scanned at: ${new Date().toISOString()}`);
  lines.push(`Detected projects: ${projects.length}`);
  lines.push('');
  lines.push('| Name | Path | Type | Last Modified | Size | Tech Stack | Git | package.json | README | Priority | Lifecycle | Cloud Source |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const p of projects) {
    lines.push(
      `| ${p.name} | \`${p.path}\` | ${p.type} | ${p.last_modified} | ${p.size} | ${p.tech_stack} | ${p.has_git_repo ? 'yes' : 'no'} | ${p.has_package_json ? 'yes' : 'no'} | ${p.has_readme ? 'yes' : 'no'} | ${p.priority_guess} | ${p.lifecycle} | ${p.related_cloud_storage_source} |`,
    );
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function writeDuplicates(filePath, projects) {
  const groups = new Map();
  for (const p of projects) {
    const key = p.name.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  const dupes = [...groups.values()].filter((g) => g.length > 1);
  const lines = ['# Duplicate Project Name Report', '', `Duplicate name groups: ${dupes.length}`, ''];
  for (const group of dupes) {
    lines.push(`## ${group[0].name}`);
    for (const item of group) lines.push(`- \`${item.path}\` (${item.last_modified}, ${item.size})`);
    lines.push('');
  }
  if (!dupes.length) lines.push('No duplicate project names detected.');
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function writeStorageRisk(filePath, projects) {
  const totalBytes = projects.reduce((acc, p) => acc + p.size_bytes, 0);
  const top = [...projects].sort((a, b) => b.size_bytes - a.size_bytes).slice(0, 20);
  const lines = [
    '# Storage Capacity Risk',
    '',
    `Total project footprint (detected projects only): ${toSizeLabel(totalBytes)}`,
    '',
    '## Top 20 Largest Projects',
    '',
    '| Name | Size | Path | Lifecycle |',
    '|---|---|---|---|',
  ];
  for (const p of top) lines.push(`| ${p.name} | ${p.size} | \`${p.path}\` | ${p.lifecycle} |`);
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function writeCatalog(filePath, projects) {
  const lines = ['# Project Catalog', '', `Total projects: ${projects.length}`, ''];
  for (const p of projects) {
    lines.push(`## ${p.name}`);
    lines.push(`- Path: \`${p.path}\``);
    lines.push(`- Type: ${p.type}`);
    lines.push(`- Purpose: ${p.likely_purpose}`);
    lines.push(`- Last modified: ${p.last_modified}`);
    lines.push(`- Size: ${p.size}`);
    lines.push(`- Stack: ${p.tech_stack}`);
    lines.push(`- Git repo: ${p.has_git_repo ? 'yes' : 'no'}`);
    lines.push(`- package.json: ${p.has_package_json ? 'yes' : 'no'}`);
    lines.push(`- README: ${p.has_readme ? 'yes' : 'no'}`);
    lines.push(`- Priority guess: ${p.priority_guess}`);
    lines.push(`- Lifecycle: ${p.lifecycle}`);
    lines.push(`- Cloud source: ${p.related_cloud_storage_source}`);
    lines.push('');
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  ensureDir(INVENTORY_DIR);
  ensureDir(REPORTS_DIR);
  ensureDir(path.join(OUTPUT_ROOT, 'protocols'));
  ensureDir(path.join(OUTPUT_ROOT, 'scripts'));

  const projects = collectProjects();
  writeJson(path.join(INVENTORY_DIR, 'local-projects.json'), projects);
  writeMdInventory(path.join(INVENTORY_DIR, 'local-projects.md'), projects);
  writeDuplicates(path.join(REPORTS_DIR, 'duplicates.md'), projects);
  writeStorageRisk(path.join(REPORTS_DIR, 'storage-capacity-risk.md'), projects);
  writeCatalog(path.join(REPORTS_DIR, 'project-catalog.md'), projects);
  console.log(`[webbox] inventory complete. projects=${projects.length}`);
}

main();
