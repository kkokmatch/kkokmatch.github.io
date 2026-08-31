import fs from 'node:fs';
const file='app-v6.0.js';
let src=fs.readFileSync(file,'utf8');
if(!src.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');
const needle='auto-v6';
const idx=src.indexOf(needle);
if(idx<0){
  console.log('No legacy auto-v6 updater section found.');
  process.exit(0);
}
const start=src.lastIndexOf('/* migrated into v6.0:',idx);
if(start<0)throw new Error('auto-v6 exists outside a migrated section');
let end=src.indexOf('/* migrated into v6.0:',idx+needle.length);
if(end<0){end=src.lastIndexOf("\nwindow.__kokmatchStandalone='6.0';");}
if(end<=start)throw new Error('Could not bound legacy auto updater section');
const section=src.slice(start,end);
if(!section.includes('kokmatch-updater')||!section.includes('auto-v6'))throw new Error('Unexpected auto-v6 section');
const marker=(section.match(/^\/\* migrated into v6\.0: ([^*]+) \*\//)||[])[1]||'unknown';
console.log('Removing legacy automatic updater section:',marker);
src=src.slice(0,start)+src.slice(end);
if(src.includes('auto-v6'))throw new Error('Legacy auto-v6 navigation still remains');
fs.writeFileSync(file,src);
