/**
 * tests.gs — ANCHOR v9 | Diagnostic + Discovery Test Suite
 * Consolidated from tests.js and test_discovery.js
 */
function REGISTER_AND_CLEAN_JS_FILES() {
  registerFolder_('JS-SCRIPTS',   '1WW1YrA_XxjCAong24PFV9nJGtYRw3-W9');
  registerFolder_('JS-COMMANDS',  '1SBs242jHt9HI9ACEoKssboLGZO-_8wDy');
  console.log('JS-SCRIPTS and JS-COMMANDS registered.');

  DriveApp.getFileById('1Qyr0U14jHxY5Z9G_E08IvPP08MyNbolQ').setTrashed(true);
  DriveApp.getFileById('1YWDHnilGYTbGLWGu3w0c99LZgJjiLSuC').setTrashed(true);
  console.log('Older duplicates trashed.');
}

function FIND_GEO_PRI_001_FILES_DATED() {
  const folderId = '1k6BYtrZSGx5zgQccpiW1NNXCnIXqNRqj';
  const folder   = DriveApp.getFolderById(folderId);
  const files    = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    console.log(f.getName() + ' | ' + f.getLastUpdated() + ' | ' + f.getId());
  }
}

function FIND_GEO_PRI_001_FILES() {
  const folderId = '1k6BYtrZSGx5zgQccpiW1NNXCnIXqNRqj';
  const folder   = DriveApp.getFolderById(folderId);
  const files    = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    console.log(f.getName() + ' → ' + f.getId());
  }
}



// =============================================================================
// ANCHOR FULL DIAGNOSTICS
// =============================================================================

function RUN_ANCHOR_DIAGNOSTICS() {
  const LOG_HEADER = '⚓ ANCHOR DIAGNOSTIC REPORT\n' +
                     new Date().toLocaleString() + '\n' +
                     '='.repeat(40);
  console.log(LOG_HEADER);

  const results = {
    routing:      false,
    vault_access: false,
    ingest_io:    false,
    vertex:       false,
    vault_map:    false
  };

  try {
    const pingRes = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({ intent: 'PING' }) } }).getContent()
    );
    if (pingRes.status === 'OK') {
      console.log('✅ PING: Success');
      results.routing = true;
    }

    console.log('Verifying Vault Access (ID: ' + VAULT_ID + ')...');
    try {
      const folder = DriveApp.getFolderById(VAULT_ID);
      console.log('✅ VAULT ACCESS: ' + folder.getName());
      results.vault_access = true;
    } catch (fErr) {
      console.error('❌ VAULT ACCESS FAILED: ' + fErr.message);
    }

    const map = loadVaultMap_();
    if (Object.keys(map).length > 0) {
      console.log('✅ VAULT_MAP: ' + Object.keys(map).length + ' entries loaded');
      results.vault_map = true;
    } else {
      console.error('❌ VAULT_MAP: Empty or not initialized');
    }

    const ingestPayload = {
      intent:   'INGEST',
      format:   'txt',
      folderId: VAULT_ID,
      name:     'DIAGNOSTIC_TEST.txt',
      content:  'ANCHOR diagnostic test file — safe to delete.',
      meta:     { agent: 'DIAGNOSTIC', agentId: 'SYS-DIA-000', format: 'txt' }
    };
    const ingestRes = JSON.parse(
      doPost({ postData: { contents: JSON.stringify(ingestPayload) } }).getContent()
    );
    if (ingestRes.status === 'OK') {
      console.log('✅ INGEST I/O: Success → ' + ingestRes.fileId);
      results.ingest_io = true;
    }

  } catch (e) {
    console.error('❌ DIAGNOSTICS ERROR: ' + e.message);
  }

  const passed = Object.values(results).filter(Boolean).length;
  const total  = Object.keys(results).length;
  console.log('='.repeat(40));
  console.log('PASSED: ' + passed + ' / ' + total);
  if (passed === total) {
    console.log('🚀 All diagnostics passed');
  } else {
    console.log('⚠️  Some checks failed — review above');
  }
  return results;
}

// =============================================================================
// AGENT WIRING
// =============================================================================

