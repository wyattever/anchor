/**
 * 1_memory.gs — ANCHOR v11.3.1 | Memory Controller (Per-Agent)
 * v11.3.1: Reverted to per-agent agent_memory.json storage.
 */

function getAgentMemory(agentKey) {
  const folderId = Vault.get(agentKey);
  if (!folderId) return { facts: [], observations: [] };
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName('agent_memory.json');
  
    if (files.hasNext()) {
      const file = files.next();
      const content = file.getBlob().getDataAsString('UTF-8');
      return content ? JSON.parse(content) : { facts: [], observations: [] };
    }
  } catch (e) {
    console.error(`⚓ MEMORY READ FAILURE [${agentKey}]: ` + e.message);
  }
  return { facts: [], observations: [] };
}

function updateAgentMemory(agentKey, newData) {
  const folderId = Vault.get(agentKey);
  if (!folderId) throw new Error(`Vault key "${agentKey}" not found.`);
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName('agent_memory.json');
  
    const memory = getAgentMemory(agentKey);
    const updatedMemory = { ...memory, ...newData, last_sync: new Date().toISOString() };
    const jsonString = JSON.stringify(updatedMemory, null, 2);
  
    if (files.hasNext()) {
      const file = files.next();
      file.setContent(jsonString);
    } else {
      folder.createFile('agent_memory.json', jsonString, MimeType.PLAIN_TEXT);
    }
    return updatedMemory;
  } catch (e) {
    console.error(`⚓ MEMORY WRITE FAILURE [${agentKey}]: ` + e.message);
    return newData;
  }
}

/**
 * LEGACY WRAPPER (to avoid breaking 3_crawl.js immediately)
 */
function getPhysicalMemory() {
  return getAgentMemory('0-1-PANTO');
}
