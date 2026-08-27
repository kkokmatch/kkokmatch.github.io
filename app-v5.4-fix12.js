(()=>{
if(window.__kokmatchV54Fix12)return;
window.__kokmatchV54Fix12=true;
window.__kokmatchGroupSwitchPatch='12.0';

function style12(){
 if(document.getElementById('v54fix12style'))return;
 const s=document.createElement('style');s.id='v54fix12style';s.textContent=`
.statsRange11>label{display:flex!important;flex-direction:column!important;min-width:0!important;max-width:100%!important;overflow:visible!important}
.statsRange11 input[type="date"]{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;inline-size:100%!important;font-variant-numeric:tabular-nums!important}
.statsRange11 input[type="date"]::-webkit-date-and-time-value{text-align:left!important;min-height:1.2em!important;padding:0!important}
.statsRange11 .dash11{display:block!important;text-align:center!important;white-space:nowrap!important;overflow:visible!important;min-width:16px!important;line-height:1!important}
#groupBtn.groupSwitching12{opacity:.65!important;pointer-events:none!important}
@media(max-width:420px){
 .statsRange11{grid-template-columns:minmax(0,1fr) 18px minmax(0,1fr)!important;column-gap:4px!important;row-gap:7px!important;width:100%!important;min-width:0!important;overflow:visible!important}
 .statsRange11>label{width:100%!important;min-width:0!important}
 .statsRange11 input[type="date"]{height:38px!important;min-height:38px!important;padding:6px 3px!important;font-size:12px!important;letter-spacing:-.2px!important;border-radius:8px!important;overflow:hidden!important}
 .statsRange11 .dash11{width:18px!important;min-width:18px!important;padding:0 0 11px!important;justify-self:center!important;align-self:end!important;font-size:13px!important;font-weight:800!important}
 .statsRange11 button{grid-column:1/-1!important;width:100%!important;margin:0!important}
}
@media(max-width:374px){
 .statsRange11{grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr)!important;column-gap:3px!important}
 .statsRange11 input[type="date"]{font-size:11px!important;padding-left:2px!important;padding-right:2px!important}
 .statsRange11 .dash11{width:16px!important;min-width:16px!important;font-size:12px!important}
}
`;document.head.appendChild(s)
}
style12();

const showErrorPrev12=typeof showError==='function'?showError:null;
let switching12=false,deferred12=[],target12='',startGroup12='';
function msg12(e){return String(e?.message||e||'오류가 발생했습니다.')}
function showError12(e){
 if(switching12){deferred12.push(e);console.warn('group switch deferred error',msg12(e));return}
 if(showErrorPrev12)return showErrorPrev12(e);
 alert(msg12(e));
}
try{showError=showError12;window.showError=showError12}catch{}

function switchUi12(on){
 const b=document.getElementById('groupBtn');if(!b)return;
 b.classList.toggle('groupSwitching12',!!on);b.disabled=!!on;
 if(on){b.dataset.before12=b.textContent||'';b.textContent='모임 변경 중…'}
 else{try{if(typeof renderHeader==='function')renderHeader()}catch{};if(b.textContent==='모임 변경 중…'&&b.dataset.before12)b.textContent=b.dataset.before12;delete b.dataset.before12}
}
function switched12(id){return String(currentGroupId||'')===String(id||'')&&String(group?.groupId||'')===String(id||'')}
function preferredError12(){
 if(!deferred12.length)return null;
 const meaningful=deferred12.filter(e=>!/(프로필|회원명단|통계|응답이 지연|로그인이 만료)/i.test(msg12(e)));
 return (meaningful.length?meaningful:deferred12).at(-1)||null;
}
async function runSwitch12(fn,id,args=[]){
 const target=String(id||'');if(!target)return;
 if(switching12)return;
 if(target===String(currentGroupId||'')){try{closeModal()}catch{};return}
 const before=String(currentGroupId||''),view=String(currentView||'members');
 switching12=true;window.__kokmatchGroupSwitching12=true;target12=target;startGroup12=before;deferred12=[];switchUi12(true);
 try{
  const r=await fn(target,...args);
  await new Promise(res=>setTimeout(res,120));
  if(switched12(target)){
   deferred12=[];
   if(String(currentView||'')!==view){try{goView(view)}catch{currentView=view}}
   if(view==='stats'){try{renderStats()}catch{}}
   try{window.scrollTo(0,0)}catch{}
   return r
  }
  const e=preferredError12();if(e){deferred12=[];if(showErrorPrev12)showErrorPrev12(e);else alert(msg12(e))}
  return r
 }catch(e){deferred12=[];if(showErrorPrev12)showErrorPrev12(e);else alert(msg12(e))}
 finally{switching12=false;window.__kokmatchGroupSwitching12=false;target12='';startGroup12='';deferred12=[];switchUi12(false)}
}

const ownPrev12=typeof window.switchOwnGroup38==='function'?window.switchOwnGroup38:null;
const adminPrev12=typeof window.adminSwitchGroup38==='function'?window.adminSwitchGroup38:null;
if(ownPrev12){window.switchOwnGroup38=function(id){return runSwitch12((target)=>ownPrev12(target),id)};try{switchOwnGroup38=window.switchOwnGroup38}catch{}}
if(adminPrev12){window.adminSwitchGroup38=function(id,view){const keep=String(view||currentView||'members');return runSwitch12((target,v)=>adminPrev12(target,v),id,[keep])};try{adminSwitchGroup38=window.adminSwitchGroup38}catch{}}
window.switchGroup=function(id,view){const keep=String(view||currentView||'members');return me?.globalAdmin===true?window.adminSwitchGroup38?.(id,keep):window.switchOwnGroup38?.(id)};
try{switchGroup=window.switchGroup}catch{}

function restyle12(){style12();const box=document.getElementById('stats');if(!box)return;box.querySelectorAll('.statsRange11').forEach(x=>x.classList.add('statsRangeSafe12'))}
const rsPrev12=typeof renderStats==='function'?renderStats:null;if(rsPrev12){renderStats=function(){const r=rsPrev12();restyle12();return r};window.renderStats=renderStats}
const raPrev12=typeof renderAll==='function'?renderAll:null;if(raPrev12){renderAll=function(){const r=raPrev12();restyle12();return r};window.renderAll=renderAll}
const mo12=new MutationObserver(()=>{if(document.querySelector('#stats .statsRange11'))restyle12()});
function boot12(){style12();const box=document.getElementById('stats');if(box)mo12.observe(box,{childList:true,subtree:true});restyle12()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot12,{once:true});else boot12();
})();