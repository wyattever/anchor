/**
 * 99_restore_properties.gs — ANCHOR v10.1.7
 * Restores non-sensitive ScriptProperties to known good state.
 * Run manually after a fresh clone or property wipe.
 *
 * IMPORTANT: Sensitive values (GEMINI_API_KEY, HEAL_TOKEN, SYNC_TOKEN)
 * must be set manually in Apps Script UI:
 *   Project Settings → Script Properties → Add property
 * Never store credentials in source files.
 */
function restoreAnchorProperties() {
  const props = {
    'GCP_PROJECT_ID':     'acp-vertex-core',
    'GCP_PROJECT_NUMBER': '663707827708',
    'GCP_REGION':         'us-central1',

    'MODEL_ID':           'gemini-2.5-flash-lite',
    'MODEL_ID_DEFAULT':   'gemini-2.5-flash-lite',
    'MODEL_ID_ADVANCED':  'gemini-2.5-flash',
    'MODEL_ID_PRO':       'gemini-2.5-pro',

    'VAULT_ID':           '1PfiQ9BZ9pk2kiVJ8HUsEt4XenMy4ZkiE',
    'VAULT_MAP_SHEET_ID': '',

    'NETWORK_REG_ID':     '175th9uat0P52l9dnjAScpzdXfGl0JGoj4GyGmYuaOZ0'
  };

  PropertiesService.getScriptProperties().setProperties(props);
  console.log('⚓ ANCHOR PROPERTIES RESTORED.');
  console.log('⚓ Set GEMINI_API_KEY, HEAL_TOKEN, SYNC_TOKEN manually in Script Properties UI.');
  console.log('⚓ Run bootstrapVaultMap() if VAULT_MAP_SHEET_ID is empty.');
  console.log('⚓ Run setupRegistry() to seed the REGISTRY sheet.');
}
