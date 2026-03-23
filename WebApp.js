/**
* WebApp.gs — ANCHOR v10.0.5 | UI Controller
*/

const UI_VERSION = 'v10.0.5';

function doGet() {
 return HtmlService.createTemplateFromFile('Index')
   .evaluate()
   .setTitle('ANCHOR | ' + UI_VERSION)
   .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
 return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getAgentConfig() {
 const agents = [
   { name: 'Panto', key: 'PANTO', icon: 'neurology' },
   { name: 'Lexicona', key: 'LEXICONA', icon: 'manage_accounts' },
   { name: 'Synapse', key: 'SYNAPSE', icon: 'code' }
 ];
 return agents.map(a => ({
   name: a.name,
   id: getFolderIdByName_(a.key) || 'MISSING_ID',
   icon: a.icon
 }));
}

function processMessage(data) {
 const intent = (data.format === 'chat') ? 'REASON' : 'INGEST';
 const payload = {
   intent: intent,
   message: data.message,
   prompt: "[" + data.agent + " | " + data.id + "] " + data.message,
   name: data.topic || "ui_ingest_" + Date.now(),
   content: { agent: data.agent, id: data.id, format: data.format, text: data.message, timestamp: new Date().toISOString() }
 };
 const response = doPost({postData: { contents: JSON.stringify(payload) }});
 return JSON.parse(response.getContent());
}