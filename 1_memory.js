/**
 * 1_memory.gs — ANCHOR v11.1.3 | Memory Controller (Blob-Safe)
 * v11.1.3: Version bump and write-safety check for shortcuts.
 */

function getPhysicalMemory() {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  try {
    const vault = DriveApp.getFolderById(vaultId);
    const files = vault.getFilesByName('agent_memory.json');
  
    if (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() === 'application/vnd.google-apps.shortcut') {
        console.error("⚓ MEMORY ERROR: Vault contains a shortcut, not a file.");
        return {};
      }
      const blob = file.getBlob();
      const content = blob.getDataAsString('UTF-8');
      return content ? JSON.parse(content) : {};
    }
  } catch (e) {
    console.error("⚓ MEMORY READ FAILURE: " + e.message);
  }
  return {};
}

function updatePhysicalMemory(newData) {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  try {
    const vault = DriveApp.getFolderById(vaultId);
    const files = vault.getFilesByName('agent_memory.json');
  
    const memory = getPhysicalMemory();
    const updatedMemory = { ...memory, ...newData, last_sync: new Date().toISOString() };
    const jsonString = JSON.stringify(updatedMemory, null, 2);
  
    if (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() === 'application/vnd.google-apps.shortcut') {
        throw new Error("Cannot write to a shortcut.");
      }
      file.setContent(jsonString);
    } else {
      vault.createFile('agent_memory.json', jsonString, MimeType.PLAIN_TEXT);
    }
    return updatedMemory;
  } catch (e) {
    console.error("⚓ MEMORY WRITE FAILURE: " + e.message);
    return newData;
  }
}
