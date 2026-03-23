/**
* 4_vault_map.gs — ANCHOR v9.1.1 | Vault Registry
* Fix: Added 'ACTIVE' status filtering to getFolderIdByName_
*/

function getVaultMapSheetId_() {
  return PropertiesService.getScriptProperties().getProperty('VAULT_MAP_SHEET_ID');
}

function bootstrapVaultMap() {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  const ss = SpreadsheetApp.create('VAULT_MAP');
  DriveApp.getFolderById(vaultId).addFile(DriveApp.getFileById(ss.getId()));
  DriveApp.getRootFolder().removeFile(DriveApp.getFileById(ss.getId()));
  const sheet = ss.getActiveSheet();
  sheet.setName('VAULT_MAP').appendRow(['FOLDER_NAME', 'FOLDER_ID', 'REGISTERED_AT', 'STATUS']);
  sheet.setFrozenRows(1);
  PropertiesService.getScriptProperties().setProperty('VAULT_MAP_SHEET_ID', ss.getId());
}

function getFolderIdByName_(folderName) {
  const id = getVaultMapSheetId_();
  if (!id) return null;
  const rows = SpreadsheetApp.openById(id).getSheetByName('VAULT_MAP').getDataRange().getValues();
  const entry = rows.find(row => row[0].toString().toUpperCase() === folderName.toUpperCase() && row[3] === 'ACTIVE');
  return entry ? entry[1] : null;
}

function registerFolder_(name, id) {
  const ss = SpreadsheetApp.openById(getVaultMapSheetId_());
  ss.getSheetByName('VAULT_MAP').appendRow([name.toUpperCase(), id, new Date().toISOString(), 'ACTIVE']);
}

function cleanupLegacyProperties() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  const whitelist = ['VAULT_ID', 'VAULT_MAP_SHEET_ID', 'GCP_PROJECT_ID', 'GCP_REGION', 'GEMINI_API_KEY', 'HEAL_TOKEN', 'SYNC_TOKEN'];
  for (const key in all) {
    if (!whitelist.includes(key) && !key.startsWith("MODEL_ID")) props.deleteProperty(key);
  }
  return "Cleanup Complete.";
}
