/**
 * ANCHOR CORE v9.2.0 - Drive Crawler & Registry Sync
 */

/**
 * RECONCILE REGISTRY
 * Iterates through Script Properties and verifies Drive IDs.
 */
function reconcileRegistry() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const report = [];
  
  console.log("⚓ STARTING REGISTRY RECONCILIATION...");
  
  for (const key in props) {
    if (key.endsWith('_ID')) {
      try {
        const id = props[key];
        const type = id.length > 20 ? "DRIVE_OBJECT" : "METADATA";
        
        if (type === "DRIVE_OBJECT") {
          const resource = DriveApp.getFolderById(id) || DriveApp.getFileById(id);
          report.push(`VERIFIED: ${key} -> ${resource.getName()}`);
        }
      } catch (e) {
        report.push(`ERROR: ${key} (${props[key]}) is unreachable or invalid.`);
      }
    }
  }
  
  console.log("⚓ RECONCILIATION REPORT:\n" + report.join("\n"));
  return report;
}

/**
 * GET FOLDER MAP
 * Returns a JSON map of a folder's contents for the Brain to parse.
 */
function getFolderMap(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const subfolders = folder.getFolders();
  const map = { name: folder.getName(), files: [], folders: [] };

  while (files.hasNext()) {
    const file = files.next();
    map.files.push({ name: file.getName(), id: file.getId() });
  }
  while (subfolders.hasNext()) {
    const sub = subfolders.next();
    map.folders.push({ name: sub.getName(), id: sub.getId() });
  }
  return map;
}
