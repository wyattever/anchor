/**
 * ANCHOR CORE v9.7.0 - Unified Orchestrator
 */

const CONFIG = {
  PROJECT_ID: PropertiesService.getScriptProperties().getProperty('GCP_PROJECT_ID'),
  LOCATION: PropertiesService.getScriptProperties().getProperty('VERTEX_LOCATION'),
  MODEL_ID: "gemini-2.5-flash-lite"
};

/**
 * WEBHOOK ENTRY POINT
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const intent = payload.intent || "REASON"; // Default to reasoning
    
    let result;
    switch(intent) {
      case "LOG":
        result = writeProjectLog(payload.project, payload.content);
        break;
      case "SEARCH":
        result = findFileInRegistry(payload.registry, payload.query);
        break;
      case "REASON":
      default:
        result = processReasoning(payload.message || payload.prompt);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * VERTEX AI BRIDGE
 */
function routeRequest(payload) {
  const url = `https://${CONFIG.LOCATION}-aiplatform.googleapis.com/v1/projects/${CONFIG.PROJECT_ID}/locations/${CONFIG.LOCATION}/publishers/google/models/${CONFIG.MODEL_ID}:streamGenerateContent`;
  
  const body = {
    contents: [{
      role: "user",
      parts: [{ text: (payload.context || "") + "\n\n" + payload.prompt }]
    }]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(body),
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  return {
    status: response.getResponseCode() === 200 ? "success" : "error",
    response: response.getContentText()
  };
}
