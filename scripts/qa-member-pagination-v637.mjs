import fs from 'node:fs';
import { chromium } from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
if(VERSION!=='6.37')throw new Error(`expected v6.37, got ${VERSION}`);
const members=Array.from({length:23},(_,i)=>({id:`m${String(i).padStart(2,'0')}`,name:`회원${String(i).padStart(2,'0')}`,year:1990+i%10,gender:i%2?'여':'남',age:'30',cls:'C',type:'member',role:'member',totalGames:0,state:i%3===0?'waiting':i%3===1?'spectator':'out',joinedAt:Date.now()-60000}));
const baseState={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:members.filter(m=>m.state==='waiting').map(m=>m.id),pendingGames:[],games:[],history:[],pairCounts:{}};
const copy=()=>JSON.parse(JSON.stringify(baseState));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:800,height:1280},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/152 Mobile Safari/537.36'});
const errors=[];page.on('pageerror',e=>errors.push(String(e?.stack||e)));
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:copy(),profiles:{},groups:[]})}));

function expect(cond,msg){if(!cond)throw new Error(msg)}
async function inject(user){
 await page.evaluate(({state,user})=>{T='qa-token';currentGroupId='qa';currentView='members';S=JSON.parse(JSON.stringify(state));window.S=S;me=user;window.me=me;group={groupId:'qa',name:'QA 모임'};window.group=group;groups=[];normalizeClient();if(typeof window.memberPageGo46==='function')window.memberPageGo46(1);renderAll();document.getElementById('login')?.classList.add('hide');window.__kokmatchStabilizeRoster637?.(true)},{state:copy(),user});
 await page.waitForTimeout(150);
}
async function snapshot(){return page.evaluate(()=>({
 page:Number(window.__kokmatchMemberPage46||1),
 cards:[...document.querySelectorAll('#members .memberCard')].map(c=>{const a=c.querySelector('.kmRosterActions621');const row=a?.querySelector('.kmRosterBtns621');const ar=a?.getBoundingClientRect();const rr=row?.getBoundingClientRect();return{id:String(c.dataset.memberId22||''),buttons:[...(row?.querySelectorAll('button')||[])].map(b=>(b.textContent||'').trim()),slots:row?[...row.children].filter(x=>x.classList.contains('kmRosterSlot621')).length:0,readonly:!!a?.classList.contains('kmRosterReadonly621'),aw:ar?Math.round(ar.width):0,rw:rr?Math.round(rr.width):0}}),
 pager:[...document.querySelectorAll('#members .memberPager46 button')].map(b=>({text:(b.textContent||'').trim(),disabled:b.disabled}))
}))}
async function next(){await page.getByRole('button',{name:'다음',exact:true}).click();await page.waitForFunction(()=>Number(window.__kokmatchMemberPage46||1)>1);await page.waitForTimeout(160);}
async function prev(){await page.getByRole('button',{name:'이전',exact:true}).click();await page.waitForFunction(()=>Number(window.__kokmatchMemberPage46||1)===1);await page.waitForTimeout(160);}

try{
 await page.goto('http://127.0.0.1:4173/?qa=v637',{waitUntil:'networkidle'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v&&typeof window.renderAll==='function'&&typeof window.__kokmatchStabilizeRoster637==='function',VERSION,{timeout:15000});

 // General member: self keeps own attendance controls; other pages keep the same three-slot rail with no unauthorized buttons.
 await inject({memberId:'m00',displayName:'회원00',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'});
 let s=await snapshot();expect(s.page===1&&s.cards.length===10,'general page 1 failed');
 const self=s.cards.find(x=>x.id==='m00');expect(self&&self.slots===3,'general self must keep three slots');expect(self.buttons.length===2&&!self.buttons.includes('수정'),'general self permissions changed');
 expect(s.cards.filter(x=>x.id!=='m00').every(x=>x.readonly&&x.slots===3&&x.buttons.length===0),'general readonly cards are not canonical on page 1');
 for(let cycle=0;cycle<2;cycle++){
  await next();s=await snapshot();expect(s.page===2&&s.cards.length===10,`general next page failed cycle ${cycle}`);expect(s.cards.every(x=>x.readonly&&x.slots===3&&x.buttons.length===0),`general page 2 exposed/broke controls cycle ${cycle}: ${JSON.stringify(s.cards)}`);expect(s.cards.every(x=>x.aw>=135&&x.rw>=135),`general tablet action rail width collapsed: ${JSON.stringify(s.cards)}`);
  await prev();s=await snapshot();expect(s.page===1&&s.cards.length===10,`general previous page failed cycle ${cycle}`);
 }

 // Developer: all cards retain three active action buttons through the same next/previous path.
 await inject({memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'});
 await next();s=await snapshot();expect(s.page===2&&s.cards.length===10,'developer next page failed');expect(s.cards.every(x=>x.slots===3&&x.buttons.length===3&&x.buttons.includes('수정')),`developer controls regressed: ${JSON.stringify(s.cards)}`);expect(s.cards.every(x=>x.aw>=135&&x.rw>=135),'developer tablet action rail width collapsed');
 await prev();s=await snapshot();expect(s.page===1,'developer previous page failed');

 // iPhone-sized regression: canonical rail stays inside the card and page switching does not throw.
 await page.setViewportSize({width:390,height:844});await inject({memberId:'m00',displayName:'회원00',role:'member',globalAdmin:false,tempOrganizer:false,groupId:'qa'});await next();
 const mobile=await page.evaluate(()=>[...document.querySelectorAll('#members .memberCard')].every(c=>{const a=c.querySelector('.kmRosterActions621'),cr=c.getBoundingClientRect(),ar=a?.getBoundingClientRect();return !!a&&!!ar&&ar.left>=cr.left-1&&ar.right<=cr.right+1}));expect(mobile,'iPhone member action rail escaped card');
 if(errors.length)throw new Error('page errors: '+errors.join(' | '));
 console.log('PASS v6.37 Android general page 1 → 2 → 1 x2');
 console.log('PASS general readonly cards retain 3-slot geometry without unauthorized actions');
 console.log('PASS Android developer page 1 → 2 → 1 with 3 active buttons');
 console.log('PASS iPhone-sized member rail containment');
}finally{await browser.close();}
