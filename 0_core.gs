/**
 * ANCHOR CORE v9.1.1 - Simplified Validated Bridge
 * Standardized on gemini-2.5-flash-lite
 */

const CONFIG = {
  PROJECT_ID: PropertiesService.getScriptProperties().getProperty('GCP_PROJECT_ID'),
  LOCATION: PropertiesService.getScriptProperties().getProperty('VERTEX_LOCATION'),
  MODEL_ID: "gemini-2.5-flash-lite" // Hard-coded for stability during verification
};

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

function routeRequest(payload) {
  const prompt = payload.prompt || payload.message;
  const context = payload.context || "";
  return callVertexAI(prompt, context);
}

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
  const resCode = response.getResponseCode();
  const resText = response.getContentText();

  return {
    status: resCode === 200 ? "success" : "error",
    code: resCode,
    response: resText
  };
}
