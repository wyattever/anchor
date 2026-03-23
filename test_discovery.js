function TEST_FOLDER_DISCOVERY_LIFECYCLE() {
 const TEST_NAME = "UNIT_TEST_" + Date.now();
 const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
 console.log("🚀 STARTING VAULT_MAP TEST...");

 try {
   const vault = DriveApp.getFolderById(vaultId);
   const folder = vault.createFolder(TEST_NAME);
   const folderId = folder.getId();

   registerFolder_(TEST_NAME, folderId);
   const resolved = getFolderIdByName_(TEST_NAME);

   if (resolved === folderId) {
     console.log("✅ SUCCESS: Folder registered and resolved correctly.");
   } else {
     throw new Error("Mismatch! Resolved: " + resolved);
   }

   folder.setTrashed(true);
   console.log("⚓ TEST COMPLETE. Cleanup done.");

 } catch (e) {
   console.error("❌ TEST FAILED: " + e.message);
 }
}