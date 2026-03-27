/**
 * 4_vault_map.gs — ANCHOR v11.3.0 | Dual-Registry Bridge
 * v11.3.0: Synchronized naming refactor (VAULT_MAP, ROOT).
 */
const Vault = {
  get: function(key) {
    const cache = CacheService.getScriptCache();
    let id = cache.get(key);
    if (id) return id;
    id = PropertiesService.getScriptProperties().getProperty(key);
    if (id) {
      cache.put(key, id, 21600);
      return id;
    }
    this.sync();
    return PropertiesService.getScriptProperties().getProperty(key);
  },
  sync: function() {
    const vaultMapId = PropertiesService.getScriptProperties().getProperty('VAULT_MAP') || '1VcpXX7vXca1SZLaRVxsL7TWP54tJit25C8DkXCX0SgQ';
    try {
      const ss = SpreadsheetApp.openById(vaultMapId);
      const props = {};
      ['SYSTEM_FILES', 'ROOT'].forEach(tabName => {
        const sheet = ss.getSheetByName(tabName);
        if (!sheet) return;
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          const k = data[i][0] ? data[i][0].toString().trim() : null;
          const v = data[i][1] ? data[i][1].toString().trim() : null;
          if (k && v) props[k] = v;
        }
      });
      PropertiesService.getScriptProperties().setProperties(props);
      console.log('[VAULT] Synchronized to ROOT registry.');
    } catch (e) {
      console.error('[VAULT] Sync failed: ' + e.message);
    }
  }
};
