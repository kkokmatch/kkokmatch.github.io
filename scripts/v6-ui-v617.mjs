import fs from 'node:fs';

const JS='app-v6.0.js';
let js=fs.readFileSync(JS,'utf8');
if(!js.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');
if(!js.includes("__kokmatchPartnerDisplayFilterV616='v6.16'"))throw new Error('v6.16 must be generated first');

js=js.replaceAll('v6.16','v6.17');
js=js.replace(/function buildLabelV6\(\)\{return 'v6\.\d+'\}/,"function buildLabelV6(){return 'v6.17'}");

// Remove the original 3-second full-state repaint loop and the unconditional 60-second renderAll loop.
// Poll in the background and repaint only when server state actually changed.
const oldBasePoll="document.addEventListener('click',e=>{if(e.target?.id==='modal')closeModal()});setInterval(()=>{if(T&&!reloginBusy)loadState().catch(()=>{})},3000);setInterval(()=>{if(me)renderAll()},60000);boot();";
const newBasePoll=String.raw`document.addEventListener('click',e=>{if(e.target?.id==='modal')closeModal()});
let statePollBusyV617=false;
window.__kokmatchBackgroundPollV617='v6.17';
function stateSigV617(v){try{return JSON.stringify(v,(k,x)=>String(k).startsWith('__')?undefined:x)}catch{return''}}
async function backgroundStatePollV617(){
 if(statePollBusyV617||!T||reloginBusy||document.hidden)return;
 if(document.querySelector('#memberEditorV615,#partnerOverlayV615'))return;
 statePollBusyV617=true;
 try{
  const x=await request('state','GET',null,{groupId:currentGroupId});
  if(!x?.data)return;
  const stateChanged=stateSigV617(S)!==stateSigV617(x.data);
  const userChanged=stateSigV617({role:me?.role,globalAdmin:me?.globalAdmin,tempOrganizer:me?.tempOrganizer,memberId:me?.memberId,displayName:me?.displayName})!==stateSigV617({role:x.user?.role,globalAdmin:x.user?.globalAdmin,tempOrganizer:x.user?.tempOrganizer,memberId:x.user?.memberId,displayName:x.user?.displayName});
  const groupChanged=String(group?.groupId||'')!==String(x.group?.groupId||'')||String(group?.name||'')!==String(x.group?.name||'');
  if(!stateChanged&&!userChanged&&!groupChanged)return;
  S=x.data;me=x.user;group=x.group;groups=x.groups||groups;
  if(group?.groupId){currentGroupId=group.groupId;localStorage.setItem(GROUP_KEY,currentGroupId)}
  normalizeClient();
  if(currentView==='members'){
   renderHeader();renderNav();renderMembers();window.__kokmatchFinalizeRoster22?.();v615StripPartnerNames?.();
  }else renderAll();
 }catch(e){if(e?.message==='로그인이 만료되었습니다.')return}
 finally{statePollBusyV617=false}
}
setInterval(backgroundStatePollV617,10000);boot();`;
if(!js.includes(oldBasePoll))throw new Error('Original 3s full repaint loop not found');
js=js.replace(oldBasePoll,newBasePoll);

// Disable the v99 document-wide mutation repair observer. It was written for the old runtime and
// can repeatedly schedule member repairs whenever modern renderers change the DOM.
const oldMo="const mo99=new MutationObserver(()=>requestAnimationFrame(enhance99));mo99.observe(document.documentElement,{subtree:true,childList:true});";
if(!js.includes(oldMo))throw new Error('v99 mutation observer not found');
js=js.replace(oldMo,"const mo99={disconnect(){}};window.__kokmatchLegacyRosterObserverDisabledV617=true;");

// The old developer roster watchdog may call renderMembers again whenever it thinks cards are missing.
// Canonical v6 roster re-entry already owns this responsibility, so make the old repair function inert.
const repairStart=js.indexOf('function ensureFullDeveloperRoster99(){');
const repairEnd=repairStart>=0?js.indexOf('\nfunction enhance99()',repairStart):-1;
if(repairStart<0||repairEnd<0)throw new Error('v99 developer roster repair function not found');
js=js.slice(0,repairStart)+"function ensureFullDeveloperRoster99(){return false}"+js.slice(repairEnd);

const oldWatch="setInterval(()=>{if(me){restoreDeveloper99();if(currentView==='members')ensureFullDeveloperRoster99()}},1200);";
if(!js.includes(oldWatch))throw new Error('v99 1.2s roster watchdog not found');
js=js.replace(oldWatch,"setTimeout(()=>{if(me)restoreDeveloper99()},0);");

// Avoid the old v99 navigation wrapper drawing the member roster a second time immediately after navigation.
js=js.replace("if(id==='members'){renderMembers();ensureFullDeveloperRoster99()}","if(id==='members'){window.__kokmatchFinalizeRoster22?.();v615StripPartnerNames?.()}");

// Keep the requested stable 4px name-to-meta spacing and lock card geometry while updates are applied.
const marker='/* V6_UI_STABILITY_CSS_END */';
let css=fs.readFileSync('app-v6.0.css','utf8');
const p=css.indexOf(marker);if(p<0)throw new Error('CSS stability marker missing');
const add=`\n/* v6.17 no-flicker roster geometry */\n#members .memberCard{contain:layout style!important;transform:translateZ(0)}\n#members .memberInfo48,#members .memberInfoV6{min-height:52px!important;justify-content:center!important}\n#members .memberMetaV6{margin-top:4px!important}\n#members .v6MemberActions,#members .memberActions48,#members .memberActions60,#members .memberActions65{min-height:54px!important}\n`;
css=css.slice(0,p)+add+css.slice(p);

for(const check of ["function buildLabelV6(){return 'v6.17'}","__kokmatchBackgroundPollV617='v6.17'","__kokmatchLegacyRosterObserverDisabledV617=true","function ensureFullDeveloperRoster99(){return false}"]){if(!js.includes(check))throw new Error('v6.17 marker missing: '+check)}
if(js.includes("setInterval(()=>{if(T&&!reloginBusy)loadState().catch(()=>{})},3000)"))throw new Error('3s loadState repaint loop still present');
if(js.includes("setInterval(()=>{if(me){restoreDeveloper99();if(currentView==='members')ensureFullDeveloperRoster99()}},1200)"))throw new Error('1.2s v99 roster watchdog still present');
if(!css.includes('#members .memberMetaV6{margin-top:4px!important}'))throw new Error('4px spacing lock missing');

fs.writeFileSync(JS,js);fs.writeFileSync('app-v6.0.css',css);
console.log('v6.17 removed legacy full-roster repaint loops and installed change-only background state polling.');
