/**
 * web.gs — ANCHOR v11.3.0 | UI Controller
 * v11.3.0: Synchronized naming refactor (0-1-PANTO, etc.).
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('⚓ ANCHOR v11.3.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAgentList() {
  const agents = [
    { name: 'Panto',    key: '0-1-PANTO',    icon: '⚓' },
    { name: 'Lexicona', key: '0-2-LEXICONA', icon: '📖' },
    { name: 'Synapse',  key: '0-3-SYNAPSE',  icon: '🧠' }
  ];
  return agents.map(a => ({ name: a.name, id: Vault.get(a.key) || 'MISSING_ID', icon: a.icon }));
}

function readFile(vaultMapKey, fileName) {
  const folderId = Vault.get(vaultMapKey);
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    return files.next().getBlob().getDataAsString();
  }
  return 'FILE_NOT_FOUND';
}

function listFiles(vaultMapKey) {
  const folderId = Vault.get(vaultMapKey);
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const results = [];
  while (files.hasNext()) {
    const f = files.next();
    results.push({ name: f.getName(), id: f.getId(), size: f.getSize() });
  }
  return results;
}

function Vault_get_bridge(key) { return Vault.get(key); }

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Loads content from a file in Google Drive.
 * Used for dynamic script loading.
 */
function includeFromDrive_(vaultMapKey, fileName) {
  const folderId = Vault.get(vaultMapKey);
  if (!folderId) return `/* VAULT_KEY_MISSING: ${vaultMapKey} */`;
  
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    return files.next().getBlob().getDataAsString();
  }
  return `/* FILE_NOT_FOUND: ${fileName} */`;
}

function logMessage_(data) {
  const logId = PropertiesService.getScriptProperties().getProperty('NETWORK-MESSAGING-LOGS');
  if (!logId) return;
  
  try {
    const ss = SpreadsheetApp.openById(logId);
    const sheet = ss.getSheets()[0];
    sheet.appendRow([
      new Date(),
      data.agent || 'SYSTEM',
      data.agentId || '',
      data.format || '',
      data.topic || '',
      data.message || '',
      data.url || '',
      data.direction || 'IN'
    ]);
  } catch (e) {
    console.error('Logging failed: ' + e.message);
  }
}
