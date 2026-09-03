import fs from 'node:fs';
import { chromium } from 'playwright';

const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
if(manifest.display!=='standalone'||manifest.scope!=='/'||!Array.isArray(manifest.icons)||manifest.icons.length<3)throw new Error('PWA manifest incomplete');
const js=fs.readFileSync('app-v6.29.js','utf8');
if(js.includes("register('/sw.js')"))throw new Error('legacy service worker registration remains');
for(const s of ['window.__kokmatchPwa629','Notification.permission','beforeinstallprompt','enableGamePush48'])if(!js.includes(s))throw new Error('missing PWA flow marker: '+s);
const swText=fs.readFileSync('kokmatch-sw.js','utf8');
for(const s of ["addEventListener('push'","addEventListener('fetch'","cache:'no-store'","KOKMATCH_SW_VERSION='6.29'"])if(!swText.includes(s))throw new Error('service worker check failed: '+s);
for(const f of ['icons/kokmatch-180.png','icons/kokmatch-192.png','icons/kokmatch-512.png','icons/kokmatch-maskable-512.png'])if(!fs.existsSync(f)||fs.statSync(f).size<100)throw new Error('missing PWA icon: '+f);

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  const manifestHref=await page.locator('link[rel="manifest"]').getAttribute('href');
  if(!manifestHref?.includes('manifest.webmanifest'))throw new Error('manifest link missing');
  const sw=await page.evaluate(async()=>{
    if(!('serviceWorker' in navigator))return null;
    const reg=await Promise.race([navigator.serviceWorker.ready,new Promise(r=>setTimeout(()=>r(null),8000))]);
    return reg?.active?.scriptURL||null;
  });
  if(!sw||!sw.includes('kokmatch-sw.js'))throw new Error('canonical service worker not active: '+sw);
  if(errors.length)throw new Error('page errors: '+errors.join(' | '));
  console.log('PASS v6.29 PWA browser smoke QA');
} finally {
  await browser.close();
}
