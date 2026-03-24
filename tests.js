/**
 * tests.gs — ANCHOR v11.0.0 | Diagnostic + Discovery Test Suite
 * Consolidated from tests.js and test_discovery.js
 */

function TEST_READ_LIST_FULL() {
  const folderId = '1QnrCSWMim4xPhUoXYzyAkXcYYu7y3vLt'; // Panto
  const vaultId  = '1PfiQ9BZ9pk2kiVJ8HUsEt4XenMy4ZkiE'; // ANCHOR-VAULT

  const results = [];
  const pass = (msg) => { results.push('✅ ' + msg); };
  const fail = (msg) => { results.push('❌ ' + msg); };

  // --- READ by name ---
  const readByName = JSON.parse(
    doPost({ postData: { contents: JSON.stringify({
      intent:   'READ',
      folderId: folderId,
      name:     'number-test.txt'
    }) } }).getContent()
  );
  if (readByName.status === 'OK') {
    pass('READ by name: ' + readByName.name + ' (' + readByName.content.length + ' chars)');
    console.log('--- content preview ---');
    console.log(readByName.content.substring(0, 200));

    // --- READ by fileId (use ID returned from name lookup) ---
    const readById = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({
        intent: 'READ',
        fileId: readByName.fileId
      }) } }).getContent()
    );
    readById.status === 'OK'
      ? pass('READ by fileId: ' + readById.fileId + ' — content matches: ' + (readById.content === readByName.content))
      : fail('READ by fileId: ' + readById.message);

  } else {
    fail('READ by name: ' + readByName.message);
    fail('READ by fileId: skipped — no fileId available');
  }

  // --- LIST vault root ---
  const listVault = JSON.parse(
    doPost({ postData: { contents: JSON.stringify({
      intent:   'LIST',
      folderId: vaultId
    }) } }).getContent()
  );
  if (listVault.status === 'OK') {
    pass('LIST vault root: ' + listVault.count + ' files');
    listVault.files.forEach(f => console.log('  ' + f.name + ' | ' + f.fileId));
  } else {
    fail('LIST vault root: ' + listVault.message);
  }

  // --- LIST Panto folder ---
  const listPanto = JSON.parse(
    doPost({ postData: { contents: JSON.stringify({
      intent:   'LIST',
      folderId: folderId
    }) } }).getContent()
  );
  if (listPanto.status === 'OK') {
    pass('LIST Panto folder: ' + listPanto.count + ' files');
    listPanto.files.forEach(f => console.log('  ' + f.name + ' | ' + f.fileId));
  } else {
    fail('LIST Panto folder: ' + listPanto.message);
  }

  // --- Report ---
  const passed = results.filter(r => r.startsWith('✅')).length;
  const failed = results.filter(r => r.startsWith('❌')).length;
  console.log('\n⚓ READ/LIST FULL TEST REPORT');
  console.log('='.repeat(40));
  results.forEach(r => console.log(r));
  console.log('='.repeat(40));
  console.log('PASSED: ' + passed + ' / FAILED: ' + failed);
}

function FIX_VAULT_MAP_JS() {
  registerFolder_('JS-SCRIPTS',  '1WW1YrA_XxjCAong24PFV9nJGtYRw3-W9');
  registerFolder_('JS-COMMANDS', '1SBs242jHt9HI9ACEoKssboLGZO-_8wDy');
  console.log('Done. Run CHECK_DRIVE_JS() to verify.');
}

function CHECK_DRIVE_JS() {
  console.log(includeFromDrive_('JS-SCRIPTS').substring(0, 100));
  console.log(includeFromDrive_('JS-COMMANDS').substring(0, 100));
}

function QUICK_CHECK() {
  console.log(typeof getFolderIdByName_);
  console.log(typeof handleRead_);
  console.log(typeof handleList_);
  console.log(getAgentConfig());
}

