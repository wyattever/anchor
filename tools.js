/**
 * tools.gs — ANCHOR v11.3.0 | System Utilities
 * v11.3.0: Synchronized naming refactor (VAULT_MAP, 0-0-PRIMARY).
 */

function bootstrapVaultMap() {
  const props = PropertiesService.getScriptProperties();
  const vaultId = props.getProperty('ANCHOR_VAULT');
  const mapId = props.getProperty('VAULT_MAP');
  
  if (!mapId) {
    console.log('⚓ Creating VAULT_MAP spreadsheet...');
    const ss = SpreadsheetApp.create('VAULT_MAP_v11');
    const rootSheet = ss.getActiveSheet().setName('ROOT');
    ss.insertSheet('SYSTEM_FILES');
    
    rootSheet.appendRow(['Name', 'ID', 'Status']);
    rootSheet.appendRow(['0-0-PRIMARY', vaultId, 'ACTIVE']);
    
    props.setProperty('VAULT_MAP', ss.getId());
    console.log('✅ Created VAULT_MAP: ' + ss.getUrl());
  } else {
    console.log('⚓ VAULT_MAP already exists: ' + mapId);
  }
}

function setupRegistry() {
  const vault = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('ANCHOR_VAULT'));
  const folders = vault.getFolders();
  const registry = [];
  
  while (folders.hasNext()) {
    const f = folders.next();
    registry.push([f.getName(), f.getId(), 'ACTIVE']);
  }
  
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('VAULT_MAP'));
  const sheet = ss.getSheetByName('ROOT');
  if (registry.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, registry.length, 3).setValues(registry);
  }
  console.log('✅ Registry seeded from ANCHOR_VAULT.');
}

function setupSystemFilesRegistry() {
  const logSheetId = PropertiesService.getScriptProperties().getProperty('NETWORK-MESSAGING-LOGS');
  const data = [
    ['NETWORK-MESSAGING-LOGS', logSheetId, 'ACTIVE'],
    ['0-0-PRIMARY', Vault.get('0-0-PRIMARY'), 'ACTIVE'],
    ['0-1-PANTO', Vault.get('0-1-PANTO'), 'ACTIVE'],
    ['0-2-LEXICONA', Vault.get('0-2-LEXICONA'), 'ACTIVE'],
    ['0-3-SYNAPSE', Vault.get('0-3-SYNAPSE'), 'ACTIVE']
  ];
  
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('VAULT_MAP'));
  const sheet = ss.getSheetByName('SYSTEM_FILES');
  sheet.getRange(1, 1, data.length, 3).setValues(data);
  console.log('✅ SYSTEM_FILES registry initialized.');
}
