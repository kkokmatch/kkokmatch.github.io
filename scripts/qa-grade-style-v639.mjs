import fs from 'node:fs';
import { chromium } from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
if(String(latest.semanticVersion)!=='6.39')throw new Error('expected v6.39');
const grades=['A','B','C','D','E'];
const members=grades.map((g,i)=>({id:'g'+g,name:g+'급회원',year:1990+i,gender:i%2?'여':'남',age:'30',cls:g,type:'member',role:i===0?'manager':'member',totalGames:i,state:i%3===0?'waiting':i%3===1?'spectator':'out',joinedAt:Date.now()-60000}));
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:['gA','gD'],pendingGames:[],games:[],history:[],pairCounts:{}};
const copy=()=>JSON.parse(JSON.stringify(state));
const expected={
 A:{bg:'rgb(250, 240, 249)',line:'rgb(166, 0, 147)',badge:'rgb(166, 0, 147)'},
 B:{bg:'rgb(240, 252, 252)',line:'rgb(0, 207, 198)',badge:'rgb(0, 207, 198)'},
 C:{bg:'rgb(241, 252, 240)',line:'rgb(16, 212, 0)',badge:'rgb(16, 212, 0)'},
 D:{bg:'rgb(253, 249, 249)',line:'rgb(222, 153, 153)',badge:'rgb(222, 153, 153)'},
 E:{bg:'rgb(254, 253, 240)',line:'rgb(235, 226, 2)',badge:'rgb(235, 226, 2)'}
};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:800,height:1280},isMobile:true,hasTouch:true});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),user:{memberId:'gA',displayName:'A급회원',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},group:{groupId:'qa',name:'QA 모임'},groups:[],profiles:{}})}));
try{
 await page.goto('http://127.0.0.1:4173/?qa=grade639',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__kokmatchVersionLock==='6.39'&&typeof window.renderAll==='function',{timeout:15000});
 await page.evaluate(state=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'gA',displayName:'A급회원',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA 모임'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide')},copy());
 await page.waitForTimeout(700);
 const check=async()=>page.evaluate(()=>[...document.querySelectorAll('#members .memberCard')].map(c=>{const grade=String(c.dataset.gradeV6||'');const s=getComputedStyle(c);const b=c.querySelector('.tag[class*="grade-"]');const bs=b?getComputedStyle(b):null;const cr=c.getBoundingClientRect(),ar=c.querySelector(':scope > .kmRosterActions621')?.getBoundingClientRect();return{grade,bg:s.backgroundColor,line:s.borderLeftColor,lineWidth:s.borderLeftWidth,badge:bs?.backgroundColor||'',contained:!!ar&&ar.left>=cr.left-1&&ar.right<=cr.right+1}}));
 let rows=await check();
 if(rows.length!==5)throw new Error('expected 5 grade cards: '+JSON.stringify(rows));
 for(const r of rows){const e=expected[r.grade];if(!e)throw new Error('missing grade data attr: '+JSON.stringify(r));if(r.bg!==e.bg||r.line!==e.line||r.lineWidth!=='5px'||r.badge!==e.badge||!r.contained)throw new Error('tablet grade style mismatch '+JSON.stringify(r)+' expected '+JSON.stringify(e));}
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);rows=await check();
 for(const r of rows){const e=expected[r.grade];if(r.bg!==e.bg||r.line!==e.line||r.lineWidth!=='5px'||r.badge!==e.badge||!r.contained)throw new Error('mobile grade style mismatch '+JSON.stringify(r));}
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
 if(overflow)throw new Error('horizontal overflow after grade accent styling');
 console.log('PASS v6.39 pale grade card backgrounds A-E');
 console.log('PASS v6.39 exact vivid grade badges retained');
 console.log('PASS v6.39 5px left grade accent on tablet and mobile');
 console.log('PASS v6.39 roster action rail containment and no horizontal overflow');
}finally{await browser.close()}
