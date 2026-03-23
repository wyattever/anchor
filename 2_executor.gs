/**
 * ANCHOR CORE v9.0.0 - Side-Effect Executor
 */

function executeTask(taskType, params) {
  console.log("⚓ EXECUTING TASK: " + taskType);
  
  switch(taskType) {
    case 'WRITE_FILE':
      return createDriveFile(params.name, params.content, params.folderId);
    case 'LOG_EVENT':
      return logToVault(params.data);
    default:
      throw new Error("Unknown task type: " + taskType);
  }
}

function createDriveFile(name, content, folderId) {
  const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
  const file = folder.createFile(name, content);
  return { id: file.getId(), url: file.getUrl() };
}
