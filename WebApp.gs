/**
 * WebApp.gs — ANCHOR v10.0.4 | UI Controller
 * Bridges Index.html to the 0_core.gs Gateway with Precise Status Reporting.
 */

const UI_VERSION = 'v10.0.4';

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
 * RECONCILE_NETWORK — Symmetric Sync with formatted status messages.
 */
function RECONCILE_NETWORK() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const props = PropertiesService.getScriptProperties();
    const allProps = props.getProperties();
    const vault = DriveApp.getFolderById(VAULT_ID);
    const folders = vault.getFolders();
    
    let added = [];
    let deleted = [];
    let physicalIds = [];

    // 1. Discovery Phase
    while (folders.hasNext()) {
      const folder = folders.next();
      const folderName = folder.getName();
      const key = folderName.toUpperCase().replace(/\s+/g, '_') + "_ID";
      const id = folder.getId();
      physicalIds.push(id);

      if (!allProps[key]) {
        props.setProperty(key, id);
        added.push(folderName);
      }
    }

    // 2. Pruning Phase
    for (const key in allProps) {
      if (key.endsWith("_ID") && key !== "VAULT_ID" && key !== "REGISTRY_ID") {
        if (physicalIds.indexOf(allProps[key]) === -1) {
          const folderName = key.replace("_ID", "").replace(/_/g, " ");
          props.deleteProperty(key);
          deleted.push(folderName);
        }
      }
    }

    // 3. Status Message Logic
    if (added.length > 0) return added.join("; ") + "; added to file map.";
    if (deleted.length > 0) return deleted.join("; ") + "; deleted from file map.";
    return "File map up-to-date.";

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
  return "Vault Verified.";
}
