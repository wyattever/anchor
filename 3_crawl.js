/**
 * 3_crawl.gs — ANCHOR v11.0.0 | Vault Surveyor + System Prompt
 * Fixed: VAULT_MAP keys updated to match actual sheet entries.
 * Fixed: processReasoning() now calls processReasoning_() in 0_core.js.
 */

function CRAWL_VAULT() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    console.log('⚓ Starting Vault Crawl...');

    const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_ID');
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

function generateSystemPrompt() {
  const props  = PropertiesService.getScriptProperties().getProperties();
  const memory = getPhysicalMemory() || {};

  const networkRegistryId = getFolderIdByName_('01-NETWORK-REGISTRY') || 'UNREGISTERED';
  const activeProjectsId  = getFolderIdByName_('02-ACTIVE-PROJECTS')  || 'UNREGISTERED';
  const archiveId         = getFolderIdByName_('ARCHIVE')              || 'UNREGISTERED';

  return `You are PANTO, the Primary Agent for Network Task Orchestration.

### SYSTEM CONTEXT
- GCP Project: ${props.GCP_PROJECT_ID}
- Primary Vault (ANCHOR-VAULT): ${props.VAULT_ID}
- Status: ${memory.status || 'ACTIVE'}
- Version: ${memory.anchor_version || 'v11.0.0'}

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
