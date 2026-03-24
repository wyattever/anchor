/**
 * 0_core.gs — ANCHOR v11.0.0 | API Gateway + Vertex Bridge
 * Architecture: Fail-Fast Router with Vault-Map Resolution
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
        return buildResponse_({ status: result.status, fileId: result.fileId, name: result.name, url: result.url });
      }
      case 'PROJECT_LOG': {
        const result = handleProjectLog_(payload);
        return buildResponse_(result);
      }
      case 'REASON': {
        const result = processReasoning_(payload);
        return buildResponse_(result);
      }
      case 'READ': {
        const result = handleRead_(payload);
        return buildResponse_(result);
      }
      case 'LIST': {
        const result = handleList_(payload);
        return buildResponse_(result);
      }
      case 'PING': {
        return buildResponse_({ status: 'OK', message: 'ANCHOR v11.0.0 is alive.' });
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

// =============================================================================
// INGEST HANDLER
// =============================================================================

function handleIngest_(payload) {
  const format   = (payload.format || 'txt').toLowerCase();
  const name     = (payload.name   || 'ingest_' + Date.now() + '.' + format);
  const targetId = payload.folderId || VAULT_ID;
  const folder   = DriveApp.getFolderById(targetId);

  let content;
  let mimeType;
  let file;

  // ── TXT: write raw message content directly ─────────────────────────────────
  if (format === 'txt') {
    content  = payload.content;
    if (!content) throw new Error('INGEST txt payload missing required field: content.');
    mimeType = MimeType.PLAIN_TEXT;
    file     = folder.createFile(name, content, mimeType);
  }

  // ── CSV: generate via Vertex AI, validate, write ────────────────────────────
  else if (format === 'csv') {
    const prompt = payload.content;
    if (!prompt) throw new Error('INGEST csv payload missing required field: content (prompt).');

    const generated = generateStructuredContent_(prompt, 'csv');
    content  = generated;
    mimeType = MimeType.CSV;
    file     = folder.createFile(name, content, mimeType);
  }

  // ── JSON: generate via Vertex AI, validate, write ───────────────────────────
  else if (format === 'json') {
    const prompt = payload.content;
    if (!prompt) throw new Error('INGEST json payload missing required field: content (prompt).');

    const generated = generateStructuredContent_(prompt, 'json');

    // Validate JSON before writing
    try {
      JSON.parse(generated);
    } catch (jsonErr) {
      throw new Error('Vertex AI returned invalid JSON. Raw: ' + generated.substring(0, 200));
    }

    content  = generated;
    mimeType = 'application/json';
    const blob = Utilities.newBlob(content, mimeType, name);
    file     = folder.createFile(blob);
  }

  else {
    // Unknown format — fall back to plain text
    content  = payload.content || '';
    mimeType = MimeType.PLAIN_TEXT;
    file     = folder.createFile(name, content, mimeType);
  }

  const fileUrl = 'https://drive.google.com/file/d/' + file.getId() + '/view';
  console.log(`[ANCHOR:INGEST] "${name}" (${format}) → ${file.getId()} in folder ${targetId}`);

  // Log to network registry
  logMessage_({
    agent:     payload.meta && payload.meta.agent   ? payload.meta.agent   : '',
    agentId:   payload.meta && payload.meta.agentId ? payload.meta.agentId : '',
    format:    format,
    topic:     payload.name || '',
    message:   name,
    url:       fileUrl,
    direction: 'OUT'
  });

  return { status: 'OK', fileId: file.getId(), name: file.getName(), url: fileUrl };
}

// =============================================================================
// STRUCTURED CONTENT GENERATOR (CSV + JSON via Vertex AI)
// =============================================================================

/**
 * generateStructuredContent_
 *
 * Calls Vertex AI with a strict system instruction to return only raw
 * CSV or JSON — no markdown, no code fences, no explanation.
 *
 * @param {string} userPrompt  — Natural language description of desired content
 * @param {string} format      — 'csv' or 'json'
 * @returns {string}           — Raw CSV or JSON string
 */
