/**
 * ONE-OFF UTILITY: Export all project files to Google Drive
 * Solves the "Logging output too large" truncation issue.
 * Requires Apps Script API enabled and specific OAuth scopes.
 */
function EXPORT_ALL_SOURCE_CODE() {
  const scriptId = ScriptApp.getScriptId();
  const url = `https://script.googleapis.com/v1/projects/${scriptId}/content`;
  
  const options = {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() !== 200) {
    console.error("❌ API Error. Ensure Apps Script API is enabled and scopes are set.");
    console.error(response.getContentText());
    return;
  }
  
  const data = JSON.parse(response.getContentText());
  
  let fullSourceCode = `=== ANCHOR PROJECT FILES (${data.files.length} total) ===\n`;
  fullSourceCode += `Generated: ${new Date().toLocaleString()}\n`;
  
  data.files.forEach(file => {
    // Ignore the manifest file to keep logs cleaner
    if (file.name === 'appsscript') return; 
    
    fullSourceCode += `\n\n======================================================\n`;
    fullSourceCode += `📄 FILE: ${file.name}.${file.type === 'SERVER_JS' ? 'gs' : 'html'}\n`;
    fullSourceCode += `======================================================\n\n`;
    fullSourceCode += file.source;
    fullSourceCode += `\n`;
  });

  // Create a text file in the root of Google Drive to prevent truncation
  const fileName = `ANCHOR_SOURCE_CODE_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  const exportFile = DriveApp.createFile(fileName, fullSourceCode, MimeType.PLAIN_TEXT);
  
  console.log(`✅ Success! Source code compiled and saved to Drive.`);
  console.log(`📄 File Name: ${exportFile.getName()}`);
  console.log(`🔗 URL: ${exportFile.getUrl()}`);
}

/**
 * TEST_SYNC_LOGIC
 * One-off function to validate Scenario A, B, and C.
 * Note: This creates/deletes a real folder in your Drive to test actual reconciliation.
 */
function TEST_SYNC_LOGIC() {
  const vaultId = PropertiesService.getScriptProperties().getProperty('ANCHOR_VAULT_ID');
  const vault = DriveApp.getFolderById(vaultId);
  
  console.log("--- STARTING RECONCILIATION TEST SUITE ---");

  // 1. Validate Scenario A: No Changes
  console.log("\nTEST 1: No Changes");
  const msgA = deploy_sync();
  console.log("Result: " + msgA);
  if (msgA === "Vault map is up-to-date.") {
    console.log("✅ Scenario A Passed");
  }

  // 2. Validate Scenario B: Discovery of New Folder
  console.log("\nTEST 2: New Folder Discovery");
  const testFolder = vault.createFolder("NEW_TEST_FOLDER");
  const msgB = deploy_sync();
  console.log("Result: " + msgB);
  if (msgB.includes("Added: NEW_TEST_FOLDER")) {
    console.log("✅ Scenario B Passed");
  }

  // 3. Validate Scenario C: Deletion Discovery
  console.log("\nTEST 3: Folder Deletion Discovery");
  testFolder.setTrashed(true); // Move to trash to simulate "Missing"
  const msgC = deploy_sync();
  console.log("Result: " + msgC);
  if (msgC.includes("Deleted: NEW_TEST_FOLDER")) {
    console.log("✅ Scenario C Passed");
  }

  // 4. Final Verification
  const finalMsg = deploy_sync();
  console.log("\nTEST 4: Return to Clean State");
  console.log("Final State: " + finalMsg);
  
  console.log("\n--- TEST SUITE COMPLETE ---");
}