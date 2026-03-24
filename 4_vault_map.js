/**
 * 4_vault_map.gs — ANCHOR v11.0.1 | Vault Folder Registry
 * v11.0.1: registerFolder_ now upserts — checks for existing active entry
 *          before appending to prevent duplicate rows.
 */

function getVaultMapSheetId_() {
  return PropertiesService.getScriptProperties().getProperty('VAULT_MAP_SHEET_ID');
}

function bootstrapVaultMap() {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  if (!vaultId) throw new Error('VAULT_ID not set in ScriptProperties.');

  const vaultFolder = DriveApp.getFolderById(vaultId);
  const ss          = SpreadsheetApp.create('VAULT_MAP');
  const ssFile      = DriveApp.getFileById(ss.getId());

  vaultFolder.addFile(ssFile);
  DriveApp.getRootFolder().removeFile(ssFile);

  const sheet = ss.getActiveSheet();
  sheet.setName('VAULT_MAP');
  sheet.appendRow(['FOLDER_NAME', 'FOLDER_ID', 'REGISTERED_AT', 'STATUS']);
  sheet.setFrozenRows(1);

  PropertiesService.getScriptProperties()
    .setProperty('VAULT_MAP_SHEET_ID', ss.getId());
  console.log(`[BOOTSTRAP] VAULT_MAP created. ID: ${ss.getId()}`);
}

function loadVaultMap_() {
  const id = getVaultMapSheetId_();
  if (!id) return {};
  const ss    = SpreadsheetApp.openById(id);
  const sheet = ss.getSheetByName('VAULT_MAP');
  const rows  = sheet.getDataRange().getValues();
  const map   = {};
  for (let i = 1; i < rows.length; i++) {
    const [name, folderId, , status] = rows[i];
    if (name && folderId) {
      map[name.toString().toUpperCase()] = {
        id:     folderId.toString(),
        status: status.toString(),
        row:    i + 1
      };
    }
  }
  return map;
}

function getFolderIdByName_(folderName) {
  const map   = loadVaultMap_();
  const entry = map[folderName.toUpperCase()];
  return (entry && entry.status === 'ACTIVE') ? entry.id : null;
}

/**
 * registerFolder_
 *
 * Upserts a VAULT_MAP entry. If an ACTIVE entry with the same name already
 * exists and points to the same ID, skips silently. If the name exists but
 * with a different ID, updates the existing row. If the name does not exist,
 * appends a new row.
 *
 * Prevents duplicate rows from accumulating on repeated calls.
 */
function registerFolder_(name, id) {
  const upperName = name.toUpperCase();
  const map       = loadVaultMap_();
  const ss        = SpreadsheetApp.openById(getVaultMapSheetId_());
  const sheet     = ss.getSheetByName('VAULT_MAP');

  if (map[upperName]) {
    if (map[upperName].id === id && map[upperName].status === 'ACTIVE') {
      console.log(`[VAULT_MAP:SKIP] ${upperName} already registered → ${id}`);
      return;
    }
    // Name exists but ID or status differs — update the existing row
    const row = map[upperName].row;
    sheet.getRange(row, 2).setValue(id);
    sheet.getRange(row, 3).setValue(new Date().toISOString());
    sheet.getRange(row, 4).setValue('ACTIVE');
    console.log(`[VAULT_MAP:UPDATE] ${upperName} → ${id} (row ${row})`);
    return;
  }

  // Name not found — append new row
  sheet.appendRow([upperName, id, new Date().toISOString(), 'ACTIVE']);
  console.log(`[VAULT_MAP:REGISTER] ${upperName} → ${id}`);
}

function deleteVaultMapRow_(rowIndex) {
  const ss    = SpreadsheetApp.openById(getVaultMapSheetId_());
  const sheet = ss.getSheetByName('VAULT_MAP');
  sheet.deleteRow(rowIndex);
}

/**
 * RECONCILE_VAULT_MAP
 *
 * Syncs VAULT_MAP sheet against physical ANCHOR-VAULT subfolders.
 *
 * Phase 1 — ADD: any physical folder not in the sheet gets a new row.
 * Phase 2 — DELETE: any ACTIVE sheet row whose folder ID no longer
 *            exists physically in the Vault is removed from the sheet.
 */
function RECONCILE_VAULT_MAP() {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  const vault   = DriveApp.getFolderById(vaultId);

  const physicalFolders = vault.getFolders();
  const physicalById    = {};
  const physicalByName  = {};

  while (physicalFolders.hasNext()) {
    const folder = physicalFolders.next();
    physicalById[folder.getId()]                   = folder.getName();
    physicalByName[folder.getName().toUpperCase()] = folder.getId();
  }

  const map      = loadVaultMap_();
  const messages = [];

  for (const [upperName, folderId] of Object.entries(physicalByName)) {
    if (!map[upperName]) {
      registerFolder_(upperName, folderId);
      messages.push(upperName + ' added to VAULT map.');
      console.log('[RECONCILE:ADD] ' + upperName);
    }
  }

  const sortedEntries = Object.entries(map)
    .sort((a, b) => b[1].row - a[1].row);

  for (const [name, entry] of sortedEntries) {
    if (entry.status !== 'ACTIVE') continue;
    if (!physicalById[entry.id]) {
      deleteVaultMapRow_(entry.row);
      messages.push(name + ' deleted from VAULT map.');
      console.log('[RECONCILE:DELETE] ' + name + ' (row ' + entry.row + ')');
    }
  }

  const result = messages.length > 0
    ? messages.join('\n')
    : 'VAULT map up-to-date.';

  console.log('[RECONCILE] ' + result);
  return result;
}

function cleanupLegacyProperties() {
  const props     = PropertiesService.getScriptProperties();
  const allProps  = props.getProperties();
  const whitelist = [
    'VAULT_ID', 'VAULT_MAP_SHEET_ID', 'GCP_PROJECT_ID',
    'GCP_REGION', 'GEMINI_API_KEY', 'MODEL_ID', 'NETWORK_REG_ID'
  ];
  let count = 0;
  for (const key in allProps) {
    if (!whitelist.includes(key)) {
      props.deleteProperty(key);
      count++;
    }
  }
  return `Cleaned ${count} legacy properties.`;
}
