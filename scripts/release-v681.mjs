import fs from 'node:fs';
import path from 'node:path';

const OLD='6.80',NEW='6.81';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s)};
function replaceOne(s,from,to,label){
  const n=s.split(from).length-1;
  if(n!==1)throw new Error(`${label}: expected 1 match, got ${n}`);
  return s.replace(from,to);
}

// Immutable archive of the live v6.80 baseline before any release edits.
const archive=`versions/v${OLD}`;
fs.mkdirSync(archive,{recursive:true});
for(const f of [`app-v${OLD}.js`,`app-v${OLD}.css`,'kokmatch-sw.js','latest-version.json','manifest.webmanifest','sw.js']){
  fs.copyFileSync(f,`${archive}/${f}`);
}
let archiveIndex=read('index.html')
  .replace(`/app-v${OLD}.css`,`/versions/v${OLD}/app-v${OLD}.css`)
  .replace(`/app-v${OLD}.js`,`/versions/v${OLD}/app-v${OLD}.js`);
write(`${archive}/index.html`,archiveIndex);

let js=read(`app-v${OLD}.js`);

// 1) Canonical member paging: the old capture router held a stale page callback and
// swallowed the real inline/current pager click. Leave pager clicks to the canonical handler.
js=replaceOne(
  js,
  "const pager=btn.closest?.('#members .memberPager46');if(pager&&pageFnV6){const t=String(btn.textContent||'');const cur=Math.max(1,Number(window.__kokmatchMemberPage46)||1);if(t.includes('다음'))callV6(pageFnV6,cur+1);else if(t.includes('이전'))callV6(pageFnV6,Math.max(1,cur-1));else return false;return true}",
  "const pager=btn.closest?.('#members .memberPager46');if(pager)return false",
  'member pager capture router'
);

// 2) Court count editing: state polling must not replace the focused number input.
js=replaceOne(
  js,
  "function renderAll(){if(!me)return;renderHeader();renderNav();renderMembers();renderQueue();renderPlaying();renderStats();renderSettings();if(canManageGroups()&&currentView==='groups')renderGroups();",
  "function renderAll(){if(!me)return;renderHeader();renderNav();renderMembers();renderQueue();renderPlaying();renderStats();if(document.activeElement?.id!=='courtCountInput')renderSettings();if(canManageGroups()&&currentView==='groups')renderGroups();",
  'court input focus guard'
);

// 3) Role-frame visibility defaults to hidden. The prior v6.80 code forcibly rewrote
// every incoming value to all, defeating group settings; keep only hidden/all now.
js=replaceOne(
  js,
  "function forceDeveloperVisible674(){try{if(S&&typeof S==='object'&&S.adminBadgeVisibility!=='all')S.adminBadgeVisibility='all'}catch{}}",
  "function forceDeveloperVisible674(){try{if(!S||typeof S!=='object')return;const mode=String(S.adminBadgeVisibility||'hidden')==='all'?'all':'hidden';S.adminBadgeVisibility=mode;document.documentElement.classList.toggle('kokmatchRoleFramesHidden681',mode!=='all')}catch{}}",
  'developer visibility normalizer'
);
js=js.replace("window.__kokmatchSaveRoster654=function(g,m,b='all')","window.__kokmatchSaveRoster654=function(g,m,b='hidden')");
js=js.replaceAll("adminBadgeVisibility:String(b||'all')","adminBadgeVisibility:String(b||'hidden')");
js=js.replaceAll("adminBadgeVisibility||'all'","adminBadgeVisibility||'hidden'");

