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
 const ss = SpreadsheetApp.create('VAULT_MAP');
 const ssFile = DriveApp.getFileById(ss.getId());

 vaultFolder.addFile(ssFile);
 DriveApp.getRootFolder().removeFile(ssFile);

 const sheet = ss.getActiveSheet();
 sheet.setName('VAULT_MAP');
 sheet.appendRow(['FOLDER_NAME', 'FOLDER_ID', 'REGISTERED_AT', 'STATUS']);
 sheet.setFrozenRows(1);

 PropertiesService.getScriptProperties().setProperty('VAULT_MAP_SHEET_ID', ss.getId());
 console.log(`[BOOTSTRAP] VAULT_MAP created. ID: ${ss.getId()}`);
}

function loadVaultMap_() {
 const id = getVaultMapSheetId_();
 if (!id) return {};
 const ss = SpreadsheetApp.openById(id);
 const sheet = ss.getSheetByName('VAULT_MAP');
 const rows = sheet.getDataRange().getValues();
 const map = {};
 for (let i = 1; i < rows.length; i++) {
   const [name, folderId, , status] = rows[i];
   if (name && folderId) {
     map[name.toString().toUpperCase()] = { id: folderId.toString(), status: status.toString() };
   }
 }
 return map;
}

function getFolderIdByName_(folderName) {
 const map = loadVaultMap_();
 const entry = map[folderName.toUpperCase()];
 return (entry && entry.status === 'ACTIVE') ? entry.id : null;
}

function registerFolder_(name, id) {
 const ss = SpreadsheetApp.openById(getVaultMapSheetId_());
 ss.getSheetByName('VAULT_MAP').appendRow([name.toUpperCase(), id, new Date().toISOString(), 'ACTIVE']);
}

function RECONCILE_VAULT_MAP() {
 const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
 const vault = DriveApp.getFolderById(vaultId);
 const folders = vault.getFolders();
 const map = loadVaultMap_();
 let added = 0;

 while (folders.hasNext()) {
   const folder = folders.next();
   const name = folder.getName().toUpperCase();
   if (!map[name]) {
     registerFolder_(name, folder.getId());
     added++;
   }
 }
 return `Vault map reconciled. Added ${added} new folders.`;
}

function cleanupLegacyProperties() {
 const props = PropertiesService.getScriptProperties();
 const allProps = props.getProperties();
 const whitelist = ['VAULT_ID', 'VAULT_MAP_SHEET_ID', 'GCP_PROJECT_ID', 'GCP_REGION', 'GEMINI_API_KEY', 'HEAL_TOKEN', 'SYNC_TOKEN'];
 let count = 0;
 for (const key in allProps) {
   if (!whitelist.includes(key) && !key.startsWith("MODEL_ID")) {
     props.deleteProperty(key);
     count++;
   }
 }
 return `Cleaned ${count} legacy properties.`;
}