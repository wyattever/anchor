/**
 * tests.gs — ANCHOR v11.1.3 | Diagnostic + Discovery Test Suite
 * v11.1.3: Migrated to Vault registry.
 */

function RUN_V11_COMPREHENSIVE_DIAGNOSTICS() {
  const results = [];
  const pass  = (section, msg) => { results.push({ section, status: '✅', msg }); };
  const fail  = (section, msg) => { results.push({ section, status: '❌', msg }); };
  const info  = (section, msg) => { results.push({ section, status: 'ℹ️', msg }); };

  console.log('⚓ ANCHOR v11.1.3 — COMPREHENSIVE DIAGNOSTIC REPORT');
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
    const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
    info('CONSTANTS', 'VAULT_ID const = ' + vaultId);
    vaultId
      ? pass('CONSTANTS', 'VAULT_ID loaded from ScriptProperties')
      : fail('CONSTANTS', 'VAULT_ID is null or empty');
  } catch(e) { fail('CONSTANTS', 'VAULT_ID threw — ' + e.message); }

  try {
    info('CONSTANTS', 'UI_VERSION = ' + UI_VERSION);
    UI_VERSION === 'v11.1.3'
      ? pass('CONSTANTS', 'UI_VERSION = v11.1.3 correct')
      : fail('CONSTANTS', 'UI_VERSION = ' + UI_VERSION + ' — expected v11.1.3');
  } catch(e) { fail('CONSTANTS', 'UI_VERSION threw — ' + e.message); }

  // ===========================================================================
  // SECTION 3 — FUNCTION AVAILABILITY
  // ===========================================================================

  console.log('\n── SECTION 3: FUNCTION AVAILABILITY ──');

  const publicFunctions = [
    'doPost', 'doGet', 'include', 'includeFromDrive_', 'getAgentConfig',
    'processMessage', 'readFile', 'listFiles', 'listDirs', 'createDir',
    'writeProjectLog', 'commitSystemUpdate', 'ingestToVault',
    'CRAWL_VAULT', 'generateSystemPrompt', 'processReasoning',
    'getPhysicalMemory', 'updatePhysicalMemory',
    'Vault.get', 'Vault.sync' // MIGRATED functions
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

  const privateFunctions = [
    { name: 'handleIngest_',             test: () => typeof handleIngest_ },
    { name: 'generateStructuredContent_',test: () => typeof generateStructuredContent_ },
    { name: 'buildResponse_',            test: () => typeof buildResponse_ },
    { name: 'processReasoning_',         test: () => typeof processReasoning_ },
    { name: 'logMessage_',               test: () => typeof logMessage_ },
    { name: 'handleRead_',               test: () => typeof handleRead_ },
    { name: 'handleList_',               test: () => typeof handleList_ }
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
    const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
    const vault = DriveApp.getFolderById(vaultId);
    pass('VAULT', 'ANCHOR-VAULT accessible — name: ' + vault.getName());
    info('VAULT', 'Vault ID: ' + vaultId);
  } catch(e) {
    fail('VAULT', 'ANCHOR-VAULT not accessible — ' + e.message);
  }

  // ===========================================================================
  // SECTION 5 — VAULT MAP
  // ===========================================================================

  console.log('\n── SECTION 5: VAULT MAP ──');

  try {
    Vault.sync();
    pass('VAULT_MAP', 'Vault.sync() executed successfully');
  } catch(e) {
    fail('VAULT_MAP', 'Vault.sync() threw — ' + e.message);
  }

  const requiredVaultMapKeys = [
    'NETWORK_REGISTRY',
    'ACTIVE_PROJECTS',
    'PANTO_ANALYTICS',
    'LEX_RES_777',
    'SYN_ARC_555',
    'JS-SCRIPTS',
    'JS-COMMANDS',
    'JS-VAULT-MAP-CLIENT',
    'JS-MEMORY-CLIENT'
  ];

  requiredVaultMapKeys.forEach(key => {
    const id = Vault.get(key);
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
      const id = Vault.get(key);
      if (!id) { fail('DRIVE_JS', key + ' — no VAULT_MAP entry'); return; }
      const content = DriveApp.getFileById(id).getBlob().getDataAsString();
      content.length > 0
        ? pass('DRIVE_JS', key + ' readable (' + content.length + ' chars)')
        : fail('DRIVE_JS', key + ' — file is empty');
    } catch(e) {
      fail('DRIVE_JS', key + ' — ' + e.message);
    }
  });

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
    const regId = Vault.get('NETWORK_REGISTRY');
    const ss = SpreadsheetApp.openById(regId);
    pass('REGISTRY', 'Network Registry accessible — ' + ss.getName());
  } catch(e) {
    fail('REGISTRY', 'Network Registry not accessible — ' + e.message);
  }

  // ===========================================================================
  // FINAL REPORT
  // ===========================================================================

  const passed  = results.filter(r => r.status === '✅').length;
  const failed  = results.filter(r => r.status === '❌').length;
  const infos   = results.filter(r => r.status === 'ℹ️').length;

  console.log('\n' + '='.repeat(60));
  console.log('TOTAL — PASSED: ' + passed + ' | FAILED: ' + failed + ' | INFO: ' + infos);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('🚀 All checks passed — ANCHOR v11.1.3 fully operational');
  } else {
    console.log('⚠️  ' + failed + ' check(s) failed — review above');
  }
}

// =============================================================================
// AGENT WIRING
// =============================================================================

function TEST_AGENT_WIRING() {
  const agents = [
    { name: 'Panto',    key: 'PANTO_ANALYTICS' },
    { name: 'Lexicona', key: 'LEX_RES_777' },
    { name: 'Synapse',  key: 'SYN_ARC_555' }
  ];
  console.log('⚓ AGENT WIRING TEST');
  console.log('='.repeat(40));
  agents.forEach(a => {
    const id = Vault.get(a.key);
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
      const id = Vault.get(key);
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
