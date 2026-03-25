/**
 * tools.gs — ANCHOR v11.1.6 | Utility & State Reconciliation
 * v11.1.6: Finalized deploy_sync for Scenario A, B, and C reconciliation.
 */

// =============================================================================
// VAULT STATE RECONCILIATION (UI TRIGGER)
// =============================================================================

/**
 * deploy_sync
 * Reconciles the VAULT_MAP sheet with the physical folders in Drive.
 */
function deploy_sync() {
  const props = PropertiesService.getScriptProperties();
  const vaultId = props.getProperty('ANCHOR_VAULT_ID');
  const mapId = props.getProperty('VAULT_MAP_SHEET');
  
  if (!vaultId || !mapId) return "Error: Missing configuration properties.";

  const ss = SpreadsheetApp.openById(mapId);
  const sheet = ss.getSheetByName('VAULT_MAP');
  const vault = DriveApp.getFolderById(vaultId);
  const physicalFolders = vault.getFolders();
  
  // 1. Map Physical State
  const driveState = {}; // { id: name }
  while (physicalFolders.hasNext()) {
    const f = physicalFolders.next();
    driveState[f.getId()] = f.getName();
  }
  
  // 2. Map Sheet State
  const sheetData = sheet.getDataRange().getValues();
  const sheetStateIds = []; 
  const added = [];
  const deleted = [];

  // 3. Scenario C: Check for Deletions (Backwards loop to safely delete rows)
  for (let i = sheetData.length - 1; i >= 1; i--) {
    const name = sheetData[i][0];
    const id = sheetData[i][1];
    
    if (!driveState[id]) {
      deleted.push(name);
      sheet.deleteRow(i + 1);
    } else {
      sheetStateIds.push(id);
    }
  }

  // 4. Scenario B: Check for Additions
  const timestamp = new Date().toISOString();
  Object.keys(driveState).forEach(id => {
    if (!sheetStateIds.includes(id)) {
      const folderName = driveState[id];
      sheet.appendRow([folderName, id, timestamp, 'ACTIVE']);
      added.push(folderName);
    }
  });

  // 5. Scenario A & Final Sync
  Vault.sync(); 
  
  if (added.length === 0 && deleted.length === 0) {
    return "Vault map is up-to-date.";
  }
  
  let report = [];
  if (added.length > 0) report.push("Added: " + added.join('; '));
  if (deleted.length > 0) report.push("Deleted: " + deleted.join('; '));
  
  return report.join('. ') + ".";
}

// =============================================================================
// MASTER REBUILD UTILITIES (MANUAL ONLY)
// =============================================================================

/**
 * populateVaultMap
 * Master rebuild for the VAULT_MAP tab based on current translation map.
 */
function populateVaultMap() {
  const props = PropertiesService.getScriptProperties();
  const vaultId = props.getProperty('ANCHOR_VAULT_ID');
  const mapId = props.getProperty('VAULT_MAP_SHEET');
  const ss = SpreadsheetApp.openById(mapId);
  const sheet = ss.getSheetByName('VAULT_MAP');
  
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).clearContent();
  }

  const vault = DriveApp.getFolderById(vaultId);
  const folders = vault.getFolders();
  const timestamp = new Date().toISOString();
  
  const translationMap = {
    '00-GEO-PRI-001':      'PRIMARY',
    '01-NETWORK-REGISTRY': 'NETWORK_REGISTRY',
    '02-ACTIVE-PROJECTS':  'ACTIVE_PROJECTS',
    '03-TEMPORAL-LAKE':    'TEMPORAL_LAKE',
    '04-PAN-ANA-001':      'PANTO',
    '05-LEX-RES-777':      'LEXICONA',
    '06-SYN-ARC-555':      'SYNAPSE'
  };

  while (folders.hasNext()) {
    const f = folders.next();
    const pName = f.getName();
    const fId = f.getId();
    const sKey = translationMap[pName] || pName;
    sheet.appendRow([sKey, fId, timestamp, 'ACTIVE']);
  }

  Vault.sync();
  console.log('✅ VAULT_MAP Master Rebuild Complete.');
}

function setupRegistry() {
  const logSheetId = PropertiesService.getScriptProperties().getProperty('NETWORK-MESSAGING-LOGS');
  if (!logSheetId) return;
  const ss = SpreadsheetApp.openById(logSheetId);
  let sheet = ss.getSheetByName('REGISTRY');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('REGISTRY', 0);
  sheet.appendRow(['NAME', 'AGENT_ID', 'FOLDER_ID', 'STATUS']);
  const agents = [
    ['PRIMARY',  'GEO-PRI-888', Vault.get('PRIMARY'), 'ACTIVE'],
    ['Panto',    'PAN-ANA-001', Vault.get('PANTO'), 'ACTIVE'],
    ['Lexicona', 'LEX-RES-777', Vault.get('LEXICONA'), 'ACTIVE'],
    ['Synapse',  'SYN-ARC-555', Vault.get('SYNAPSE'), 'ACTIVE']
  ];
  agents.forEach(row => sheet.appendRow(row));
  console.log('[REGISTRY] Network registry updated.');
}
