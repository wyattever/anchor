/**
 * tests.gs — ANCHOR v11.3.1 | Diagnostic Suite
 */
function RUN_V11_COMPREHENSIVE_DIAGNOSTICS() {
  const results = [];
  const pass = (s, m) => results.push({s, status: '✅', m});
  const fail = (s, m) => results.push({s, status: '❌', m});
  
  console.log('⚓ ANCHOR v11.3.1 DIAGNOSTICS (Synchronized)');
  const allProps = PropertiesService.getScriptProperties().getProperties();
  const propKeys = Object.keys(allProps);

  // (1) Verify all Mandatory Script Properties exist by name
  const expectedProps = [
    '0-0-PRIMARY', '0-1-PANTO', '0-2-LEXICONA', '0-3-SYNAPSE', 
    '01-NETWORK', '02-PROJECTS', '03-WEBAIM', '04-NCADEMI', 
    'ANCHOR_VAULT', 'VAULT_MAP', 'MODEL_ID', 'GEMINI_API_KEY',
    'GCP_REGION', 'GCP_PROJECT_ID', 'NETWORK-MESSAGING-LOGS',
    'JS-CONFIG-SYS', 'JS-SCRIPTS-SYS', 'JS-COMMANDS-SYS', 'JS-UI-THEME-SYS', 
    'JS-VAULT-MAP-CLIENT-SYS', 'JS-MEMORY-CLIENT-SYS'
  ];
  
  expectedProps.forEach(p => {
    propKeys.includes(p) ? pass('PROP', p + ' EXISTS') : fail('PROP', p + ' MISSING');
  });
  
  propKeys.forEach(p => {
    if (!expectedProps.includes(p) && !p.includes('TOKEN') && !p.includes('NUMBER')) {
      fail('PROP', 'UNEXPECTED EXTRA: ' + p);
    }
  });

  // (2) Verify VAULT_MAP workbook dual-registry tabs exist and contain data
  try {
    const mapId = allProps['VAULT_MAP'];
    if (!mapId) throw new Error('VAULT_MAP property is missing or empty.');
    
    const ss = SpreadsheetApp.openById(mapId);
    ['SYSTEM_FILES', 'ROOT'].forEach(tabName => {
      const sheet = ss.getSheetByName(tabName);
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        data.length > 1 ? pass('TABS', tabName + ' OK') : fail('TABS', tabName + ' EMPTY');
      } else {
        fail('TABS', tabName + ' MISSING');
      }
    });
  } catch(e) { fail('SHEET', 'VAULT_MAP ACCESS FAILED: ' + e.message); }

  // (3) Verify Vault.get() resolves all synchronized keys
  const vaultKeys = [
    '02-PROJECTS', '01-NETWORK', '0-1-PANTO', '0-2-LEXICONA', '0-3-SYNAPSE',
    'JS-COMMANDS-SYS', 'JS-CONFIG-SYS', 'JS-MEMORY-CLIENT-SYS', 'JS-SCRIPTS-SYS', 
    'JS-UI-THEME-SYS', 'JS-VAULT-MAP-CLIENT-SYS'
  ];
  Vault.sync();
  vaultKeys.forEach(k => {
    Vault.get(k) ? pass('VAULT', k + ' RESOLVED') : fail('VAULT', k + ' MISSING');
  });

  // (4) Verify ANCHOR_VAULT exists and resolves to valid Drive folder
  const vaultId = allProps['ANCHOR_VAULT'];
  if (vaultId) {
    try {
      const folder = DriveApp.getFolderById(vaultId);
      pass('DRIVE', 'ANCHOR_VAULT RESOLVED: ' + folder.getName());
    } catch(e) { fail('DRIVE', 'ANCHOR_VAULT INVALID: ' + e.message); }
  } else {
    fail('PROP', 'ANCHOR_VAULT MISSING');
  }

  // (5) Verify Per-Agent Memory (PANTO, LEXICONA, SYNAPSE)
  ['0-1-PANTO', '0-2-LEXICONA', '0-3-SYNAPSE'].forEach(agentKey => {
    const folderId = Vault.get(agentKey);
    if (folderId) {
      try {
        const folder = DriveApp.getFolderById(folderId);
        const files = folder.getFilesByName('agent_memory.json');
        files.hasNext() ? pass('MEMORY', agentKey + ' agent_memory.json OK') : fail('MEMORY', agentKey + ' agent_memory.json MISSING');
      } catch(e) { fail('MEMORY', agentKey + ' FOLDER ACCESS FAILED: ' + e.message); }
    } else {
      fail('VAULT', agentKey + ' ID MISSING');
    }
  });

  console.log('PASSED: ' + results.filter(r => r.status === '✅').length);
  const failures = results.filter(r => r.status === '❌');
  if (failures.length > 0) {
    console.warn('FAILURES DETECTED:');
    failures.forEach(f => console.error(`[${f.s}] ${f.m}`));
  } else {
    console.log('🚀 FULLY OPERATIONAL (v11.3.1 Synchronized)');
  }
}
