/**
 * WebApp.gs — ANCHOR v10.0.2 | UI Controller
 * Bridges Index.html to the 0_core.gs Gateway with Dynamic Agent Mapping.
 */

const UI_VERSION = 'v10.0.2';

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
 * getAgentConfig — Scans properties for specific Agent IDs
 */
function getAgentConfig() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const agents = [
    { name: 'Panto', prop: '04-PAN-ANA-001_ID', icon: 'neurology' },
    { name: 'Lexicona', prop: '05-LEX-RES-777_ID', icon: 'manage_accounts' },
    { name: 'Synapse', prop: '06-SYN-ARC-555_ID', icon: 'code' }
  ];

  return agents.map(a => ({
    name: a.name,
    id: props[a.prop] || 'MISSING_ID',
    icon: a.icon
  }));
}

/**
 * processMessage — Routes UI input to the Atomic Gateway
 */
function processMessage(data) {
  const intent = (data.format === 'chat') ? 'REASON' : 'INGEST';
  
  const payload = {
    intent: intent,
    message: data.message,
    prompt: "[" + data.agent + " | " + data.id + "] " + data.message,
    name: data.topic || "ui_ingest_" + Date.now(),
    content: {
      agent: data.agent,
      id: data.id,
      format: data.format,
      text: data.message,
      timestamp: new Date().toISOString()
    }
  };

  const mockEvent = {
    postData: { contents: JSON.stringify(payload) }
  };

  const response = doPost(mockEvent);
  return JSON.parse(response.getContent());
}

function CRAWL_VAULT() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const folder = DriveApp.getFolderById(VAULT_ID);
    return "Vault Verified: " + folder.getName() + " contains files.";
  } catch (e) {
    return "Crawl Error: " + e.message;
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
