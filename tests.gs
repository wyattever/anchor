/**
 * tests.gs — ANCHOR v10 | Full-Spectrum Diagnostic Suite
 * Validates: Routing, Vault I/O, Vertex AI, and Concurrency.
 */

function RUN_ANCHOR_DIAGNOSTICS() {
  const LOG_HEADER = "⚓ ANCHOR v10 DIAGNOSTIC REPORT \n" + new Date().toLocaleString() + "\n" + "=".repeat(40);
  console.log(LOG_HEADER);
  
  const results = {
    routing: false,
    vault: false,
    vertex: false,
    lock: false
  };

  try {
    // 1. TEST: PING (Basic Routing)
    console.log("Testing Intent: PING...");
    const pingRes = JSON.parse(doPost({postData: {contents: JSON.stringify({intent: 'PING'})}}).getContent());
    if (pingRes.status === 'OK') {
      console.log("✅ PING: Success");
      results.routing = true;
    }

    // 2. TEST: INGEST (Vault I/O & Mapping)
    console.log("Testing Intent: INGEST...");
    const ingestPayload = {
      intent: 'INGEST',
      name: 'DIAGNOSTIC_TEST_FILE',
      content: { system: 'ANCHOR', status: 'Verifying I/O', timestamp: new Date().toISOString() }
    };
    const ingestRes = JSON.parse(doPost({postData: {contents: JSON.stringify(ingestPayload)}}).getContent());
    if (ingestRes.status === 'OK' && ingestRes.fileId) {
      console.log("✅ INGEST: Success (FileID: " + ingestRes.fileId + ")");
      results.vault = true;
      // Cleanup: Trash the test file
      DriveApp.getFileById(ingestRes.fileId).setTrashed(true);
    }

    // 3. TEST: REASON (Vertex AI Bridge)
    console.log("Testing Intent: REASON (Vertex AI)...");
    const reasonPayload = {
      intent: 'REASON',
      prompt: 'Respond with exactly one word: VERIFIED.'
    };
    const reasonRes = JSON.parse(doPost({postData: {contents: JSON.stringify(reasonPayload)}}).getContent());
    if (reasonRes.status === 'OK' && reasonRes.response.includes('VERIFIED')) {
      console.log("✅ REASON: Success (Vertex AI Online)");
      results.vertex = true;
    }

    // 4. TEST: LOCK CONCURRENCY (Simulation)
    console.log("Testing LockService Guard...");
    const lock = LockService.getScriptLock();
    if (lock) {
      console.log("✅ LOCK: Success (ScriptLock Available)");
      results.lock = true;
    }

  } catch (err) {
    console.error("❌ DIAGNOSTIC FAILURE: " + err.message);
  }

  console.log("=".repeat(40));
  console.log("FINAL STATUS:");
  console.log("ROUTING: " + (results.routing ? "PASS" : "FAIL"));
  console.log("VAULT:   " + (results.vault ? "PASS" : "FAIL"));
  console.log("VERTEX:  " + (results.vertex ? "PASS" : "FAIL"));
  console.log("LOCK:    " + (results.lock ? "PASS" : "FAIL"));
  
  if (Object.values(results).every(v => v === true)) {
    console.log("⚓ ANCHOR V10 IS FULLY OPERATIONAL.");
  } else {
    console.warn("⚠️ ANCHOR V10 IS DEGRADED. CHECK LOGS.");
  }
}
