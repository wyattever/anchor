/**
 * 1_memory.gs — ANCHOR v11.3.0 | Memory Controller (Blob-Safe)
 * v11.3.0: Synchronized naming refactor (AGENT-MEMORY-SYS).
 */

function getPhysicalMemory() {
  const memoryFolderId = Vault.get('AGENT-MEMORY-SYS') || PropertiesService.getScriptProperties().getProperty('ANCHOR_VAULT');
  try {
    const folder = DriveApp.getFolderById(memoryFolderId);
    const files = folder.getFilesByName('agent_memory.json');
  
    if (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() === 'application/vnd.google-apps.shortcut') {
        console.error("⚓ MEMORY ERROR: Memory location contains a shortcut, not a file.");
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
  const memoryFolderId = Vault.get('AGENT-MEMORY-SYS') || PropertiesService.getScriptProperties().getProperty('ANCHOR_VAULT');
  try {
    const folder = DriveApp.getFolderById(memoryFolderId);
    const files = folder.getFilesByName('agent_memory.json');
  
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
      folder.createFile('agent_memory.json', jsonString, MimeType.PLAIN_TEXT);
    }
    return updatedMemory;
  } catch (e) {
    console.error("⚓ MEMORY WRITE FAILURE: " + e.message);
    return newData;
  }
}