const frameHelpers=String.raw`
const ROLE_FRAME_SETTINGS_API681='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-settings-v43';
function canRoleFrameSetting681(){try{return !!me&&(!!me.globalAdmin||me.role==='manager'||me.role==='organizer')}catch{return false}}
function roleFrameMode681(){try{return String(S?.adminBadgeVisibility||'hidden')==='all'?'all':'hidden'}catch{return 'hidden'}}
function applyRoleFrameMode681(){const mode=roleFrameMode681();document.documentElement.classList.toggle('kokmatchRoleFramesHidden681',mode!=='all');return mode}
function syncRoleFrameSetting681(){
 const mode=applyRoleFrameMode681(),box=document.getElementById('settings');if(!box)return;
 let card=document.getElementById('roleFrameSetting681');
 if(!canRoleFrameSetting681()){card?.remove();return}
 if(!card){card=document.createElement('div');card.id='roleFrameSetting681';card.className='card roleFrameSetting681';const versionCard=[...box.querySelectorAll(':scope > .card')].find(c=>(c.textContent||'').includes('프로그램 버전'));if(versionCard)versionCard.before(card);else box.appendChild(card)}
 card.innerHTML='<div class="between roleFrameHead681"><div><b>역할 테두리 효과</b><div class="meta">개발자·모임장·운영진 프로필의 테두리 효과를 이 모임 전체에서 동일하게 적용합니다. 본인 포함 모든 인원에게 적용됩니다.</div></div><span class="tag">'+(mode==='all'?'보이기':'숨기기')+'</span></div><div class="roleFrameButtons681"><button type="button" class="btn '+(mode==='hidden'?'pri':'ghost')+'" onclick="setRoleFrameVisibility681(\'hidden\')">숨기기</button><button type="button" class="btn '+(mode==='all'?'pri':'ghost')+'" onclick="setRoleFrameVisibility681(\'all\')">보이기</button></div>';
}
window.setRoleFrameVisibility681=async function(mode){
 if(!canRoleFrameSetting681())return;
 const next=mode==='all'?'all':'hidden';
 try{
  const r=await fetch(ROLE_FRAME_SETTINGS_API681,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({action:'set_admin_badge_visibility',groupId:currentGroupId,mode:next}),cache:'no-store'});
  const x=await r.json().catch(()=>({}));
  if(!r.ok){if(r.status===401&&typeof reloginLatest==='function')reloginLatest();throw new Error(x.error||'테두리 효과 설정에 실패했습니다.')}
  if(S&&typeof S==='object')S.adminBadgeVisibility=next;
  try{window.__kokmatchSaveRoster654?.(currentGroupId,S?.members||[],next)}catch{}
  applyRoleFrameMode681();syncRoleFrameSetting681();
  try{window.__kokmatchSyncDeveloper674?.();window.__kokmatchSyncRoleAura664?.()}catch{}
 }catch(e){if(typeof showError==='function')showError(e);else alert(e?.message||'설정에 실패했습니다.')}
};
`;
js=replaceOne(js,'function syncUiV6(){',frameHelpers+'\nfunction syncUiV6(){','role frame settings helper');
js=replaceOne(
  js,
  "try{const f=renderSettings;renderSettings=function(...a){const r=f.apply(this,a);laterV6();return r};window.renderSettings=renderSettings}catch{}",
  "try{const f=renderSettings;renderSettings=function(...a){const r=f.apply(this,a);laterV6();syncRoleFrameSetting681();return r};window.renderSettings=renderSettings}catch{}",
  'settings canonical wrapper'
);

// Promote the new standalone version only after the structural edits are complete.
js=js.replaceAll(OLD,NEW);
write(`app-v${NEW}.js`,js);

let css=read(`app-v${OLD}.css`).replaceAll(OLD,NEW);
css+=String.raw`

/* v6.81: group-wide role-frame visibility; default is hidden. */
html.kokmatchRoleFramesHidden681 body .devChallenger659>img.devFrame661,
html.kokmatchRoleFramesHidden681 body img.roleAura664{display:none!important;visibility:hidden!important;opacity:0!important}
.roleFrameSetting681 .roleFrameHead681{align-items:flex-start}
.roleFrameSetting681 .roleFrameHead681>div{min-width:0;flex:1}
.roleFrameSetting681 .roleFrameButtons681{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}
.roleFrameSetting681 .roleFrameButtons681 .btn{width:100%}
@media(max-width:359px){.roleFrameSetting681 .roleFrameHead681{display:block}.roleFrameSetting681 .roleFrameHead681>.tag{margin:8px 0 0}}
`;
write(`app-v${NEW}.css`,css);

let index=read('index.html').replaceAll(OLD,NEW);
index=index.replaceAll(`app-v${OLD}.css`,`app-v${NEW}.css`).replaceAll(`app-v${OLD}.js`,`app-v${NEW}.js`);
write('index.html',index);
let sw=read('kokmatch-sw.js').replaceAll(OLD,NEW).replaceAll(`app-v${OLD}.css`,`app-v${NEW}.css`).replaceAll(`app-v${OLD}.js`,`app-v${NEW}.js`);
write('kokmatch-sw.js',sw);
write('sw.js',read('sw.js').replaceAll(OLD,NEW));
write('manifest.webmanifest',read('manifest.webmanifest').replaceAll(OLD,NEW));

const latest=JSON.parse(read('latest-version.json'));
latest.version=Math.max(Number(latest.version)||0,120)+1;
latest.label=`v${NEW}`;latest.semanticVersion=NEW;latest.build=`v${NEW}`;
latest.updatedAt=new Date().toISOString();
latest.note='v6.81 회원명부 다음페이지 수정 · 코트수 입력 포커스 유지 · 역할 테두리 모임별 숨김/보이기';
write('latest-version.json',JSON.stringify(latest,null,2)+'\n');

