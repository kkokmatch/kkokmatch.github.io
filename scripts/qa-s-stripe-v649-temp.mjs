import fs from 'node:fs';
import { chromium } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.49')throw new Error('expected v6.49, got '+VERSION);

const members=[
 {id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'out',joinedAt:null,totalGames:0},
 {id:'s1',name:'에스회원',year:1990,gender:'남',age:'30',cls:'S',type:'member',role:'member',state:'waiting',joinedAt:Date.now()-120000,totalGames:0},
 {id:'a1',name:'에이회원',year:1990,gender:'남',age:'30',cls:'A',type:'member',role:'member',state:'waiting',joinedAt:Date.now()-120000,totalGames:0}
];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:['s1','a1'],pendingGames:[],games:[],history:[],pairCounts:{}};
const copy=()=>JSON.parse(JSON.stringify(state));

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');const kill=()=>document.getElementById('pwaPrompt629')?.remove();new MutationObserver(kill).observe(document,{childList:true,subtree:true});addEventListener('DOMContentLoaded',kill)}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),profiles:{},groups:[]})}));

try{
 await page.goto('http://127.0.0.1:4173/?qa=sstripe649',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function',VERSION,{timeout:15000});
 await page.evaluate(({state})=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide');},{state:copy()});
 await page.waitForTimeout(300);
 const memberCheck=await page.evaluate(()=>{
   const s=document.querySelector('#members .memberCard[data-grade-v6="S"]');
   const a=document.querySelector('#members .memberCard[data-grade-v6="A"]');
   if(!s||!a)return null;
   const ss=getComputedStyle(s),as=getComputedStyle(a),ps=getComputedStyle(s,'::before');
   const sr=s.getBoundingClientRect(),ar=a.getBoundingClientRect();
   return {sBorder:ss.borderLeftWidth,sStyle:ss.borderLeftStyle,aBorder:as.borderLeftWidth,aStyle:as.borderLeftStyle,sRadius:ss.borderRadius,aRadius:as.borderRadius,sBg:ss.backgroundImage,pseudoWidth:ps.width,pseudoBg:ps.backgroundImage,pseudoLeft:ps.left,sW:sr.width,aW:ar.width};
 });
 if(!memberCheck)throw new Error('S/A member cards missing');
 if(memberCheck.sBorder!==memberCheck.aBorder||memberCheck.sBorder!=='5px'||memberCheck.sStyle!==memberCheck.aStyle||memberCheck.sStyle!=='solid')throw new Error('member S stripe border geometry differs: '+JSON.stringify(memberCheck));
 if(memberCheck.sRadius!==memberCheck.aRadius)throw new Error('member S card radius differs: '+JSON.stringify(memberCheck));
 if(memberCheck.sBg!=='none'||memberCheck.pseudoWidth!=='5px'||!memberCheck.pseudoBg.includes('linear-gradient')||memberCheck.pseudoLeft!=='-5px')throw new Error('member S rainbow edge is not normalized: '+JSON.stringify(memberCheck));
 if(Math.abs(memberCheck.sW-memberCheck.aW)>.25)throw new Error('member S card width changed: '+JSON.stringify(memberCheck));

 await page.evaluate(()=>{currentView='queue';renderAll();document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='queue'))});
 await page.waitForTimeout(250);
 const queueCheck=await page.evaluate(()=>{
   const s=document.querySelector('#queue .queueCard54[data-queue-grade642="S"]');
   const a=document.querySelector('#queue .queueCard54[data-queue-grade642="A"]');
   if(!s||!a)return null;
   const ss=getComputedStyle(s),as=getComputedStyle(a),ps=getComputedStyle(s,'::before');
   const sr=s.getBoundingClientRect(),ar=a.getBoundingClientRect();
   return {sBorder:ss.borderRightWidth,sStyle:ss.borderRightStyle,aBorder:as.borderRightWidth,aStyle:as.borderRightStyle,sRadius:ss.borderRadius,aRadius:as.borderRadius,sBg:ss.backgroundImage,pseudoWidth:ps.width,pseudoBg:ps.backgroundImage,pseudoRight:ps.right,sW:sr.width,aW:ar.width,watermark:getComputedStyle(s,'::after').content};
 });
 if(!queueCheck)throw new Error('S/A queue cards missing');
 if(queueCheck.sBorder!==queueCheck.aBorder||queueCheck.sBorder!=='5px'||queueCheck.sStyle!==queueCheck.aStyle||queueCheck.sStyle!=='solid')throw new Error('queue S stripe border geometry differs: '+JSON.stringify(queueCheck));
 if(queueCheck.sRadius!==queueCheck.aRadius)throw new Error('queue S card radius differs: '+JSON.stringify(queueCheck));
 if(queueCheck.sBg!=='none'||queueCheck.pseudoWidth!=='5px'||!queueCheck.pseudoBg.includes('linear-gradient')||queueCheck.pseudoRight!=='-5px')throw new Error('queue S rainbow edge is not normalized: '+JSON.stringify(queueCheck));
 if(Math.abs(queueCheck.sW-queueCheck.aW)>.25)throw new Error('queue S card width changed: '+JSON.stringify(queueCheck));
 if(!String(queueCheck.watermark||'').includes('S'))throw new Error('S watermark disappeared: '+JSON.stringify(queueCheck));
 console.log('PASS v6.49 S stripe matches A-E 5px edge geometry in roster and personal queue');
 console.log('PASS S rainbow color and queue watermark preserved');
}finally{await browser.close();}
