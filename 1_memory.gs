/**
 * ANCHOR CORE v9.4.3 - Memory Controller (Atomic Patch)
 */

function getPhysicalMemory() {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  const vault = DriveApp.getFolderById(vaultId);
  const files = vault.getFilesByName('agent_memory.json');
  
  if (files.hasNext()) {
    const actualFile = files.next(); // Explicitly extract the File object
    const content = actualFile.getContentText(); // Call on the File, not the Iterator
    return content ? JSON.parse(content) : {};
  }
  return {};
}

function updatePhysicalMemory(newData) {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  const vault = DriveApp.getFolderById(vaultId);
  const files = vault.getFilesByName('agent_memory.json');
  
  const memory = getPhysicalMemory();
  const updatedMemory = { ...memory, ...newData, last_sync: new Date().toISOString() };
  
  if (files.hasNext()) {
    const actualFile = files.next();
    actualFile.setContent(JSON.stringify(updatedMemory, null, 2));
  } else {
    vault.createFile('agent_memory.json', JSON.stringify(updatedMemory, null, 2), MimeType.PLAIN_TEXT);
  }
  return updatedMemory;
}