function TEST_READ_LIST() {
  const results = [];
  const pass = (msg) => { results.push('✅ ' + msg); };
  const fail = (msg) => { results.push('❌ ' + msg); };

  // --- LIST test ---
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  const listRes = JSON.parse(
    doPost({ postData: { contents: JSON.stringify({
      intent:   'LIST',
      folderId: vaultId
    }) } }).getContent()
  );
  listRes.status === 'OK'
    ? pass('LIST: returned ' + listRes.count + ' files')
    : fail('LIST: ' + listRes.message);

  // --- INGEST then READ by fileId ---
  const ingestRes = JSON.parse(
    doPost({ postData: { contents: JSON.stringify({
      intent:   'INGEST',
      format:   'txt',
      folderId: vaultId,
      name:     'READ_TEST.txt',
      content:  'read test payload — safe to delete',
      meta:     { agent: 'TEST', agentId: 'SYS-TEST-000', format: 'txt' }
    }) } }).getContent()
  );
  ingestRes.status === 'OK'
    ? pass('INGEST for READ test: ' + ingestRes.fileId)
    : fail('INGEST for READ test: ' + ingestRes.message);

  if (ingestRes.fileId) {
    const readRes = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({
        intent: 'READ',
        fileId: ingestRes.fileId
      }) } }).getContent()
    );
    readRes.status === 'OK' && readRes.content === 'read test payload — safe to delete'
      ? pass('READ by fileId: content verified')
      : fail('READ by fileId: ' + (readRes.message || 'content mismatch'));
  }

  // --- READ by folderId + name ---
  const readByNameRes = JSON.parse(
    doPost({ postData: { contents: JSON.stringify({
      intent:    'READ',
      folderId:  vaultId,
      name:      'READ_TEST.txt'
    }) } }).getContent()
  );
  readByNameRes.status === 'OK'
    ? pass('READ by name: ' + readByNameRes.name)
    : fail('READ by name: ' + readByNameRes.message);

  // --- READ with missing fileId ---
  const badReadRes = JSON.parse(
    doPost({ postData: { contents: JSON.stringify({
      intent: 'READ'
    }) } }).getContent()
  );
  badReadRes.status === 'ERROR'
    ? pass('READ with no params: correct ERROR response')
    : fail('READ with no params: should have returned ERROR');

  // --- Report ---
  const passed = results.filter(r => r.startsWith('✅')).length;
  const failed = results.filter(r => r.startsWith('❌')).length;
  console.log('\n⚓ READ/LIST TEST REPORT');
  console.log('='.repeat(40));
  results.forEach(r => console.log(r));
  console.log('='.repeat(40));
  console.log('PASSED: ' + passed + ' / FAILED: ' + failed);
}


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

// =============================================================================
// STAGE 4 MIGRATION VALIDATION — run once, then remove
// =============================================================================

