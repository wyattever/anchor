/**
 * ANCHOR CORE v9.3.2 - Deep Crawler
 */

function reconcileRegistry() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const report = [];
  
  console.log("⚓ SCANNING REGISTRY...");
  
  for (const key in props) {
    if (key.endsWith('_ID') && props[key].length > 20 && !props[key].includes(' ')) {
      try {
        // Try to get as Folder first, then File
        let resource;
        try { resource = DriveApp.getFolderById(props[key]); }
        catch(e) { resource = DriveApp.getFileById(props[key]); }
        
        report.push("✅ VERIFIED: " + key + " -> " + resource.getName());
      } catch (e) {
        report.push("❌ FAILED: " + key + " (" + props[key] + ")");
      }
    }
  }
  return report;
}

function getFolderMap(folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const subfolders = folder.getFolders();
    const files = folder.getFiles();
    
    const map = { name: folder.getName(), folders: [], files: [] };

    while (subfolders.hasNext()) {
      const sub = subfolders.next();
      map.folders.push({ name: sub.getName(), id: sub.getId() });
    }
    while (files.hasNext()) {
      const file = files.next();
      map.files.push({ name: file.getName(), id: file.getId() });
    }
    return map;
  } catch (e) {
    return { error: "Unreachable: " + folderId };
  }
}
