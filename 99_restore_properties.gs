/**
 * ANCHOR CORE v9.0.0 - Script Properties Restoration
 * Mandatory Model Strings (March 2026 Update)
 */

function restoreAnchorProperties() {
  const props = {
    // --- CORE PROJECT IDS ---
    "GCP_PROJECT_ID": "acp-vertex-core",
    "GCP_PROJECT_NUMBER": "663707827708",
    "VERTEX_LOCATION": "us-central1",
    
    // --- MANDATORY MARCH 2026 MODELS ---
    "MODEL_ID": "gemini-2.5-flash-lite", // Default Runtime
    "MODEL_ID_DEFAULT": "gemini-2.5-flash-lite",
    "MODEL_ID_ADVANCED": "gemini-2.5-flash",
    "MODEL_ID_PRO": "gemini-2.5-pro",

    // --- REGISTRY & FOLDER IDS ---
    "VAULT_ID": "1e4yfG_TCrhB7wz3u5eAvSMJZ0Hf8Mg0Q",
    "REGISTRY_ID": "175th9uat0P52l9dnjAScpzdXfGl0JGoJ4GyGr",
    "NETWORK_REGISTRY_ID": "1cgrPu0CZsQJS4LWUwh92q8MsEfrXZ20",
    "PANTO_ID": "1QnrCSWMim4xPhUoXYzyAkXcYYu7y3vLt",
    "LEXICONA_ID": "1L6THn33tM57B95Mpbydwoj2OpQSieOoG",
    "SYNAPSE_ID": "1u9ajuwB76DqRLN5gXJ3cRv2yugKi99a-",
    "OTTER_ID": "1Rvs7lv4ZgvMlG7jSxZUQt24ER5t0ONnL",
    "FAITH_ID": "1H9Y5p5zf1yu2L4x1nBXb5vyCIK_yd1RN",

    // --- MODULE IDS ---
    "ACTIVE_PROJECTS_ID": "1UQjNxRKl3qh_Lt8TVrIbXYzchOTYHsiS",
    "ARCHIVE_ID": "15J53DuNmwm0dKaRDL-5dzK0d6CVmzeul",
    "BADGER_ID": "1tpOZRBM Lqvg2Ugxd8D8f-kSZ5M4EKyyf",
    "HAMBURGER_ID": "1p2l3mgW3JmmawEyY0e5sVkDKKrH_UoE",
    "NCADEMI_ID": "1qLR2XkkkdiQT19Zafb5R5saxidn7J2sA",
    "SCRIPTURES_ID": "1IkWMNE_lk30S0clreQ9RSdDXWbt_w2YP",
    "TEMPORAL_LAKE_ID": "1wcXfVobqyezbeKbPajRPlbX1VxuiMF8",

    // --- SECURITY & SYNC ---
    "HEAL_TOKEN": "geo008-heal-secret",
    "SYNC_TOKEN": "IxlxYZTN92Lla002IL5N8",
    "GEMINI_API_KEY": "AlzaSyD0CRONhIYlHvlg3Pr69pwX3dnQnbdc"
  };

  // Set the properties (overwrites existing, keeps unmentioned if false)
  PropertiesService.getScriptProperties().setProperties(props);
  
  console.log("⚓ ANCHOR PROPERTIES RESTORED SUCCESSFULLY.");
  console.log("⚓ CURRENT MODEL: " + PropertiesService.getScriptProperties().getProperty('MODEL_ID'));
}