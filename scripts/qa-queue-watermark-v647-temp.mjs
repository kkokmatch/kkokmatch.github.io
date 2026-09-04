import { chromium } from 'playwright';

const grades=['A','B','C','D','E','S'];
const members=[{id:'mgr',name:'관리자',year:1985,gender:'남',age:'40',cls:'B',type:'member',role:'manager',state:'out',totalGames:0},...grades.map((g,i)=>({id:'q'+g,name:g+'급회원',year:1990+i,gender:i%2?'여':'남',age:'30',cls:g,type:'member',role:'member',state:'waiting',joinedAt:Date.now()-(i+1)*60000,totalGames:0}))];
const state={courtCount:8,courtNames:Array.from({length:8},(_,i)=>`${i+1}코트`),members,queue:grades.map(g=>'q'+g),pendingGames:[],games:[],history:[],pairCounts:{}};
const clone=()=>JSON.parse(JSON.stringify(state));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e?.stack||e)));
await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1');const kill=()=>document.getElementById('pwaPrompt629')?.remove();new MutationObserver(kill).observe(document,{childList:true,subtree:true});addEventListener('DOMContentLoaded',kill)}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname.includes('profile'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({profiles:{},success:true})});
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(),groups:[],group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'}})});
});
try{
 await page.goto('http://127.0.0.1:4173/?qa=watermark647',{waitUntil:'load'});
 await page.waitForFunction(()=>window.__kokmatchVersionLock==='6.47'&&typeof window.renderQueue==='function',{timeout:15000});
 await page.evaluate(s=>{T='qa-token';currentGroupId='qa';currentView='queue';S=JSON.parse(JSON.stringify(s));window.S=S;me={memberId:'mgr',displayName:'관리자',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA'};groups=[];normalizeClient();renderAll();document.getElementById('login')?.classList.add('hide')},clone());
 await page.waitForTimeout(250);
 const cards=page.locator('#queue .queueCard54');
 if(await cards.count()!==6)throw new Error('personal queue card count mismatch');
 for(const g of grades){
  const card=page.locator(`#queue .queueCard54[data-queue-watermark647="${g}"]`);
  if(await card.count()!==1)throw new Error(`missing ${g} watermark attribute`);
  const st=await card.evaluate(el=>{const c=getComputedStyle(el),p=getComputedStyle(el,'::after');return{bg:c.backgroundColor,display:c.display,content:p.content,position:p.position,pointer:p.pointerEvents,fontWeight:p.fontWeight,fontSize:p.fontSize,color:p.color,bgi:p.backgroundImage,opacity:p.opacity,client:el.clientWidth,scroll:el.scrollWidth}});
  if(st.display!=='grid')throw new Error(`${g} card layout changed from grid`);
  if(!/rgb\(255,\s*255,\s*255\)/.test(st.bg))throw new Error(`${g} card background changed: ${st.bg}`);
  if(!String(st.content).includes(g))throw new Error(`${g} watermark content missing: ${st.content}`);
  if(st.position!=='absolute'||st.pointer!=='none')throw new Error(`${g} watermark can affect layout/touch: ${JSON.stringify(st)}`);
  if(Number(st.fontWeight)<900)throw new Error(`${g} watermark not bold: ${st.fontWeight}`);
  if(st.scroll>st.client+1)throw new Error(`${g} card horizontal overflow: ${st.scroll}/${st.client}`);
  if(g==='S'&&!st.bgi.includes('linear-gradient'))throw new Error('S watermark is not rainbow');
  if(g!=='S'&&(st.color==='rgba(0, 0, 0, 0)'||st.color==='transparent'))throw new Error(`${g} watermark color missing`);
 }
 // Prove the watermark CSS does not move the card or any direct child.
 const geometry=await page.locator('#queue .queueCard54[data-queue-watermark647="S"]').evaluate(async el=>{
  const snap=()=>({card:(()=>{const r=el.getBoundingClientRect();return[r.x,r.y,r.width,r.height]})(),kids:[...el.children].map(x=>{const r=x.getBoundingClientRect();return[r.x,r.y,r.width,r.height]})});
  const on=snap(),g=el.dataset.queueWatermark647;delete el.dataset.queueWatermark647;await new Promise(r=>requestAnimationFrame(()=>r()));const off=snap();el.dataset.queueWatermark647=g;return{on,off};
 });
 const flat=x=>[...x.card,...x.kids.flat()];const a=flat(geometry.on),b=flat(geometry.off);if(a.length!==b.length)throw new Error('geometry vector mismatch');for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>.25)throw new Error(`watermark changed layout geometry at ${i}: ${a[i]} vs ${b[i]}`);
 // Watermark must not intercept card taps.
 const acard=page.locator('#queue .queueCard54[data-queue-watermark647="A"]');await acard.click();await page.waitForTimeout(50);if(!(await acard.evaluate(el=>el.classList.contains('selected'))))throw new Error('watermark interfered with queue card click');
 if(errors.length)throw new Error('page errors: '+errors.join(' | '));
 console.log('PASS v6.47 A/B/C/D/E/S personal queue watermark');
 console.log('PASS S rainbow watermark');
 console.log('PASS card/background/grid geometry unchanged with watermark on/off');
 console.log('PASS watermark pointer-events none and queue card click');
}finally{await browser.close()}
