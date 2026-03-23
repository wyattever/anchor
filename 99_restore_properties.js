/**
 * ANCHOR CORE v10.0.0 - Script Properties Restoration
 * Mandatory Model Strings (March 2026 Update)
 */

function restoreAnchorProperties() {
 const props = {
   "GCP_PROJECT_ID": "acp-vertex-core",
   "GCP_PROJECT_NUMBER": "663707827708",
   "GCP_REGION": "us-central1",
   "MODEL_ID": "gemini-2.5-flash-lite",
   "VAULT_ID": "1PfiQ9BZ9pk2kiVJ8HUsEt4XenMy4ZkiE",
   "VAULT_MAP_SHEET_ID": "", 
   "HEAL_TOKEN": "geo008-heal-secret",
   "SYNC_TOKEN": "IxlxYZTN92Lla002IL5N8",
   "GEMINI_API_KEY": "AlzaSyD0CRONhIYlHvlg3Pr69pwX3dnQnbdc"
 };
 PropertiesService.getScriptProperties().setProperties(props);
 console.log("⚓ ANCHOR PROPERTIES RESTORED. Run bootstrapVaultMap() next.");
}