import fs from 'node:fs';

const JS='app-v6.0.js',CSS='app-v6.0.css';
let js=fs.readFileSync(JS,'utf8'),css=fs.readFileSync(CSS,'utf8');
if(!js.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');
if(!js.includes('function normalizeHeaderV6(){'))throw new Error('Canonical header is missing');

// Keep the visible release name deliberately short. Internal standalone architecture stays v6.0.
js=js.replace(/function buildLabelV6\(\)\{\n const raw=[^\n]+\n const m=[^\n]+\n\}/,"function buildLabelV6(){return 'v6.12'}");
js=js.replaceAll('standalone.10','v6.12').replaceAll('standalone.11','v6.12');
js=js.replace("document.title='콕매치 v6.0 · '+buildLabelV6();","document.title='콕매치 '+buildLabelV6();");

// Do not poison the legacy logout symbol. The canonical button can call the captured logout,
// while any still-rendered safe legacy button remains usable as a fallback.
{
 const s=js.indexOf('function blockLegacyLogoutV6(){');
 const e=s>=0?js.indexOf('\nfunction normalizeHeaderV6(){',s):-1;
 if(s<0||e<0)throw new Error('Legacy logout guard block not found');
 js=js.slice(0,s)+"function blockLegacyLogoutV6(){return true}\n"+js.slice(e+1);
}

// Remove an earlier copy when this script is run repeatedly.
const TB='/* V6_RELIABLE_ACTION_TAP_BEGIN */',TE='/* V6_RELIABLE_ACTION_TAP_END */';
{
 const s=js.indexOf(TB),e=js.indexOf(TE);
 if(s>=0&&e>s)js=js.slice(0,s)+js.slice(e+TE.length);
}
const tapBlock=String.raw`/* V6_RELIABLE_ACTION_TAP_BEGIN */
function installReliableActionTapV6(){
 if(window.__kokmatchReliableActionTapV6)return;
 window.__kokmatchReliableActionTapV6='v6.12';
 let tap=null;
 const pick=t=>t?.closest?.('#topActionsV6 button,#modal .sheet button');
 document.addEventListener('touchstart',ev=>{
  const btn=pick(ev.target),t=ev.touches?.[0];
  if(!btn||btn.disabled||!t){tap=null;return}
  tap={btn,x:t.clientX,y:t.clientY,at:Date.now(),moved:false};
 },{capture:true,passive:true});
 document.addEventListener('touchmove',ev=>{
  if(!tap)return;const t=ev.touches?.[0];if(!t)return;
  if(Math.hypot(t.clientX-tap.x,t.clientY-tap.y)>10)tap.moved=true;
 },{capture:true,passive:true});
 document.addEventListener('touchcancel',()=>{tap=null},{capture:true,passive:true});
 document.addEventListener('touchend',ev=>{
  const a=tap;tap=null;if(!a||a.moved||a.btn.disabled||!a.btn.isConnected)return;
  const t=ev.changedTouches?.[0];if(!t)return;
  if(Math.hypot(t.clientX-a.x,t.clientY-a.y)>10||Date.now()-a.at>900)return;
  const endBtn=pick(ev.target);if(endBtn!==a.btn)return;
  ev.preventDefault();ev.stopPropagation();a.btn.click();
 },{capture:true,passive:false});
}
/* V6_RELIABLE_ACTION_TAP_END */`;
js=js.replace('function normalizeHeaderV6(){',tapBlock+'\nfunction normalizeHeaderV6(){');
js=js.replace('installHeaderStyleV6();blockLegacyLogoutV6();','installHeaderStyleV6();blockLegacyLogoutV6();installReliableActionTapV6();');

const CB='/* V6_UI_STABILITY_CSS_BEGIN */',CE='/* V6_UI_STABILITY_CSS_END */';
{
 const s=css.indexOf(CB),e=css.indexOf(CE);
 if(s>=0&&e>s)css=css.slice(0,s)+css.slice(e+CE.length);
}
const cssBlock=`${CB}
/* Reliable taps in Kakao/iOS: scrolling is handled by the 10px movement threshold in JS. */
#topActionsV6 button,#modal .sheet button{pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
#modal .sheet{pointer-events:auto!important}

/* Restore the original v50 grade badge palette everywhere. */
.grade-a50{background:#A60093!important;color:#fff!important;border-color:transparent!important}
.grade-b50{background:#00CFC6!important;color:#073937!important;border-color:transparent!important}
.grade-c50{background:#10D400!important;color:#063b00!important;border-color:transparent!important}
.grade-d50{background:#DE9999!important;color:#4b2020!important;border-color:transparent!important}
.grade-e50{background:#EBE202!important;color:#3b3800!important;border-color:transparent!important}

/* Keep roster cards pastel, but match each pastel to the restored badge hue. */
#members .memberCard[data-grade-v6="A"]{background:#fff1fd!important;border-color:#edc2e8!important}
#members .memberCard[data-grade-v6="B"]{background:#edfffe!important;border-color:#b8efec!important}
#members .memberCard[data-grade-v6="C"]{background:#f0ffef!important;border-color:#c2efbd!important}
#members .memberCard[data-grade-v6="D"]{background:#fff4f4!important;border-color:#edcccc!important}
#members .memberCard[data-grade-v6="E"]{background:#fffdea!important;border-color:#eee7a7!important}
#members .memberCard[data-grade-v6="A"] .grade-a50{background:#A60093!important;color:#fff!important}
#members .memberCard[data-grade-v6="B"] .grade-b50{background:#00CFC6!important;color:#073937!important}
#members .memberCard[data-grade-v6="C"] .grade-c50{background:#10D400!important;color:#063b00!important}
#members .memberCard[data-grade-v6="D"] .grade-d50{background:#DE9999!important;color:#4b2020!important}
#members .memberCard[data-grade-v6="E"] .grade-e50{background:#EBE202!important;color:#3b3800!important}

/* Compress only vertical whitespace; keep the existing readable font sizes. */
#members .memberCard{padding-top:7px!important;padding-bottom:7px!important}
#members .memberInfo48,#members .memberInfoV6{display:flex!important;flex-direction:column!important;gap:0!important}
#members .memberMainLine45{margin:0!important;line-height:1.15!important}
#members .memberName45{line-height:1.15!important}
#members .memberMetaV6{margin:0!important;padding:0!important;line-height:1.12!important}
#members .memberRosterFooterV6{margin:0!important;padding:0!important;min-height:0!important;gap:6px!important;line-height:1.1!important}
#members .memberAttendanceV6{line-height:1.1!important}
#members .rosterPartnerBtnV6{padding:0!important;min-height:0!important;line-height:1.1!important}
@media(max-width:430px){#members .memberCard{padding-top:6px!important;padding-bottom:6px!important}#members .memberRosterFooterV6{gap:5px!important}}
${CE}`;
css=css.trimEnd()+'\n\n'+cssBlock+'\n';

if(!js.includes("function buildLabelV6(){return 'v6.12'}"))throw new Error('Short build label was not installed');
if(!js.includes("__kokmatchReliableActionTapV6='v6.12'"))throw new Error('Reliable action tap bridge missing');
if(!js.includes('function blockLegacyLogoutV6(){return true}'))throw new Error('Legacy logout fallback is still blocked');
for(const color of ['#A60093','#00CFC6','#10D400','#DE9999','#EBE202'])if(!css.includes(color))throw new Error('Grade palette incomplete: '+color);
if(!css.includes(CB)||!css.includes('memberRosterFooterV6'))throw new Error('Compact roster CSS missing');

fs.writeFileSync(JS,js);fs.writeFileSync(CSS,css);
console.log('v6 short label, reliable header/modal taps, legacy grade colors and compact roster spacing installed.');
