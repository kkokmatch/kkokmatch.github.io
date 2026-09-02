import fs from 'node:fs';
import { chromium } from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];
page.on('pageerror',e=>errors.push(String(e?.stack||e)));
try{
  await page.goto('http://127.0.0.1:4173/?qa=boot',{waitUntil:'load'});
  await page.waitForTimeout(1500);
  const state=await page.evaluate(()=>({version:window.__kokmatchVersionLock,standalone:window.__kokmatchStandalone,renderAll:typeof window.renderAll,body:(document.body?.textContent||'').slice(0,200)}));
  console.log('BOOT STATE',JSON.stringify(state));
  if(errors.length){console.error('PAGE ERRORS',errors.join('\n---\n'));throw new Error('runtime page error');}
  if(state.version!==VERSION||state.renderAll!=='function')throw new Error('runtime did not boot: '+JSON.stringify(state));
  console.log(`PASS boot diagnostic v${VERSION}`);
}finally{await browser.close();}
