/**
 * 4_vault_map.gs — ANCHOR v11.1.3 | Resource Registry
 * Centralized ID resolution using VAULT_MAP_SHEET_ID.
 * v11.1.3: Version bump to match global architecture update.
 */

const Vault = {
  get: function(key) {
    const cache = CacheService.getScriptCache();
    let id = cache.get(key);
    if (id) return id;
    
    id = PropertiesService.getScriptProperties().getProperty(key);
    if (id) {
      cache.put(key, id, 21600); // 6 hour cache
      return id;
    }
    
    this.sync();
    return PropertiesService.getScriptProperties().getProperty(key);
  },

  sync: function() {
    const vaultId = PropertiesService.getScriptProperties().getProperty('VAULT_MAP_SHEET_ID') || '1VcpXX7vXca1SZLaRVxsL7TWP54tJit25C8DkXCX0SgQ';
    try {
      const ss = SpreadsheetApp.openById(vaultId);
      const data = ss.getSheets()[0].getDataRange().getValues();
      const props = {};
      
      // Map Col A (Key) to Col B (Value), skipping header
      for (let i = 1; i < data.length; i++) {
        const k = data[i][0] ? data[i][0].toString().trim() : null;
        const v = data[i][1] ? data[i][1].toString().trim() : null;
        if (k && v) props[k] = v;
      }
      
      PropertiesService.getScriptProperties().setProperties(props);
      console.log('[VAULT] Registry synchronized from: ' + vaultId);
    } catch (e) {
      console.error('[VAULT] Sync failed: ' + e.message);
    }
  }
};
