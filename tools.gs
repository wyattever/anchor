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
