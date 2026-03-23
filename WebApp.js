/**
 * WebApp.gs — ANCHOR v10.1.7 | UI Controller + Message Logger
 */
const UI_VERSION       = 'v10.1.7';
const NETWORK_REG_ID   = '175th9uat0P52l9dnjAScpzdXfGl0JGoj4GyGmYuaOZ0';
const PRIMARY_AGENT_ID = 'GEO-PRI-001';

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ANCHOR | ' + UI_VERSION)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * includeFromDrive_
 *
 * Fetches a .js file from Drive by VAULT_MAP key and wraps in <script> tags.
 * Replaces Apps Script include() for JS files stored in GEO-PRI-001 folder.
 * Clasp cannot touch these files — they live in Drive, not the project.
 *
 * @param {string} vaultMapKey  e.g. 'JS-COMMANDS', 'JS-SCRIPTS'
 * @returns {string} <script>...</script> block
 */
function includeFromDrive_(vaultMapKey) {
  const fileId = getFolderIdByName_(vaultMapKey);
  if (!fileId) throw new Error('[includeFromDrive_] VAULT_MAP has no entry for: ' + vaultMapKey);
  const content = DriveApp.getFileById(fileId).getBlob().getDataAsString();
  return '<script>\n' + content + '\n</script>';
}

function getAgentConfig() {
  const agents = [
    { name: 'Panto',    key: '04-PAN-ANA-001', icon: 'neurology'       },
    { name: 'Lexicona', key: '05-LEX-RES-777', icon: 'manage_accounts' },
    { name: 'Synapse',  key: '06-SYN-ARC-555', icon: 'code'            }
  ];
  return agents.map(a => ({
    name: a.name,
    id:   getFolderIdByName_(a.key) || 'MISSING_ID',
    icon: a.icon
  }));
}

function processMessage(data) {
  const isChat = (data.format === 'chat');
  const intent = isChat ? 'REASON' : 'INGEST';

  logMessage_({
    agent:     data.agent,
    agentId:   data.id,
    format:    data.format,
    topic:     data.topic || '',
    message:   isChat
                 ? data.message
                 : (data.topic || 'ingest_' + Date.now()) + '.' + data.format,
    url:       '',
    direction: 'OUT'
  });

  const payload = {
    intent:   intent,
    folderId: data.id,
    format:   data.format,
    name:     (data.topic || 'ingest_' + Date.now()) + '.' + data.format,
    content:  isChat ? null : data.message,
    prompt:   isChat
                ? '[' + data.agent + ' | ' + data.id + '] ' + data.message
                : null,
    topic:    data.topic || '',
    meta: {
      agent:     data.agent,
      agentId:   data.id,
      format:    data.format,
      timestamp: new Date().toISOString()
    }
  };

  const response = doPost({ postData: { contents: JSON.stringify(payload) } });
  return JSON.parse(response.getContent());
}

function logMessage_(data) {
  const ss        = SpreadsheetApp.openById(NETWORK_REG_ID);
  const timestamp = new Date().toISOString();
  const row       = [
    timestamp,
    data.agentId  || '',
    data.format   || 'chat',
    data.topic    || '',
    data.message  || '',
    data.url      || '',
    data.direction
  ];
  const primarySheet = ss.getSheetByName('Primary');
  if (primarySheet) primarySheet.appendRow(row);
  const agentSheet = ss.getSheetByName(data.agent);
  if (agentSheet) agentSheet.appendRow(row);
}

function listFiles(data) {
  const folderId = data.folderId;
  const filter   = data.filter || null;
  if (!folderId || folderId === 'MISSING_ID') {
    return { status: 'ERROR', message: 'No active agent folder selected.' };
  }
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files  = folder.getFiles();
    const result = [];
    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName();
      if (filter && !name.toLowerCase().endsWith('.' + filter)) continue;
      result.push({ name: name, fileId: file.getId() });
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    return { status: 'OK', files: result };
  } catch (err) {
    return { status: 'ERROR', message: err.message };
  }
}

function listDirs(data) {
  const folderId = data.folderId;
  if (!folderId || folderId === 'MISSING_ID') {
    return { status: 'ERROR', message: 'No active agent folder selected.' };
  }
  try {
    const folder  = DriveApp.getFolderById(folderId);
    const subDirs = folder.getFolders();
    const result  = [];
    while (subDirs.hasNext()) {
      const dir      = subDirs.next();
      let fileCount  = 0;
      const dirFiles = dir.getFiles();
      while (dirFiles.hasNext()) { dirFiles.next(); fileCount++; }
      result.push({
        name:      dir.getName(),
        folderId:  dir.getId(),
        fileCount: fileCount
      });
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    return { status: 'OK', folders: result };
  } catch (err) {
    return { status: 'ERROR', message: err.message };
  }
}

function createDir(data) {
  const folderId = data.folderId;
  const name     = (data.name || '').trim();
  if (!folderId || folderId === 'MISSING_ID') {
    return { status: 'ERROR', message: 'No active agent folder selected.' };
  }
  if (!name) {
    return { status: 'ERROR', message: 'Directory name cannot be empty.' };
  }
  try {
    const parent    = DriveApp.getFolderById(folderId);
    const newFolder = parent.createFolder(name);
    console.log('[ANCHOR:createDir] "' + name + '" → ' + newFolder.getId());
    return { status: 'OK', name: newFolder.getName(), folderId: newFolder.getId() };
  } catch (err) {
    return { status: 'ERROR', message: err.message };
  }
}

function setupRegistry() {
  const ss       = SpreadsheetApp.openById(NETWORK_REG_ID);
  const existing = ss.getSheetByName('REGISTRY');
  if (existing) ss.deleteSheet(existing);
  const sheet    = ss.insertSheet('REGISTRY', 0);
  sheet.appendRow(['NAME', 'AGENT_ID', 'FOLDER_ID', 'STATUS']);
  sheet.setFrozenRows(1);
  const agents = [
    ['PRIMARY',  'GEO-PRI-001', '1k6BYtrZSGx5zgQccpiW1NNXCnIXqNRqj', 'ACTIVE'],
    ['Panto',    'PAN-ANA-001', '1QnrCSWMim4xPhUoXYzyAkXcYYu7y3vLt', 'ACTIVE'],
    ['Lexicona', 'LEX-RES-777', '1L6THn33tM57B95Mpbydwoj2OpQSie0oG', 'ACTIVE'],
    ['Synapse',  'SYN-ARC-555', '1u9ajuwB76DqRLN5gXJ3cRv2yugKi99a-', 'ACTIVE']
  ];
  agents.forEach(row => sheet.appendRow(row));
  console.log('[REGISTRY] Setup complete.');
}
