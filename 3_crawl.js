/**
 * 3_crawl.gs — ANCHOR v11.1.3 | Vault Surveyor + System Prompt
 * v11.1.3: Fully migrated to Vault.get() registry.
 */

function CRAWL_VAULT() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    console.log('⚓ Starting Vault Crawl...');

    // Pull from Script Properties via VAULT_MAP_SHEET
    const vaultId = PropertiesService.getScriptProperties().getProperty('ANCHOR_VAULT_ID');
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

  // MIGRATED: Legacy folder name lookups replaced with Vault keys
  const networkRegistryId = Vault.get('NETWORK_REGISTRY') || 'UNREGISTERED';
  const activeProjectsId  = Vault.get('ACTIVE_PROJECTS')  || 'UNREGISTERED';
  const archiveId         = Vault.get('ARCHIVE')           || 'UNREGISTERED';

  return `You are PANTO, the Primary Agent for Network Task Orchestration.

### SYSTEM CONTEXT
- GCP Project: ${props.GCP_PROJECT_ID}
- Vault Registry: ${props.VAULT_MAP_SHEET}
- Status: ${memory.status || 'ACTIVE'}
- Version: ${memory.anchor_version || 'v11.1.3'}

### VAULT REGISTRIES
- Network Registry: ${networkRegistryId}
- Active Projects:  ${activeProjectsId}
- Archives:         ${archiveId}

All ingestion tasks must be directed to the ANCHOR-VAULT sub-folders.
Operate with technical precision and follow the ANCHOR Protocol.`;
}

function processReasoning(userPrompt) {
  return processReasoning_({ prompt: userPrompt });
}
