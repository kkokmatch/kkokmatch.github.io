import fs from 'node:fs';

const JS='app-v6.0.js',CSS='app-v6.0.css';
let src=fs.readFileSync(JS,'utf8');
let css=fs.readFileSync(CSS,'utf8');
if(!src.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');

const begin='/* V6_CANONICAL_ROSTER_BEGIN */';
const end='/* V6_CANONICAL_ROSTER_END */';
function removeMarked(text){const a=text.indexOf(begin),b=text.indexOf(end);if(a>=0&&b>a)return text.slice(0,a)+text.slice(b+end.length);return text}
src=removeMarked(src);

const legacy='/* migrated into v6.0: app-v5.4-fix22.js */';
const ls=src.indexOf(legacy);
if(ls>=0){
  let le=src.indexOf('/* migrated into v6.0:',ls+legacy.length);
  const core=src.indexOf('/* v6.0 canonical interaction core',ls+legacy.length);
  const footer=src.lastIndexOf("\nwindow.__kokmatchStandalone='6.0';");
  if(le<0||(core>=0&&core<le))le=core;
  if(le<0)le=footer;
  if(le<=ls)throw new Error('Could not isolate legacy roster section');
  src=src.slice(0,ls)+src.slice(le);
}

const roster=String.raw`${begin}
/* v6.0 canonical member roster: one final owner for roster presentation/re-entry */
(()=>{
'use strict';
window.__kokmatchRosterCanonical='22.3';
window.__kokmatchRosterCanonicalV6='6.0.1';
document.documentElement.dataset.kokmatchRoster='6.0.1';
let reentryBusyV6=false;
function eRoster(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function jsRoster(v){return String(v??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
function memberRoster(id){try{return typeof M==='function'?M(String(id||'')):null}catch{return null}}
function roleTextRoster(r){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':'일반'}
try{roleLabel=roleTextRoster}catch{};window.roleLabel=roleTextRoster;
function roleBadgeRoster(m){
 if(m?.type==='guest')return '<span class="roleBadge guest45">게스트</span>';
 const r=String(m?.role||'member');
 if(r==='admin')return '<span class="roleBadge role-global">개발자</span>';
 if(r==='manager')return '<span class="roleBadge role-manager">모임장</span>';
 if(r==='organizer')return '<span class="roleBadge role-organizer">운영진</span>';
 try{if(typeof isTemp==='function'&&isTemp(m))return '<span class="roleBadge role-temp">편성자</span>'}catch{}
 return '<span class="roleBadge role-member44">일반</span>';
}
function gradeRoster(m){const c=String(m?.cls||'C').trim().toUpperCase(),g=['A','B','C','D','E'].includes(c)?c:'C';return `<span class="tag gradeBadge50 grade-${g.toLowerCase()}50">${eRoster(m?.age||'30')}${eRoster(g)}</span>`}
function businessMonthRoster(){const d=new Date(Date.now()-5*60*60*1000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).format(d)}
function attendanceRoster(m){const month=businessMonthRoster(),h=m?.attendanceHistory&&typeof m.attendanceHistory==='object'&&!Array.isArray(m.attendanceHistory)?m.attendanceHistory:null;if(h&&h[month]!=null)return Math.max(0,Number(h[month])||0);return String(m?.attendanceMonth||'')===month?Math.max(0,Number(m?.attendanceCount)||0):0}
function monthRoster(){return Number(businessMonthRoster().slice(5,7))+'월'}
function canPartnerRoster(m){return !!m&&!!me&&(String(me.memberId||'')===String(m.id)||me.globalAdmin||me.role==='manager'||me.role==='organizer')}
function avatarRoster(card,m){if(!card||!m||typeof avatar!=='function')return;let html='';try{html=String(avatar(m)||'')}catch{};if(!html)return;const t=document.createElement('div');t.innerHTML=html;const n=t.firstElementChild;if(!n)return;n.dataset.memberId22=String(m.id||'');const cur=[...card.children].find(x=>x?.classList?.contains('avatar'))||card.querySelector('.profileIdentity21,.profileIdentity80,.genderAvatar39,.genderPerson54');if(cur)cur.replaceWith(n);else card.insertBefore(n,card.firstChild)}
function controlsRoster(card,m){if(!card||!m||typeof memberControls!=='function')return;let html='';try{html=String(memberControls(m)||'')}catch{};if(!html)return;const t=document.createElement('div');t.innerHTML=html;const n=t.firstElementChild;if(!n)return;const info=card.querySelector('.memberInfo48')||card.children?.[1],kids=[...card.children],old=kids.length>=3?kids[kids.length-1]:null;if(old&&old!==info&&!old.classList.contains('avatar'))old.replaceWith(n);else if(!card.contains(n))card.appendChild(n)}
function actionsRoster(card,m){const id=jsRoster(m?.id||'');card.querySelectorAll('button[onclick]').forEach(btn=>{const raw=String(btn.getAttribute('onclick')||'');if(/^\s*setOther\s*\(/.test(raw)){const state=(raw.match(/setOther\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]/)||[])[1];if(state)btn.setAttribute('onclick',`setOther('${id}','${state}')`)}else if(/^\s*openEditMember\s*\(/.test(raw))btn.setAttribute('onclick',`openEditMember('${id}')`)});const p=card.querySelector('.rosterPartnerBtnV6');if(p)p.setAttribute('onclick',`openPartner66('${id}')`)}
function infoRoster(card,m){
 const info=card.querySelector('.memberInfo48')||card.children?.[1];if(!info)return;
 info.classList.add('memberInfoV6');
 const line=info.querySelector('.memberMainLine45')||info.querySelector('.name');
 if(line){line.classList.add('memberMainLine45');line.innerHTML=`<span class="memberName45">${eRoster(m.name)}</span>${gradeRoster(m)}${roleBadgeRoster(m)}`}
 info.querySelectorAll('.gamecnt,.recordBtn73,.pairBtn:not(.partnerSetBtn66),.memberAttendance71').forEach(x=>x.remove());
 const meta=info.querySelector(':scope > .meta')||info.querySelector('.meta');
 if(meta){meta.classList.add('memberMetaV6');meta.innerHTML=`${eRoster(m.year||'')}년생 · ${eRoster(m.gender||'')}`}
 info.querySelectorAll('.memberRecordActions73,.memberRosterFooterV6').forEach(x=>x.remove());
 const footer=document.createElement('div');footer.className='memberRosterFooterV6';
 footer.innerHTML=`<span class="memberAttendanceV6">${monthRoster()} 출석 ${attendanceRoster(m)}회</span>${canPartnerRoster(m)?`<button type="button" class="pairBtn partnerSetBtn66 rosterPartnerBtnV6" onclick="openPartner66('${jsRoster(m.id)}')">파트너 설정</button>`:''}`;
 info.appendChild(footer);
 card.dataset.gradeV6=String(m?.cls||'C').toUpperCase();
 card.dataset.memberId22=String(m?.id||'');
 card.dataset.memberId=String(m?.id||'');
}
function finalizeRosterV6(){const box=document.getElementById('members');if(!box)return;for(const card of box.querySelectorAll('.memberCard')){const id=String(card.dataset.memberId46||card.dataset.memberId22||card.dataset.memberId||'');const m=memberRoster(id);if(!m)continue;infoRoster(card,m);avatarRoster(card,m);controlsRoster(card,m);actionsRoster(card,m)}window.__kokmatchRosterFinalizedV6=Date.now()}
window.__kokmatchFinalizeRosterV6=finalizeRosterV6;
function userFirstRoster(list){const a=Array.isArray(list)?list:[],id=String(me?.memberId||'');if(!id)return a.slice();const mine=a.find(m=>String(m?.id||'')===id);return mine?[mine,...a.filter(m=>String(m?.id||'')!==id)]:a.slice()}
const renderMembersBeforeV6=renderMembers;
renderMembers=function(){let original=null,reordered=false;try{if(Array.isArray(S?.members)&&S.members.length&&me?.memberId){original=S.members;const next=userFirstRoster(original);if(next.length===original.length&&next.some((m,i)=>m!==original[i])){S.members=next;reordered=true}}}catch{};try{const r=renderMembersBeforeV6();finalizeRosterV6();requestAnimationFrame(finalizeRosterV6);return r}finally{if(reordered&&original)S.members=original}};
window.renderMembers=renderMembers;
function repairReentryV6(){if(reentryBusyV6||currentView!=='members')return;reentryBusyV6=true;try{const box=document.getElementById('members'),q=String(document.getElementById('memberSearchInput46')?.value||'').trim();if(!q&&typeof window.resetMemberList46==='function')window.resetMemberList46();else renderMembers();finalizeRosterV6();requestAnimationFrame(finalizeRosterV6)}catch(e){console.warn('v6 roster re-entry repair',e);try{renderMembers()}catch{}}finally{setTimeout(()=>{reentryBusyV6=false},80)}}
const goViewBeforeV6=goView;
goView=function(id,...args){const before=currentView,r=goViewBeforeV6(id,...args);if(id==='members'&&before!=='members'){queueMicrotask(repairReentryV6);requestAnimationFrame(repairReentryV6);setTimeout(repairReentryV6,80)}return r};
window.goView=goView;
const renderAllBeforeV6=renderAll;
renderAll=function(...args){const r=renderAllBeforeV6(...args);if(currentView==='members'){finalizeRosterV6();requestAnimationFrame(finalizeRosterV6)}return r};
window.renderAll=renderAll;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(finalizeRosterV6,0),{once:true});else setTimeout(finalizeRosterV6,0);
})();
${end}`;

const coreAt=src.indexOf('/* v6.0 canonical interaction core');
const footerAt=src.lastIndexOf("\nwindow.__kokmatchStandalone='6.0';");
const insertAt=coreAt>=0?coreAt:footerAt;
if(insertAt<0)throw new Error('v6 insertion point missing');
src=src.slice(0,insertAt)+roster+'\n\n'+src.slice(insertAt);

const cssBegin='/* V6_CANONICAL_ROSTER_CSS_BEGIN */',cssEnd='/* V6_CANONICAL_ROSTER_CSS_END */';
const ca=css.indexOf(cssBegin),cb=css.indexOf(cssEnd);if(ca>=0&&cb>ca)css=css.slice(0,ca)+css.slice(cb+cssEnd.length);
const cssBlock=`${cssBegin}
/* v6 roster final layout: four-character names, right-side controls, grade pastel cards */
#members .memberCard{grid-template-columns:46px minmax(0,1fr) 104px!important;column-gap:7px!important;align-items:center!important;padding:10px 9px!important;overflow:visible!important}
#members .memberCard .memberInfo48,#members .memberCard .memberInfoV6{min-width:0!important;width:100%!important;overflow:visible!important;position:static!important;transform:none!important}
#members .memberMainLine45{display:flex!important;align-items:center!important;flex-wrap:nowrap!important;gap:4px!important;min-width:0!important;overflow:visible!important;white-space:nowrap!important}
#members .memberName45{display:inline-block!important;flex:0 0 auto!important;min-width:4.05em!important;max-width:none!important;width:auto!important;overflow:visible!important;text-overflow:clip!important;white-space:nowrap!important;font-size:14px!important;line-height:1.25!important}
#members .memberMainLine45 .tag,#members .memberMainLine45 .roleBadge{flex:0 0 auto!important;margin:0!important;font-size:9.5px!important;padding:2px 4px!important;white-space:nowrap!important}
#members .memberMainLine45 .gamecnt,#members .recordBtn73,#members .pairBtn:not(.partnerSetBtn66){display:none!important}
#members .memberMetaV6{margin-top:3px!important;font-size:10.5px!important;line-height:1.25!important;white-space:nowrap!important}
#members .memberRosterFooterV6{display:flex!important;align-items:center!important;gap:8px!important;min-height:20px!important;margin-top:2px!important;white-space:nowrap!important}
#members .memberAttendanceV6{font-size:10.5px!important;line-height:1.2!important;font-weight:800!important;color:#65728b!important}
#members .rosterPartnerBtnV6{display:inline-block!important;margin:0!important;padding:2px 0!important;border:0!important;background:transparent!important;color:#516da7!important;font-size:10.5px!important;line-height:1.2!important;font-weight:900!important;text-decoration:underline!important;white-space:nowrap!important}
#members .memberActions60,#members .memberActions65{width:104px!important;min-width:104px!important;max-width:104px!important;justify-self:end!important;margin-left:auto!important;transform:none!important}
#members .memberActions60 .status,#members .memberActions65 .status{width:104px!important;max-width:104px!important;text-align:right!important}
#members .memberBtns,#members .memberBtns65{width:104px!important;max-width:104px!important;justify-content:flex-end!important;gap:3px!important}
#members .memberBtns .btn,#members .memberBtns65 .btn{padding:6px 5px!important;font-size:10px!important;white-space:nowrap!important}
#members .memberCard[data-grade-v6="A"]{background:#fff2f4!important;border-color:#f7c8d0!important}#members .memberCard[data-grade-v6="A"] .grade-a50{background:#ffe2e8!important;color:#a92f4b!important;border-color:#f1b6c2!important}
#members .memberCard[data-grade-v6="B"]{background:#fff7ed!important;border-color:#f5d4ac!important}#members .memberCard[data-grade-v6="B"] .grade-b50{background:#ffead2!important;color:#9a5711!important;border-color:#efc58f!important}
#members .memberCard[data-grade-v6="C"]{background:#f1f6ff!important;border-color:#c8d8f5!important}#members .memberCard[data-grade-v6="C"] .grade-c50{background:#dfeaff!important;color:#315fa8!important;border-color:#b9cff1!important}
#members .memberCard[data-grade-v6="D"]{background:#f1faf5!important;border-color:#c7e7d4!important}#members .memberCard[data-grade-v6="D"] .grade-d50{background:#ddf3e6!important;color:#317450!important;border-color:#b9dfc8!important}
#members .memberCard[data-grade-v6="E"]{background:#f7f4ff!important;border-color:#ddd2f3!important}#members .memberCard[data-grade-v6="E"] .grade-e50{background:#ece5ff!important;color:#6b4ea0!important;border-color:#d2c3f2!important}
@media(max-width:430px){#members .memberCard{grid-template-columns:44px minmax(0,1fr) 96px!important;column-gap:5px!important;padding-left:7px!important;padding-right:7px!important}#members .memberActions60,#members .memberActions65,#members .memberActions60 .status,#members .memberActions65 .status,#members .memberBtns,#members .memberBtns65{width:96px!important;min-width:96px!important;max-width:96px!important}#members .memberName45{font-size:13.5px!important;min-width:4.05em!important}#members .memberMainLine45{gap:3px!important}#members .memberMainLine45 .tag,#members .memberMainLine45 .roleBadge{font-size:8.8px!important;padding:2px 3px!important}#members .memberMetaV6,#members .memberAttendanceV6,#members .rosterPartnerBtnV6{font-size:9.8px!important}#members .memberRosterFooterV6{gap:6px!important}#members .memberBtns .btn,#members .memberBtns65 .btn{padding:6px 3px!important;font-size:9.5px!important}}
@media(max-width:359px){#members .memberCard{grid-template-columns:40px minmax(0,1fr) 90px!important;column-gap:4px!important;padding-left:6px!important;padding-right:6px!important}#members .memberActions60,#members .memberActions65,#members .memberActions60 .status,#members .memberActions65 .status,#members .memberBtns,#members .memberBtns65{width:90px!important;min-width:90px!important;max-width:90px!important}#members .memberName45{font-size:12.8px!important}#members .memberMainLine45 .tag,#members .memberMainLine45 .roleBadge{font-size:8.2px!important;padding:1px 3px!important}#members .memberMetaV6,#members .memberAttendanceV6,#members .rosterPartnerBtnV6{font-size:9.2px!important}}
${cssEnd}`;
css=css.trimEnd()+'\n\n'+cssBlock+'\n';

fs.writeFileSync(JS,src);
fs.writeFileSync(CSS,css);
console.log('Installed v6 canonical roster, role labels, attendance/partner row, grade pastel layout and re-entry repair.');
