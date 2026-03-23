/**
 * ANCHOR CORE v9.0.0 - Global Tools & Diagnostics
 */

function healthCheck() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const report = {
    timestamp: new Date().toISOString(),
    status: "ACTIVE",
    gcp_project: props["GCP_PROJECT_ID"],
    vault_id: props["VAULT_ID"] ? "CONNECTED" : "MISSING",
    vertex_location: props["VERTEX_LOCATION"]
  };
  console.log("⚓ HEALTH CHECK REPORT:", JSON.stringify(report, null, 2));
  return report;
}

/**
 * Wrapper for testing routing via clasp run
 */
function testRoute(prompt, context) {
  const mockPayload = {
    prompt: prompt || "Status Check",
    context: context || "Manual Test"
  };
  const result = routeRequest(mockPayload);
  console.log("⚓ ROUTE RESULT:", JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test the Reasoning Engine + Vertex AI Bridge
 */
function testBrain() {
  const testPrompt = "Who are you and what is your current mission?";
  console.log("⚓ INITIATING BRAIN TEST...");
  const result = processReasoning(testPrompt);
  console.log("⚓ BRAIN RESPONSE:", JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test the Registry Crawler & Drive access
 */
function testCrawl() {
  console.log("⚓ INITIATING REGISTRY CRAWL...");
  const report = reconcileRegistry();
  
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
  if (vaultId) {
    const vaultMap = getFolderMap(vaultId);
    console.log("⚓ VAULT CONTENTS:", JSON.stringify(vaultMap, null, 2));
  }
  
  return report;
}

/**
 * Test Physical Memory Read/Write
 */
function testMemory() {
  console.log("⚓ TESTING PHYSICAL MEMORY BRIDGE...");
  const timestamp = new Date().toLocaleTimeString();
  const update = { last_test: timestamp, status: "VERIFIED" };
  
  const result = updatePhysicalMemory(update);
  console.log("✅ MEMORY UPDATED. CURRENT STATE:", JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test the Search Engine
 */
function testSearch() {
  console.log("⚓ TESTING SEARCH ENGINE...");
  const result = findFileInRegistry('VAULT_ID', 'agent_memory.json');
  console.log("🔍 SEARCH RESULT:", JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test the Executor's ability to write files
 */
function testExecution() {
  console.log("⚓ TESTING ACTION ENGINE...");
  const projectName = "ANCHOR_DIAGNOSTIC_v9";
  const content = "System execution test at " + new Date().toLocaleString();
  
  const result = writeProjectLog(projectName, content);
  console.log("📂 EXECUTION RESULT:", JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test Brain's awareness of the new Vault architecture
 */
function testVaultAwareness() {
  console.log("⚓ TESTING VAULT-CENTRIC REASONING...");
  const testPrompt = "Where should you store long-term ingestion data now?";
  
  const result = processReasoning(testPrompt);
  console.log("🧠 BRAIN RESPONSE:", result.response);
  
  if (result.response.includes("ANCHOR-VAULT") && !result.response.includes("Temporal Lake")) {
    console.log("✅ VALIDATION SUCCESS: Brain is Vault-aware.");
  } else {
    console.warn("⚠️ VALIDATION WARNING: Brain may still be referencing legacy architecture.");
  }
  return result;
}

/**
 * Test the Vault Ingestion logic
 */
function testIngestion() {
  console.log("⚓ TESTING VAULT INGESTION...");
  const sampleData = "System Validation: ANCHOR v9 Core Infrastructure is 100% operational.";
  const result = ingestToVault(sampleData, "SYSTEM_DIAGNOSTIC");
  console.log("📥 INGESTION RESULT:", JSON.stringify(result, null, 2));
  return result;
}
