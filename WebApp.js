/**
 * WebApp.gs — ANCHOR v10.1.7 | UI Controller
 * Bridges Index.html to the 0_core.gs Gateway.
 */
const UI_VERSION = 'v10.1.7';

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
  const isChat  = (data.format === 'chat');
  const intent  = isChat ? 'REASON' : 'INGEST';

  const payload = {
    intent:   intent,
    folderId: data.id,
    name:     (data.topic || 'ingest_' + Date.now()) + '.' + data.format,
    content:  isChat ? null : data.message,
    prompt:   isChat
                ? '[' + data.agent + ' | ' + data.id + '] ' + data.message
                : null,
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
