/**
 * 3_crawl.gs — ANCHOR v11.3.0 | Vault Surveyor + System Prompt
 * v11.3.0: Synchronized naming refactor (ANCHOR_VAULT, 01-NETWORK, 02-PROJECTS).
 */

function CRAWL_VAULT() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    console.log('⚓ Starting Vault Crawl...');

    // Pull from Script Properties via VAULT_MAP
    const vaultId = PropertiesService.getScriptProperties().getProperty('ANCHOR_VAULT');
    const vault   = DriveApp.getFolderById(vaultId);
    const files   = vault.getFiles();
    const manifest = [];

    while (files.hasNext()) {
      const file = files.next();
      manifest.push({
        id:      file.getId(),
        name:    file.getName(),
        created: file.getDateCreated().toISOString(),
        size:    file.getSize()
      });
    }

    console.log('✅ Crawl Complete. Indexed ' + manifest.length + ' files.');
    return manifest.length + ' files indexed in Vault.';

  } catch (e) {
    console.error('❌ Crawl Error: ' + e.message);
    return 'Crawl Failed: ' + e.message;
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

/**
 * Generates the live system instructions for the AI.
 * Uses Vault.get() to ensure IDs are accurate.
 */
function generateSystemPrompt() {
  const props  = PropertiesService.getScriptProperties().getProperties();
  const memory = getPhysicalMemory() || {};

  // Fully migrated to synchronized Vault keys
  const networkRegistryId = Vault.get('01-NETWORK') || 'UNREGISTERED';
  const activeProjectsId  = Vault.get('02-PROJECTS') || 'UNREGISTERED';

  return `You are PANTO, the Primary Agent for Network Task Orchestration.

### SYSTEM CONTEXT
- GCP Project: ${props.GCP_PROJECT_ID}
- Vault Registry: ${props.VAULT_MAP}
- Status: ${memory.status || 'ACTIVE'}
- Version: ${memory.anchor_version || 'v11.3.0'}

### VAULT REGISTRIES
- Network Registry: ${networkRegistryId}
- Active Projects:  ${activeProjectsId}

All ingestion tasks must be directed to the ANCHOR-VAULT sub-folders.
Operate with technical precision and follow the ANCHOR Protocol.`;
}

function processReasoning(userPrompt) {
  return processReasoning_({ prompt: userPrompt });
}
