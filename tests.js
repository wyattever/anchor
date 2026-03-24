/**
 * tests.gs — ANCHOR v11.0.1 | Diagnostic + Discovery Test Suite
 */

function RUN_V11_COMPREHENSIVE_DIAGNOSTICS() {
  const results = [];
  const pass  = (section, msg) => { results.push({ section, status: '✅', msg }); };
  const fail  = (section, msg) => { results.push({ section, status: '❌', msg }); };
  const info  = (section, msg) => { results.push({ section, status: 'ℹ️', msg }); };

  console.log('⚓ ANCHOR v11.0 — COMPREHENSIVE DIAGNOSTIC REPORT');
  console.log(new Date().toLocaleString());
  console.log('='.repeat(60));

  // ===========================================================================
  // SECTION 1 — SCRIPT PROPERTIES
  // ===========================================================================

  console.log('\n── SECTION 1: SCRIPT PROPERTIES ──');
  const props = PropertiesService.getScriptProperties().getProperties();

  const requiredProps = [
    'GCP_PROJECT_ID',
    'GCP_REGION',
    'VAULT_ID',
    'VAULT_MAP_SHEET_ID',
    'MODEL_ID',
    'NETWORK_REG_ID',
    'GEMINI_API_KEY'
  ];

  const eliminatedProps = [
    'GCP_PROJECT_NUMBER',
    'VERTEX_LOCATION',
    'MODEL_ID_DEFAULT',
    'MODEL_ID_ADVANCED',
    'MODEL_ID_PRO',
    'HEAL_TOKEN',
    'SYNC_TOKEN'
  ];

  requiredProps.forEach(key => {
    if (props[key] && props[key].length > 0) {
      const display = (key === 'GEMINI_API_KEY')
        ? props[key].substring(0, 6) + '...(masked)'
        : props[key];
      pass('PROPS', key + ' = ' + display);
    } else {
      fail('PROPS', key + ' — NOT SET');
    }
  });

  eliminatedProps.forEach(key => {
    props[key]
      ? fail('PROPS', key + ' — still present, should be eliminated')
      : pass('PROPS', key + ' — correctly absent');
  });

  // ===========================================================================
  // SECTION 2 — RUNTIME CONSTANTS
  // ===========================================================================

  console.log('\n── SECTION 2: RUNTIME CONSTANTS ──');

  try {
    info('CONSTANTS', 'VAULT_ID const = ' + VAULT_ID);
    VAULT_ID
      ? pass('CONSTANTS', 'VAULT_ID loaded from ScriptProperties')
      : fail('CONSTANTS', 'VAULT_ID is null or empty');
  } catch(e) { fail('CONSTANTS', 'VAULT_ID threw — ' + e.message); }

  try {
    info('CONSTANTS', 'VERTEX_MODEL const = ' + VERTEX_MODEL);
    VERTEX_MODEL
      ? pass('CONSTANTS', 'VERTEX_MODEL is set')
      : fail('CONSTANTS', 'VERTEX_MODEL is null or empty');
  } catch(e) { fail('CONSTANTS', 'VERTEX_MODEL threw — ' + e.message); }

  try {
    info('CONSTANTS', 'GCP_PROJECT_ID const = ' + GCP_PROJECT_ID);
    GCP_PROJECT_ID
      ? pass('CONSTANTS', 'GCP_PROJECT_ID is set')
      : fail('CONSTANTS', 'GCP_PROJECT_ID is null or empty');
  } catch(e) { fail('CONSTANTS', 'GCP_PROJECT_ID threw — ' + e.message); }

  try {
    info('CONSTANTS', 'GCP_REGION const = ' + GCP_REGION);
    GCP_REGION
      ? pass('CONSTANTS', 'GCP_REGION is set')
      : fail('CONSTANTS', 'GCP_REGION is null or empty');
  } catch(e) { fail('CONSTANTS', 'GCP_REGION threw — ' + e.message); }

  try {
    info('CONSTANTS', 'UI_VERSION = ' + UI_VERSION);
    UI_VERSION === 'v11.0.0'
      ? pass('CONSTANTS', 'UI_VERSION = v11.0.0 correct')
      : fail('CONSTANTS', 'UI_VERSION = ' + UI_VERSION + ' — expected v11.0.0');
  } catch(e) { fail('CONSTANTS', 'UI_VERSION threw — ' + e.message); }

  try {
    info('CONSTANTS', 'NETWORK_REG_ID = ' + NETWORK_REG_ID);
    NETWORK_REG_ID
      ? pass('CONSTANTS', 'NETWORK_REG_ID is set')
      : fail('CONSTANTS', 'NETWORK_REG_ID is null or empty');
  } catch(e) { fail('CONSTANTS', 'NETWORK_REG_ID threw — ' + e.message); }

  // ===========================================================================
  // SECTION 3 — FUNCTION AVAILABILITY
  // ===========================================================================

  console.log('\n── SECTION 3: FUNCTION AVAILABILITY ──');

  // Public functions — testable via eval()
  const publicFunctions = [
    // 0_core.js
    'doPost',
    // web.js
    'doGet', 'include', 'includeFromDrive_', 'getAgentConfig',
    'processMessage', 'readFile', 'listFiles', 'listDirs', 'createDir',
    // 2_executor.js
    'writeProjectLog', 'commitSystemUpdate', 'ingestToVault',
    // 3_crawl.js
    'CRAWL_VAULT', 'generateSystemPrompt', 'processReasoning',
    // 4_vault_map.js
    'bootstrapVaultMap', 'loadVaultMap_', 'getFolderIdByName_',
    'registerFolder_', 'RECONCILE_VAULT_MAP', 'cleanupLegacyProperties',
    // 1_memory.js
    'getPhysicalMemory', 'updatePhysicalMemory',
    // tools.js
    'setupRegistry', 'registerClientJsFiles', 'registerCoreJsFiles',
    'FIND_GEO_PRI_001_FILES_DATED'
  ];

  publicFunctions.forEach(fn => {
    try {
      typeof eval(fn) === 'function'
        ? pass('FUNCTIONS', fn + '()')
        : fail('FUNCTIONS', fn + '() — NOT FOUND');
    } catch(e) {
      fail('FUNCTIONS', fn + '() — eval threw: ' + e.message);
    }
  });

  // Private functions (underscore suffix) — tested by calling them directly
  // and catching ReferenceError if missing
  const privateFunctions = [
    // 0_core.js
    { name: 'handleIngest_',             test: () => typeof handleIngest_ },
    { name: 'generateStructuredContent_',test: () => typeof generateStructuredContent_ },
    { name: 'buildResponse_',            test: () => typeof buildResponse_ },
    { name: 'processReasoning_',         test: () => typeof processReasoning_ },
    // web.js
    { name: 'logMessage_',               test: () => typeof logMessage_ },
    { name: 'includeFromDrive_',         test: () => typeof includeFromDrive_ },
    // 2_executor.js
    { name: 'handleRead_',               test: () => typeof handleRead_ },
    { name: 'handleList_',               test: () => typeof handleList_ },
    // 4_vault_map.js
    { name: 'getVaultMapSheetId_',       test: () => typeof getVaultMapSheetId_ },
    { name: 'loadVaultMap_',             test: () => typeof loadVaultMap_ },
    { name: 'deleteVaultMapRow_',        test: () => typeof deleteVaultMapRow_ }
  ];

  privateFunctions.forEach(fn => {
    try {
      fn.test() === 'function'
        ? pass('FUNCTIONS', fn.name + '() — private, in scope')
        : fail('FUNCTIONS', fn.name + '() — NOT FOUND');
    } catch(e) {
      fail('FUNCTIONS', fn.name + '() — threw: ' + e.message);
    }
  });

  // ===========================================================================
  // SECTION 4 — VAULT ACCESS
  // ===========================================================================

  console.log('\n── SECTION 4: VAULT ACCESS ──');

  try {
    const vault = DriveApp.getFolderById(VAULT_ID);
    pass('VAULT', 'ANCHOR-VAULT accessible — name: ' + vault.getName());
    info('VAULT', 'Vault ID: ' + VAULT_ID);
  } catch(e) {
    fail('VAULT', 'ANCHOR-VAULT not accessible — ' + e.message);
  }

  try {
    const geoPri = DriveApp.getFolderById('1k6BYtrZSGx5zgQccpiW1NNXCnIXqNRqj');
    pass('VAULT', 'GEO-PRI-001 accessible — name: ' + geoPri.getName());
  } catch(e) {
    fail('VAULT', 'GEO-PRI-001 not accessible — ' + e.message);
  }

  // ===========================================================================
  // SECTION 5 — VAULT MAP
  // ===========================================================================

  console.log('\n── SECTION 5: VAULT MAP ──');

  let vaultMap = {};
  try {
    vaultMap = loadVaultMap_();
    const count = Object.keys(vaultMap).length;
    count > 0
      ? pass('VAULT_MAP', count + ' entries loaded')
      : fail('VAULT_MAP', 'Empty — not initialized');
    info('VAULT_MAP', 'Keys: ' + Object.keys(vaultMap).join(', '));
  } catch(e) {
    fail('VAULT_MAP', 'loadVaultMap_() threw — ' + e.message);
  }

  const requiredVaultMapKeys = [
    '01-NETWORK-REGISTRY',
    '02-ACTIVE-PROJECTS',
    '04-PAN-ANA-001',
    '05-LEX-RES-777',
    '06-SYN-ARC-555',
    'JS-SCRIPTS',
    'JS-COMMANDS',
    'JS-VAULT-MAP-CLIENT',
    'JS-MEMORY-CLIENT'
  ];

  requiredVaultMapKeys.forEach(key => {
    const id = getFolderIdByName_(key);
    id
      ? pass('VAULT_MAP', key + ' → ' + id)
      : fail('VAULT_MAP', key + ' — not found or inactive');
  });

  // ===========================================================================
  // SECTION 6 — DRIVE JS FILES
  // ===========================================================================

  console.log('\n── SECTION 6: DRIVE JS FILES ──');

  const driveJsKeys = [
    'JS-SCRIPTS',
    'JS-COMMANDS',
    'JS-VAULT-MAP-CLIENT',
    'JS-MEMORY-CLIENT'
  ];

  driveJsKeys.forEach(key => {
    try {
      const id = getFolderIdByName_(key);
      if (!id) { fail('DRIVE_JS', key + ' — no VAULT_MAP entry'); return; }
      const content = DriveApp.getFileById(id).getBlob().getDataAsString();
      content.length > 0
        ? pass('DRIVE_JS', key + ' readable (' + content.length + ' chars)')
        : fail('DRIVE_JS', key + ' — file is empty');
    } catch(e) {
      fail('DRIVE_JS', key + ' — ' + e.message);
    }
  });

  try {
    const result = includeFromDrive_('JS-SCRIPTS');
    result.startsWith('<script>') && result.endsWith('</script>')
      ? pass('DRIVE_JS', 'includeFromDrive_(JS-SCRIPTS) wraps correctly')
      : fail('DRIVE_JS', 'includeFromDrive_(JS-SCRIPTS) — bad wrapper output');
  } catch(e) {
    fail('DRIVE_JS', 'includeFromDrive_ threw — ' + e.message);
  }

  try {
    const result = includeFromDrive_('JS-DOES-NOT-EXIST');
    result.includes('console.error')
      ? pass('DRIVE_JS', 'includeFromDrive_ missing key degrades gracefully')
      : fail('DRIVE_JS', 'includeFromDrive_ missing key — did not degrade gracefully');
  } catch(e) {
    fail('DRIVE_JS', 'includeFromDrive_ missing key threw instead of degrading — ' + e.message);
  }

  // ===========================================================================
  // SECTION 7 — AGENT WIRING
  // ===========================================================================

  console.log('\n── SECTION 7: AGENT WIRING ──');

  try {
    const agents = getAgentConfig();
    agents.forEach(a => {
      a.id !== 'MISSING_ID'
        ? pass('AGENTS', a.name + ' → ' + a.id)
        : fail('AGENTS', a.name + ' — MISSING_ID');
    });
  } catch(e) {
    fail('AGENTS', 'getAgentConfig() threw — ' + e.message);
  }

  // ===========================================================================
  // SECTION 8 — NETWORK REGISTRY
  // ===========================================================================

  console.log('\n── SECTION 8: NETWORK REGISTRY ──');

  try {
    const ss = SpreadsheetApp.openById(NETWORK_REG_ID);
    pass('REGISTRY', 'Network Registry accessible — ' + ss.getName());
    const sheets = ss.getSheets().map(s => s.getName());
    info('REGISTRY', 'Sheets: ' + sheets.join(', '));
    sheets.includes('Primary')
      ? pass('REGISTRY', 'Primary sheet exists')
      : fail('REGISTRY', 'Primary sheet missing');
    sheets.includes('REGISTRY')
      ? pass('REGISTRY', 'REGISTRY sheet exists')
      : fail('REGISTRY', 'REGISTRY sheet missing — run setupRegistry()');
  } catch(e) {
    fail('REGISTRY', 'Network Registry not accessible — ' + e.message);
  }

  // ===========================================================================
  // SECTION 9 — MEMORY
  // ===========================================================================

  console.log('\n── SECTION 9: AGENT MEMORY ──');

  try {
    const memory = getPhysicalMemory();
    const keys = Object.keys(memory);
    keys.length > 0
      ? pass('MEMORY', 'agent_memory.json readable — ' + keys.length + ' keys')
      : fail('MEMORY', 'agent_memory.json empty or missing');
    info('MEMORY', 'Memory keys: ' + keys.join(', '));
    if (memory.anchor_version) {
      memory.anchor_version === 'v11.0.0'
        ? pass('MEMORY', 'anchor_version = v11.0.0')
        : fail('MEMORY', 'anchor_version = ' + memory.anchor_version + ' — update to v11.0.0');
    } else {
      fail('MEMORY', 'anchor_version key missing from agent_memory.json');
    }
  } catch(e) {
    fail('MEMORY', 'getPhysicalMemory() threw — ' + e.message);
  }

  // ===========================================================================
  // SECTION 10 — DOPOST ROUTING
  // ===========================================================================

  console.log('\n── SECTION 10: DOPOST ROUTING ──');

  try {
    const res = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({ intent: 'PING' }) } }).getContent()
    );
    res.status === 'OK' && res.message.includes('v11.0')
      ? pass('ROUTING', 'PING → v11.0.0 confirmed')
      : fail('ROUTING', 'PING returned unexpected: ' + JSON.stringify(res));
  } catch(e) { fail('ROUTING', 'PING threw — ' + e.message); }

  try {
    const res = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({ intent: 'BOGUS' }) } }).getContent()
    );
    res.status === 'ERROR'
      ? pass('ROUTING', 'Unknown intent returns ERROR correctly')
      : fail('ROUTING', 'Unknown intent did not return ERROR — ' + JSON.stringify(res));
  } catch(e) { fail('ROUTING', 'Unknown intent threw — ' + e.message); }

  try {
    const res = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({}) } }).getContent()
    );
    res.status === 'ERROR'
      ? pass('ROUTING', 'Missing intent returns ERROR correctly')
      : fail('ROUTING', 'Missing intent did not return ERROR');
  } catch(e) { fail('ROUTING', 'Missing intent threw — ' + e.message); }

  try {
    const res = JSON.parse(
      doPost({ postData: { contents: 'not json' } }).getContent()
    );
    res.status === 'ERROR'
      ? pass('ROUTING', 'Invalid JSON returns ERROR correctly')
      : fail('ROUTING', 'Invalid JSON did not return ERROR');
  } catch(e) { fail('ROUTING', 'Invalid JSON threw — ' + e.message); }

  // ===========================================================================
  // SECTION 11 — INGEST
  // ===========================================================================

  console.log('\n── SECTION 11: INGEST ──');

  let ingestFileId = null;

  try {
    const res = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({
        intent:   'INGEST',
        format:   'txt',
        folderId: VAULT_ID,
        name:     'DIAG_TEST_v11.txt',
        content:  'ANCHOR v11.0.0 diagnostic test — safe to delete',
        meta:     { agent: 'DIAGNOSTIC', agentId: 'SYS-DIAG-000', format: 'txt' }
      }) } }).getContent()
    );
    if (res.status === 'OK') {
      ingestFileId = res.fileId;
      pass('INGEST', 'TXT ingest OK → ' + res.fileId);
    } else {
      fail('INGEST', 'TXT ingest ERROR — ' + res.message);
    }
  } catch(e) { fail('INGEST', 'TXT ingest threw — ' + e.message); }

  try {
    const res = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({
        intent: 'INGEST', format: 'txt', folderId: VAULT_ID
      }) } }).getContent()
    );
    res.status === 'ERROR'
      ? pass('INGEST', 'TXT missing content returns ERROR correctly')
      : fail('INGEST', 'TXT missing content did not return ERROR');
  } catch(e) { fail('INGEST', 'TXT missing content threw — ' + e.message); }

  // ===========================================================================
  // SECTION 12 — READ
  // ===========================================================================

  console.log('\n── SECTION 12: READ ──');

  if (ingestFileId) {
    try {
      const res = JSON.parse(
        doPost({ postData: { contents: JSON.stringify({
          intent: 'READ',
          fileId: ingestFileId
        }) } }).getContent()
      );
      res.status === 'OK' && res.content === 'ANCHOR v11.0.0 diagnostic test — safe to delete'
        ? pass('READ', 'READ by fileId — content verified')
        : fail('READ', 'READ by fileId — content mismatch or error: ' + JSON.stringify(res));
    } catch(e) { fail('READ', 'READ by fileId threw — ' + e.message); }
  } else {
    fail('READ', 'READ by fileId — skipped, no fileId from INGEST');
  }

  try {
    const res = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({
        intent:   'READ',
        folderId: VAULT_ID,
        name:     'DIAG_TEST_v11.txt'
      }) } }).getContent()
    );
    res.status === 'OK'
      ? pass('READ', 'READ by name — ' + res.name + ' (' + res.content.length + ' chars)')
      : fail('READ', 'READ by name — ' + res.message);
  } catch(e) { fail('READ', 'READ by name threw — ' + e.message); }

  try {
    const res = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({ intent: 'READ' }) } }).getContent()
    );
    res.status === 'ERROR'
      ? pass('READ', 'READ with no params returns ERROR correctly')
      : fail('READ', 'READ with no params did not return ERROR');
  } catch(e) { fail('READ', 'READ no params threw — ' + e.message); }

  try {
    const res = readFile({ fileId: ingestFileId });
    res.status === 'OK'
      ? pass('READ', 'readFile() wrapper OK')
      : fail('READ', 'readFile() wrapper ERROR — ' + res.message);
  } catch(e) { fail('READ', 'readFile() wrapper threw — ' + e.message); }

  // ===========================================================================
  // SECTION 13 — LIST
  // ===========================================================================

  console.log('\n── SECTION 13: LIST ──');

  try {
    const res = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({
        intent:   'LIST',
        folderId: VAULT_ID
      }) } }).getContent()
    );
    if (res.status === 'OK') {
      pass('LIST', 'LIST vault root — ' + res.count + ' files');
      res.files.forEach(f => info('LIST', '  vault: ' + f.name + ' | ' + f.fileId));
    } else {
      fail('LIST', 'LIST vault root — ' + res.message);
    }
  } catch(e) { fail('LIST', 'LIST vault root threw — ' + e.message); }

  try {
    const pantoId = getFolderIdByName_('04-PAN-ANA-001');
    if (!pantoId) { fail('LIST', 'LIST Panto — no folderId'); }
    else {
      const res = JSON.parse(
        doPost({ postData: { contents: JSON.stringify({
          intent:   'LIST',
          folderId: pantoId
        }) } }).getContent()
      );
      res.status === 'OK'
        ? pass('LIST', 'LIST Panto folder — ' + res.count + ' files')
        : fail('LIST', 'LIST Panto folder — ' + res.message);
    }
  } catch(e) { fail('LIST', 'LIST Panto threw — ' + e.message); }

  try {
    const res = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({ intent: 'LIST' }) } }).getContent()
    );
    res.status === 'ERROR'
      ? pass('LIST', 'LIST with no folderId returns ERROR correctly')
      : fail('LIST', 'LIST with no folderId did not return ERROR');
  } catch(e) { fail('LIST', 'LIST no folderId threw — ' + e.message); }

  // ===========================================================================
  // SECTION 14 — VERTEX AI
  // ===========================================================================

  console.log('\n── SECTION 14: VERTEX AI ──');

  try {
    info('VERTEX', 'Endpoint: ' + getVertexEndpoint_());
    const res = JSON.parse(
      doPost({ postData: { contents: JSON.stringify({
        intent: 'REASON',
        prompt: 'Reply with exactly the words: ANCHOR VERTEX OK',
        meta:   { agent: 'DIAGNOSTIC', agentId: 'SYS-DIAG-000' }
      }) } }).getContent()
    );
    if (res.status === 'OK') {
      pass('VERTEX', 'REASON intent OK — model responded');
      info('VERTEX', 'Response: ' + res.response.substring(0, 100));
    } else {
      fail('VERTEX', 'REASON intent ERROR — ' + res.message);
    }
  } catch(e) { fail('VERTEX', 'REASON threw — ' + e.message); }

  // ===========================================================================
  // FINAL REPORT
  // ===========================================================================

  const passed  = results.filter(r => r.status === '✅').length;
  const failed  = results.filter(r => r.status === '❌').length;
  const infos   = results.filter(r => r.status === 'ℹ️').length;

  console.log('\n' + '='.repeat(60));
  console.log('⚓ ANCHOR v11.0 — DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));

  const sections = [...new Set(results.map(r => r.section))];
  sections.forEach(section => {
    const sectionResults = results.filter(r => r.section === section);
    const sectionPassed  = sectionResults.filter(r => r.status === '✅').length;
    const sectionFailed  = sectionResults.filter(r => r.status === '❌').length;
    console.log('\n[' + section + '] ' + sectionPassed + ' passed, ' + sectionFailed + ' failed');
    sectionResults.forEach(r => {
      if (r.status !== 'ℹ️') console.log('  ' + r.status + ' ' + r.msg);
    });
    sectionResults
      .filter(r => r.status === 'ℹ️')
      .forEach(r => console.log('  ' + r.status + ' ' + r.msg));
  });

  console.log('\n' + '='.repeat(60));
  console.log('TOTAL — PASSED: ' + passed + ' | FAILED: ' + failed + ' | INFO: ' + infos);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('🚀 All checks passed — ANCHOR v11.0 fully operational');
  } else {
    console.log('⚠️  ' + failed + ' check(s) failed — review above');
  }
}

// =============================================================================
// DISCOVERY UTILITIES
// =============================================================================

function REGISTER_AND_CLEAN_JS_FILES() {
  registerFolder_('JS-SCRIPTS',   '1WW1YrA_XxjCAong24PFV9nJGtYRw3-W9');
  registerFolder_('JS-COMMANDS',  '1SBs242jHt9HI9ACEoKssboLGZO-_8wDy');
  console.log('JS-SCRIPTS and JS-COMMANDS registered.');
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
