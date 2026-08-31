import fs from 'node:fs';

const JS='app-v6.0.js',CSS='app-v6.0.css';
let src=fs.readFileSync(JS,'utf8'),css=fs.readFileSync(CSS,'utf8');
if(!src.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');

const legacy='/* migrated into v6.0: app-v5.4-fix22.js */',canonical='/* v6.0 canonical member roster */';
let start=src.indexOf(canonical);
if(start<0){start=src.indexOf(legacy);if(start<0)throw new Error('Roster section not found');src=src.slice(0,start)+canonical+src.slice(start+legacy.length)}
start=src.indexOf(canonical);let end=src.indexOf('/* v6.0 canonical interaction core',start);if(end<0)end=src.lastIndexOf("\nwindow.__kokmatchStandalone='6.0';");if(end<=start)throw new Error('Roster section end not found');
let section=src.slice(start,end);
section=section.replace("window.__kokmatchRosterCanonical='22.3';","window.__kokmatchRosterCanonical='22.3';\nwindow.__kokmatchRosterCanonicalV6='6.0.1';\ndocument.documentElement.dataset.kokmatchRoster='6.0.1';");
section=section.replace('>모임관리자</span>','>모임장</span>').replace('>게임편성자</span>','>운영진</span>').replace('>임시편성자</span>','>편성자</span>').replace('>일반회원</span>','>일반</span>');

const pv=section.indexOf('function patchVisibleInfo22(card,m){'),fn=section.indexOf('\nfunction finalizeRoster22()',pv);if(pv<0||fn<0)throw new Error('Roster info function not found');
const infoFn=[
"function businessMonth22(){const d=new Date(Date.now()-5*60*60*1000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).format(d)}",
"function monthLabel22(){return Number(businessMonth22().slice(5,7))+'월'}",
"function attendanceCount22(m){const k=businessMonth22(),h=m?.attendanceHistory&&typeof m.attendanceHistory==='object'&&!Array.isArray(m.attendanceHistory)?m.attendanceHistory:null;if(h&&h[k]!=null)return Math.max(0,Number(h[k])||0);return String(m?.attendanceMonth||'')===k?Math.max(0,Number(m?.attendanceCount)||0):0}",
"function canPartner22(m){return !!m&&!!me&&(String(me.memberId||'')===String(m.id)||me.globalAdmin||me.role==='manager'||me.role==='organizer')}",
"function patchVisibleInfo22(card,m){",
" const info=card.querySelector('.memberInfo48')||card.children?.[1];if(!info)return;info.classList.add('memberInfoV6');",
" const line=info.querySelector('.memberMainLine45')||info.querySelector('.name');if(line){line.classList.add('memberMainLine45');line.innerHTML=\"<span class='memberName45'>\"+e22(m.name)+\"</span>\"+grade22(m)+roleBadge22(m)}",
" info.querySelectorAll('.gamecnt,.recordBtn73,.pairBtn,.memberAttendance71').forEach(x=>x.remove());",
" const meta=info.querySelector(':scope > .meta')||info.querySelector('.meta');if(meta){meta.classList.add('memberMetaV6');meta.innerHTML=e22(m.year||'')+'년생 · '+e22(m.gender||'')}",
" info.querySelectorAll('.memberRecordActions73,.memberRosterFooterV6').forEach(x=>x.remove());",
" const footer=document.createElement('div');footer.className='memberRosterFooterV6';footer.innerHTML=\"<span class='memberAttendanceV6'>\"+monthLabel22()+' 출석 '+attendanceCount22(m)+\"회</span>\"+(canPartner22(m)?\"<button type='button' class='partnerSetBtn66 rosterPartnerBtnV6'>파트너 설정</button>\":'');info.appendChild(footer);",
" card.dataset.gradeV6=String(m?.cls||'C').trim().toUpperCase();card.dataset.memberId22=String(m?.id||'');card.dataset.memberId=String(m?.id||'');card.querySelectorAll('.v54genderText,.genderMark53').forEach(x=>x.remove());",
"}"
].join('\n');
section=section.slice(0,pv)+infoFn+section.slice(fn);src=src.slice(0,start)+section+src.slice(end);

const rb='/* V6_ROSTER_REENTRY_BEGIN */',re='/* V6_ROSTER_REENTRY_END */';let a=src.indexOf(rb),b=src.indexOf(re);if(a>=0&&b>a)src=src.slice(0,a)+src.slice(b+re.length);
const reentry=[rb,"(()=>{'use strict';let busy=false;function repair(){if(busy||currentView!=='members')return;busy=true;try{const q=String(document.getElementById('memberSearchInput46')?.value||'').trim();if(!q&&typeof window.resetMemberList46==='function')window.resetMemberList46();else if(typeof renderMembers==='function')renderMembers();try{window.__kokmatchFinalizeRoster22?.()}catch{}}catch(e){console.warn('v6 roster reentry',e)}finally{setTimeout(()=>{busy=false},100)}}const old=goView;goView=function(id,...args){const was=currentView,r=old(id,...args);if(id==='members'&&was!=='members'){queueMicrotask(repair);requestAnimationFrame(repair);setTimeout(repair,80)}return r};window.goView=goView;})();",re].join('\n');
const core=src.indexOf('/* v6.0 canonical interaction core');if(core<0)throw new Error('Interaction core missing');src=src.slice(0,core)+reentry+'\n\n'+src.slice(core);

const cb='/* V6_CANONICAL_ROSTER_CSS_BEGIN */',ce='/* V6_CANONICAL_ROSTER_CSS_END */';a=css.indexOf(cb);b=css.indexOf(ce);if(a>=0&&b>a)css=css.slice(0,a)+css.slice(b+ce.length);
const block=[cb,
'#members .memberCard{grid-template-columns:46px minmax(0,1fr) 104px!important;column-gap:7px!important;align-items:center!important;padding:10px 9px!important;overflow:visible!important}',
'#members .memberInfo48,#members .memberInfoV6{min-width:0!important;width:100%!important;overflow:visible!important;position:static!important;transform:none!important}',
'#members .memberMainLine45{display:flex!important;align-items:center!important;flex-wrap:nowrap!important;gap:4px!important;min-width:0!important;overflow:visible!important;white-space:nowrap!important}',
'#members .memberName45{display:inline-block!important;flex:0 0 auto!important;min-width:4.05em!important;max-width:none!important;width:auto!important;overflow:visible!important;text-overflow:clip!important;white-space:nowrap!important;font-size:14px!important;line-height:1.25!important}',
'#members .memberMainLine45 .tag,#members .memberMainLine45 .roleBadge{flex:0 0 auto!important;margin:0!important;font-size:9.5px!important;padding:2px 4px!important;white-space:nowrap!important}',
'#members .gamecnt,#members .recordBtn73,#members .pairBtn:not(.partnerSetBtn66){display:none!important}',
'#members .memberMetaV6{margin-top:3px!important;font-size:10.5px!important;line-height:1.25!important;white-space:nowrap!important}',
'#members .memberRosterFooterV6{display:flex!important;align-items:center!important;gap:8px!important;min-height:20px!important;margin-top:2px!important;white-space:nowrap!important}',
'#members .memberAttendanceV6{font-size:10.5px!important;line-height:1.2!important;font-weight:800!important;color:#65728b!important}',
'#members .rosterPartnerBtnV6{display:inline-block!important;margin:0!important;padding:2px 0!important;border:0!important;background:transparent!important;color:#516da7!important;font-size:10.5px!important;line-height:1.2!important;font-weight:900!important;text-decoration:underline!important;white-space:nowrap!important}',
'#members .memberActions60,#members .memberActions65,#members .memberActions60 .status,#members .memberActions65 .status,#members .memberBtns,#members .memberBtns65{width:104px!important;min-width:104px!important;max-width:104px!important;justify-self:end!important;margin-left:auto!important}',
'#members .memberBtns,#members .memberBtns65{justify-content:flex-end!important;gap:3px!important}#members .memberBtns .btn,#members .memberBtns65 .btn{padding:6px 5px!important;font-size:10px!important;white-space:nowrap!important}',
'#members .memberCard[data-grade-v6="A"]{background:#fff2f4!important;border-color:#f7c8d0!important}#members .memberCard[data-grade-v6="A"] .grade-a50{background:#ffe2e8!important;color:#a92f4b!important;border-color:#f1b6c2!important}',
'#members .memberCard[data-grade-v6="B"]{background:#fff7ed!important;border-color:#f5d4ac!important}#members .memberCard[data-grade-v6="B"] .grade-b50{background:#ffead2!important;color:#9a5711!important;border-color:#efc58f!important}',
'#members .memberCard[data-grade-v6="C"]{background:#f1f6ff!important;border-color:#c8d8f5!important}#members .memberCard[data-grade-v6="C"] .grade-c50{background:#dfeaff!important;color:#315fa8!important;border-color:#b9cff1!important}',
'#members .memberCard[data-grade-v6="D"]{background:#f1faf5!important;border-color:#c7e7d4!important}#members .memberCard[data-grade-v6="D"] .grade-d50{background:#ddf3e6!important;color:#317450!important;border-color:#b9dfc8!important}',
'#members .memberCard[data-grade-v6="E"]{background:#f7f4ff!important;border-color:#ddd2f3!important}#members .memberCard[data-grade-v6="E"] .grade-e50{background:#ece5ff!important;color:#6b4ea0!important;border-color:#d2c3f2!important}',
'@media(max-width:430px){#members .memberCard{grid-template-columns:44px minmax(0,1fr) 96px!important;column-gap:5px!important;padding-left:7px!important;padding-right:7px!important}#members .memberActions60,#members .memberActions65,#members .memberActions60 .status,#members .memberActions65 .status,#members .memberBtns,#members .memberBtns65{width:96px!important;min-width:96px!important;max-width:96px!important}#members .memberName45{font-size:13.5px!important;min-width:4.05em!important}#members .memberMainLine45{gap:3px!important}#members .memberMainLine45 .tag,#members .memberMainLine45 .roleBadge{font-size:8.8px!important;padding:2px 3px!important}#members .memberMetaV6,#members .memberAttendanceV6,#members .rosterPartnerBtnV6{font-size:9.8px!important}#members .memberRosterFooterV6{gap:6px!important}#members .memberBtns .btn,#members .memberBtns65 .btn{padding:6px 3px!important;font-size:9.5px!important}}',
'@media(max-width:359px){#members .memberCard{grid-template-columns:40px minmax(0,1fr) 90px!important;column-gap:4px!important;padding-left:6px!important;padding-right:6px!important}#members .memberActions60,#members .memberActions65,#members .memberActions60 .status,#members .memberActions65 .status,#members .memberBtns,#members .memberBtns65{width:90px!important;min-width:90px!important;max-width:90px!important}#members .memberName45{font-size:12.8px!important}#members .memberMainLine45 .tag,#members .memberMainLine45 .roleBadge{font-size:8.2px!important;padding:1px 3px!important}#members .memberMetaV6,#members .memberAttendanceV6,#members .rosterPartnerBtnV6{font-size:9.2px!important}}',ce].join('\n');
css=css.trimEnd()+'\n\n'+block+'\n';fs.writeFileSync(JS,src);fs.writeFileSync(CSS,css);console.log('Canonical v6 roster installed.');
