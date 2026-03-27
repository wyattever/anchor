/**
 * 99_restore_properties.gs — ANCHOR v11.3.0
 * Restores non-sensitive ScriptProperties to known good state.
 * v11.3.0: Full synchronized naming refactor.
 *
 * IMPORTANT: Sensitive values (GEMINI_API_KEY, HEAL_TOKEN, SYNC_TOKEN)
 * must be set manually in Apps Script UI.
 */
function restoreAnchorProperties() {
  const props = {
    // GCP Infrastructure
    'GCP_PROJECT_ID':     'acp-vertex-core',
    'GCP_PROJECT_NUMBER': '663707827708',
    'GCP_REGION':         'us-central1',

    // Model Configuration
    'MODEL_ID':           'gemini-2.5-flash-lite',

    // Core Vault IDs (Synchronized Names)
    'ANCHOR_VAULT':       '1PfiQ9BZ9pk2kiVJ8HUsEt4XenMy4ZkiE',
    'VAULT_MAP':          '1VcpXX7vXca1SZLaRVxsL7TWP54tJit25C8DkXCX0SgQ',
    'NETWORK-MESSAGING-LOGS': '175th9uat0P52l9dnjAScpzdXfGl0JGoj4GyGmYuaOZ0',

    // Reference Keys (Synchronized for ROOT/SYSTEM_FILES)
    '0-0-PRIMARY':        '1k6BYtrZSGx5zgQccpiW1NNXCnIXqNRqj',
    '0-1-PANTO':          '1QnrCSWMim4xPhUoXYzyAkXcYYu7y3vLt',
    '0-2-LEXICONA':       '1L6THn33tM57B95Mpbydwoj2OpQSie0oG',
    '0-3-SYNAPSE':        '1u9ajuwB76DqRLN5gXJ3cRv2yugKi99a-',
    '01-NETWORK':         '1cgrPu0CZsQJS4LWUwh92q8MsEfrXZ20t',
    '02-PROJECTS':        '1UQjNxRKl3qh_Lt8TVrIbXYzchOTYHsiS',
    '03-WEBAIM':          '1gZvR4lWI_yRZL5m1XPngNLNxE80cT_zI',
    '04-NCADEMI':         '1qLR2XxkkdiQT19Zafb5R5saxidn7J2sA',

    'JS-CONFIG-SYS':      '15RToT-UeNpFqBOylKHI0LiQesaztUKE_',
    'JS-SCRIPTS-SYS':     '1WW1YrA_XxjCAong24PFV9nJGtYRw3-W9',
    'JS-COMMANDS-SYS':    '1SBs242jHt9HI9ACEoKssboLGZO-_8wDy',
    'JS-UI-THEME-SYS':    '1T-XNLrCFsuHN0BUvKOBjFhuleqN7j-7t',
    'JS-VAULT-MAP-CLIENT-SYS': '1xbHd5yKoP3wCAbM3mbOXyrkRtysDL6LJ',
    'JS-MEMORY-CLIENT-SYS': '1O2tVV5IyF3KKrvh1fgFiFo6iRogSnTtw',
    'AGENT-MEMORY-SYS':   '1k6BYtrZSGx5zgQccpiW1NNXCnIXqNRqj'
  };

  PropertiesService.getScriptProperties().setProperties(props);
  console.log('⚓ ANCHOR PROPERTIES RESTORED (v11.3.0 Synchronized).');
  console.log('⚓ Run Vault.sync() to refresh ROOT registry.');
}
