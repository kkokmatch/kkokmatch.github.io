import fs from 'node:fs';
import {chromium,webkit} from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/i,'');
if(VERSION!=='6.61')throw new Error('expected 6.61, got '+VERSION);
const now=Date.now();
const members=[
 {id:'dev',name:'개발자',year:1989,gender:'남',age:'30',cls:'B',type:'member',role:'admin',state:'waiting',joinedAt:now-20*60000,totalGames:2},
 {id:'mem',name:'일반회원',year:1991,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'waiting',joinedAt:now-10*60000,totalGames:1}
];
const base={courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members,queue:['dev','mem'],pendingGames:[],games:[],history:[],pairCounts:{},adminBadgeVisibility:'hidden',autoGame:{enabled:false,mode:'ai_optimal'}};
const user={memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'};
const group={groupId:'qa',name:'QA 모임'};
const clone=x=>JSON.parse(JSON.stringify(x));

async function run(engine,label){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e?.message||e)));
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await context.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'};
  return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data:clone(base),user,group,groups:[],profiles:{},members:clone(members),memberCount:members.length,compact:true})});
 });
 await page.goto('http://127.0.0.1:4173/?qa=v661',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v,VERSION,{timeout:15000});
 await page.evaluate(({s,user,group})=>{
   T='qa-token';currentGroupId='qa';S=JSON.parse(JSON.stringify(s));window.S=S;me=user;window.me=me;window.group=group;groups=[];
   window.__kokmatchMemberCount46=S.members.length;window.__kokmatchMemberCountGroup46='qa';normalizeClient();document.getElementById('login')?.classList.add('hide');renderAll();
 },{s:base,user,group});

 // Settings/self-profile first: inspect actual DOM and actual asset decode.
 await page.evaluate(()=>{goView('settings');renderSettings();window.__kokmatchSyncDevFrame661?.()});
 await page.waitForTimeout(350);
 const diag=await page.evaluate(async()=>{
   const card=document.querySelector('#profileCard53'),preview=document.querySelector('#profileCard53 .profilePreview53'),frame=document.querySelector('#profileCard53 .profilePreview53 > img.devFrame661');
   let asset={};try{const r=await fetch('/assets/dev-challenger-frame-v660.webp?v=6.61',{cache:'no-store'});const b=await r.blob();asset={status:r.status,ok:r.ok,type:r.headers.get('content-type'),size:b.size}}catch(e){asset={error:String(e)}}
   const direct=await new Promise(resolve=>{const im=new Image();const done=()=>resolve({complete:im.complete,naturalWidth:im.naturalWidth,naturalHeight:im.naturalHeight});im.onload=done;im.onerror=done;im.src='/assets/dev-challenger-frame-v660.webp?v=6.61&t='+Date.now()});
   return {marker:window.__kokmatchDevFrame661,syncType:typeof window.__kokmatchSyncDevFrame661,me:{role:me?.role,globalAdmin:me?.globalAdmin,memberId:me?.memberId},linked:typeof linkedDev659==='function'?linkedDev659():null,actualRole:typeof M==='function'?M('dev')?.role:null,currentView,card:!!card,preview:!!preview,previewClass:preview?.className||'',frame:!!frame,frameComplete:frame?.complete||false,frameNaturalWidth:frame?.naturalWidth||0,children:preview?[...preview.children].map(x=>({tag:x.tagName,cls:x.className,src:x.getAttribute?.('src')||''})):[],asset,direct,settingsText:(document.querySelector('#settings')?.innerText||'').slice(0,300)};
 });
 console.log(label+' FRAME DIAG '+JSON.stringify(diag));
 if(pageErrors.length)console.log(label+' PAGE ERRORS '+JSON.stringify(pageErrors));
 if(!diag.card||!diag.preview||!diag.frame||diag.frameNaturalWidth<=0||!diag.asset?.ok||diag.direct?.naturalWidth<=0)throw new Error(label+' settings frame diagnostic failed '+JSON.stringify(diag));
 const settings=await page.evaluate(()=>{
   const frame=document.querySelector('#profileCard53 .profilePreview53.devChallenger659 > img.devFrame661'),host=frame?.parentElement;
   if(!frame||!host)return null;const fr=frame.getBoundingClientRect(),hr=host.getBoundingClientRect();return {naturalWidth:frame.naturalWidth,fw:fr.width,fh:fr.height,hw:hr.width,hh:hr.height,overflow:getComputedStyle(host).overflow,display:getComputedStyle(frame).display,opacity:getComputedStyle(frame).opacity};
 });
 if(!settings||settings.naturalWidth<100||settings.fw<settings.hw*1.5||settings.overflow!=='visible'||settings.display==='none'||Number(settings.opacity)<=0)throw new Error(label+' settings profile frame not visible '+JSON.stringify(settings));

 // Member list: badge hidden, role-based frame required.
 await page.evaluate(()=>{goView('members');renderMembers();window.__kokmatchSyncDevFrame661?.()});
 await page.waitForTimeout(350);
 const member=await page.evaluate(()=>{
   const frame=document.querySelector('#members [data-member-id="dev"].devChallenger659 > img.devFrame661,#members .devChallenger659 > img.devFrame661');
   const host=frame?.parentElement,card=frame?.closest('.memberCard');
   if(!frame||!host||!card)return {missing:true,html:(document.querySelector('#members')?.innerHTML||'').slice(0,1200)};
   const fr=frame.getBoundingClientRect(),hr=host.getBoundingClientRect(),cs=getComputedStyle(frame),pseudo=getComputedStyle(host,'::after'),cc=getComputedStyle(card);
   return {naturalWidth:frame.naturalWidth,naturalHeight:frame.naturalHeight,fw:fr.width,fh:fr.height,hw:hr.width,hh:hr.height,display:cs.display,visibility:cs.visibility,opacity:cs.opacity,z:cs.zIndex,pseudo:pseudo.content,borders:[cc.borderTopWidth,cc.borderRightWidth,cc.borderBottomWidth,cc.borderLeftWidth],developerBadge:!!card.querySelector('.roleBadge.role-global')};
 });
 if(member.missing||member.naturalWidth<100)throw new Error(label+' member frame asset not decoded '+JSON.stringify(member));
 if(member.fw<member.hw*1.5||member.fh<member.hh*1.5)throw new Error(label+' member frame not visibly larger than avatar '+JSON.stringify(member));
 if(member.display==='none'||member.visibility==='hidden'||Number(member.opacity)<=0)throw new Error(label+' member frame hidden '+JSON.stringify(member));
 if(member.pseudo!=='none'&&member.pseudo!=='normal')throw new Error(label+' legacy pseudo frame still active '+JSON.stringify(member));
 if(member.borders.some(v=>v!=='0px'))throw new Error(label+' rectangular member card border returned '+JSON.stringify(member));
 const geom=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
 if(geom.scroll>geom.inner+2)throw new Error(label+' horizontal overflow '+JSON.stringify(geom));
 console.log(`PASS ${label} v6.61 real DOM developer frame decoded and visible with badge-hidden role detection`);
 await browser.close();
}
await run(chromium,'Chromium mobile');
await run(webkit,'WebKit mobile');
