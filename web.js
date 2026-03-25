/**
 * web.gs — ANCHOR v11.1.3 | UI Controller + Message Logger
 * v11.1.3: Fully migrated to Vault.get() registry.
 */
const UI_VERSION       = 'v11.1.3';
const PRIMARY_AGENT_ID = 'GEO-PRI-888';

// =============================================================================
// ENTRY POINTS
// =============================================================================

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
 * Fetches a JS file from Drive by VAULT_MAP key.
 */
function includeFromDrive_(vaultMapKey) {
  // MIGRATED: Uses Vault.get()
  const fileId = Vault.get(vaultMapKey);
  if (!fileId) {
    console.warn('[includeFromDrive_] No VAULT_MAP entry for: ' + vaultMapKey);
    return '<script>console.error("ANCHOR: Failed to load ' + vaultMapKey + '")</script>';
  }
  const content = DriveApp.getFileById(fileId).getBlob().getDataAsString();
  return '<script>\n' + content + '\n</script>';
}

// =============================================================================
// AGENT CONFIG
// =============================================================================

function getAgentConfig() {
  const agents = [
    { name: 'Panto',    key: 'PANTO_ANALYTICS', icon: 'neurology'       },
    { name: 'Lexicona', key: 'LEX_RES_777',     icon: 'manage_accounts' },
    { name: 'Synapse',  key: 'SYN_ARC_555',     icon: 'code'            }
  ];
  return agents.map(a => ({
    name: a.name,
    // MIGRATED: Uses Vault.get()
    id:   Vault.get(a.key) || 'MISSING_ID',
    icon: a.icon
  }));
}

// =============================================================================
// MESSAGE PROCESSING
// =============================================================================

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

// =============================================================================
// FILE READ WRAPPER
// =============================================================================

function readFile(payload) {
  return JSON.parse(
    doPost({ postData: { contents: JSON.stringify({ intent: 'READ', ...payload }) } }).getContent()
  );
}

// =============================================================================
// NETWORK REGISTRY LOGGING
// =============================================================================

function logMessage_(data) {
  // MIGRATED: Pull Registry ID from Vault
  const regId = Vault.get('NETWORK_REGISTRY');
  if (!regId) return console.error('[WEB] NETWORK_REGISTRY ID not found.');
  
  const ss        = SpreadsheetApp.openById(regId);
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

// =============================================================================
// FILE SYSTEM OPERATIONS
// =============================================================================

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
