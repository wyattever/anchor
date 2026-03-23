/**
 * ANCHOR CORE v9.9.4 - Strict Routing Enforcement
 */

function doPost(e) {
  try {
    const postData = e.postData.contents;
    const data = JSON.parse(postData);
    const intent = (data.intent || "REASON").toUpperCase();
    
    // PATH A: INGESTION (Drive Write Only)
    if (intent === "INGEST") {
      const result = ingestToVault(data.message, "MOBILE_UI");
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        intent: "INGEST",
        fileId: result.fileId,
        name: result.name
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // PATH B: PROJECT LOGGING
    if (intent === "PROJECT_LOG") {
      const result = writeProjectLog(data.project || "GENERAL", data.message);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        intent: "PROJECT_LOG",
        fileId: result.id
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // PATH C: REASONING (LLM Bridge)
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
