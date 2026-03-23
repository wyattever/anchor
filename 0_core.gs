/**
 * ANCHOR CORE v9.9.3 - Final Switch Fix
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const intent = (data.intent || "REASON").toUpperCase();
    
    if (intent === "INGEST") {
      const ingestResult = ingestToVault(data.message, "MOBILE_UI");
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        intent: "INGEST",
        data: ingestResult
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (intent === "PROJECT_LOG") {
      const logResult = writeProjectLog(data.project || "GENERAL", data.message);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        intent: "PROJECT_LOG",
        data: logResult
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Default to REASONing
    const reasonResult = processReasoning(data.message || data.prompt);
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      intent: "REASON",
      data: reasonResult
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function routeRequest(payload) {
  const props = PropertiesService.getScriptProperties().getProperties();
  const url = "https://" + props.VERTEX_LOCATION + "-aiplatform.googleapis.com/v1/projects/" + props.GCP_PROJECT_ID + "/locations/" + props.VERTEX_LOCATION + "/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent";
  
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
    code: response.getResponseCode(),
    response: response.getContentText()
  };
}
