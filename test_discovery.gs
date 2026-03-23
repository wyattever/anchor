/**
 * test_discovery.gs — ANCHOR v10.0.5 | Discovery Logic Validator
 * Runs a 3-stage lifecycle test: Create, Sync, Verify, Purge.
 */

function TEST_FOLDER_DISCOVERY_LIFECYCLE() {
  const TEST_FOLDER_NAME = "UNIT_TEST_FOLDER_" + Date.now();
  const EXPECTED_KEY = TEST_FOLDER_NAME + "_ID";
  const props = PropertiesService.getScriptProperties();
  
  console.log("🚀 STARTING DISCOVERY TEST...");

  try {
    // STAGE 1: Create Physical Folder
    console.log("1. Creating physical folder: " + TEST_FOLDER_NAME);
    const vault = DriveApp.getFolderById(VAULT_ID);
    const testFolder = vault.createFolder(TEST_FOLDER_NAME);
    const testId = testFolder.getId();

    // STAGE 2: Trigger Reconciliation
    console.log("2. Triggering RECONCILE_NETWORK()...");
    const result = RECONCILE_NETWORK();
    console.log("   Result: " + result);

    // STAGE 3: Verify Property Existence
    const storedId = props.getProperty(EXPECTED_KEY);
    if (storedId === testId) {
      console.log("✅ VERIFICATION SUCCESS: Property " + EXPECTED_KEY + " matches Folder ID.");
    } else {
      throw new Error("Property mismatch! Expected " + testId + " but got " + storedId);
    }

    // STAGE 4: Test Deletion Sync
    console.log("3. Testing Deletion... Trashing folder and re-syncing.");
    testFolder.setTrashed(true);
    const deleteResult = RECONCILE_NETWORK();
    console.log("   Delete Result: " + deleteResult);

    if (!props.getProperty(EXPECTED_KEY)) {
      console.log("✅ VERIFICATION SUCCESS: Ghost property pruned correctly.");
    } else {
      throw new Error("Ghost property still exists after folder deletion!");
    }

    console.log("⚓ DISCOVERY LOGIC IS 100% OPERATIONAL.");

  } catch (e) {
    console.error("❌ TEST FAILED: " + e.message);
  }
}
