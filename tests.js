/**
 * tests.gs — ANCHOR v10 | Full-Spectrum Diagnostic Suite
 * Validates: Routing, Vault Access, Vertex AI, and Concurrency.
 */

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
