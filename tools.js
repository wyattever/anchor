/**
 * tools.gs — ANCHOR v10.2.0 | One-Time Setup & Utility Functions
 * Run manually from Apps Script editor only. Never called by doGet/doPost.
 */

// =============================================================================
// REGISTRY SETUP
// =============================================================================

function setupRegistry() {
  const ss       = SpreadsheetApp.openById(NETWORK_REG_ID);
  const existing = ss.getSheetByName('REGISTRY');
  if (existing) ss.deleteSheet(existing);
  const sheet    = ss.insertSheet('REGISTRY', 0);
  sheet.appendRow(['NAME', 'AGENT_ID', 'FOLDER_ID', 'STATUS']);
  sheet.setFrozenRows(1);
  const agents = [
    ['PRIMARY',  'GEO-PRI-001', '1k6BYtrZSGx5zgQccpiW1NNXCnIXqNRqj', 'ACTIVE'],
    ['Panto',    'PAN-ANA-001', '1QnrCSWMim4xPhUoXYzyAkXcYYu7y3vLt', 'ACTIVE'],
    ['Lexicona', 'LEX-RES-777', '1L6THn33tM57B95Mpbydwoj2OpQSie0oG', 'ACTIVE'],
    ['Synapse',  'SYN-ARC-555', '1u9ajuwB76DqRLN5gXJ3cRv2yugKi99a-', 'ACTIVE']
  ];
  agents.forEach(row => sheet.appendRow(row));
  console.log('[REGISTRY] Setup complete. ' + agents.length + ' agents registered.');
}

// =============================================================================
// VAULT MAP REGISTRATION UTILITIES
// =============================================================================

function registerClientJsFiles() {
  registerFolder_('JS-VAULT-MAP-CLIENT', '1xbHd5yKoP3wCAbM3mbOXyrkRtysDL6LJ');
  registerFolder_('JS-MEMORY-CLIENT',    '1O2tVV5IyF3KKrvh1fgFiFo6iRogSnTtw');
  console.log('Client JS files registered.');
}

function registerCoreJsFiles() {
  registerFolder_('JS-SCRIPTS',  '1WW1YrA_XxjCAong24PFV9nJGtYRw3-W9');
  registerFolder_('JS-COMMANDS', '1SBs242jHt9HI9ACEoKssboLGZO-_8wDy');
  console.log('Core JS files registered.');
}

// =============================================================================
// DRIVE FILE DISCOVERY
// =============================================================================

function FIND_GEO_PRI_001_FILES_DATED() {
  const folderId = '1k6BYtrZSGx5zgQccpiW1NNXCnIXqNRqj';
  const folder   = DriveApp.getFolderById(folderId);
  const files    = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    console.log(f.getName() + ' | ' + f.getLastUpdated() + ' | ' + f.getId());
  }
}
