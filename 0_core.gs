/**
 * ANCHOR CORE v9.0.0 - Consolidated Bridge & Dispatcher
 * Merged from v8 source: 1_tools, 3_dispatcher, 6_bridge
 */

const CONFIG = {
  PROJECT_ID: PropertiesService.getScriptProperties().getProperty('GCP_PROJECT_ID') || 'acp-vertex-core',
  LOCATION: PropertiesService.getScriptProperties().getProperty('VERTEX_LOCATION') || 'us-central1',
  MODEL_ID: PropertiesService.getScriptProperties().getProperty('MODEL_ID') || 'gemini-1.5-pro'
};

/**
 * WEB APP ROUTER
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = routeRequest(data);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * DISPATCHER LOGIC
 */
function routeRequest(payload) {
  const prompt = payload.prompt || payload.message;
  const context = payload.context || "";
  
  // Logic to determine if we hit Vertex or AI Studio
  return callVertexAI(prompt, context);
}

/**
 * VERTEX AI BRIDGE
 */
function callVertexAI(prompt, context) {
  const url = `https://${CONFIG.LOCATION}-aiplatform.googleapis.com/v1/projects/${CONFIG.PROJECT_ID}/locations/${CONFIG.LOCATION}/publishers/google/models/${CONFIG.MODEL_ID}:streamGenerateContent`;
  
  const payload = {
    contents: [{
      role: "user",
      parts: [{ text: context + "\n\n" + prompt }]
    }]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  return {
    status: response.getResponseCode() === 200 ? "success" : "error",
    response: response.getContentText()
  };
}
