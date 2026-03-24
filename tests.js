/**
 * tests.gs — ANCHOR v10 | Full-Spectrum Diagnostic Suite
 * Validates: Routing, Vault Access, Vertex AI, and Concurrency.
 */
function debugJsFiles() {
  const keys = ['JS-COMMANDS', 'JS-SCRIPTS'];
  keys.forEach(key => {
    const fileId = getFolderIdByName_(key);
    console.log(key + ' → fileId: ' + fileId);
    if (fileId) {
      try {
        const content = DriveApp.getFileById(fileId).getBlob().getDataAsString();
        console.log(key + ' → content length: ' + content.length);
        console.log(key + ' → first 100 chars: ' + content.substring(0, 100));
      } catch (err) {
        console.error(key + ' → READ ERROR: ' + err.message);
      }
    }
  });
}

function updateJsFileIds() {
  const ss    = SpreadsheetApp.openById(getVaultMapSheetId_());
  const sheet = ss.getSheetByName('VAULT_MAP');
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'JS-COMMANDS') {
      sheet.getRange(i + 1, 2).setValue('1SBs242jHt9HI9ACEoKssboLGZO-_8wDy');
      console.log('JS-COMMANDS updated.');
    }
    if (data[i][0] === 'JS-SCRIPTS') {
      sheet.getRange(i + 1, 2).setValue('1WW1YrA_XxjCAong24PFV9nJGtYRw3-W9');
      console.log('JS-SCRIPTS updated.');
    }
  }
}

function RUN_ANCHOR_DIAGNOSTICS() {
  const LOG_HEADER = "⚓ ANCHOR v10 DIAGNOSTIC REPORT \n" + new Date().toLocaleString() + "\n" + "=".repeat(40);
  console.log(LOG_HEADER);
  
  const results = {
    routing: false,
    vault_access: false,
    ingest_io: false,
    vertex: false
  };

  try {
    // 1. TEST: PING (Basic Routing)
    const pingRes = JSON.parse(doPost({postData: {contents: JSON.stringify({intent: 'PING'})}}).getContent());
    if (pingRes.status === 'OK') {
      console.log("✅ PING: Success");
      results.routing = true;
    }

    // 2. TEST: GET FOLDER BY ID (Permissions & Scope)
    console.log("Verifying Vault Access (ID: " + VAULT_ID + ")...");
    try {
      const folder = DriveApp.getFolderById(VAULT_ID);
      console.log("✅ VAULT ACCESS: Success (Folder: " + folder.getName() + ")");
      results.vault_access = true;
    } catch (fErr) {
      console.error("❌ VAULT ACCESS FAILED: " + fErr.message);
    }

    // 3. TEST: INGEST (Physical Write)
    const ingestPayload = {
      intent: 'INGEST',
      name: 'DIAGNOSTIC_TEST_FILE',
      content: { system: 'ANCHOR', status: 'Verifying I/O' }
    };
    const ingestRes = JSON.parse(doPost({postData: {contents: JSON.stringify(ingestPayload)}}).getContent());
    if (ingestRes.status === 'OK') {
      console.log("✅ INGEST I/O: Success");
      results.ingest_io = true;
      DriveApp.getFileById(ingestRes.fileId).setTrashed(true);
    }

    // 4. TEST: REASON (Vertex AI)
    const reasonRes = JSON.parse(doPost({postData: {contents: JSON.stringify({intent: 'REASON', prompt: 'VERIFY'})}}).getContent());
    if (reasonRes.status === 'OK') {
      console.log("✅ VERTEX AI: Success");
      results.vertex = true;
    }

  } catch (err) {
    console.error("❌ DIAGNOSTIC CRASH: " + err.message);
  }

  console.log("=".repeat(40));
  console.log("FINAL STATUS: " + (Object.values(results).every(v => v) ? "OPERATIONAL" : "DEGRADED"));
}

/**
 * ONE-OFF_VAULT_SYNC
 * Scans the physical ANCHOR-VAULT and populates the VAULT_MAP sheet.
 */
function ONE_OFF_VAULT_SYNC() {
  const VAULT_ID = "1PfiQ9BZ9pk2kiVJ8HUsEt4XenMy4ZkiE";
  const mapSheetId = PropertiesService.getScriptProperties().getProperty('VAULT_MAP_SHEET_ID');
  
  if (!mapSheetId) {
    throw new Error("VAULT_MAP_SHEET_ID not found. Run bootstrapVaultMap() first.");
  }

  console.log("⚓ Starting One-Off Vault Discovery...");
  const vault = DriveApp.getFolderById(VAULT_ID);
  const folders = vault.getFolders();
  const ss = SpreadsheetApp.openById(mapSheetId);
  const sheet = ss.getSheetByName('VAULT_MAP');
  
  // Clear existing data (except header) to prevent duplicates during this one-off sync
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).clearContent();
  }

  let count = 0;
  const timestamp = new Date().toISOString();

  while (folders.hasNext()) {
    const folder = folders.next();
    const name = folder.getName();
    const id = folder.getId();
    
    // Log to console for your records
    console.log(`📍 Found: ${name.padEnd(30)} ID: ${id}`);
    
    // Write to VAULT_MAP Sheet
    sheet.appendRow([name.toUpperCase(), id, timestamp, 'ACTIVE']);
    count++;
  }

  console.log(`✅ SYNC COMPLETE. ${count} folders registered in VAULT_MAP.`);
  return `Successfully indexed ${count} folders.`;
}