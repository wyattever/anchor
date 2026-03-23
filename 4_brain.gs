/**
 * ANCHOR CORE v9.0.0 - Reasoning Engine
 * Derived from v8 source: 8_brain
 */

function generateSystemPrompt() {
  const props = PropertiesService.getScriptProperties().getProperties();
  return `You are PANTO, the Primary Agent for Network Task Orchestration.
  Your current GCP Project is ${props.GCP_PROJECT_ID}.
  Your Vault ID is ${props.VAULT_ID}.
  Operate with technical precision and follow the ANCHOR Protocol.`;
}

function processReasoning(userPrompt) {
  const systemContext = generateSystemPrompt();
  const refinedPrompt = `### SYSTEM INSTRUCTION\n${systemContext}\n\n### USER INPUT\n${userPrompt}`;
  
  // Dispatch to the core bridge
  return routeRequest({
    prompt: refinedPrompt,
    context: "ANCHOR_REASONING_v9"
  });
}
