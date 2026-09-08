import fs from 'node:fs';
import { chromium, webkit } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.51')throw new Error('expected v6.51, got '+VERSION);

const suppress=async page=>{
  await page.addInitScript(()=>{try{
    localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));
    localStorage.setItem('kokmatch_install_guide631_seen','1');
    sessionStorage.setItem('kokmatch_install_later630','1');
  }catch{}});
};

async function assertLogin(page,label){
  await page.waitForFunction(v=>window.__kokmatchVersionLock===v,VERSION,{timeout:15000});
  const x=await page.evaluate(()=>({
    version:window.__kokmatchVersionLock,
    input:!!document.querySelector('#login input'),
    js:[...document.scripts].map(s=>new URL(s.src||location.href).pathname).filter(p=>/^\/app-v.*\.js$/.test(p)),
    css:[...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>new URL(l.href).pathname).filter(p=>/^\/app-v.*\.css$/.test(p))
  }));
  if(x.version!==VERSION||!x.input)throw new Error(label+' login shell failed '+JSON.stringify(x));
  if(JSON.stringify(x.js)!==JSON.stringify([`/app-v${VERSION}.js`])||JSON.stringify(x.css)!==JSON.stringify([`/app-v${VERSION}.css`]))throw new Error(label+' standalone assets failed '+JSON.stringify(x));
}

// Chromium: prove the installed PWA can relaunch its shell from the current-version cache.
{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();await suppress(page);
  const errors=[];page.on('pageerror',e=>errors.push(String(e?.message||e)));
  await page.goto('http://127.0.0.1:4173/?qa=v651-cache',{waitUntil:'networkidle'});
  await assertLogin(page,'chromium online');
  await page.evaluate(()=>navigator.serviceWorker?.ready);
  await page.reload({waitUntil:'networkidle'});
  await assertLogin(page,'chromium controlled');
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await assertLogin(page,'chromium offline');
  if(errors.length)throw new Error('chromium page errors: '+errors.join(' | '));
  await browser.close();
  console.log('PASS v6.51 current-version PWA cache + offline shell relaunch');
}

// WebKit mobile smoke: catches Safari/WebKit parse, layout bootstrap and touch-environment regressions.
{
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({
    viewport:{width:390,height:844},
    isMobile:true,
    hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
  });
  const page=await context.newPage();await suppress(page);
  const errors=[];page.on('pageerror',e=>errors.push(String(e?.message||e)));
  await page.goto('http://127.0.0.1:4173/?qa=v651-webkit',{waitUntil:'domcontentloaded'});
  await assertLogin(page,'webkit mobile');
  if(errors.length)throw new Error('webkit page errors: '+errors.join(' | '));
  await browser.close();
  console.log('PASS v6.51 WebKit mobile bootstrap');
}
