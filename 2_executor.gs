/**
 * ANCHOR CORE v9.6.0 - Action & File Execution
 */

/**
 * WRITE LOG TO PROJECT
 * Standardizes log creation in the ACTIVE_PROJECTS folder.
 */
function writeProjectLog(projectName, logContent) {
  const activeId = PropertiesService.getScriptProperties().getProperty('ACTIVE_PROJECTS_ID');
  const parentFolder = DriveApp.getFolderById(activeId);
  
  // Find or Create Project Subfolder
  let projectFolder;
  const subfolders = parentFolder.getFoldersByName(projectName);
  
  if (subfolders.hasNext()) {
    projectFolder = subfolders.next();
  } else {
    projectFolder = parentFolder.createFolder(projectName);
    console.log("⚓ EXECUTOR: Created new project folder: " + projectName);
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = "LOG_" + timestamp + ".txt";
  
  const file = projectFolder.createFile(fileName, logContent, MimeType.PLAIN_TEXT);
  console.log("✅ LOG WRITTEN: " + file.getName() + " in " + projectName);
  
  return { name: file.getName(), id: file.getId(), url: file.getUrl() };
}

/**
 * UPDATE REGISTRY METADATA
 * Allows the Brain to manually push updates to the memory file.
 */
function commitSystemUpdate(updateNote) {
  const memory = getPhysicalMemory();
  memory.last_update_note = updateNote;
  memory.last_successful_execution = new Date().toISOString();
  
  return updatePhysicalMemory(memory);
}
