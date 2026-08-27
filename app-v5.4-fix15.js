(()=>{
if(window.__kokmatchV54Fix15)return;
window.__kokmatchV54Fix15=true;
window.__kokmatchStatsUsabilityPatch='15.0';

const PAGE_SIZE15=20,MAX_DIFF_DAYS15=30;
let page15=1,lastTable15=null,raf15=0,rangeMsgTimer15=0;

function date15(s){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||''));return m?new Date(Date.UTC(+m[1],+m[2]-1,+m[3])):null}
function fmt15(d){return d&&Number.isFinite(d.getTime())?d.toISOString().slice(0,10):''}
function add15(s,n){const d=date15(s);if(!d)return s;d.setUTCDate(d.getUTCDate()+n);return fmt15(d)}
function diff15(a,b){const A=date15(a),B=date15(b);return A&&B?Math.round((B-A)/86400000):0}
function esc15(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}

function style15(){
 if(document.getElementById('v54fix15style'))return;
 const s=document.createElement('style');s.id='v54fix15style';s.textContent=`
#stats .personalTable11.statsPersonal14 .rank11.r1{background:linear-gradient(180deg,#ffe98a 0%,#e7b92f 100%)!important;color:#5d4700!important;border:1px solid #d6a91f!important;box-shadow:inset 0 1px rgba(255,255,255,.72)!important}
#stats .personalTable11.statsPersonal14 .rank11.r2{background:linear-gradient(180deg,#f1f4f7 0%,#bcc5cf 100%)!important;color:#4b5664!important;border:1px solid #aab5c0!important;box-shadow:inset 0 1px rgba(255,255,255,.85)!important}
#stats .personalTable11.statsPersonal14 .rank11.r3{background:linear-gradient(180deg,#e7b086 0%,#b8733f 100%)!important;color:#fff!important;border:1px solid #a96534!important;box-shadow:inset 0 1px rgba(255,255,255,.4)!important}
#stats .statsPager15{display:flex;align-items:center;justify-content:center;gap:8px;margin:8px 0 2px;padding:6px 4px;color:#687383;font-size:10.5px;font-weight:800}
#stats .statsPager15 button{height:30px;min-width:50px;padding:0 10px;border:1px solid #d8dee7;border-radius:8px;background:#fff;color:#394454;font-size:10.5px;font-weight:850}
#stats .statsPager15 button:disabled{opacity:.38}
#stats .pagerCount15{min-width:88px;text-align:center;white-space:nowrap}
#stats .rangeNote15{margin:-2px 2px 7px;color:#8a93a0;font-size:9.5px;line-height:1.35;text-align:right}
#stats .rangeNote15.warn{color:#a46a19;font-weight:800}
@media(max-width:374px){#stats .statsPager15{gap:5px}.statsPager15 button{min-width:45px;padding:0 8px}.pagerCount15{min-width:80px}}
`;
 document.head.appendChild(s)
}

function canonicalBadge15(btn){
 if(!(btn instanceof Element))return;
 const raw=String(btn.textContent||'').replace(/\s+/g,'').toUpperCase();
 const m=/^(.*?)([A-E])$/.exec(raw);if(!m)return;
 const age=String(m[1]||'').replace(/대/g,'').trim(),grade=m[2];if(!age)return;
 const expected=`grade-${grade.toLowerCase()}50`;
 const current=btn.querySelector('.gradeBadge50');
 if(current&&current.classList.contains(expected)&&String(current.textContent||'').replace(/\s+/g,'').toUpperCase()===age+grade){btn.dataset.grade15=grade;return}
 try{
  if(typeof ageTag==='function'){
   const html=ageTag({age,cls:grade});
   if(html){btn.innerHTML=html;btn.dataset.grade15=grade;return}
  }
 }catch{}
 btn.innerHTML=`<span class="tag gradeBadge50 ${expected}">${esc15(age+grade)}</span>`;btn.dataset.grade15=grade
}
function badges15(){document.querySelectorAll('#stats .personBadgeLink14[data-detail11]').forEach(canonicalBadge15)}

function pager15(){
 const table=document.querySelector('#stats .personalTable11.statsPersonal14');
 if(!table)return;
 if(table!==lastTable15){lastTable15=table;page15=1}
 const rows=[...(table.tBodies?.[0]?.rows||[])].filter(r=>r.cells.length>1);
 const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE15));page15=Math.min(Math.max(1,page15),pages);
 const start=(page15-1)*PAGE_SIZE15,end=start+PAGE_SIZE15;
 rows.forEach((r,i)=>{r.hidden=!(i>=start&&i<end);r.style.display=r.hidden?'none':''});
 let p=table.closest('.recordBox11')?.nextElementSibling;
 if(!p||!p.classList.contains('statsPager15')){p=document.createElement('div');p.className='statsPager15';table.closest('.recordBox11')?.insertAdjacentElement('afterend',p)}
 if(!p)return;
 if(rows.length<=PAGE_SIZE15){p.remove();return}
 p.innerHTML=`<button type="button" data-page15="prev" ${page15<=1?'disabled':''}>이전</button><span class="pagerCount15">${page15} / ${pages} · 총 ${rows.length}명</span><button type="button" data-page15="next" ${page15>=pages?'disabled':''}>다음</button>`
}

function rangeNote15(msg='',warn=false){
 const box=document.querySelector('#stats .statsPeriodBox11');if(!box)return;
 let n=box.nextElementSibling;
 if(!n||!n.classList.contains('rangeNote15')){n=document.createElement('div');n.className='rangeNote15';box.insertAdjacentElement('afterend',n)}
 n.classList.toggle('warn',warn);n.textContent=msg||'최대 31일 조회 · 개인별 기록은 20명씩 표시';
 if(warn){clearTimeout(rangeMsgTimer15);rangeMsgTimer15=setTimeout(()=>rangeNote15(),2400)}
}
function clampRange15(target){
 const from=document.getElementById('statsFrom11'),to=document.getElementById('statsTo11');if(!from||!to||!from.value||!to.value)return;
 let f=from.value,t=to.value;if(f>t)return;
 if(diff15(f,t)<=MAX_DIFF_DAYS15)return;
 if(target===from)to.value=add15(f,MAX_DIFF_DAYS15);else from.value=add15(t,-MAX_DIFF_DAYS15);
 rangeNote15('최대 31일까지 조회할 수 있어 기간을 자동 조정했습니다.',true)
}

function decorate15(){style15();badges15();pager15();rangeNote15()}
function schedule15(){if(raf15)return;raf15=requestAnimationFrame(()=>{raf15=0;decorate15()})}

window.addEventListener('change',e=>{const t=e.target;if(!(t instanceof HTMLInputElement)||!t.closest('#stats'))return;if(t.id==='statsFrom11'||t.id==='statsTo11'){clampRange15(t);page15=1;queueMicrotask(schedule15)}},true);
document.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('[data-page15]'):null;if(!b)return;e.preventDefault();e.stopPropagation();if(b.dataset.page15==='prev')page15--;else page15++;pager15();document.querySelector('#stats .statsHint11')?.scrollIntoView({block:'nearest',behavior:'smooth'})},true);
document.addEventListener('click',e=>{const h=e.target instanceof Element?e.target.closest('#stats [data-sort11]'):null;if(h){page15=1;setTimeout(schedule15,0)}},true);

function boot15(){style15();decorate15();const box=document.getElementById('stats');if(box)new MutationObserver(schedule15).observe(box,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot15,{once:true});else boot15();
})();