let versions=read('versions/index.html');
versions=replaceOne(versions,"const versions=[","const versions=[{v:'6.80',d:'편성대기 예상 시작 · 당일 실측/급수 구성 반영',path:'/versions/v6.80/index.html'},",'versions archive list');
versions=replaceOne(versions,'콕매치 v6.80 · 편성대기 예상 시작시간','콕매치 v6.81 · 회원명부 페이지·코트입력·역할 테두리 설정','versions current label');
versions=replaceOne(versions,'>v6.80 열기</a>','>v6.81 열기</a>','versions current button');
write('versions/index.html',versions);

const qa=String.raw`import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const latest=JSON.parse(fs.readFileSync('latest-version.json','utf8'));
const VERSION=String(latest.semanticVersion||'').replace(/^v/,'');
const now=Date.now();
const members=[
 {id:'dev',name:'개발자',year:1989,age:'30',cls:'B',gender:'남',type:'member',role:'admin',state:'waiting',joinedAt:now-600000,totalGames:2},
 {id:'mgr',name:'모임장',year:1990,age:'30',cls:'B',gender:'남',type:'member',role:'manager',state:'waiting',joinedAt:now-590000,totalGames:2},
 {id:'org',name:'운영진',year:1991,age:'30',cls:'C',gender:'여',type:'member',role:'organizer',state:'waiting',joinedAt:now-580000,totalGames:1},
 ...Array.from({length:21},(_,i)=>({id:'m'+i,name:'회원'+String(i+1).padStart(2,'0'),year:1992,age:'30',cls:'C',gender:i%2?'여':'남',type:'member',role:'member',state:'out',joinedAt:now-(i+20)*10000,totalGames:0}))
];
const state={courtCount:4,courtNames:['1코트','2코트','3코트','4코트'],adminBadgeVisibility:'hidden',autoGame:{enabled:false},members,queue:['dev','mgr','org'],pendingGames:[],games:[],history:[],pairCounts:{},attendancePolls:[]};
const clone=x=>JSON.parse(JSON.stringify(x));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
const settingsCalls=[];
await page.addInitScript(()=>{try{localStorage.setItem('kokmatch_push_denied_notice629',String(Date.now()));localStorage.setItem('kokmatch_install_guide631_seen','1');sessionStorage.setItem('kokmatch_install_later630','1')}catch{}});
await page.route('https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/**',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname.endsWith('/kokmatch-state-v46'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:clone(state),group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'},memberCount:state.members.length})});
 if(url.pathname.endsWith('/kokmatch-roster-v654')||url.pathname.endsWith('/kokmatch-roster-v653'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({members:clone(state.members),memberCount:state.members.length,adminBadgeVisibility:state.adminBadgeVisibility})});
 if(url.pathname.endsWith('/kokmatch-settings-v43')){const body=JSON.parse(route.request().postData()||'{}');settingsCalls.push(body);state.adminBadgeVisibility=body.mode==='all'?'all':'hidden';return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,mode:state.adminBadgeVisibility,data:clone(state)})})}
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:clone(state),group:{groupId:'qa',name:'QA'},user:{memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false},groups:[]})});
});
await page.goto('http://127.0.0.1:4173/?qa=v681',{waitUntil:'networkidle'});
await page.waitForFunction(v=>window.__kokmatchVersionLock===v,VERSION,{timeout:15000});
await page.evaluate(({state})=>{T='qa-token';localStorage.setItem('kokmatch_token',T);currentGroupId='qa';localStorage.setItem('kokmatch_group_id','qa');S=JSON.parse(JSON.stringify(state));window.S=S;me={memberId:'mgr',displayName:'모임장',role:'manager',globalAdmin:false,tempOrganizer:false,groupId:'qa'};group={groupId:'qa',name:'QA'};groups=[];normalizeClient();document.getElementById('login')?.classList.add('hide');currentView='members';renderAll();goView('members')},{state:clone(state)});
await page.waitForTimeout(120);
let pager=page.locator('#members .memberPager46');await pager.waitFor({state:'visible'});
assert.match((await pager.innerText()).replace(/\s+/g,' '),/1\s*\/\s*3/,'member roster did not start on page 1/3');
await pager.getByRole('button',{name:'다음'}).click();
await page.waitForTimeout(120);
pager=page.locator('#members .memberPager46');
assert.match((await pager.innerText()).replace(/\s+/g,' '),/2\s*\/\s*3/,'member roster next page click did not move to page 2');

await page.evaluate(()=>{currentView='settings';renderAll();goView('settings')});
await page.waitForTimeout(80);
const court=page.locator('#courtCountInput');await court.focus();await court.fill('');
await page.evaluate(()=>renderAll());await page.waitForTimeout(50);
assert.equal(await page.evaluate(()=>document.activeElement?.id),'courtCountInput','court count input lost focus while editing');
assert.equal(await page.locator('#courtCountInput').inputValue(),'','empty court-count draft was replaced by a rerender');
await page.evaluate(()=>document.activeElement?.blur());
await page.evaluate(()=>renderSettings());await page.waitForTimeout(50);
assert.equal(await page.locator('#roleFrameSetting681').count(),1,'manager role-frame setting missing');
assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('kokmatchRoleFramesHidden681')),true,'hidden must be the default frame mode');
await page.locator('#roleFrameSetting681 button',{hasText:'보이기'}).click();await page.waitForTimeout(80);
assert.equal(settingsCalls.at(-1)?.action,'set_admin_badge_visibility','frame setting API action mismatch');
assert.equal(settingsCalls.at(-1)?.mode,'all','show mode was not saved');
assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('kokmatchRoleFramesHidden681')),false,'show mode did not reveal role frames');
for(const identity of [
 {memberId:'org',displayName:'운영진',role:'organizer',globalAdmin:false},
 {memberId:'dev',displayName:'개발자',role:'admin',globalAdmin:true},
]){await page.evaluate(identity=>{me=identity;renderSettings()},identity);await page.waitForTimeout(30);assert.equal(await page.locator('#roleFrameSetting681').count(),1,identity.displayName+' setting missing')}
await page.evaluate(()=>{me={memberId:'m0',displayName:'회원01',role:'member',globalAdmin:false};renderSettings()});await page.waitForTimeout(30);
assert.equal(await page.locator('#roleFrameSetting681').count(),0,'general member must not see role-frame setting');
await context.close();await browser.close();
console.log('PASS v6.81 roster paging + court focus + group role-frame visibility');
`;
write('scripts/qa-v681-settings.mjs',qa);