function TEST_AGENT_WIRING() {
  const agents = [
    { name: 'Panto',    key: '04-PAN-ANA-001' },
    { name: 'Lexicona', key: '05-LEX-RES-777' },
    { name: 'Synapse',  key: '06-SYN-ARC-555' }
  ];
  console.log('⚓ AGENT WIRING TEST');
  console.log('='.repeat(40));
  agents.forEach(a => {
    const id = getFolderIdByName_(a.key);
    id
      ? console.log('✅ ' + a.name + ' WIRED → ' + id)
      : console.log('❌ ' + a.name + ' MISSING — check VAULT_MAP for ' + a.key);
  });
}

// =============================================================================
// DRIVE JS FILES
// =============================================================================

function TEST_DRIVE_JS_FILES() {
  const keys = [
    'JS-COMMANDS',
    'JS-SCRIPTS',
    'JS-VAULT-MAP-CLIENT',
    'JS-MEMORY-CLIENT'
  ];
  console.log('⚓ DRIVE JS FILE TEST');
  console.log('='.repeat(40));
  keys.forEach(key => {
    try {
      const id      = getFolderIdByName_(key);
      if (!id) { console.log('❌ ' + key + ': no VAULT_MAP entry'); return; }
      const content = DriveApp.getFileById(id).getBlob().getDataAsString();
      content.length > 0
        ? console.log('✅ ' + key + ': readable (' + content.length + ' chars)')
        : console.log('❌ ' + key + ': file is empty');
    } catch(e) {
      console.log('❌ ' + key + ': ' + e.message);
    }
  });
}

// =============================================================================
// STAGE 2 MIGRATION VALIDATION
// =============================================================================

function VALIDATE_STAGE_2() {
  const results = [];
  const pass = (msg) => { results.push('✅ ' + msg); };
  const fail = (msg) => { results.push('❌ ' + msg); };

  const deadFiles = ['Code', '94_sync_props', '5_ingest', '4_brain'];
  deadFiles.forEach(name => {
    try {
      HtmlService.createHtmlOutputFromFile(name);
      fail('Dead file still present: ' + name);
    } catch(e) {
      pass('Dead file gone: ' + name);
    }
  });

  try {
    const id = getFolderIdByName_('02-ACTIVE-PROJECTS');
    id
      ? pass('2_executor: 02-ACTIVE-PROJECTS key resolves → ' + id)
      : fail('2_executor: 02-ACTIVE-PROJECTS key returned null');
  } catch(e) {
    fail('2_executor: getFolderIdByName_ threw — ' + e.message);
  }

  try {
    const netId = getFolderIdByName_('01-NETWORK-REGISTRY');
    netId
      ? pass('3_crawl: 01-NETWORK-REGISTRY key resolves → ' + netId)
      : fail('3_crawl: 01-NETWORK-REGISTRY key returned null');
  } catch(e) {
    fail('3_crawl: 01-NETWORK-REGISTRY threw — ' + e.message);
  }

  try {
    const actId = getFolderIdByName_('02-ACTIVE-PROJECTS');
    actId
      ? pass('3_crawl: 02-ACTIVE-PROJECTS key resolves → ' + actId)
      : fail('3_crawl: 02-ACTIVE-PROJECTS key returned null');
  } catch(e) {
    fail('3_crawl: 02-ACTIVE-PROJECTS threw — ' + e.message);
  }

  typeof processReasoning_ === 'function'
    ? pass('3_crawl: processReasoning_() found in scope')
    : fail('3_crawl: processReasoning_() not found — check 0_core.js');

  const props = PropertiesService.getScriptProperties().getProperties();
  ['GEMINI_API_KEY', 'HEAL_TOKEN', 'SYNC_TOKEN'].forEach(key => {
    (props[key] || '').length > 0
      ? pass('99_restore: ' + key + ' is set')
      : fail('99_restore: ' + key + ' NOT set — set manually in Script Properties UI');
  });

  try {
    const folder = DriveApp.getFolderById(
      PropertiesService.getScriptProperties().getProperty('VAULT_ID')
    );
    pass('VAULT: accessible → ' + folder.getName());
  } catch(e) {
    fail('VAULT: not accessible — ' + e.message);
  }

  const passed = results.filter(r => r.startsWith('✅')).length;
  const failed = results.filter(r => r.startsWith('❌')).length;
  console.log('\n⚓ STAGE 2 VALIDATION REPORT');
  console.log('='.repeat(40));
  results.forEach(r => console.log(r));
  console.log('='.repeat(40));
  console.log('PASSED: ' + passed + ' / FAILED: ' + failed);
  failed === 0
    ? console.log('🚀 Stage 2 clean — ready for Stage 3')
    : console.log('⚠️  Fix failures before proceeding to Stage 3');
}
