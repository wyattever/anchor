/**
* 3_crawl.gs — ANCHOR v10.1.0 | Vault Surveyor
* Scans ANCHOR-VAULT root. Decoupled from hardcoded REGISTRY_ID.
*/

function CRAWL_VAULT() {
 const lock = LockService.getScriptLock();
 try {
   lock.waitLock(30000);
   console.log("⚓ Starting Vault Crawl...");
  
   const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
   const vault = DriveApp.getFolderById(vaultId);
   const files = vault.getFiles();
   const manifest = [];
  
   while (files.hasNext()) {
     const file = files.next();
     manifest.push({
       id: file.getId(),
       name: file.getName(),
       created: file.getDateCreated().toISOString(),
       size: file.getSize()
     });
   }
  
   console.log("✅ Crawl Complete. Indexed " + manifest.length + " files.");
   return manifest.length + " files indexed in Vault.";
  
 } catch (e) {
   console.error("❌ Crawl Error: " + e.message);
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
- Primary Vault (ANCHOR-VAULT): ${props.VAULT_ID}
- Status: ${memory.status || "ACTIVE"}
- Version: ${memory.anchor_version}

### VAULT REGISTRIES
- Network Registry: ${getFolderIdByName_('NETWORK-REGISTRY') || 'UNREGISTERED'}
- Active Projects: ${getFolderIdByName_('ACTIVE-PROJECTS') || 'UNREGISTERED'}
- Archives: ${getFolderIdByName_('ARCHIVE') || 'UNREGISTERED'}

All ingestion tasks must be directed to the ANCHOR-VAULT sub-folders.
Operate with technical precision and follow the ANCHOR Protocol.`;
}

function processReasoning(userPrompt) {
 const systemContext = generateSystemPrompt();
 return routeRequest({
   prompt: userPrompt,
   context: systemContext
 });
}