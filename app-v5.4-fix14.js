(()=>{
if(window.__kokmatchV54Fix14)return;
window.__kokmatchV54Fix14=true;
window.__kokmatchPersonalStatsPatch='14.0';

function esc14(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function member14(id){
 try{if(typeof M==='function'){const m=M(id);if(m)return m}}catch{}
 try{const rows=(typeof S!=='undefined'&&Array.isArray(S?.members))?S.members:[];return rows.find(m=>String(m?.id)===String(id))||null}catch{}
 return null
}
function badge14(m,ageText,clsText){
 try{if(m&&typeof ageTag==='function'){const h=ageTag(m);if(h)return h}}catch{}
 const age=String(ageText||'').replace(/대/g,'').trim();
 const cls=String(clsText||'').trim();
 const text=(age+cls)||'-';
 return `<span class="ageGradeFallback14">${esc14(text)}</span>`
}
function gender14(m){const g=String(m?.gender||'').trim();return g==='남'||g==='여'?g:''}

function style14(){
 if(document.getElementById('v54fix14style'))return;
 const s=document.createElement('style');s.id='v54fix14style';s.textContent=`
#stats .recordBox11.personalRedesign14{border:0!important;background:transparent!important;overflow:visible!important}
#stats .personalTable11.statsPersonal14{border-collapse:separate!important;border-spacing:0 6px!important;table-layout:fixed!important;font-size:11px!important}
#stats .personalTable11.statsPersonal14 thead th{background:#eef1f4!important;color:#4d5867!important;border:0!important;padding:8px 2px!important;font-size:10.5px!important;font-weight:850!important;letter-spacing:-.2px;cursor:default!important}
#stats .personalTable11.statsPersonal14 thead th[data-sort11]{cursor:pointer!important}
#stats .personalTable11.statsPersonal14 thead th:first-child{border-radius:9px 0 0 9px}
#stats .personalTable11.statsPersonal14 thead th:last-child{border-radius:0 9px 9px 0}
#stats .personalTable11.statsPersonal14 tbody tr,#stats .personalTable11.statsPersonal14 tbody tr:nth-child(odd),#stats .personalTable11.statsPersonal14 tbody tr:nth-child(even){background:transparent!important}
#stats .personalTable11.statsPersonal14 tbody td{background:#fff!important;color:#27313d!important;border-top:1px solid #e5e9ee!important;border-bottom:1px solid #e5e9ee!important;padding:8px 2px!important;font-weight:720!important;line-height:1.15;vertical-align:middle!important}
#stats .personalTable11.statsPersonal14 tbody td:first-child{border-left:1px solid #e5e9ee!important;border-radius:10px 0 0 10px}
#stats .personalTable11.statsPersonal14 tbody td:last-child{border-right:1px solid #e5e9ee!important;border-radius:0 10px 10px 0}
#stats .personalTable11.statsPersonal14 th:nth-child(1),#stats .personalTable11.statsPersonal14 td:nth-child(1){width:9%!important}
#stats .personalTable11.statsPersonal14 th:nth-child(2),#stats .personalTable11.statsPersonal14 td:nth-child(2){width:25%!important;text-align:left!important;padding-left:4px!important}
#stats .personalTable11.statsPersonal14 th:nth-child(3),#stats .personalTable11.statsPersonal14 td:nth-child(3){width:14%!important}
#stats .personalTable11.statsPersonal14 th:nth-child(4),#stats .personalTable11.statsPersonal14 td:nth-child(4){width:12%!important}
#stats .personalTable11.statsPersonal14 th:nth-child(5),#stats .personalTable11.statsPersonal14 td:nth-child(5){width:13%!important}
#stats .personalTable11.statsPersonal14 th:nth-child(6),#stats .personalTable11.statsPersonal14 td:nth-child(6){width:14%!important}
#stats .personalTable11.statsPersonal14 th:nth-child(7),#stats .personalTable11.statsPersonal14 td:nth-child(7){width:13%!important}
#stats .personalTable11.statsPersonal14 .personLink11{color:#171d26!important;font-weight:850!important;letter-spacing:-.15px;display:inline-flex;align-items:center;max-width:100%;overflow:visible;text-overflow:clip}
#stats .personalTable11.statsPersonal14 .memberName14{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#stats .personalTable11.statsPersonal14 .memberGender14{flex:0 0 auto;margin-left:4px;font-size:9px;font-weight:900;line-height:1;color:#7a8492}
#stats .personalTable11.statsPersonal14 .memberGender14.male{color:#55708c}
#stats .personalTable11.statsPersonal14 .memberGender14.female{color:#aa6074}
#stats .personalTable11.statsPersonal14 .personBadgeLink14{border:0!important;background:transparent!important;padding:0!important;margin:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;max-width:100%}
#stats .personalTable11.statsPersonal14 .ageGradeFallback14{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:21px;padding:0 5px;border-radius:999px;background:#f1f3f6;border:1px solid #dce1e7;color:#414b59;font-size:9.5px;font-weight:900;box-sizing:border-box}
#stats .personalTable11.statsPersonal14 .rank11{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:27px!important;height:21px!important;padding:0 5px!important;border-radius:6px!important;background:#eef1f4!important;color:#687383!important;font-size:9.5px!important;font-weight:900!important;box-sizing:border-box}
#stats .personalTable11.statsPersonal14 .rank11.r1{background:#263548!important;color:#fff!important}
#stats .personalTable11.statsPersonal14 .rank11.r2{background:#667487!important;color:#fff!important}
#stats .personalTable11.statsPersonal14 .rank11.r3{background:#837795!important;color:#fff!important}
#stats .personalTable11.statsPersonal14 .zeroStat11{color:#a3aab4!important;font-weight:750!important}
#stats .personalTable11.statsPersonal14 .todayBubble11{min-width:23px!important;height:21px!important;border-radius:6px!important;background:#f1f3f6!important;border:1px solid #e1e5ea!important;color:#858e9b!important;font-weight:850!important}
#stats .personalTable11.statsPersonal14 .todayBubble11.has{background:#e9f3f1!important;border-color:#d2e5e1!important;color:#2f7167!important}
#stats .personalTable11.statsPersonal14 .sortMark11{color:#7f8997!important;font-size:7.5px!important;margin-left:2px!important}
#stats .statsHint11.personalHint14{background:transparent!important;border:0!important;color:#7b8491!important;padding:4px 2px 3px!important;margin-bottom:1px!important;font-size:10px!important}
@media(max-width:420px){
 #stats .personalTable11.statsPersonal14{font-size:10.5px!important}
 #stats .personalTable11.statsPersonal14 thead th{font-size:9.8px!important;padding:7px 1px!important}
 #stats .personalTable11.statsPersonal14 tbody td{padding:7px 1px!important}
 #stats .personalTable11.statsPersonal14 th:nth-child(2),#stats .personalTable11.statsPersonal14 td:nth-child(2){padding-left:3px!important}
}
@media(max-width:374px){
 #stats .personalTable11.statsPersonal14{font-size:9.8px!important}
 #stats .personalTable11.statsPersonal14 thead th{font-size:9.1px!important}
 #stats .personalTable11.statsPersonal14 .rank11{min-width:24px!important;padding:0 4px!important}
 #stats .personalTable11.statsPersonal14 .memberGender14{font-size:8.5px!important;margin-left:2px!important}
}
`;
 document.head.appendChild(s)
}

function decorate14(){
 style14();
 const table=document.querySelector('#stats .personalTable11');
 if(!table||table.dataset.redesign14==='1')return;
 table.dataset.redesign14='1';table.classList.add('statsPersonal14');
 const box=table.closest('.recordBox11');if(box)box.classList.add('personalRedesign14');
 const hint=document.querySelector('#stats .statsHint11');if(hint){hint.classList.add('personalHint14');hint.textContent='회원 이름 또는 나이·급수 배지를 누르면 상세 기록을 볼 수 있습니다.'}
 const head=table.tHead?.rows?.[0];
 if(head&&head.cells.length>=8){
  head.cells[1].innerHTML=head.cells[1].innerHTML.replace(/^이름/,'회원');
  head.cells[2].innerHTML=head.cells[2].innerHTML.replace(/^나이/,'나이·급수');
  head.cells[3].remove();
 }
 [...(table.tBodies?.[0]?.rows||[])].forEach(row=>{
  if(row.cells.length===1){row.cells[0].colSpan=7;return}
  if(row.cells.length<8)return;
  const cells=[...row.cells],nameCell=cells[1],ageCell=cells[2],clsCell=cells[3];
  const detail=nameCell.querySelector('[data-detail11]');
  const id=String(detail?.dataset?.detail11||'');
  const m=member14(id),g=gender14(m);
  if(detail){
   const name=String(detail.textContent||'').trim();
   detail.innerHTML=`<span class="memberName14">${esc14(name)}</span>${g?`<span class="memberGender14 ${g==='여'?'female':'male'}">${g}</span>`:''}`
  }
  const ageBtn=ageCell.querySelector('[data-detail11]');
  const ageText=String(ageBtn?.textContent||ageCell.textContent||'').trim();
  const clsText=String(clsCell.textContent||'').trim();
  if(ageBtn){ageBtn.classList.add('personBadgeLink14');ageBtn.innerHTML=badge14(m,ageText,clsText)}
  else ageCell.innerHTML=badge14(m,ageText,clsText);
  clsCell.remove()
 })
}
let raf14=0;function schedule14(){if(raf14)return;raf14=requestAnimationFrame(()=>{raf14=0;decorate14()})}
function boot14(){style14();decorate14();const box=document.getElementById('stats');if(box)new MutationObserver(schedule14).observe(box,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot14,{once:true});else boot14();
})();