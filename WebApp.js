/**
 * WebApp.gs — ANCHOR v10.1.7 | UI Controller + Message Logger
 * Bridges Index.html to the 0_core.gs Gateway.
 * Logs all messages to Network Registry sheets.
 */
const UI_VERSION        = 'v10.1.7';
const NETWORK_REG_ID    = '175th9uat0P52l9dnjAScpzdXfGl0JGoj4GyGmYuaOZ0';
const PRIMARY_AGENT_ID  = 'GEO-PRI-001';

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

  // ── Log outbound message from PRIMARY ──────────────────────────────────────
  logMessage_({
    agent:     data.agent,
    agentId:   data.id,
    format:    data.format,
    topic:     data.topic || '',
    message:   isChat ? data.message : (data.topic || 'ingest_' + Date.now()) + '.' + data.format,
    url:       '',          // URL populated after file creation for INGEST
    direction: 'OUT'
  });

  const payload = {
    intent:   intent,
    folderId: data.id,
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

/**
 * logMessage_
 *
 * Writes a message event to both the PRIMARY sheet and the agent-specific sheet.
 * Schema: Timestamp | Agent ID | Format | Topic | Message | URL | Direction
 *
 * Direction is always from PRIMARY's perspective:
 *   OUT = PRIMARY sent this
 *   IN  = PRIMARY received this
 *
 * @param {Object} data
 */
function logMessage_(data) {
  const ss        = SpreadsheetApp.openById(NETWORK_REG_ID);
  const timestamp = new Date().toISOString();

  const row = [
    timestamp,
    data.agentId  || '',
    data.format   || 'chat',
    data.topic    || '',
    data.message  || '',
    data.url      || '',
    data.direction
  ];

  // Always write to PRIMARY sheet
  const primarySheet = ss.getSheetByName('Primary');
  if (primarySheet) primarySheet.appendRow(row);

  // Write to agent-specific sheet
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

/**
 * setupRegistry
 *
 * One-time function — creates the REGISTRY sheet and seeds it.
 * Run once manually from the Apps Script editor.
 */
function setupRegistry() {
  const ss = SpreadsheetApp.openById(NETWORK_REG_ID);

  // Delete existing REGISTRY sheet if present
  const existing = ss.getSheetByName('REGISTRY');
  if (existing) ss.deleteSheet(existing);

  // Create and position as first sheet
  const sheet = ss.insertSheet('REGISTRY', 0);
  sheet.appendRow(['NAME', 'AGENT_ID', 'FOLDER_ID', 'STATUS']);
  sheet.setFrozenRows(1);

  const agents = [
    ['PRIMARY',  'GEO-PRI-001', '1k6BYtrZSGx5zgQccpiW1NNXCnIXqNRqj', 'ACTIVE'],
    ['Panto',    'PAN-ANA-001', '1QnrCSWMim4xPhUoXYzyAkXcYYu7y3vLt', 'ACTIVE'],
    ['Lexicona', 'LEX-RES-777', '1L6THn33tM57B95Mpbydwoj2OpQSie0oG', 'ACTIVE'],
    ['Synapse',  'SYN-ARC-555', '1u9ajuwB76DqRLN5gXJ3cRv2yugKi99a-', 'ACTIVE']
  ];

  agents.forEach(row => sheet.appendRow(row));
  console.log('[REGISTRY] Setup complete. ' + agents.length + ' agents registered.');
}
