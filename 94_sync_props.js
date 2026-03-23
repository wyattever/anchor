function syncPropertiesFromVault() {
  const vaultId = "1PfiQ9BZ9pk2kiVJ8HUsEt4XenMy4ZkiE";
  const vaultMap = getFolderMap(vaultId);
  const props = PropertiesService.getScriptProperties();
  
  console.log("⚓ SYNCING PROPERTIES FROM DRIVE...");
  
  vaultMap.folders.forEach(folder => {
    // Standardize key names (e.g., PAN-ANA-001-WORKSHOP -> PANTO_ID)
    let key = folder.name.split('-')[0].toUpperCase() + "_ID";
    
    // Manual overrides for specific naming conventions
    if (folder.name.includes("01-NETWORK")) key = "NETWORK_REGISTRY_ID";
    if (folder.name.includes("02-ACTIVE")) key = "ACTIVE_PROJECTS_ID";
    if (folder.name.includes("03-TEMPORAL")) key = "TEMPORAL_LAKE_ID";
    
    props.setProperty(key, folder.id);
    console.log("✅ SYNCED: " + key + " -> " + folder.id);
  });
  
  console.log("⚓ SYNC COMPLETE.");
}
