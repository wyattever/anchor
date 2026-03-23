/**
 * ANCHOR CORE v9.5.0 - Network Search Engine
 */

/**
 * FIND FILE IN REGISTRY
 * Scans a specific registry folder for a filename (fuzzy match).
 */
function findFileInRegistry(registryKey, fileName) {
  const folderId = PropertiesService.getScriptProperties().getProperty(registryKey);
  if (!folderId) return { error: "Registry key " + registryKey + " not found." };
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName(fileName);
    
    if (files.hasNext()) {
      const file = files.next();
      return { name: file.getName(), id: file.getId(), url: file.getUrl() };
    }
    
    // Fallback: Partial match search
    const partials = folder.searchFiles("title contains '" + fileName + "'");
    if (partials.hasNext()) {
      const p = partials.next();
      return { name: p.getName(), id: p.getId(), url: p.getUrl(), note: "Partial match" };
    }
    
    return { error: "File not found in " + folder.getName() };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * LIST PROJECT LOGS
 * Specifically targets the active project folders.
 */
function listRecentLogs(count = 5) {
  const activeId = PropertiesService.getScriptProperties().getProperty('ACTIVE_PROJECTS_ID');
  const folder = DriveApp.getFolderById(activeId);
  const files = folder.getFiles();
  const logs = [];
  
  while (files.hasNext() && logs.length < count) {
    const file = files.next();
    logs.push({ name: file.getName(), id: file.getId(), date: file.getLastUpdated() });
  }
  return logs.sort((a, b) => b.date - a.date);
}
