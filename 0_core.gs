/**
* 0_core.gs — ANCHOR v9.1.1 | API Gateway + Vertex Bridge
* Fix: handleProjectLog_ Type Validation & Refined Error Handling
*/

const VAULT_ID        = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
const VERTEX_MODEL    = 'gemini-2.5-flash-lite';
const LOCK_TIMEOUT_MS = 30000;
const GCP_PROJECT_ID  = PropertiesService.getScriptProperties().getProperty('GCP_PROJECT_ID');
const GCP_REGION      = PropertiesService.getScriptProperties().getProperty('GCP_REGION') || 'us-central1';

function getVertexEndpoint_() {
  return `https://${GCP_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/publishers/google/models/${VERTEX_MODEL}:generateContent`;
}

function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (parseErr) {
    return buildResponse_({ status: 'ERROR', message: 'Invalid JSON payload.' }, 400);
  }

  const intent = (payload.intent || '').toUpperCase().trim();
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
    lockAcquired = true;
  
    switch (intent) {
      case 'INGEST': 
        return buildResponse_(handleIngest_(payload));
      case 'PROJECT_LOG': 
        return buildResponse_(handleProjectLog_(payload));
      case 'REASON': 
        return buildResponse_(processReasoning_(payload));
      case 'PING': 
        return buildResponse_({ status: 'OK', message: 'ANCHOR v9.1.1 is alive.' });
      default: 
        return buildResponse_({ status: 'ERROR', message: `Unknown intent: "${intent}".` }, 400);
    }
  } catch (err) {
    // Distinguish between validation (400) and execution (500)
    const statusCode = err.message.includes('missing required') ? 400 : 500;
    return buildResponse_({ status: 'ERROR', message: err.message }, statusCode);
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
}

function handleIngest_(payload) {
  const name = payload.name || `ingest_${Date.now()}`;
  const content = payload.content || payload.data;
  if (!content) throw new Error('INGEST missing required field: content.');

  const blob = Utilities.newBlob(JSON.stringify(content), 'application/json', `${name}.json`);
  const file = DriveApp.getFolderById(VAULT_ID).createFile(blob);
  return { status: 'OK', fileId: file.getId(), name };
}

function handleProjectLog_(payload) {
  const activeProjectsId = getFolderIdByName_('ACTIVE-PROJECTS');
  if (!activeProjectsId) throw new Error('VAULT_MAP missing ACTIVE-PROJECTS.');

  // FIX: Verify if ID is a Spreadsheet or Folder. 
  // If Folder, find/create a "Network_Log" Spreadsheet inside it.
  let ss;
  try {
    ss = SpreadsheetApp.openById(activeProjectsId);
  } catch (e) {
    const folder = DriveApp.getFolderById(activeProjectsId);
    const files = folder.getFilesByName('Network_Project_Log');
    ss = files.hasNext() ? SpreadsheetApp.openById(files.next().getId()) : SpreadsheetApp.create('Network_Project_Log');
    if (!files.hasNext()) folder.addFile(DriveApp.getFileById(ss.getId()));
  }

  const sheet = ss.getSheets()[0];
  sheet.appendRow([new Date().toISOString(), payload.projectId || 'N/A', payload.event || 'LOG', JSON.stringify(payload.meta || {})]);
  return { status: 'OK', rowIndex: sheet.getLastRow() };
}

function processReasoning_(payload) {
  const prompt = payload.prompt || payload.query;
  if (!prompt) throw new Error('REASON missing required field: prompt.');

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: payload.temperature || 0.7, maxOutputTokens: payload.maxOutputTokens || 2048 }
  };

  const options = {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    payload: JSON.stringify(body), muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(getVertexEndpoint_(), options);
  const raw = JSON.parse(response.getContentText());
  if (response.getResponseCode() !== 200) throw new Error(`Vertex AI Error: ${JSON.stringify(raw.error)}`);

  return { status: 'OK', response: raw.candidates?.[0]?.content?.parts?.[0]?.text || '' };
}

function buildResponse_(body, httpStatus = 200) {
  return ContentService.createTextOutput(JSON.stringify({ httpStatus, ...body })).setMimeType(ContentService.MimeType.JSON);
}
