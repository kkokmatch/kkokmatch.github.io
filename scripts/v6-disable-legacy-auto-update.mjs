import fs from 'node:fs';

const file='app-v6.0.js';
let src=fs.readFileSync(file,'utf8');
if(!src.includes("window.__kokmatchStandalone='6.0'")) throw new Error('Not a v6 standalone runtime');

const disabledMarker='/* V6_DISABLE_LEGACY_AUTO_UPDATE */';
const blockRe=/\/\*\s*---\s*migrated into v6\.0:\s*([^*]+?)\s*---\s*\*\/([\s\S]*?)(?=\/\*\s*---\s*migrated into v6\.0:|\/\*\s*=== Kokmatch v6\.0 interaction core|$)/g;
let removed=[];

src=src.replace(blockRe,(whole,name,body)=>{
  const n=String(name||'').trim();
  const legacyAuto=
    body.includes('auto-v6') ||
    body.includes('/kokmatch-updater?api=version') ||
    n==='app-v75.js' ||
    body.includes('refreshTo75') ||
    body.includes('targetReady75') ||
    (body.includes('latest-version.json') && body.includes('/refresh/v'));
  if(!legacyAuto) return whole;
  removed.push(n);
  return `${disabledMarker}\n/* Disabled legacy auto-update section: ${n} */\n`;
});

// Some older generated runtimes used a migrated marker without the decorative dashes.
const plainBlockRe=/\/\*\s*migrated into v6\.0:\s*([^*]+?)\s*\*\/([\s\S]*?)(?=\/\*\s*migrated into v6\.0:|\/\*\s*---\s*migrated into v6\.0:|\/\*\s*=== Kokmatch v6\.0 interaction core|$)/g;
src=src.replace(plainBlockRe,(whole,name,body)=>{
  const n=String(name||'').trim();
  const legacyAuto=
    body.includes('auto-v6') ||
    body.includes('/kokmatch-updater?api=version') ||
    n==='app-v75.js' ||
    body.includes('refreshTo75') ||
    body.includes('targetReady75') ||
    (body.includes('latest-version.json') && body.includes('/refresh/v'));
  if(!legacyAuto) return whole;
  removed.push(n);
  return `${disabledMarker}\n/* Disabled legacy auto-update section: ${n} */\n`;
});

// Never allow a migrated updater to send the standalone runtime back into /refresh/vXX.
if(src.includes('auto-v6')) throw new Error('Legacy auto-v6 navigation still remains');
if(src.includes('/kokmatch-updater?api=version')) throw new Error('Legacy updater API call still remains');
if(src.includes('refreshTo75')) throw new Error('Legacy refreshTo75 still remains');
if(src.includes('targetReady75')) throw new Error('Legacy targetReady75 still remains');
if(/location\.(?:replace|assign)\s*\([^\n;]*\/refresh\/v/.test(src)) throw new Error('Legacy /refresh/v navigation still remains');

console.log(removed.length ? `Disabled legacy automatic updater blocks: ${[...new Set(removed)].join(', ')}` : 'No legacy automatic updater blocks remain.');
fs.writeFileSync(file,src);
