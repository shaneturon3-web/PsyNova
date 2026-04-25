/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { Client } = require('@notionhq/client');

dotenv.config();

const ROOT = process.cwd();
const PM_DIR = path.join(ROOT, 'project-management');

const ENV = {
  NOTION_TOKEN: process.env.NOTION_TOKEN || '',
  NOTION_PARENT_PAGE_ID: process.env.NOTION_PARENT_PAGE_ID || '',
  NOTION_MODULES_DATABASE_ID: process.env.NOTION_MODULES_DATABASE_ID || '',
  NOTION_TASKS_DATABASE_ID: process.env.NOTION_TASKS_DATABASE_ID || '',
  NOTION_RESEARCH_DATABASE_ID: process.env.NOTION_RESEARCH_DATABASE_ID || '',
  NOTION_LICENSES_DATABASE_ID: process.env.NOTION_LICENSES_DATABASE_ID || '',
};

function loadJson(fileName) {
  const filePath = path.join(PM_DIR, fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function title(value) {
  return { title: [{ text: { content: String(value || '') } }] };
}

function rich(value) {
  return { rich_text: [{ text: { content: String(value || '') } }] };
}

function select(value) {
  return { select: value ? { name: String(value) } : null };
}

function multiSelect(values) {
  const arr = Array.isArray(values) ? values : [];
  return { multi_select: arr.map((v) => ({ name: String(v) })) };
}

function checkbox(value) {
  return { checkbox: !!value };
}

function url(value) {
  const v = String(value || '').trim();
  return { url: v || null };
}

async function ensureDatabase(notion, maybeDbId, parentPageId, name, properties) {
  if (maybeDbId) return maybeDbId;
  const created = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: name } }],
    properties,
  });
  console.log(`[notion] created database: ${name} (${created.id})`);
  return created.id;
}

async function findPageByIdProp(notion, databaseId, idValue) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'ID',
      rich_text: { equals: idValue },
    },
    page_size: 1,
  });
  return response.results[0] || null;
}

async function upsertPage(notion, databaseId, idValue, properties, label) {
  const existing = await findPageByIdProp(notion, databaseId, idValue);
  if (existing) {
    await notion.pages.update({
      page_id: existing.id,
      properties,
    });
    console.log(`[sync] updated ${label}: ${idValue}`);
  } else {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });
    console.log(`[sync] created ${label}: ${idValue}`);
  }
}

function modulesSchema() {
  return {
    Name: { title: {} },
    ID: { rich_text: {} },
    Category: { select: { options: [] } },
    Status: { select: { options: [] } },
    Priority: { select: { options: [] } },
    'Business Value': { rich_text: {} },
    'Legal Risk': { select: { options: [] } },
    Dependencies: { multi_select: { options: [] } },
    'Related Files': { rich_text: {} },
    Notes: { rich_text: {} },
  };
}

function tasksSchema() {
  return {
    Name: { title: {} },
    ID: { rich_text: {} },
    Module: { rich_text: {} },
    Status: { select: { options: [] } },
    Priority: { select: { options: [] } },
    'Cursor Prompt': { rich_text: {} },
    'Test Result': { rich_text: {} },
    'Related Files': { rich_text: {} },
    Notes: { rich_text: {} },
  };
}

function researchSchema() {
  return {
    Name: { title: {} },
    ID: { rich_text: {} },
    Competitor: { select: { options: [] } },
    'Source URL': { url: {} },
    Finding: { rich_text: {} },
    Complaint: { rich_text: {} },
    Opportunity: { rich_text: {} },
    Priority: { select: { options: [] } },
  };
}

function licensesSchema() {
  return {
    Name: { title: {} },
    ID: { rich_text: {} },
    Category: { select: { options: [] } },
    'Official URL': { url: {} },
    'License Type': { select: { options: [] } },
    'Commercial Use': { select: { options: [] } },
    'Signup Required': { checkbox: {} },
    'API Key Required': { checkbox: {} },
    Status: { select: { options: [] } },
    Notes: { rich_text: {} },
  };
}

