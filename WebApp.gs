/**
 * WebApp.gs — ANCHOR v10 | UI Controller
 * Bridges Index.html to the 0_core.gs Gateway
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ANCHOR | Network Interface')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * processMessage — Routes UI input to the Atomic Gateway
 * @param {Object} data {agent, id, format, topic, message, ui_version}
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
    postData: {
      contents: JSON.stringify(payload)
    }
  };

  const response = doPost(mockEvent);
  return JSON.parse(response.getContent());
}

/**
 * CRAWL_VAULT — UI trigger for registry reconciliation
 */
function CRAWL_VAULT() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const folder = DriveApp.getFolderById(VAULT_ID);
    return "Vault Verified: " + folder.getName() + " contains " + (folder.getFiles().hasNext() ? "files" : "no files") + ".";
  } catch (e) {
    return "Crawl Error: " + e.message;
  } finally {
    lock.releaseLock();
  }
}
