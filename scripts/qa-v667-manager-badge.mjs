import fs from 'node:fs';
import { chromium, webkit } from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const members=[{id:'mgr',name:'모임장QA',year:1988,gender:'남',age:'30',cls:'B',type:'member',role:'manager',state:'out',totalGames:0}];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:[],pendingGames:[],games:[],history:[],pairCounts:{}};
const clone=()=>JSON.parse(JSON.stringify(state));
function rgb(s){const m=String(s||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?m.slice(1,4).map(Number):null}
function lum([r,g,b]){const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)}
async function run(engine,name){const browser=await engine.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),profiles:{},groups:[],group:{groupId:'qa',name:'QA'}})}));
 try{await page.goto('http://127.0.0.1:4173/?qa=v667',{waitUntil:'networkidle'});await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});await page.evaluate(({state})=>{T='qa';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'모임장QA',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide')},{state:clone()});await page.waitForTimeout(350);
 const info=await page.evaluate(()=>{const b=document.querySelector('#members .roleBadge.role-manager');if(!b)return null;const s=getComputedStyle(b);return{text:(b.textContent||'').trim(),color:s.color,bg:s.backgroundColor,marker:s.getPropertyValue('--km-manager-text-v667').trim(),fontSize:s.fontSize,padding:s.padding,borderRadius:s.borderRadius}});if(!info)throw new Error(name+' manager badge missing');if(info.marker!=='1')throw new Error(name+' v667 marker missing');const c=rgb(info.color);if(!c)throw new Error(name+' manager text color unreadable '+info.color);if(c[0]>130||c[1]>100||c[2]>80)throw new Error(name+' manager text still too light '+info.color);if(info.text!=='모임장')throw new Error(name+' manager badge label changed');if(errors.length)throw new Error(name+' page errors '+errors.join(' | '));console.log(`PASS v${VERSION} ${name} manager badge dark text ${info.color}`)}finally{await browser.close()}}
await run(chromium,'chromium-mobile');
await run(webkit,'webkit-mobile');
