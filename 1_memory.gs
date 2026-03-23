/**
 * ANCHOR CORE v9.4.0 - Memory Controller
 */

function getPhysicalMemory() {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  const vault = DriveApp.getFolderById(vaultId);
  const files = vault.getFilesByName('agent_memory.json');
  
  if (files.hasNext()) {
    const file = files.next();
    return JSON.parse(file.getContentText());
  }
  return null;
}

function updatePhysicalMemory(newData) {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  const vault = DriveApp.getFolderById(vaultId);
  const files = vault.getFilesByName('agent_memory.json');
  
  const memory = getPhysicalMemory() || {};
  const updatedMemory = { ...memory, ...newData, last_sync: new Date().toISOString() };
  
  if (files.hasNext()) {
    files.next().setContent(JSON.stringify(updatedMemory, null, 2));
  } else {
    vault.createFile('agent_memory.json', JSON.stringify(updatedMemory, null, 2), MimeType.PLAIN_TEXT);
  }
  return updatedMemory;
}
