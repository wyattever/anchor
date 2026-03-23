/**
 * ANCHOR CORE v9.8.0 - Vault-Centric Reasoning
 */

function generateSystemPrompt() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const memory = getPhysicalMemory() || {};
  
  return `You are PANTO, the Primary Agent for Network Task Orchestration.
  
### SYSTEM CONTEXT
- GCP Project: ${props.GCP_PROJECT_ID}
- Primary Vault (ANCHOR-VAULT): ${props.VAULT_ID}
- Status: ${memory.status || "ACTIVE"}
- Version: ${memory.anchor_version}

### VAULT REGISTRIES
- Network Registry: ${props.NETWORK_REGISTRY_ID}
- Active Projects: ${props.ACTIVE_PROJECTS_ID}
- Archives: ${props.ARCHIVE_ID}

All ingestion tasks must be directed to the ANCHOR-VAULT sub-folders. 
Operate with technical precision and follow the ANCHOR Protocol.`;
}

function processReasoning(userPrompt) {
  const systemContext = generateSystemPrompt();
  return routeRequest({
    prompt: userPrompt,
    context: systemContext
  });
}
