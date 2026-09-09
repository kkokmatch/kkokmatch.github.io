import fs from 'node:fs';
import {chromium,webkit} from 'playwright';

const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/i,'');
if(VERSION!=='6.62')throw new Error('expected 6.62, got '+VERSION);
const now=Date.now();
const members=[
 {id:'dev',name:'개발자',year:1989,gender:'남',age:'30',cls:'B',type:'member',role:'admin',state:'waiting',joinedAt:now-20*60000,totalGames:2},
 {id:'mem',name:'일반회원',year:1991,gender:'여',age:'30',cls:'C',type:'member',role:'member',state:'waiting',joinedAt:now-10*60000,totalGames:1}
];
const base={courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],members,queue:['dev','mem'],pendingGames:[],games:[],history:[],pairCounts:{},adminBadgeVisibility:'all',autoGame:{enabled:false,mode:'ai_optimal'}};
const user={memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true,tempOrganizer:false,groupId:'qa'};
const group={groupId:'qa',name:'QA 모임'};
const clone=x=>JSON.parse(JSON.stringify(x));

async function run(engine,label){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 const requested=[];page.on('request',r=>requested.push(r.url()));
 const errors=[];page.on('pageerror',e=>errors.push(String(e?.message||e)));
 await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
 await context.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'};
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({success:true,data:clone(base),user,group,groups:[],profiles:{},members:clone(members),memberCount:members.length,compact:true})});
 });
 await page.goto('http://127.0.0.1:4173/?qa=v662',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(v=>window.__kokmatchVersionLock===v,VERSION,{timeout:15000});
 await page.evaluate(({s,user,group})=>{
   T='qa-token';currentGroupId='qa';S=JSON.parse(JSON.stringify(s));window.S=S;me=user;window.me=me;window.group=group;groups=[];
   window.__kokmatchMemberCount46=S.members.length;window.__kokmatchMemberCountGroup46='qa';normalizeClient();document.getElementById('login')?.classList.add('hide');renderAll();
 },{s:base,user,group});

 // Settings profile: exact new prism asset must be decoded and deliberately subtle.
 await page.evaluate(()=>{goView('settings');renderSettings();window.__kokmatchSyncDevFrame661?.()});
 await page.waitForFunction(()=>{const f=document.querySelector('#profileCard53 .profilePreview53.devChallenger659 > img.devFrame661');return !!f&&f.complete&&f.naturalWidth>0},{timeout:8000});
 const settings=await page.evaluate(()=>{
   const f=document.querySelector('#profileCard53 .profilePreview53.devChallenger659 > img.devFrame661'),h=f?.parentElement;
   if(!f||!h)return null;const fr=f.getBoundingClientRect(),hr=h.getBoundingClientRect(),cs=getComputedStyle(f);
   return {src:f.getAttribute('src')||'',naturalWidth:f.naturalWidth,naturalHeight:f.naturalHeight,fw:fr.width,fh:fr.height,hw:hr.width,hh:hr.height,opacity:Number(cs.opacity),display:cs.display,visibility:cs.visibility,overflow:getComputedStyle(h).overflow,marker:cs.getPropertyValue('--km-dev-frame-v662').trim()};
 });
 if(!settings||!settings.src.includes('dev-prism-frame-v662.webp')||settings.naturalWidth<200)throw new Error(label+' prism asset not decoded '+JSON.stringify(settings));
 const ratio=settings.fw/settings.hw;
 if(ratio<1.30||ratio>1.50)throw new Error(label+' prism frame ratio not subtle '+JSON.stringify(settings));
 if(settings.opacity<0.35||settings.opacity>0.60||settings.display==='none'||settings.visibility==='hidden'||settings.overflow!=='visible'||settings.marker!=='1')throw new Error(label+' prism frame visibility/style invalid '+JSON.stringify(settings));

 // Member roster: frame only on avatar, rectangular card remains borderless, badge becomes blue crystal.
 await page.evaluate(()=>{goView('members');renderMembers();window.__kokmatchSyncDevFrame661?.()});
 await page.waitForTimeout(300);
 const member=await page.evaluate(()=>{
   const frame=document.querySelector('#members .devChallenger659 > img.devFrame661');
   const host=frame?.parentElement,card=frame?.closest('.memberCard');
   const badge=card?.querySelector('.roleBadge.role-global');
   if(!frame||!host||!card||!badge)return {missing:true,html:(document.getElementById('members')?.innerHTML||'').slice(0,1800)};
   const fr=frame.getBoundingClientRect(),hr=host.getBoundingClientRect(),fs=getComputedStyle(frame),bs=getComputedStyle(badge),cc=getComputedStyle(card),before=getComputedStyle(badge,'::before');
   return {src:frame.getAttribute('src')||'',naturalWidth:frame.naturalWidth,ratio:fr.width/hr.width,opacity:Number(fs.opacity),frameMarker:fs.getPropertyValue('--km-dev-frame-v662').trim(),badgeMarker:bs.getPropertyValue('--km-dev-badge-v662').trim(),badgeBg:bs.backgroundImage,badgeColor:bs.color,badgeHeight:badge.getBoundingClientRect().height,badgeBefore:before.content,borders:[cc.borderTopWidth,cc.borderRightWidth,cc.borderBottomWidth,cc.borderLeftWidth],ordinaryBadges:[...card.parentElement.querySelectorAll('.roleBadge.role-member44')].filter(x=>getComputedStyle(x).display!=='none').length};
 });
 if(member.missing||!member.src.includes('dev-prism-frame-v662.webp')||member.naturalWidth<200||member.frameMarker!=='1')throw new Error(label+' member prism frame missing '+JSON.stringify(member));
 if(member.badgeMarker!=='1'||!String(member.badgeBefore).includes('◆')||member.badgeHeight>28)throw new Error(label+' blue crystal developer badge invalid '+JSON.stringify(member));
 if(member.borders.some(v=>v!=='0px'))throw new Error(label+' rectangular member card border returned '+JSON.stringify(member));
 if(member.ordinaryBadges!==0)throw new Error(label+' ordinary member badge visible '+JSON.stringify(member));
 const geom=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
 if(geom.scroll>geom.inner+2)throw new Error(label+' horizontal overflow '+JSON.stringify(geom));
 if(errors.length)throw new Error(label+' page errors '+JSON.stringify(errors));
 const oldReq=requested.filter(u=>u.includes('dev-challenger-frame-v661.webp'));
 const newReq=requested.filter(u=>u.includes('dev-prism-frame-v662.webp'));
 if(oldReq.length)throw new Error(label+' old challenger asset still requested '+JSON.stringify(oldReq));
 if(!newReq.length)throw new Error(label+' prism asset was never requested');
 console.log(`PASS ${label} v6.62 subtle prism frame + blue crystal developer badge`);
 await browser.close();
}
await run(chromium,'Chromium mobile');
await run(webkit,'WebKit mobile');
