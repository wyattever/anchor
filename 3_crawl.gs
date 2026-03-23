/**
 * 3_crawl.gs — ANCHOR v10 | Vault Surveyor
 * Scans ANCHOR-VAULT and updates the Network Registry.
 */

function CRAWL_VAULT() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    console.log("⚓ Starting Vault Crawl...");
    
    const vault = DriveApp.getFolderById(VAULT_ID);
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
    
    // Update Registry File
    const registryFile = DriveApp.getFileById(REGISTRY_ID);
    registryFile.setContent(JSON.stringify({
      last_crawl: new Date().toISOString(),
      file_count: manifest.length,
      files: manifest
    }));
    
    console.log("✅ Crawl Complete. Indexed " + manifest.length + " files.");
    return manifest.length + " files indexed in Registry.";
    
  } catch (e) {
    console.error("❌ Crawl Error: " + e.message);
    return "Crawl Failed: " + e.message;
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
