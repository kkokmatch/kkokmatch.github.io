(()=>{
if(window.__kokmatchV54Fix16)return;
window.__kokmatchV54Fix16=true;
window.__kokmatchFeedbackPatch='16.0';
const FEEDBACK_URL16='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-feedback-v54';

function style16(){
 if(document.getElementById('v54fix16style'))return;
 const s=document.createElement('style');s.id='v54fix16style';s.textContent=`
.topActions16{display:flex;flex-direction:column;align-items:stretch;gap:5px;flex:0 0 auto}
.topActions16 .logout,.feedbackBtn16{white-space:nowrap;width:100%;min-width:72px;text-align:center}
.feedbackBtn16{border:1px solid #ffffff55;background:#ffffff18;color:#fff;border-radius:999px;padding:7px 10px;font-weight:850;font-size:12px;cursor:pointer}
.feedbackBtn16:active{transform:translateY(1px)}
.feedbackTextarea16{width:100%;min-height:112px;max-height:220px;resize:vertical;padding:12px;border:1px solid var(--line);border-radius:12px;background:#fff;font:inherit;line-height:1.5;color:var(--text);box-sizing:border-box}
.feedbackTextarea16:focus,#feedbackTarget16:focus{outline:2px solid #2453d42b;border-color:#91a9ef}
.feedbackCount16{text-align:right;font-size:11px;color:var(--mut);margin-top:4px;font-variant-numeric:tabular-nums}
.feedbackCount16.limit16{color:var(--red);font-weight:900}
@media(max-width:359px){.topActions16{gap:4px}.topActions16 .logout,.feedbackBtn16{min-width:66px;padding:6px 8px;font-size:11px}}
`;
 document.head.appendChild(s)
}

function ensureFeedback16(){
 style16();
 const row=document.querySelector('.toprow');if(!row)return;
 if(row.querySelector('.feedbackBtn16'))return;
 const logout=row.querySelector('.logout');if(!logout)return;
 let actions=row.querySelector('.topActions16');
 if(!actions){actions=document.createElement('div');actions.className='topActions16';logout.replaceWith(actions);actions.appendChild(logout)}
 const b=document.createElement('button');b.type='button';b.className='feedbackBtn16';b.textContent='건의사항';b.addEventListener('click',()=>window.openFeedback16());actions.appendChild(b);
}

function charCount16(v){return Array.from(String(v||'')).length}
window.feedbackCount16=function(){
 const ta=document.getElementById('feedbackContent16'),counter=document.getElementById('feedbackCount16');if(!ta||!counter)return;
 let chars=Array.from(ta.value||'');if(chars.length>100){chars=chars.slice(0,100);ta.value=chars.join('')}
 const n=charCount16(ta.value);counter.textContent=`${n} / 100`;counter.classList.toggle('limit16',n>=100)
};

window.openFeedback16=function(){
 if(typeof openModal!=='function')return;
 openModal(`<h3>건의사항</h3><div class="note">받는 대상을 선택하고 건의내용을 100자 이내로 작성해주세요.</div><div class="field"><label>받는 대상</label><select id="feedbackTarget16"><option value="">수신 대상 선택</option><option value="developer">개발자</option><option value="manager">모임장</option><option value="organizer">운영진</option></select></div><div class="field"><label>건의내용</label><textarea id="feedbackContent16" class="feedbackTextarea16" maxlength="100" placeholder="불편한 점이나 추가되었으면 하는 기능을 간단히 적어주세요." oninput="feedbackCount16()"></textarea><div id="feedbackCount16" class="feedbackCount16">0 / 100</div></div><div class="acts"><button class="btn ghost" type="button" onclick="closeModal()">취소</button><button id="feedbackSend16" class="btn pri" type="button" onclick="sendFeedback16()">보내기</button></div>`);
 setTimeout(()=>document.getElementById('feedbackTarget16')?.focus(),30)
};

window.sendFeedback16=async function(){
 const target=document.getElementById('feedbackTarget16')?.value||'';
 const ta=document.getElementById('feedbackContent16');
 const content=String(ta?.value||'').trim();
 const btn=document.getElementById('feedbackSend16');
 if(!target)return alert('받는 대상을 선택해주세요.');
 if(!content)return alert('건의내용을 입력해주세요.');
 if(charCount16(content)>100)return alert('건의내용은 100자 이내로 입력해주세요.');
 if(!T)return alert('로그인이 필요합니다.');
 if(btn){btn.disabled=true;btn.textContent='보내는 중...'}
 try{
  const r=await fetch(FEEDBACK_URL16,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+T},body:JSON.stringify({groupId:String(currentGroupId||''),targetRole:target,content}),cache:'no-store'});
  const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.error||'건의사항을 보내지 못했습니다.');
  closeModal();alert('건의사항을 전송했습니다.');
 }catch(e){if(typeof showError==='function')showError(e);else alert(e?.message||String(e))}
 finally{if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='보내기'}}
};

const rh16=typeof renderHeader==='function'?renderHeader:null;
if(rh16){renderHeader=function(){const r=rh16();ensureFeedback16();return r};window.renderHeader=renderHeader}
const ra16=typeof renderAll==='function'?renderAll:null;
if(ra16){renderAll=function(){const r=ra16();ensureFeedback16();return r};window.renderAll=renderAll}
style16();ensureFeedback16();
})();