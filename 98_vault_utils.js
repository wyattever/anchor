/**
 * Utility: Map Local Network to VAULT_MAP_SHEET_ID
 */
function util_FullSyncToVault() {
  const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_MAP_SHEET_ID') || '1VcpXX7vXca1SZLaRVxsL7TWP54tJit25C8DkXCX0SgQ';
  const foldersToMap = [
    '01-NETWORK-REGISTRY',
    '02-ACTIVE-PROJECTS',
    '03-ARCHIVE',
    '04-PAN-ANA-001',
    '05-LOGS'
  ];
  
  const sheet = SpreadsheetApp.openById(vaultId).getSheets()[0];
  const rows = [];
  
  foldersToMap.forEach(name => {
    const folder = DriveApp.getFoldersByName(name);
    if (folder.hasNext()) {
      const f = folder.next();
      // Format: ACTIVE_PROJECTS, NETWORK_REGISTRY, etc.
      const key = name.replace(/[0-9]{2}-/g, '').replace(/-/g, '_');
      rows.push([key, f.getId()]);
    }
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    console.log('[MIGRATION] Wrote ' + rows.length + ' IDs to Sheet.');
    Vault.sync(); // Immediately update Script Properties
  }
}
