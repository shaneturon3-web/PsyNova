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
  NOTION_ROADMAP_DATABASE_ID: process.env.NOTION_ROADMAP_DATABASE_ID || '',
  NOTION_INTEGRATIONS_DATABASE_ID: process.env.NOTION_INTEGRATIONS_DATABASE_ID || '',
  NOTION_RESEARCH_DATABASE_ID: process.env.NOTION_RESEARCH_DATABASE_ID || '',
  NOTION_LICENSES_DATABASE_ID: process.env.NOTION_LICENSES_DATABASE_ID || '',
  NOTION_DECISIONS_DATABASE_ID: process.env.NOTION_DECISIONS_DATABASE_ID || '',
  NOTION_CURSOR_PROMPTS_DATABASE_ID: process.env.NOTION_CURSOR_PROMPTS_DATABASE_ID || '',
  NOTION_CHANGELOG_DATABASE_ID: process.env.NOTION_CHANGELOG_DATABASE_ID || '',
  NOTION_PROJECTS_DATABASE_ID: process.env.NOTION_PROJECTS_DATABASE_ID || '',
};

function loadJson(fileName) {
  const filePath = path.join(PM_DIR, fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function loadText(fileName) {
  const filePath = path.join(PM_DIR, fileName);
  return fs.readFileSync(filePath, 'utf8');
}

function title(value) {
  return { title: [{ text: { content: String(value || '') } }] };
}

function rich(value) {
  const content = String(value || '');
  const capped = content.slice(0, 1900);
  return { rich_text: [{ text: { content: capped } }] };
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
  if (maybeDbId) {
    const meta = await notion.databases.retrieve({ database_id: maybeDbId });
    const dbTitle = (meta.title || []).map((t) => t?.plain_text || '').join('').trim();
    if (!dbTitle.startsWith('PsyNova')) {
      throw new Error(
        `Refusing to sync into non-PsyNova database title "${dbTitle}" (${maybeDbId}). ` +
          'Set a PsyNova* database ID or clear the ID to recreate under parent page.',
      );
    }
    console.log(`[notion] using existing database: ${dbTitle} (${meta.id}) ${meta.url || ''}`);
    return maybeDbId;
  }
  const created = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: name } }],
    properties,
  });
  console.log(`[notion] created database: ${name} (${created.id}) ${created.url || ''}`);
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

function roadmapSchema() {
  return {
    Name: { title: {} },
    ID: { rich_text: {} },
    Priority: { select: { options: [] } },
    Modules: { rich_text: {} },
    'Success Criteria': { rich_text: {} },
    Notes: { rich_text: {} },
  };
}

function integrationsSchema() {
  return {
    Name: { title: {} },
    ID: { rich_text: {} },
    Type: { select: { options: [] } },
    Status: { select: { options: [] } },
    'Credentials Required': { rich_text: {} },
    Notes: { rich_text: {} },
  };
}

function textLogSchema() {
  return {
    Name: { title: {} },
    ID: { rich_text: {} },
    Content: { rich_text: {} },
    Notes: { rich_text: {} },
  };
}

