/**
 * 99_restore_properties.gs — ANCHOR v10.1.7
 * Restores all ScriptProperties to known good state.
 * Run manually after a fresh clone or property wipe.
 */
function restoreAnchorProperties() {
  const props = {
    // ── CORE PROJECT ───────────────────────────────────────────────────────
    'GCP_PROJECT_ID':     'acp-vertex-core',
    'GCP_PROJECT_NUMBER': '663707827708',
    'GCP_REGION':         'us-central1',

    // ── MODELS ─────────────────────────────────────────────────────────────
    'MODEL_ID':           'gemini-2.5-flash-lite',
    'MODEL_ID_DEFAULT':   'gemini-2.5-flash-lite',
    'MODEL_ID_ADVANCED':  'gemini-2.5-flash',
    'MODEL_ID_PRO':       'gemini-2.5-pro',

    // ── ANCHOR BOOTSTRAP ───────────────────────────────────────────────────
    'VAULT_ID':           '1PfiQ9BZ9pk2kiVJ8HUsEt4XenMy4ZkiE',
    'VAULT_MAP_SHEET_ID': '',   // populate after bootstrapVaultMap() runs

    // ── NETWORK REGISTRY ───────────────────────────────────────────────────
    'NETWORK_REG_ID':     '175th9uat0P52l9dnjAScpzdXfGl0JGoj4GyGmYuaOZ0',

    // ── SECURITY ───────────────────────────────────────────────────────────
    'HEAL_TOKEN':         'geo008-heal-secret',
    'SYNC_TOKEN':         'IxlxYZTN92Lla002IL5N8',
    'GEMINI_API_KEY':     'AlzaSyD0CRONhIYlHvlg3Pr69pwX3dnQnbdc'
  };

  PropertiesService.getScriptProperties().setProperties(props);
  console.log('⚓ ANCHOR PROPERTIES RESTORED.');
  console.log('⚓ Run bootstrapVaultMap() if VAULT_MAP_SHEET_ID is empty.');
  console.log('⚓ Run setupRegistry() to seed the REGISTRY sheet.');
}
