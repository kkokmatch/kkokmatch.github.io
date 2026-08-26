(()=>{
const CUR54='5.4';
const DRAFT_KEY54='kokmatch_draft_v54_';
function gid54(){return String(currentGroupId||'')}
function draftKey54(){return DRAFT_KEY54+gid54()}
function saveDraft54(){try{if(!gid54()||!Array.isArray(draft))return;localStorage.setItem(draftKey54(),JSON.stringify(draft.slice(0,4)))}catch{}}
function restoreDraft54(){try{if(!gid54()||!Array.isArray(draft))return;const raw=localStorage.getItem(draftKey54());if(!raw)return;const a=JSON.parse(raw);if(!Array.isArray(a))return;const valid=a.slice(0,4).map(id=>id&&typeof M==='function'&&M(id)?id:null);while(valid.length<4)valid.push(null);draft.splice(0,draft.length,...valid)}catch{}}
function clearDraft54(){try{localStorage.removeItem(draftKey54())}catch{}}
function wrapDraft54(name,after){const f=window[name];if(typeof f!=='function'||f.__v54)return;const w=function(...a){const r=f.apply(this,a);Promise.resolve(r).finally(()=>{try{after?.(a,r)}catch{}});return r};w.__v54=true;window[name]=w;try{eval(`${name}=window[name]`)}catch{}}
for(const n of ['draftClick','draftRemove','recommendDraft'])wrapDraft54(n,()=>{saveDraft54();try{renderQueue()}catch{}});
wrapDraft54('registerDraft',()=>{clearDraft54();try{renderQueue()}catch{}});

function style54(){if(document.getElementById('v54style'))return;const s=document.createElement('style');s.id='v54style';s.textContent=`
.composer54 .slots{gap:6px!important}.composer54 .slot54{padding:8px 9px!important;min-height:86px!important}.composer54 .slotTop53{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important}.composer54 .slotName53{display:flex!important;align-items:center!important;gap:4px!important;flex-wrap:wrap!important;margin-top:3px!important}.composer54 .gradeBadge50,.composer54 .tag{margin-left:0!important;margin-right:0!important}.composer54 .genderAvatar39,.composer54 .profileAvatar53,.composer54 .queueProfile53{display:none!important}
.composerGender54{width:24px;height:24px;min-width:24px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%}.composerGender54 svg{width:16px;height:16px;fill:currentColor}.composerGender54.male{color:#3977d5;background:#eef5ff}.composerGender54.female{color:#d85b8f;background:#fff2f7}
.v54genderText{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;min-width:22px;border-radius:50%;font-size:10px;font-weight:900;line-height:1;border:1px solid currentColor;margin-left:4px;vertical-align:middle}.v54genderText.female{color:#d85b8f;background:#fff2f7}.v54genderText.male{color:#3977d5;background:#eef5ff}
.queueCard .profileAvatar53+.v54genderText{margin-left:3px}
#headerRefresh52.v54hidden{display:none!important}
`;document.head.appendChild(s)}
function genderText54(m){const f=m?.gender==='여';return `<span class="v54genderText ${f?'female':'male'}" aria-label="${f?'여':'남'}">${f?'여':'남'}</span>`}
function genderPerson54x(m){const f=m?.gender==='여';return `<span class="composerGender54 ${f?'female':'male'}" title="${f?'여성':'남성'}" aria-label="${f?'여성':'남성'}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg></span>`}
function decorateComposer54(){const box=typeof $==='function'?$('queue'):document.getElementById('queue');if(!box)return;const slots=[...box.querySelectorAll('.composer54 .slot54')];slots.forEach((slot,i)=>{slot.querySelectorAll('.genderPerson54,.genderAvatar39,.profileAvatar53,.queueProfile53,.composerGender54').forEach(x=>x.remove());const id=Array.isArray(draft)?draft[i]:null,m=id&&typeof M==='function'?M(id):null;if(!m)return;let top=slot.querySelector('.slotTop53'),label=slot.querySelector('.slotLabel');if(!top&&label){top=document.createElement('div');top.className='slotTop53';label.parentNode.insertBefore(top,label);top.appendChild(label)}if(top)top.insertAdjacentHTML('beforeend',`<span class="slotBadges53">${genderPerson54x(m)}</span>`);const name=slot.querySelector('.slotName53');const grade=name?.querySelector('.gradeBadge50,.tag');if(grade){grade.style.marginLeft='0';grade.style.marginRight='0'}})}
function decoratePhotoGender54(){const box=typeof $==='function'?$('queue'):document.getElementById('queue');if(!box||typeof sortedQueue!=='function')return;const ids=sortedQueue(),cards=[...box.querySelectorAll('.queueCard')];cards.forEach((c,i)=>{c.querySelectorAll('.v54genderText').forEach(x=>x.remove());const m=ids[i]&&typeof M==='function'?M(ids[i]):null;if(!m)return;const photo=c.querySelector('.profileAvatar53 img');if(photo){const av=photo.closest('.profileAvatar53');av?.insertAdjacentHTML('afterend',genderText54(m))}})}
const rq54=renderQueue;renderQueue=function(){restoreDraft54();const r=rq54();style54();decorateComposer54();decoratePhotoGender54();return r};
const ra54=renderAll;renderAll=function(){restoreDraft54();const r=ra54();style54();try{decorateComposer54();decoratePhotoGender54()}catch{}return r};

if(typeof window.changeProfile53==='function'){
 const oldChange=window.changeProfile53;
 window.changeProfile53=async function(input){if(!input?.files?.[0])return;const r=await oldChange(input);await new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));try{renderMembers();renderQueue();if(currentView==='settings')renderSettings()}catch{}return r};
}

async function syncLatest54(){const b=document.getElementById('headerRefresh52');if(!b)return;try{const r=await fetch('/latest-version.json?t='+Date.now(),{cache:'no-store'});const x=await r.json();const latest=String(x.semanticVersion||x.label||CUR54).replace(/^v/i,'');b.classList.toggle('v54hidden',latest===CUR54);if(latest!==CUR54)b.textContent=`v${latest} 업데이트 · 새로고침`}catch{b.classList.add('v54hidden')}}
function mark54(){document.title='콕매치 v5.4';document.documentElement.dataset.kokmatchVersion='5.4';const old=document.getElementById('currentVersion52');if(old){const v=old.cloneNode(true);v.textContent='v5.4';old.replaceWith(v)}syncLatest54()}
style54();restoreDraft54();setTimeout(()=>{mark54();try{renderQueue()}catch{}},0);setInterval(syncLatest54,30000);
})();