async function fetchPageTitle(notion, pageId) {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    const prop = page?.properties || {};
    for (const key of Object.keys(prop)) {
      const value = prop[key];
      if (value?.type === 'title' && Array.isArray(value.title)) {
        return value.title.map((t) => t.plain_text || '').join('').trim() || 'Untitled';
      }
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

async function main() {
  const modules = loadJson('modules.json');
  const tasks = loadJson('tasks.json');
  const integrations = loadJson('integrations.json');
  const roadmap = loadJson('roadmap.json');
  const research = loadJson('research.json');
  const licenses = loadJson('licenses.json');
  const decisionsText = loadText('decision-log.md');
  const promptsText = loadText('cursor-prompts.md');
  const changelogText = loadText('changelog.md');

  if (!ENV.NOTION_TOKEN || !ENV.NOTION_PARENT_PAGE_ID) {
    console.log('Missing NOTION_TOKEN or NOTION_PARENT_PAGE_ID. Local project database created. Notion sync skipped.');
    return;
  }

  const notion = new Client({ auth: ENV.NOTION_TOKEN });
  const parentTitle = await fetchPageTitle(notion, ENV.NOTION_PARENT_PAGE_ID);
  console.log(`[notion] parent page id: ${ENV.NOTION_PARENT_PAGE_ID}`);
  console.log(`[notion] parent page title: ${parentTitle}`);

  if (ENV.NOTION_PROJECTS_DATABASE_ID) {
    console.log(
      '[notion] NOTION_PROJECTS_DATABASE_ID is set. Script will still ignore generic Projects DB unless explicitly used by future mapping.',
    );
  }

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
  const roadmapDbId = await ensureDatabase(
    notion,
    ENV.NOTION_ROADMAP_DATABASE_ID,
    ENV.NOTION_PARENT_PAGE_ID,
    'PsyNova Roadmap',
    roadmapSchema(),
  );
  const integrationsDbId = await ensureDatabase(
    notion,
    ENV.NOTION_INTEGRATIONS_DATABASE_ID,
    ENV.NOTION_PARENT_PAGE_ID,
    'PsyNova Integrations',
    integrationsSchema(),
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
  const decisionsDbId = await ensureDatabase(
    notion,
    ENV.NOTION_DECISIONS_DATABASE_ID,
    ENV.NOTION_PARENT_PAGE_ID,
    'PsyNova Decisions',
    textLogSchema(),
  );
  const promptsDbId = await ensureDatabase(
    notion,
    ENV.NOTION_CURSOR_PROMPTS_DATABASE_ID,
    ENV.NOTION_PARENT_PAGE_ID,
    'PsyNova Cursor Prompts',
    textLogSchema(),
  );
  const changelogDbId = await ensureDatabase(
    notion,
    ENV.NOTION_CHANGELOG_DATABASE_ID,
    ENV.NOTION_PARENT_PAGE_ID,
    'PsyNova Changelog',
    textLogSchema(),
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

  for (const phase of roadmap.phases || []) {
    const properties = {
      Name: title(phase.name),
      ID: rich(phase.id),
      Priority: select(phase.priority),
      Modules: rich((phase.modules || []).join(', ')),
      'Success Criteria': rich(phase.success_criteria),
      Notes: rich(''),
    };
    await upsertPage(notion, roadmapDbId, phase.id, properties, 'roadmap');
  }

  for (const item of integrations) {
    const properties = {
      Name: title(item.name),
      ID: rich(item.id),
      Type: select(item.provider_type),
      Status: select(item.status),
      'Credentials Required': rich((item.credentials_required || []).join(', ')),
      Notes: rich(item.notes),
    };
    await upsertPage(notion, integrationsDbId, item.id, properties, 'integration');
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

  await upsertPage(
    notion,
    decisionsDbId,
    'pm-decisions-master',
    {
      Name: title('PsyNova Decisions'),
      ID: rich('pm-decisions-master'),
      Content: rich(decisionsText),
      Notes: rich('Synced from project-management/decision-log.md'),
    },
    'decision-log',
  );

  await upsertPage(
    notion,
    promptsDbId,
    'pm-cursor-prompts-master',
    {
      Name: title('PsyNova Cursor Prompts'),
      ID: rich('pm-cursor-prompts-master'),
      Content: rich(promptsText),
      Notes: rich('Synced from project-management/cursor-prompts.md'),
    },
    'cursor-prompts',
  );

  await upsertPage(
    notion,
    changelogDbId,
    'pm-changelog-master',
    {
      Name: title('PsyNova Changelog'),
      ID: rich('pm-changelog-master'),
      Content: rich(changelogText),
      Notes: rich('Synced from project-management/changelog.md'),
    },
    'changelog',
  );

  console.log(`[notion] database ids:`);
  console.log(`  PsyNova Modules: ${modulesDbId}`);
  console.log(`  PsyNova Tasks: ${tasksDbId}`);
  console.log(`  PsyNova Roadmap: ${roadmapDbId}`);
  console.log(`  PsyNova Integrations: ${integrationsDbId}`);
  console.log(`  PsyNova Research: ${researchDbId}`);
  console.log(`  PsyNova Licenses: ${licensesDbId}`);
  console.log(`  PsyNova Decisions: ${decisionsDbId}`);
  console.log(`  PsyNova Cursor Prompts: ${promptsDbId}`);
  console.log(`  PsyNova Changelog: ${changelogDbId}`);
  console.log(`Created/synced under parent page: ${parentTitle}`);
  console.log('[notion] sync complete (upsert only, no deletes).');
}

main().catch((err) => {
  console.error('[notion] sync failed:', err.message || err);
  process.exitCode = 1;
});
