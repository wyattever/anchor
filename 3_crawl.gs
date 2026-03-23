/**
* 3_crawl.gs — ANCHOR v10.1.1 | Vault Surveyor & Prompt Logic
* Fix: Consolidated generateSystemPrompt & Resolved processReasoning Reference.
*/

function CRAWL_VAULT() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
    const vault = DriveApp.getFolderById(vaultId);
    const files = vault.getFiles();
    const manifest = [];
    while (files.hasNext()) {
      const file = files.next();
      manifest.push({ id: file.getId(), name: file.getName(), size: file.getSize() });
    }
    return manifest.length + " files indexed in Vault.";
  } catch (e) {
    return "Crawl Failed: " + e.message;
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function generateSystemPrompt() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const memory = getPhysicalMemory() || {};
  return `You are PANTO, the Primary Agent for Network Task Orchestration.
 ### SYSTEM CONTEXT
- GCP Project: ${props.GCP_PROJECT_ID}
- Vault: ${props.VAULT_ID}
- Version: ${memory.anchor_version || "9.1.1"}
 ### VAULT REGISTRIES
- Network Registry: ${getFolderIdByName_('NETWORK-REGISTRY') || 'UNREGISTERED'}
- Active Projects: ${getFolderIdByName_('ACTIVE-PROJECTS') || 'UNREGISTERED'}`;
}

/**
* FIX: Now calls the internal Vertex Bridge processReasoning_
*/
function processReasoning(userPrompt) {
  const systemContext = generateSystemPrompt();
  const payload = { intent: 'REASON', prompt: `${systemContext}\n\nUser Query: ${userPrompt}` };
  return processReasoning_(payload);
}
