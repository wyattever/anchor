/**
 * ANCHOR CORE v9.9.0 - Mobile API Gateway
 */

function doPost(e) {
  const logVault = (msg) => ingestToVault(msg, "MOBILE_UI");
  
  try {
    const data = JSON.parse(e.postData.contents);
    const intent = data.intent ? data.intent.toUpperCase() : "REASON";
    
    logVault("Processing Mobile Intent: " + intent);
    
    let result;
    switch(intent) {
      case "INGEST":
        // Direct save to ANCHOR-VAULT
        result = ingestToVault(data.message, "MOBILE_USER");
        break;
        
      case "PROJECT_LOG":
        // Save to specific project folder in ACTIVE_PROJECTS
        result = writeProjectLog(data.project || "GENERAL", data.message);
        break;
        
      case "REASON":
      default:
        // Run full LLM reasoning with Vault context
        result = processReasoning(data.message || data.prompt);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      intent: intent,
      data: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    logVault("API ERROR: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * VERTEX AI BRIDGE (Internal Routing)
 */
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
