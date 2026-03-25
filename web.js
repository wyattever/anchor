/**
 * web.gs — ANCHOR v11.2.0 | UI Controller & Router
 * v11.2.0: Restored routing, recursion fix, and Vault bridge.
 */
const UI_VERSION = 'v11.2.0';

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('ANCHOR | ' + UI_VERSION)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

function includeFromDrive_(vaultMapKey) {
  const fileId = Vault.get(vaultMapKey);
  if (!fileId) return '<script>console.error("Missing: ' + vaultMapKey + '")</script>';
  return '<script>\n' + DriveApp.getFileById(fileId).getBlob().getDataAsString() + '\n</script>';
}

function getAgentConfig() {
  const agents = [
    { name: 'Panto',    key: 'PANTO',    icon: 'neurology' },
    { name: 'Lexicona', key: 'LEXICONA', icon: 'manage_accounts' },
    { name: 'Synapse',  key: 'SYNAPSE',  icon: 'code' }
  ];
  return agents.map(a => ({ name: a.name, id: Vault.get(a.key) || 'MISSING_ID', icon: a.icon }));
}

// =============================================================================
// BRIDGES & SYNC
// =============================================================================

function RUN_DEPLOY_SYNC() { return deploy_sync(); }
function Vault_get_bridge(key) { return Vault.get(key); }

// =============================================================================
// UI MESSAGE ROUTER
// =============================================================================

function processMessage(data) {
  const isChat = (data.format === 'chat');
  
  logMessage_({
    agent: data.agent,
    agentId: data.id,
    format: data.format,
    topic: data.topic || '',
    message: isChat ? data.message : (data.topic || 'ingest') + '.' + data.format,
    direction: 'OUT'
  });

  const payload = {
    intent: isChat ? 'REASON' : 'INGEST',
    folderId: data.id,
    format: data.format,
    name: (data.topic || 'ingest_' + Date.now()) + '.' + data.format,
    content: isChat ? null : data.message,
    prompt: isChat ? '[' + data.agent + '] ' + data.message : null,
    topic: data.topic || '',
    meta: { agent: data.agent, agentId: data.id }
  };

  const response = doPost({ postData: { contents: JSON.stringify(payload) } });
  return JSON.parse(response.getContent());
}

function logMessage_(data) {
  const logId = PropertiesService.getScriptProperties().getProperty('NETWORK-MESSAGING-LOGS');
  if (!logId) return;
  try {
    const ss = SpreadsheetApp.openById(logId);
    const row = [new Date().toISOString(), data.agentId, data.format, data.topic, data.message, data.url || '', data.direction];
    const primary = ss.getSheetByName('Primary');
    if (primary) primary.appendRow(row);
    const agentSheet = ss.getSheetByName(data.agent);
    if (agentSheet) agentSheet.appendRow(row);
  } catch(e) { console.error('Log failed: ' + e.message); }
}

// =============================================================================
// SLASH COMMAND HANDLERS
// =============================================================================

function readFile(payload) {
  const response = doPost({ postData: { contents: JSON.stringify({ intent: 'READ', ...payload }) } });
  return JSON.parse(response.getContent());
}

function listFiles(payload) {
  const response = doPost({ postData: { contents: JSON.stringify({ intent: 'LIST', ...payload }) } });
  return JSON.parse(response.getContent());
}

function listDirs(data) {
  try {
    const folder = DriveApp.getFolderById(data.folderId);
    const dirs = folder.getFolders();
    const result = [];
    while (dirs.hasNext()) {
      const d = dirs.next();
      let fileCount = 0;
      const fIter = d.getFiles();
      while (fIter.hasNext()) { fIter.next(); fileCount++; }
      result.push({ name: d.getName(), folderId: d.getId(), fileCount: fileCount });
    }
    return { status: 'OK', folders: result.sort((a,b) => a.name.localeCompare(b.name)) };
  } catch (e) { return { status: 'ERROR', message: e.message }; }
}

function createDir(data) {
  try {
    const folder = DriveApp.getFolderById(data.folderId);
    const newDir = folder.createFolder(data.name);
    return { status: 'OK', folderId: newDir.getId(), name: newDir.getName() };
  } catch(e) {
    return { status: 'ERROR', message: e.message };
  }
}
