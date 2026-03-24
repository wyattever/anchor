# ANCHOR v11.0 — Project Context

## Stack
Google Apps Script (V8 runtime), Vertex AI (gemini-2.5-flash-lite default),
Google Drive API v3, Google Sheets API. No Node.js, no npm, no build step.
All files are .js but deployed as .gs to Apps Script.

## Repository
- Repo: https://github.com/wyattever/anchor
- Active branch: v11
- Local path: /Users/a00288946/anchor-v11
- Apps Script project: 1Tw5gs84xGBfjDs2T5HlTcLSEDj8TOtIw9pYx7XAI2p8AbLmqhxlHNZW4

## Architecture
doPost() in 0_core.js is the API gateway — all agent communication flows
through it via intents: INGEST, REASON, READ, LIST, PING.
Client JS (commands.js, scripts.js) lives in Google Drive folder GEO-PRI-001
and loads at page load via includeFromDrive_() — no redeploy needed to update UI.
VAULT_MAP is a Google Sheet registry mapping string keys to Drive folder/file IDs.
All folder lookups go through getFolderIdByName_() in 4_vault_map.js.

## File Roles
- 0_core.js — doPost gateway, Vertex AI via VertexAI advanced service
- web.js — doGet, includeFromDrive_, readFile(), listFiles(), listDirs(), createDir()
- 2_executor.js — handleRead_(), handleList_(), writeProjectLog(), ingestToVault()
- 4_vault_map.js — VAULT_MAP registry, registerFolder_() upserts only
- 1_memory.js — agent_memory.json blob storage in ANCHOR-VAULT
- 3_crawl.js — CRAWL_VAULT(), generateSystemPrompt()
- 99_restore_properties.js — bootstrap utility, manual run only
- tests.js — RUN_V11_COMPREHENSIVE_DIAGNOSTICS(), manual run only
- tools.js — one-time setup utilities, manual run only

## Code Standards
- SRD: Simple, Reliable, DRY
- Private functions use trailing underscore: handleRead_(), getFolderIdByName_()
- All Vertex AI calls go through callVertex_() in 0_core.js — never call UrlFetchApp directly for Vertex
- registerFolder_() is an upsert — never append duplicates
- Version format: major.minor must align across files, patch increments per file
- Bump patch version in file header on every meaningful edit before clasp push

## Versioning
- Current version: v11.0.x
- Version check: major.minor only (v11.0)
- Git branch: v11
- Deployment: clasp deploy --deploymentId (never clasp deploy alone — preserves access settings)

## Script Properties (v11 clean set)
GCP_PROJECT_ID, GCP_REGION, VAULT_ID, VAULT_MAP_SHEET_ID,
MODEL_ID, NETWORK_REG_ID, GEMINI_API_KEY (sensitive — never in source)

## Key Resource IDs
- ANCHOR-VAULT: 1PfiQ9BZ9pk2kiVJ8HUsEt4XenMy4ZkiE
- NETWORK_REG_ID: 175th9uat0P52l9dnjAScpzdXfGl0JGoj4GyGmYuaOZ0
- GEO-PRI-001: 1k6BYtrZSGx5zgQccpiW1NNXCnIXqNRqj
- GCP_PROJECT_ID: acp-vertex-core

## What NOT to do
- Never use clasp deploy without --deploymentId
- Never call SpreadsheetApp.openById() on a VAULT_MAP folder ID
- Never store credentials in source files
- Never use sed for multi-line or quote-heavy file edits — use cat instead
- Never push without running RUN_V11_COMPREHENSIVE_DIAGNOSTICS() first
