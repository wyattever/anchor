/**
 * 4_vault_map.gs — ANCHOR v9.1.0 | Vault Folder Registry
 * Replaces ScriptProperties-based folder ID storage.
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
        row:    i + 1   // 1-indexed sheet row — needed for targeted deletes
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

function registerFolder_(name, id) {
  const ss    = SpreadsheetApp.openById(getVaultMapSheetId_());
  const sheet = ss.getSheetByName('VAULT_MAP');
  sheet.appendRow([name.toUpperCase(), id, new Date().toISOString(), 'ACTIVE']);
  console.log(`[VAULT_MAP:REGISTER] ${name.toUpperCase()} → ${id}`);
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
 *
 * Return messages:
 *   No change:       "VAULT map up-to-date."
 *   Folder added:    "[Name] added to VAULT map."
 *   Folder deleted:  "[Name] deleted from VAULT map."
 *   Multiple events: one message per change, joined by newline.
 */
function RECONCILE_VAULT_MAP() {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  const vault   = DriveApp.getFolderById(vaultId);

  // ── Build physical folder map from Drive ───────────────────────────────────
  const physicalFolders = vault.getFolders();
  const physicalById    = {};   // id   → name
  const physicalByName  = {};   // NAME → id

  while (physicalFolders.hasNext()) {
    const folder = physicalFolders.next();
    physicalById[folder.getId()]              = folder.getName();
    physicalByName[folder.getName().toUpperCase()] = folder.getId();
  }

  // ── Load current VAULT_MAP ─────────────────────────────────────────────────
  const map      = loadVaultMap_();
  const messages = [];

  // ── Phase 1: ADD new physical folders not in sheet ────────────────────────
  for (const [upperName, folderId] of Object.entries(physicalByName)) {
    if (!map[upperName]) {
      registerFolder_(upperName, folderId);
      messages.push(upperName + ' added to VAULT map.');
      console.log('[RECONCILE:ADD] ' + upperName);
    }
  }

  // ── Phase 2: DELETE sheet rows whose folder no longer exists in Vault ──────
  // Iterate in reverse row order so row deletions don't shift subsequent indices
  const sortedEntries = Object.entries(map)
    .sort((a, b) => b[1].row - a[1].row);   // descending by row number

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
    'GCP_REGION', 'GEMINI_API_KEY', 'HEAL_TOKEN',
    'SYNC_TOKEN', 'NETWORK_REG_ID'
  ];
  let count = 0;
  for (const key in allProps) {
    if (!whitelist.includes(key) && !key.startsWith('MODEL_ID')) {
      props.deleteProperty(key);
      count++;
    }
  }
  return `Cleaned ${count} legacy properties.`;
}
