/**
 * 2_executor.gs — ANCHOR v11.1.3 | Action & File Execution
 * v11.1.3: Migrated to Vault.get() for 02-ACTIVE-PROJECTS.
 */

function writeProjectLog(projectName, logContent) {
  const activeId = Vault.get('ACTIVE_PROJECTS');
  if (!activeId) throw new Error('VAULT_MAP entry for ACTIVE_PROJECTS not found.');

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
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_MAP_SHEET_ID');
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

function handleRead_(payload) {
  if (payload.fileId) {
    try {
      const file = DriveApp.getFileById(payload.fileId);
      return {
        status:  'OK',
        name:    file.getName(),
        fileId:  file.getId(),
        content: file.getBlob().getDataAsString()
      };
    } catch (e) {
      return { status: 'ERROR', message: 'Could not read file: ' + e.message };
    }
  }
  if (payload.folderId && payload.name) {
    try {
      const folder = DriveApp.getFolderById(payload.folderId);
      const files  = folder.getFilesByName(payload.name);
      if (!files.hasNext()) return { status: 'ERROR', message: 'File not found: ' + payload.name };
      const file = files.next();
      return {
        status:  'OK',
        name:    file.getName(),
        fileId:  file.getId(),
        content: file.getBlob().getDataAsString()
      };
    } catch (e) {
      return { status: 'ERROR', message: 'Could not read file: ' + e.message };
    }
  }
  return { status: 'ERROR', message: 'READ requires fileId or folderId+name.' };
}

function handleList_(payload) {
  if (!payload.folderId) return { status: 'ERROR', message: 'LIST requires folderId.' };
  try {
    const folder = DriveApp.getFolderById(payload.folderId);
    const iter   = folder.getFiles();
    const files  = [];
    while (iter.hasNext()) {
      const f = iter.next();
      files.push({
        name:    f.getName(),
        fileId:  f.getId(),
        size:    f.getSize(),
        created: f.getDateCreated().toISOString(),
        updated: f.getLastUpdated().toISOString()
      });
    }
    files.sort((a, b) => a.name.localeCompare(b.name));
    return { status: 'OK', count: files.length, files: files };
  } catch (e) {
    return { status: 'ERROR', message: 'Could not list folder: ' + e.message };
  }
}
