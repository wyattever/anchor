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

function getAgentConfig() {
  const agents = [
    { name: 'Panto',    key: '0-1-PANTO',    icon: 'neurology'        },
    { name: 'Lexicona', key: '0-2-LEXICONA', icon: 'manage_accounts'  },
    { name: 'Synapse',  key: '0-3-SYNAPSE',  icon: 'code'             }
  ];
  return agents.map(a => ({ name: a.name, id: Vault.get(a.key) || 'MISSING_ID', icon: a.icon }));
}

function readFile(payload) {
  try {
    if (payload.fileId) {
      const file = DriveApp.getFileById(payload.fileId);
      return {
        status:  'OK',
        name:    file.getName(),
        fileId:  file.getId(),
        content: file.getBlob().getDataAsString()
      };
    }

    if (payload.folderId && payload.name) {
      const folder = DriveApp.getFolderById(payload.folderId);
      const iter   = folder.getFilesByName(payload.name);
      if (iter.hasNext()) {
        const file = iter.next();
        return {
          status:  'OK',
          name:    file.getName(),
          fileId:  file.getId(),
          content: file.getBlob().getDataAsString()
        };
      }
      return { status: 'ERROR', message: 'File not found: ' + payload.name };
    }

    return { status: 'ERROR', message: 'Payload must include fileId or folderId+name.' };
  } catch (e) {
    return { status: 'ERROR', message: e.message };
  }
}

function listFiles(payload) {
  const folderId = payload.folderId;
  const filter   = payload.filter || null;
  if (!folderId) return { status: 'ERROR', message: 'folderId is required.' };

  try {
    const folder = DriveApp.getFolderById(folderId);
    const iter   = folder.getFiles();
    const files  = [];

    while (iter.hasNext()) {
      const f    = iter.next();
      const name = f.getName();
      if (filter && !name.toLowerCase().endsWith('.' + filter)) continue;
      files.push({
        name:   name,
        fileId: f.getId(),
        size:   f.getSize()
      });
    }
    return { status: 'OK', files: files };
  } catch (e) {
    return { status: 'ERROR', message: e.message };
  }
}

function listDirs(payload) {
  const folderId = payload.folderId;
  if (!folderId) return { status: 'ERROR', message: 'folderId is required.' };

  try {
    const folder  = DriveApp.getFolderById(folderId);
    const iter    = folder.getFolders();
    const folders = [];

    while (iter.hasNext()) {
      const f = iter.next();
      folders.push({
        name:     f.getName(),
        folderId: f.getId()
      });
    }
    return { status: 'OK', folders: folders };
  } catch (e) {
    return { status: 'ERROR', message: e.message };
  }
}

function createDir(payload) {
  const folderId = payload.folderId;
  const name     = payload.name;
  if (!folderId) return { status: 'ERROR', message: 'folderId is required.' };
  if (!name)     return { status: 'ERROR', message: 'name is required.' };

  try {
    const parent    = DriveApp.getFolderById(folderId);
    const newFolder = parent.createFolder(name);
    return {
      status:   'OK',
      name:     newFolder.getName(),
      folderId: newFolder.getId()
    };
  } catch (e) {
    return { status: 'ERROR', message: e.message };
  }
}

function Vault_get_bridge(key) { return Vault.get(key); }

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Loads content from a file in Google Drive.
 * Used for dynamic script loading.
 */
function includeFromDrive_(vaultMapKey) {
  const fileId = Vault.get(vaultMapKey);
  if (!fileId) return `/* VAULT_KEY_MISSING: ${vaultMapKey} */`;
  try {
    return DriveApp.getFileById(fileId).getBlob().getDataAsString();
  } catch(e) {
    return `/* FILE_NOT_FOUND: ${vaultMapKey} — ${e.message} */`;
  }
}

function logMessage_(data) {
  const logId = PropertiesService.getScriptProperties().getProperty('NETWORK-MESSAGING-LOGS');
  if (!logId) return;
  
  try {
    const ss    = SpreadsheetApp.openById(logId);
    const sheet = ss.getSheetByName(data.agent) || ss.getSheets()[0];
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

function processMessage(data) {
  const agent   = data.agent   || 'Panto';
  const agentKey = data.id     || Vault.get('0-1-PANTO');
  const format  = data.format  || 'chat';
  const topic   = data.topic   || '';
  const message = data.message || '';

  if (!message) return { status: 'ERROR', message: 'No message provided.' };

  logMessage_({
    agent:     agent,
    agentId:   agentKey,
    format:    format,
    topic:     topic,
    message:   message,
    url:       '',
    direction: 'OUT'
  });

  if (format === 'chat') {
    const systemPrompt = generateSystemPrompt();
    const fullPrompt   = systemPrompt + '\n\nUser: ' + message;
    const result       = processReasoning_({ prompt: fullPrompt });

    logMessage_({
      agent:     agent,
      agentId:   agentKey,
      format:    'chat',
      topic:     topic,
      message:   result.response || '',
      url:       '',
      direction: 'IN'
    });

    return result;
  }

  if (format === 'txt' || format === 'csv' || format === 'json') {
    const folderId = agentKey || Vault.get('0-1-PANTO');
    return handleIngest_({
      format:   format,
      name:     topic || ('anchor_' + Date.now() + '.' + format),
      content:  message,
      folderId: folderId,
      meta:     { agent: agent, agentId: agentKey }
    });
  }

  return { status: 'ERROR', message: 'Unknown format: ' + format };
}

function RUN_DEPLOY_SYNC() {
  try {
    Vault.sync();
    return 'Vault sync complete. All registries refreshed.';
  } catch (e) {
    return 'Vault sync failed: ' + e.message;
  }
}
