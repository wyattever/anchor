/**
 * ANCHOR CORE v9.4.1 - Context-Aware Reasoning
 */

function generateSystemPrompt() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const memory = getPhysicalMemory() || {};
  
  return `You are PANTO, the Primary Agent for Network Task Orchestration.
  
### SYSTEM CONTEXT
- GCP Project: ${props.GCP_PROJECT_ID}
- Vault: ${props.VAULT_ID}
- Status: ${memory.status || "ACTIVE"}
- Last Sync: ${memory.last_sync}

### REGISTRY ACCESS
- Network Registry: ${props.NETWORK_REGISTRY_ID}
- Active Projects: ${props.ACTIVE_PROJECTS_ID}
- Temporal Lake: ${props.TEMPORAL_LAKE_ID}

Operate with technical precision. You have access to tools via the ANCHOR bridge.
Follow the ANCHOR Protocol without exception.`;
}

function processReasoning(userPrompt) {
  const systemContext = generateSystemPrompt();
  
  const refinedPayload = {
    prompt: userPrompt,
    context: systemContext,
    model: "gemini-2.5-flash-lite"
  };
  
  console.log("⚓ BRAIN: Context injected. Dispatching...");
  return routeRequest(refinedPayload);
}
