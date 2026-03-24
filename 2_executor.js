/**
 * 2_executor.gs — ANCHOR v9.6.2 | Action & File Execution
 * Fixed: VAULT_MAP key updated to 02-ACTIVE-PROJECTS.
 */

function writeProjectLog(projectName, logContent) {
  const activeId = getFolderIdByName_('02-ACTIVE-PROJECTS');
  if (!activeId) throw new Error('VAULT_MAP entry for 02-ACTIVE-PROJECTS not found.');

  const parentFolder = DriveApp.getFolderById(activeId);
  let projectFolder;
  const subfolders = parentFolder.getFoldersByName(projectName);

  if (subfolders.hasNext()) {
    projectFolder = subfolders.next();
  } else {
    projectFolder = parentFolder.createFolder(projectName);
    console.log('⚓ EXECUTOR: Created new project folder: ' + projectName);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName  = 'LOG_' + timestamp + '.txt';
  const file      = projectFolder.createFile(fileName, logContent, MimeType.PLAIN_TEXT);

  console.log('✅ LOG WRITTEN: ' + file.getName() + ' in ' + projectName);
  return { name: file.getName(), id: file.getId(), url: file.getUrl() };
}

function commitSystemUpdate(updateNote) {
  const memory = getPhysicalMemory();
  memory.last_update_note          = updateNote;
  memory.last_successful_execution = new Date().toISOString();
  return updatePhysicalMemory(memory);
}

function ingestToVault(data, source = 'MANUAL') {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  const vault   = DriveApp.getFolderById(vaultId);

  const dateStr  = new Date().toISOString().split('T')[0];
  const fileName = 'INGEST_' + dateStr + '.txt';
  const entry    = '\n\n--- INGESTION [' + new Date().toLocaleTimeString() +
                   '] SOURCE: ' + source + ' ---\n' + data;

  let file;
  try {
    const files = vault.getFilesByName(fileName);
    if (files.hasNext()) {
      file = files.next();
      file.setContent(file.getContentText() + entry);
      console.log('⚓ INGEST: Appended to ' + fileName);
    } else {
      file = vault.createFile(
        fileName,
        'ANCHOR VAULT INGESTION LOG: ' + dateStr + entry,
        MimeType.PLAIN_TEXT
      );
      console.log('⚓ INGEST: Created new log ' + fileName);
    }
    return { status: 'ingested', fileId: file.getId(), name: fileName };
  } catch (e) {
    console.error('❌ INGESTION ERROR: ' + e.message);
    return { status: 'error', message: e.message };
  }
}
