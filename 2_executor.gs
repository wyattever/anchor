/**
* 2_executor.gs — ANCHOR v9.1.1 | Action Execution
* Cleanup: Removed legacy syncPropertiesFromVault and duplicate ingestion.
*/

function writeProjectLog(projectName, logContent) {
  const activeId = getFolderIdByName_('ACTIVE-PROJECTS');
  if (!activeId) throw new Error('VAULT_MAP entry for ACTIVE-PROJECTS not found.');

  const parentFolder = DriveApp.getFolderById(activeId);
  let projectFolder;
  const subfolders = parentFolder.getFoldersByName(projectName);
  projectFolder = subfolders.hasNext() ? subfolders.next() : parentFolder.createFolder(projectName);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = "LOG_" + timestamp + ".txt";
  const file = projectFolder.createFile(fileName, logContent, MimeType.PLAIN_TEXT);
  return { name: file.getName(), id: file.getId(), url: file.getUrl() };
}

function commitSystemUpdate(updateNote) {
  const memory = getPhysicalMemory();
  memory.last_update_note = updateNote;
  memory.last_successful_execution = new Date().toISOString();
  return updatePhysicalMemory(memory);
}
