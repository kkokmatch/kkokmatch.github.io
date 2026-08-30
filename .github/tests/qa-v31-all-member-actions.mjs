import {webkit,devices} from 'playwright';
const browser=await webkit.launch({headless:true});
const page=await browser.newPage({...devices['iPhone 13'],userAgent:devices['iPhone 13'].userAgent+' KAKAOTALK'});
page.setDefaultTimeout(12000);
const calls=[];
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api**',async r=>{const b=JSON.parse(r.request().postData()||'{}');calls.push(b);await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:{members:[{id:'m1',name:'박태영'},{id:'m2',name:'다른회원'}]}})})});
await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><section id="members"><div class="memberCard" data-member-id22="m1"><div class="memberBtns"><button class="btn ghost" data-v26direct="edit-m1">수정</button></div></div><div class="memberCard"><div class="memberBtns"><span class="memberBtnSlot65"><button class="btn enter" data-v26direct="wait-m2">입장</button></span><span class="memberBtnSlot65"><button class="btn danger" data-v26direct="out-m2">퇴장</button></span><span class="memberBtnSlot65"><button class="btn ghost" data-v26direct="edit-m2">수정</button></span></div></div></section><div id="modal"></div>`);
await page.evaluate(()=>{window.S={members:[{id:'m1',name:'박태영'},{id:'m2',name:'다른회원'}]};window.T='qa';window.currentGroupId='grp';window.normalizeClient=()=>{};window.renderAll=()=>{};window.__edited='';window.openMemberModal=m=>{window.__edited=m.id}});
await page.addScriptTag({url:'http://127.0.0.1:4173/app-v5.4-fix31.js?v=31.0'});
await page.waitForFunction(()=>window.__kokmatchIOSAllMemberActions==='31.0');
async function tap(sel){const b=page.locator(sel);await b.scrollIntoViewIfNeeded();const r=await b.boundingBox();if(!r)throw new Error('no box '+sel);await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await page.waitForTimeout(250)}
await tap('[data-v26direct="edit-m2"]');if(await page.evaluate(()=>window.__edited)!=='m2')throw new Error('other member edit failed');
await page.waitForTimeout(800);await tap('[data-v26direct="wait-m2"]');if(!calls.some(x=>x.memberId==='m2'&&x.mode==='waiting'))throw new Error('other member enter failed '+JSON.stringify(calls));
await page.waitForTimeout(800);await tap('[data-v26direct="out-m2"]');if(!calls.some(x=>x.memberId==='m2'&&x.mode==='out'))throw new Error('other member out failed '+JSON.stringify(calls));
console.log('PASS v31 other-member edit/enter/out exact ID');
await browser.close();