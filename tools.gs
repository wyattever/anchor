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
