/**
 * 2_executor.gs — ANCHOR v11.3.0 | Command Execution Engine
 * v11.3.0: Synchronized naming refactor (ANCHOR_VAULT, 02-PROJECTS).
 */

function handleRead_(payload) {
  const activeId = Vault.get('02-PROJECTS');
  if (!activeId) throw new Error('VAULT key "02-PROJECTS" is not registered.');

  const folder = DriveApp.getFolderById(activeId);
  const fileName = payload.name;
  if (!fileName) throw new Error('READ intent missing required field: name.');

  const files = folder.getFilesByName(fileName);
  if (!files.hasNext()) throw new Error(`File not found: "${fileName}" in Active Projects.`);

  const file = files.next();
  return {
    status: 'OK',
    content: file.getBlob().getDataAsString(),
    meta: {
      id: file.getId(),
      updated: file.getLastUpdated().toISOString()
    }
  };
}

function handleList_(payload) {
  const targetId = payload.folderId || PropertiesService.getScriptProperties().getProperty('ANCHOR_VAULT');
  const folder = DriveApp.getFolderById(targetId);
  const files = folder.getFiles();
  const list = [];

  while (files.hasNext()) {
    const file = files.next();
    list.push({
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType()
    });
  }

  return { status: 'OK', files: list };
}

function ingestToVault(name, content, format = 'txt') {
  return handleIngest_({ name, content, format });
}

function writeProjectLog(projectName, logEntry) {
  const folderId = Vault.get('02-PROJECTS');
  const folder = DriveApp.getFolderById(folderId);
  const fileName = `${projectName}_log.txt`;
  
  const files = folder.getFilesByName(fileName);
  let file;
  if (files.hasNext()) {
    file = files.next();
    file.setContent(file.getContent() + '\n' + logEntry);
  } else {
    file = folder.createFile(fileName, logEntry, MimeType.PLAIN_TEXT);
  }
  return file.getId();
}
