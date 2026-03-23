/**
 * ANCHOR CORE v9.8.1 - Ingestion Engine
 */

/**
 * INGEST TO VAULT
 * Appends or creates a daily ingestion log in the Vault.
 */
function ingestToVault(data, source = "MANUAL") {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  const vault = DriveApp.getFolderById(vaultId);
  
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const fileName = "INGEST_" + dateStr + ".txt";
  
  let file;
  const files = vault.getFilesByName(fileName);
  
  const entry = "\n\n--- INGESTION [" + new Date().toLocaleTimeString() + "] SOURCE: " + source + " ---\n" + data;
  
  try {
    if (files.hasNext()) {
      file = files.next();
      file.setContent(file.getContentText() + entry);
      console.log("⚓ INGEST: Appended to " + fileName);
    } else {
      file = vault.createFile(fileName, "ANCHOR VAULT INGESTION LOG: " + dateStr + entry, MimeType.PLAIN_TEXT);
      console.log("⚓ INGEST: Created new log " + fileName);
    }
    return { status: "ingested", fileId: file.getId(), name: fileName };
  } catch (e) {
    console.error("❌ INGESTION ERROR: " + e.message);
    return { status: "error", message: e.message };
  }
}
