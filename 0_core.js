/**
* 0_core.gs — ANCHOR v9.1.0 | API Gateway + Vertex Bridge
* Architecture: Fail-Fast Router with Vault-Map Resolution
*/

const VAULT_ID        = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
const VERTEX_MODEL    = 'gemini-2.5-flash-lite';
const LOCK_TIMEOUT_MS = 30000;

const GCP_PROJECT_ID = PropertiesService.getScriptProperties().getProperty('GCP_PROJECT_ID');
const GCP_REGION     = PropertiesService.getScriptProperties().getProperty('GCP_REGION') || 'us-central1';

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
 if (!intent) {
   return buildResponse_({ status: 'ERROR', message: 'Missing required field: intent.' }, 400);
 }

 const lock = LockService.getScriptLock();
 let lockAcquired = false;

 try {
   lock.waitLock(LOCK_TIMEOUT_MS);
   lockAcquired = true;
  
   switch (intent) {
     case 'INGEST': {
       const result = handleIngest_(payload);
       return buildResponse_({ status: result.status, fileId: result.fileId, name: result.name });
     }
     case 'PROJECT_LOG': {
       const result = handleProjectLog_(payload);
       return buildResponse_(result);
     }
     case 'REASON': {
       const result = processReasoning_(payload);
       return buildResponse_(result);
     }
     case 'PING': {
       return buildResponse_({ status: 'OK', message: 'ANCHOR v9.1.0 is alive.' });
     }
     default: {
       return buildResponse_({ status: 'ERROR', message: `Unknown intent: "${intent}".` }, 400);
     }
   }
 } catch (err) {
   return buildResponse_({ status: 'ERROR', message: err.message }, 500);
 } finally {
   if (lockAcquired) lock.releaseLock();
 }
}

function handleIngest_(payload) {
 const name = payload.name || `ingest_${Date.now()}`;
 const content = payload.content || payload.data || null;
 if (!content) throw new Error('INGEST payload missing required field: content or data.');

 const blob = Utilities.newBlob(JSON.stringify(content), 'application/json', `${name}.json`);
 const file = DriveApp.getFolderById(VAULT_ID).createFile(blob);
 return { status: 'OK', fileId: file.getId(), name };
}

function handleProjectLog_(payload) {
 const activeProjectsId = getFolderIdByName_('ACTIVE-PROJECTS');
 if (!activeProjectsId) throw new Error('VAULT_MAP entry for ACTIVE-PROJECTS not found.');

 const ss = SpreadsheetApp.openById(activeProjectsId);
 const sheet = ss.getSheets()[0];
 const row = [new Date().toISOString(), payload.projectId || '', payload.event || '', JSON.stringify(payload.meta || {})];
 sheet.appendRow(row);
 return { status: 'OK', rowIndex: sheet.getLastRow() };
}

function processReasoning_(payload) {
 const prompt = payload.prompt || payload.query || '';
 if (!prompt) throw new Error('REASON payload missing required field: prompt.');

 const body = {
   contents: [{ role: 'user', parts: [{ text: prompt }] }],
   generationConfig: { temperature: payload.temperature || 0.7, maxOutputTokens: payload.maxOutputTokens || 2048 }
 };

 const options = {
   method: 'post',
   contentType: 'application/json',
   headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
   payload: JSON.stringify(body),
   muteHttpExceptions: true
 };

 const response = UrlFetchApp.fetch(getVertexEndpoint_(), options);
 const raw = JSON.parse(response.getContentText());
 if (response.getResponseCode() !== 200) throw new Error(`Vertex AI Error: ${JSON.stringify(raw.error)}`);

 return { status: 'OK', response: raw.candidates?.[0]?.content?.parts?.[0]?.text || '' };
}

function buildResponse_(body, httpStatus = 200) {
 return ContentService.createTextOutput(JSON.stringify({ httpStatus, ...body }))
   .setMimeType(ContentService.MimeType.JSON);
}