function generateStructuredContent_(userPrompt, format) {
  if (!GCP_PROJECT_ID) throw new Error('Script property GCP_PROJECT_ID is not configured.');

  const systemInstructions = format === 'csv'
    ? 'You are a data generation assistant. Return ONLY raw CSV data with no explanation, ' +
      'no markdown, no code fences, and no preamble. The first row must be a header row. ' +
      'Use commas as delimiters. Every row must have the same number of columns.'
    : 'You are a data generation assistant. Return ONLY a valid raw JSON object or array ' +
      'with no explanation, no markdown, no code fences, and no preamble. ' +
      'The response must be parseable by JSON.parse() with no modification.';

  const body = {
    system_instruction: {
      parts: [{ text: systemInstructions }]
    },
    contents: [{
      role:  'user',
      parts: [{ text: userPrompt }]
    }],
    generationConfig: {
      temperature:     0.2,
      maxOutputTokens: 4096
    }
  };

  const options = {
    method:             'post',
    contentType:        'application/json',
    headers:            { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    payload:            JSON.stringify(body),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(getVertexEndpoint_(), options);
  const raw      = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    throw new Error(`Vertex AI Error: ${JSON.stringify(raw.error)}`);
  }

  let text = raw.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Strip any markdown code fences Vertex adds despite instructions
  text = text
    .replace(/^```(?:csv|json)?\n?/i, '')
    .replace(/\n?```$/,               '')
    .trim();

  if (!text) throw new Error('Vertex AI returned empty content for ' + format + ' generation.');

  console.log(`[ANCHOR:GENERATE] ${format.toUpperCase()} generated. Length: ${text.length} chars`);
  return text;
}

// =============================================================================
// PROJECT LOG HANDLER
// =============================================================================

function handleProjectLog_(payload) {
  const activeProjectsId = getFolderIdByName_('02-ACTIVE-PROJECTS');
  if (!activeProjectsId) throw new Error('VAULT_MAP entry for 02-ACTIVE-PROJECTS not found.');

  const ss    = SpreadsheetApp.openById(activeProjectsId);
  const sheet = ss.getSheets()[0];
  const row   = [
    new Date().toISOString(),
    payload.projectId || '',
    payload.event     || '',
    JSON.stringify(payload.meta || {})
  ];
  sheet.appendRow(row);
  return { status: 'OK', rowIndex: sheet.getLastRow() };
}

// =============================================================================
// REASON HANDLER
// =============================================================================

function processReasoning_(payload) {
  const prompt = payload.prompt || payload.query || '';
  if (!prompt) throw new Error('REASON payload missing required field: prompt.');

  const body = {
    contents:         [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature:     payload.temperature     || 0.7,
      maxOutputTokens: payload.maxOutputTokens || 2048
    }
  };

  const options = {
    method:             'post',
    contentType:        'application/json',
    headers:            { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    payload:            JSON.stringify(body),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(getVertexEndpoint_(), options);
  const raw      = JSON.parse(response.getContentText());
  if (response.getResponseCode() !== 200) {
    throw new Error(`Vertex AI Error: ${JSON.stringify(raw.error)}`);
  }

  const responseText = raw.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Log agent reply to registry sheets
  logMessage_({
    agent:     payload.meta && payload.meta.agent   ? payload.meta.agent   : '',
    agentId:   payload.meta && payload.meta.agentId ? payload.meta.agentId : '',
    format:    'chat',
    topic:     payload.topic || '',
    message:   responseText,
    url:       '',
    direction: 'IN'
  });

  return { status: 'OK', response: responseText };
}

// =============================================================================
// UTILITIES
// =============================================================================

function buildResponse_(body, httpStatus = 200) {
  return ContentService
    .createTextOutput(JSON.stringify({ httpStatus, ...body }))
    .setMimeType(ContentService.MimeType.JSON);
}
