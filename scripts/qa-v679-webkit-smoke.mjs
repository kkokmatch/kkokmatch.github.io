import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webkit} from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({
 viewport:{width:390,height:844},isMobile:true,hasTouch:true,
 userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e?.stack||e)));
await page.goto('http://127.0.0.1:4173/?qa=v679-webkit',{waitUntil:'domcontentloaded'});
await page.waitForFunction(v=>window.__kokmatchVersionLock===v,VERSION,{timeout:15000});
await page.waitForSelector('.app',{state:'visible',timeout:15000});
await page.waitForSelector('#login',{state:'visible',timeout:15000});
assert((await page.locator('body').innerText()).trim().length>0,'WebKit rendered a blank body');
assert.equal(await page.locator('#bootFallback679').count(),0,'WebKit fallback did not clear after shell boot');
if(errors.length)throw new Error('WebKit page errors: '+errors.join(' | '));
await browser.close();
console.log('PASS v6.79 WebKit/iPhone-size cold boot renders login shell without blank screen');
