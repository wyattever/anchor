/**
 * ANCHOR CORE v9.2.1 - Resilient Crawler
 */

function reconcileRegistry() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const report = [];
  
  for (const key in props) {
    // Only check keys ending in _ID that look like Drive IDs (long strings, no spaces)
    if (key.endsWith('_ID') && props[key].length > 20 && !props[key].includes(' ')) {
      try {
        const resource = DriveApp.getFolderById(props[key]);
        report.push("✅ VERIFIED: " + key + " -> " + resource.getName());
      } catch (e) {
        report.push("❌ FAILED: " + key + " (" + props[key] + ")");
      }
    }
  }
  console.log("⚓ RECONCILIATION COMPLETE.");
  return report;
}

function getFolderMap(folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const map = { name: folder.getName(), files: [] };
    while (files.hasNext()) {
      const file = files.next();
      map.files.push({ name: file.getName(), id: file.getId() });
    }
    return map;
  } catch (e) {
    return { error: "Folder unreachable: " + folderId };
  }
}
