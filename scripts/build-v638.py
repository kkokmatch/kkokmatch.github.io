from pathlib import Path
import json,re

OLD='6.37'
NEW='6.38'
root=Path('.')
js=(root/f'app-v{OLD}.js').read_text(encoding='utf-8').replace(OLD,NEW)

# During an ordinary app resume v6.38 patches the existing three slots in place.
# Old compatibility painters used to replace the whole action rail a moment later,
# which was visible as a flash. Guard only that short resume window.
repls=[
 ("function applyControls(){\n", "function applyControls(){\n if(Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0))return;\n"),
 ("function paint632(){\n", "function paint632(){\n if(Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0))return;\n"),
 ("function replaceControls22(card,m){\n", "function replaceControls22(card,m){\n if(Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0)&&card?.querySelector?.(':scope > .kmRosterActions621'))return;\n"),
 ("function stabilize637(force=false){\n", "function stabilize637(force=false){\n if(Date.now()<Number(window.__kokmatchResumeNoRailReplaceUntil638||0)&&!needs637())return;\n"),
]
for old,new in repls:
    if old not in js: raise SystemExit('v6.38 guard insertion point missing: '+old.strip())
    js=js.replace(old,new,1)

patch=r'''

/* KokMatch v6.38: no-flash member roster resume */
(()=>{
'use strict';
if(window.__kokmatchNoFlashResume638)return;
window.__kokmatchNoFlashResume638=true;
window.__kokmatchResumeDebug638={silentCalls:0,baseCalls:0,structuralCount:0,lastStructural:null,lastClean:null};
let resumePromise638=null,lastResumeAt638=0,backgrounded638=false;
function armNoRail638(ms=1800){
 const until=Date.now()+Math.max(200,Number(ms)||1800),old=Number(window.__kokmatchResumeNoRailReplaceUntil638||0);
 if(until>old)window.__kokmatchResumeNoRailReplaceUntil638=until;
}
function markBackground638(){backgrounded638=true;armNoRail638(60000)}
function markReturn638(){if(!backgrounded638)return false;armNoRail638(1800);setTimeout(()=>{backgrounded638=false},1900);return true}
window.__kokmatchArmNoRail638=armNoRail638;
window.addEventListener('pagehide',markBackground638,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)markBackground638();else markReturn638()},true);
window.addEventListener('focus',()=>markReturn638(),true);
window.addEventListener('pageshow',e=>{if(e?.persisted)backgrounded638=true;markReturn638()},true);
const token638=()=>{try{return String(T||localStorage.getItem(TOKEN_KEY)||'').trim()}catch{return String(T||'').trim()}};
function staticSig638(list){try{return JSON.stringify((Array.isArray(list)?list:[]).map(m=>[m?.id,m?.name,m?.year,m?.gender,m?.age,m?.cls,m?.type,m?.role,m?.memberSince,m?.inviter]))}catch{return''}}
function userSig638(u){try{return JSON.stringify([u?.memberId,u?.displayName,u?.role,!!u?.globalAdmin,!!u?.tempOrganizer,u?.groupId])}catch{return''}}
function cardId638(card){return String(card?.dataset?.memberId22||card?.dataset?.memberId||card?.dataset?.memberId46||card?.dataset?.memberId80||'')}
function copySlot638(cur,next){if(!cur||!next)return false;if(cur.innerHTML!==next.innerHTML)cur.innerHTML=next.innerHTML;return true}
function patchCard638(card,m){
 if(!card||!m||typeof memberControls!=='function')return false;
 const cur=card.querySelector(':scope > .kmRosterActions621');
 const probe=document.createElement('div');probe.innerHTML=memberControls(m);const next=probe.firstElementChild;
 if(!cur||!next||!next.classList.contains('kmRosterActions621'))return false;
 if(cur.className!==next.className)cur.className=next.className;
 const cs=cur.querySelector(':scope > .status'),ns=next.querySelector(':scope > .status');if(cs&&ns&&cs.textContent!==ns.textContent)cs.textContent=ns.textContent;
 const cr=cur.querySelector(':scope > .kmRosterBtns621'),nr=next.querySelector(':scope > .kmRosterBtns621');if(!cr||!nr)return false;
 const hidden=nr.getAttribute('aria-hidden');if(hidden===null){if(cr.hasAttribute('aria-hidden'))cr.removeAttribute('aria-hidden')}else if(cr.getAttribute('aria-hidden')!==hidden)cr.setAttribute('aria-hidden',hidden);
 for(const key of ['first','second','edit']){const c=cr.querySelector(`:scope > .kmRosterSlot-${key}621`),n=nr.querySelector(`:scope > .kmRosterSlot-${key}621`);if(!copySlot638(c,n))return false}
 const gc=card.querySelector('.gamecnt');if(gc){const t=`총 게임 ${Number(m?.totalGames)||0}회`;if(gc.textContent!==t)gc.textContent=t}
 return true;
}
function preservePage638(page,y){try{if(typeof window.memberPageGo46==='function'&&Number(page)>1)window.memberPageGo46(Number(page))}catch{}requestAnimationFrame(()=>{try{scrollTo(0,Math.max(0,Number(y)||0))}catch{}})}
async function silentResume638(){
 const gid=String(currentGroupId||''),oldS=S,oldUser=me,page=Number(window.__kokmatchMemberPage46||1),y=Math.max(0,scrollY||0),oldStatic=staticSig638(S?.members),oldUserSig=userSig638(me);
 armNoRail638(1800);
 const x=await request('state','GET',null,{groupId:gid});if(!x?.data)return x;
 const nextGroup=x.group||group,nextStatic=staticSig638(x.data?.members),nextUserSig=userSig638(x.user||oldUser);
 const structural=oldStatic!==nextStatic||oldUserSig!==nextUserSig||(gid&&String(nextGroup?.groupId||gid)!==gid);
 window.__kokmatchResumeDebug638.lastStructural={structural,oldStaticLen:oldStatic.length,nextStaticLen:nextStatic.length,oldUserSig,nextUserSig,gid,nextGid:String(nextGroup?.groupId||'')};
 S=x.data;window.S=S;me=x.user||me;group=nextGroup;groups=x.groups||groups;if(group?.groupId){currentGroupId=String(group.groupId);try{localStorage.setItem(GROUP_KEY,currentGroupId)}catch{}}try{normalizeClient()}catch{}
 if(structural){
  window.__kokmatchResumeDebug638.structuralCount++;
  window.__kokmatchResumeNoRailReplaceUntil638=0;
  renderAll();preservePage638(page,y);lastResumeAt638=Date.now();return x;
 }
 try{renderHeader()}catch{}
 const box=document.getElementById('members'),map=new Map((Array.isArray(S?.members)?S.members:[]).map(m=>[String(m?.id||''),m]));let clean=!!box;
 if(box){for(const card of box.querySelectorAll('.memberCard')){const m=map.get(cardId638(card));if(!m||!patchCard638(card,m)){clean=false;break}}}
 window.__kokmatchResumeDebug638.lastClean=clean;
 if(!clean){window.__kokmatchResumeNoRailReplaceUntil638=0;try{window.__kokmatchStabilizeRoster637?.(true)}catch{}}
 try{window.__kokmatchRenderGlobalVersion634?.()}catch{}
 lastResumeAt638=Date.now();return x;
}
const baseLoadState638=loadState;
loadState=async function(...args){
 const silent=args[0]===true&&!!(token638()&&me&&group&&currentGroupId)&&currentView==='members'&&!document.hidden&&Date.now()>=Number(window.__kokmatchFreshLoginUntil630||0);
 if(!silent){window.__kokmatchResumeDebug638.baseCalls++;return baseLoadState638.apply(this,args)}
 window.__kokmatchResumeDebug638.silentCalls++;
 if(resumePromise638)return resumePromise638;if(Date.now()-lastResumeAt638<650)return true;
 resumePromise638=silentResume638();try{return await resumePromise638}finally{resumePromise638=null}
};
window.loadState=loadState;window.__kokmatchSilentResume638=silentResume638;
})();
'''
js+=patch
(root/f'app-v{NEW}.js').write_text(js,encoding='utf-8')
(root/f'app-v{NEW}.css').write_text((root/f'app-v{OLD}.css').read_text(encoding='utf-8'),encoding='utf-8')
index=(root/'index.html').read_text(encoding='utf-8').replace(OLD,NEW);(root/'index.html').write_text(index,encoding='utf-8')
manifest=(root/'manifest.webmanifest').read_text(encoding='utf-8').replace(OLD,NEW);(root/'manifest.webmanifest').write_text(manifest,encoding='utf-8')
ksw=(root/'kokmatch-sw.js').read_text(encoding='utf-8').replace(OLD,NEW);(root/'kokmatch-sw.js').write_text(ksw,encoding='utf-8')
sw=(root/'sw.js').read_text(encoding='utf-8');sw=re.sub(r"kokmatch-sw\.js\?v=\d+(?:\.\d+)+",f"kokmatch-sw.js?v={NEW}",sw);(root/'sw.js').write_text(sw,encoding='utf-8')
latest={'version':78,'label':'v6.38','semanticVersion':'6.38','build':'v6.38','updatedAt':'2026-09-03T15:55:00+09:00','note':'v6.38 홈화면 복귀 시 회원명부 전체 재렌더 제거 · 기존 카드/버튼 레일 유지 · 상태 슬롯만 1회 동기화'}
(root/'latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert '__kokmatchNoFlashResume638' in js
assert '__kokmatchResumeNoRailReplaceUntil638' in js and '__kokmatchArmNoRail638' in js
assert f'/app-v{NEW}.js?v={NEW}' in index and f'/app-v{NEW}.css?v={NEW}' in index
assert f'kmv={NEW}' in manifest and f"KOKMATCH_SW_VERSION='{NEW}'" in ksw and f'kokmatch-sw.js?v={NEW}' in sw
print('built v6.38')
