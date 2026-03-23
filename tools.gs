/**
 * tools.gs — ANCHOR v10 | Network Mapping Utility
 * Run this once to reset and rebuild Project ID properties.
 */

function RESET_AND_MAP_NETWORK() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  const vault = DriveApp.getFolderById(VAULT_ID);
  
  console.log("⚓ Starting Network Reset...");

  // 1. DELETE: All existing folder properties (ending in _ID)
  let deletedCount = 0;
  for (const key in allProps) {
    if (key.endsWith("_ID") && key !== "VAULT_ID" && key !== "REGISTRY_ID") {
      props.deleteProperty(key);
      deletedCount++;
    }
  }
  console.log("🗑️ Purged " + deletedCount + " legacy folder properties.");

  // 2. MAP: Scan ANCHOR-VAULT for all subfolders
  const folders = vault.getFolders();
  let addedCount = 0;
  
  while (folders.hasNext()) {
    const folder = folders.next();
    const folderName = folder.getName();
    // Format: [FILENAME]_ID (Upper case, spaces to underscores)
    const newKey = folderName.toUpperCase().replace(/\s+/g, '_') + "_ID";
    
    props.setProperty(newKey, folder.getId());
    console.log("📍 Mapped: " + newKey + " -> " + folder.getId());
    addedCount++;
  }

  console.log("✅ Network Mapping Complete. Added " + addedCount + " new properties.");
  return "Reset Complete: Purged " + deletedCount + ", Mapped " + addedCount + ".";
}