async function main() {
  const modules = loadJson('modules.json');
  const tasks = loadJson('tasks.json');
  const research = loadJson('research.json');
  const licenses = loadJson('licenses.json');

  if (!ENV.NOTION_TOKEN || !ENV.NOTION_PARENT_PAGE_ID) {
    console.log('Missing NOTION_TOKEN or NOTION_PARENT_PAGE_ID. Local project database created. Notion sync skipped.');
    return;
  }

  const notion = new Client({ auth: ENV.NOTION_TOKEN });

  const modulesDbId = await ensureDatabase(
    notion,
    ENV.NOTION_MODULES_DATABASE_ID,
    ENV.NOTION_PARENT_PAGE_ID,
    'PsyNova Modules',
    modulesSchema(),
  );
  const tasksDbId = await ensureDatabase(
    notion,
    ENV.NOTION_TASKS_DATABASE_ID,
    ENV.NOTION_PARENT_PAGE_ID,
    'PsyNova Tasks',
    tasksSchema(),
  );
  const researchDbId = await ensureDatabase(
    notion,
    ENV.NOTION_RESEARCH_DATABASE_ID,
    ENV.NOTION_PARENT_PAGE_ID,
    'PsyNova Research',
    researchSchema(),
  );
  const licensesDbId = await ensureDatabase(
    notion,
    ENV.NOTION_LICENSES_DATABASE_ID,
    ENV.NOTION_PARENT_PAGE_ID,
    'PsyNova Licenses',
    licensesSchema(),
  );

  for (const item of modules) {
    const properties = {
      Name: title(item.name),
      ID: rich(item.id),
      Category: select(item.category),
      Status: select(item.status),
      Priority: select(item.priority),
      'Business Value': rich(item.business_value),
      'Legal Risk': select(item.legal_risk),
      Dependencies: multiSelect(item.dependencies),
      'Related Files': rich((item.related_files || []).join(', ')),
      Notes: rich(item.notes),
    };
    await upsertPage(notion, modulesDbId, item.id, properties, 'module');
  }

  for (const item of tasks) {
    const properties = {
      Name: title(item.name),
      ID: rich(item.id),
      Module: rich(item.module),
      Status: select(item.status),
      Priority: select(item.priority),
      'Cursor Prompt': rich(item.cursor_prompt),
      'Test Result': rich(item.test_result),
      'Related Files': rich((item.related_files || []).join(', ')),
      Notes: rich(item.notes),
    };
    await upsertPage(notion, tasksDbId, item.id, properties, 'task');
  }

  for (const item of research) {
    const properties = {
      Name: title(item.name),
      ID: rich(item.id),
      Competitor: select(item.competitor),
      'Source URL': url(item.source_url),
      Finding: rich(item.finding),
      Complaint: rich(item.complaint),
      Opportunity: rich(item.opportunity),
      Priority: select(item.priority),
    };
    await upsertPage(notion, researchDbId, item.id, properties, 'research');
  }

  for (const item of licenses) {
    const properties = {
      Name: title(item.name),
      ID: rich(item.id),
      Category: select(item.category),
      'Official URL': url(item.official_url),
      'License Type': select(item.license_type),
      'Commercial Use': select(item.commercial_use_allowed),
      'Signup Required': checkbox(item.signup_required === 'yes' || item.signup_required === true),
      'API Key Required': checkbox(item.api_key_required === 'yes' || item.api_key_required === true),
      Status: select(item.status),
      Notes: rich(item.notes),
    };
    await upsertPage(notion, licensesDbId, item.id, properties, 'license');
  }

  console.log('[notion] sync complete (upsert only, no deletes).');
}

main().catch((err) => {
  console.error('[notion] sync failed:', err.message || err);
  process.exitCode = 1;
});
