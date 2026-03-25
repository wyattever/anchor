/**
 * tests.gs — ANCHOR v11.1.6 | Diagnostic Suite
 */
function RUN_V11_COMPREHENSIVE_DIAGNOSTICS() {
  const results = [];
  const pass = (s, m) => results.push({s, status: '✅', m});
  const fail = (s, m) => results.push({s, status: '❌', m});
  
  console.log('⚓ ANCHOR v11.1.6 DIAGNOSTICS');
  const props = PropertiesService.getScriptProperties().getProperties();
  
  // Verify Tabs
  try {
    const ss = SpreadsheetApp.openById(props['VAULT_MAP_SHEET']);
    ss.getSheetByName('SYSTEM_FILES') ? pass('TABS', 'SYSTEM_FILES OK') : fail('TABS', 'SYSTEM_FILES MISSING');
    ss.getSheetByName('VAULT_MAP') ? pass('TABS', 'VAULT_MAP OK') : fail('TABS', 'VAULT_MAP MISSING');
  } catch(e) { fail('SHEET', e.message); }

  // Verify Key Resolution
  Vault.sync();
  ['PANTO', 'LEXICONA', 'SYNAPSE', 'JS-SCRIPTS'].forEach(k => {
    Vault.get(k) ? pass('VAULT', k + ' resolved') : fail('VAULT', k + ' missing');
  });

  console.log('PASSED: ' + results.filter(r => r.status === '✅').length);
  if (results.filter(r => r.status === '❌').length === 0) console.log('🚀 FULLY OPERATIONAL');
}