function VALIDATE_STAGE_4() {
  const results = [];
  const pass = (msg) => { results.push('✅ ' + msg); };
  const fail = (msg) => { results.push('❌ ' + msg); };

  // --- WebApp.js must be gone ---
  try {
    HtmlService.createHtmlOutputFromFile('WebApp');
    fail('WebApp.js still present in project');
  } catch(e) {
    pass('WebApp.js removed from project');
  }

  // --- web.js entry points exist ---
  try {
    if (typeof doGet === 'function') {
      pass('web.js: doGet() found in scope');
    } else {
      fail('web.js: doGet() not found');
    }
  } catch(e) {
    fail('web.js: doGet() check threw — ' + e.message);
  }

  try {
    if (typeof includeFromDrive_ === 'function') {
      pass('web.js: includeFromDrive_() found in scope');
    } else {
      fail('web.js: includeFromDrive_() not found');
    }
  } catch(e) {
    fail('web.js: includeFromDrive_() check threw — ' + e.message);
  }

  try {
    if (typeof processMessage === 'function') {
      pass('web.js: processMessage() found in scope');
    } else {
      fail('web.js: processMessage() not found');
    }
  } catch(e) {
    fail('web.js: processMessage() check threw — ' + e.message);
  }

  // --- tools.js one-off functions exist ---
  try {
    if (typeof setupRegistry === 'function') {
      pass('tools.js: setupRegistry() found in scope');
    } else {
      fail('tools.js: setupRegistry() not found');
    }
  } catch(e) {
    fail('tools.js: setupRegistry() check threw — ' + e.message);
  }

  try {
    if (typeof registerClientJsFiles === 'function') {
      pass('tools.js: registerClientJsFiles() found in scope');
    } else {
      fail('tools.js: registerClientJsFiles() not found');
    }
  } catch(e) {
    fail('tools.js: registerClientJsFiles() check threw — ' + e.message);
  }

  // --- All four Drive JS keys readable ---
  ['JS-COMMANDS', 'JS-SCRIPTS', 'JS-VAULT-MAP-CLIENT', 'JS-MEMORY-CLIENT'].forEach(key => {
    try {
      const id = getFolderIdByName_(key);
      if (!id) { fail('Drive JS: ' + key + ' — no VAULT_MAP entry'); return; }
      const content = DriveApp.getFileById(id).getBlob().getDataAsString();
      content.length > 0
        ? pass('Drive JS: ' + key + ' readable (' + content.length + ' chars)')
        : fail('Drive JS: ' + key + ' — file is empty');
    } catch(e) {
      fail('Drive JS: ' + key + ' — ' + e.message);
    }
  });

  // --- includeFromDrive_ returns script tag for JS-COMMANDS ---
  try {
    const result = includeFromDrive_('JS-COMMANDS');
    result.includes('<script>') && result.includes('</script>')
      ? pass('includeFromDrive_: JS-COMMANDS wraps correctly in script tags')
      : fail('includeFromDrive_: JS-COMMANDS output missing script tags');
  } catch(e) {
    fail('includeFromDrive_: threw — ' + e.message);
  }

  // --- includeFromDrive_ returns error script tag for missing key ---
  try {
    const result = includeFromDrive_('JS-DOES-NOT-EXIST');
    result.includes('console.error')
      ? pass('includeFromDrive_: missing key returns error script tag gracefully')
      : fail('includeFromDrive_: missing key did not return error script tag');
  } catch(e) {
    fail('includeFromDrive_: missing key threw instead of degrading gracefully — ' + e.message);
  }

  // --- Agent config resolves all three agents ---
  try {
    const agents = getAgentConfig();
    const missing = agents.filter(a => a.id === 'MISSING_ID');
    missing.length === 0
      ? pass('getAgentConfig: all 3 agents resolve (' + agents.map(a => a.name).join(', ') + ')')
      : fail('getAgentConfig: missing IDs for — ' + missing.map(a => a.name).join(', '));
  } catch(e) {
    fail('getAgentConfig: threw — ' + e.message);
  }

  // --- PING routing still clean ---
  try {
    const pingRes = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({ intent: 'PING' }) } }).getContent()
    );
    pingRes.status === 'OK'
      ? pass('doPost: PING routing OK')
      : fail('doPost: PING returned unexpected status — ' + JSON.stringify(pingRes));
  } catch(e) {
    fail('doPost: PING threw — ' + e.message);
  }

  // --- Index.html contains includeFromDrive_ calls ---
  try {
    const html = HtmlService.createHtmlOutputFromFile('Index').getContent();
    html.includes('includeFromDrive_') || html.includes('includeFromDrive_') || html.includes('includeFromDrive_')
      ? pass('Index.html: includeFromDrive_() calls present (encoded)')
      : fail('Index.html: includeFromDrive_() calls not found');
    (html.includes('JS-COMMANDS') || html.includes('JS-COMMANDS')) &&
    (html.includes('JS-SCRIPTS')  || html.includes('JS-SCRIPTS'))
      ? pass('Index.html: JS-COMMANDS and JS-SCRIPTS referenced (encoded)')
      : fail('Index.html: JS-COMMANDS or JS-SCRIPTS reference missing');
  } catch(e) {
    fail('Index.html: check threw — ' + e.message);
  }

  // --- Report ---
  const passed = results.filter(r => r.startsWith('✅')).length;
  const failed = results.filter(r => r.startsWith('❌')).length;
  console.log('\n⚓ STAGE 4 VALIDATION REPORT');
  console.log('='.repeat(40));
  results.forEach(r => console.log(r));
  console.log('='.repeat(40));
  console.log('PASSED: ' + passed + ' / FAILED: ' + failed);
  failed === 0
    ? console.log('🚀 Stage 4 clean — migration complete')
    : console.log('⚠️  Fix failures before deploying');
}