let qaWorkflow=read('.github/workflows/qa-current-runtime.yml');
qaWorkflow=qaWorkflow.replace("      - 'scripts/qa-developer-visibility-v674.mjs'","      - 'scripts/qa-developer-visibility-v674.mjs'\n      - 'scripts/qa-v681-settings.mjs'");
qaWorkflow=qaWorkflow.replace('      - name: Developer visibility and persistent queue badge QA\n        run: node scripts/qa-developer-visibility-v674.mjs','      - name: v6.81 roster, court focus and role-frame settings QA\n        run: node scripts/qa-v681-settings.mjs');
write('.github/workflows/qa-current-runtime.yml',qaWorkflow);

write('RELEASE_v6.81.md',`# v6.81 — 회원명부·코트입력·역할 테두리 설정\n\n- 회원명부 페이지 버튼을 가로채던 구형 캡처 라우터를 제거해 1페이지에서 다음 페이지로 정상 이동하도록 수정.\n- 코트 수 입력 중 상태 동기화가 설정 화면을 다시 그리지 않도록 해 기존 숫자를 지운 뒤에도 입력 포커스가 유지되도록 수정.\n- 개발자·모임장·운영진이 설정에서 개발자/모임장/운영진 프로필 테두리 효과를 모임 전체에 숨기기/보이기로 선택할 수 있게 추가. 기본값은 숨기기.\n- 설정은 모임 단위로 서버에 저장되며 본인 포함 모든 사용자 화면에 동일 적용. 일반 회원은 설정 메뉴를 볼 수 없음.\n- v6.80 운영본은 backup/v6.80 및 versions/v6.80/에 보존.\n`);

// Release invariants.
for(const [file,needle] of [[`app-v${NEW}.js`,"if(pager)return false"],[`app-v${NEW}.js`,"document.activeElement?.id!=='courtCountInput'"],[`app-v${NEW}.js`,'roleFrameSetting681'],[`app-v${NEW}.css`,'kokmatchRoleFramesHidden681']]){
 if(!read(file).includes(needle))throw new Error(`${file}: missing ${needle}`);
}
if((read('index.html').match(/<script[^>]+src="\/app-v/g)||[]).length!==1)throw new Error('index must load exactly one app JS');
if((read('index.html').match(/<link[^>]+href="\/app-v/g)||[]).length!==1)throw new Error('index must load exactly one app CSS');
console.log('Prepared KokMatch v6.81 release');
