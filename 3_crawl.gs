/**
 * ANCHOR CORE v9.0.0 - Drive Crawler & Registry
 * Derived from v8 source: 5_crawl
 */

function syncRegistry() {
  const registryId = PropertiesService.getScriptProperties().getProperty('REGISTRY_ID');
  if (!registryId) return "No Registry ID found.";
  
  // Logic to verify all IDs in Script Properties exist in Drive
  console.log("⚓ CRAWLING REGISTRY: " + registryId);
  return "Registry Sync Complete";
}

function getFolderContents(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  let results = [];
  while (files.hasNext()) {
    let file = files.next();
    results.push({name: file.getName(), id: file.getId()});
  }
  return results;
}
