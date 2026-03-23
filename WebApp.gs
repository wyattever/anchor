/**
 * WebApp.gs — ANCHOR v10.0.3 | UI Controller
 * Bridges Index.html to the 0_core.gs Gateway with Network Discovery.
 */

const UI_VERSION = 'v10.0.3';

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
 * RECONCILE_NETWORK — Triggered by the UI "Sync" button.
 * Resets and maps all _ID properties based on physical Vault folders.
 */
function RECONCILE_NETWORK() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const vault = DriveApp.getFolderById(VAULT_ID);
    const folders = vault.getFolders();
    const props = PropertiesService.getScriptProperties();
    
    let added = 0;
    while (folders.hasNext()) {
      const folder = folders.next();
      const key = folder.getName().toUpperCase().replace(/\s+/g, '_') + "_ID";
      props.setProperty(key, folder.getId());
      added++;
    }
    return "Network Synced: " + added + " project endpoints mapped.";
  } catch (e) {
    return "Sync Error: " + e.message;
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

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

function processMessage(data) {
  const intent = (data.format === 'chat') ? 'REASON' : 'INGEST';
  const payload = {
    intent: intent,
    message: data.message,
    prompt: "[" + data.agent + " | " + data.id + "] " + data.message,
    name: data.topic || "ui_ingest_" + Date.now(),
    content: { agent: data.agent, id: data.id, format: data.format, text: data.message, timestamp: new Date().toISOString() }
  };
  const response = doPost({postData: { contents: JSON.stringify(payload) }});
  return JSON.parse(response.getContent());
}

function CRAWL_VAULT() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const folder = DriveApp.getFolderById(VAULT_ID);
    return "Vault Verified: " + folder.getName() + " confirmed.";
  } catch (e) {
    return "Crawl Error: " + e.message;
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
