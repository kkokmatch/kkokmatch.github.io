(()=>{
if(window.__kokmatchV54Fix10)return;
window.__kokmatchV54Fix10=true;
window.__kokmatchProfileUiPatch='10.0';
window.__kokmatchCanonicalLogin10=true;
const API10='https://wjelumpbjklfrdjxbesj.supabase.co/functions/v1/kokmatch-multi-api';
const TOKEN10='kokmatch_token',GROUP10='kokmatch_group_id';
let probeBusy10=false,loginBusy10=false,recoverBusy10=false;

function style10(){
 if(document.getElementById('v54fix10style'))return;
 const s=document.createElement('style');s.id='v54fix10style';s.textContent=`
.login input{font-size:16px!important;touch-action:manipulation;-webkit-user-select:text!important;user-select:text!important}
.loginBusy10{opacity:.68;pointer-events:none}
.profileIdentity80.genderVisual10{position:relative!important;overflow:visible!important}
.profileIdentity80.genderFallback80{font-weight:950!important;border-radius:50%!important;display:grid!important;place-items:center!important;cursor:default!important;user-select:none!important}
.profileIdentity80.genderFallback80 svg{display:block!important;width:24px!important;height:24px!important;fill:currentColor!important}
.profileIdentity80.genderFallback80.male{background:#eaf2ff!important;color:#2768e8!important;border:1px solid #b8cef9!important}
.profileIdentity80.genderFallback80.female{background:#fff0f4!important;color:#e34e67!important;border:1px solid #f4bdc9!important}
.profileIdentity80.genderVisual10>.genderBadge10,.profileIdentity80.genderVisual10>.profileGender80{display:none!important}
.profileIdentity80.genderVisual10::after{content:attr(data-gender)!important;position:absolute!important;right:-4px!important;bottom:-3px!important;min-width:18px!important;width:18px!important;height:18px!important;border-radius:999px!important;display:grid!important;place-items:center!important;font-size:9px!important;font-weight:950!important;line-height:1!important;background:#fff!important;border:2px solid currentColor!important;box-shadow:none!important;z-index:5!important;pointer-events:none!important;box-sizing:border-box!important}
.profileIdentity80.genderVisual10.male::after{color:#2768e8!important;background:#fff!important;border-color:#2768e8!important}
.profileIdentity80.genderVisual10.female::after{color:#e34e67!important;background:#fff!important;border-color:#e34e67!important}
@media(max-width:374px){.profileIdentity80.genderFallback80 svg{width:22px!important;height:22px!important}.profileIdentity80.genderVisual10::after{min-width:17px!important;width:17px!important;height:17px!important;font-size:8px!important;right:-3px!important;bottom:-2px!important}}
 `;document.head.appendChild(s)
}
function esc10(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function storageSet10(k,v){try{localStorage.setItem(k,v);return true}catch{return false}}
function storageRemove10(k){try{localStorage.removeItem(k)}catch{}}
function loginBox10(){return typeof $==='function'?$('loginBox'):document.getElementById('loginBox')}
function loginRoot10(){return typeof $==='function'?$('login'):document.getElementById('login')}
function err10(msg){const e=document.getElementById('loginErr');if(e)e.textContent=String(msg||'')}
function busy10(on){const b=loginBox10();b?.classList.toggle('loginBusy10',!!on);b?.querySelectorAll('button,input').forEach(x=>x.disabled=!!on)}
function releaseScreen10(box){if(!box)return;box.classList.remove('loginBusy10');box.querySelectorAll('button,input').forEach(x=>x.disabled=false)}
function prepInput10(el){if(!el)return;el.setAttribute('autocapitalize','off');el.setAttribute('spellcheck','false');el.style.fontSize='16px'}
function blur10(){try{if(document.activeElement instanceof HTMLElement)document.activeElement.blur()}catch{}}
function apiError10(x,status){const e=new Error(String(x?.error||x?.message||`로그인 처리 중 오류가 발생했습니다. (${status})`));e.status=status;return e}
async function req10(api,method='POST',body=null,token='',params={}){
 const u=new URL(API10);u.searchParams.set('api',api);for(const [k,v] of Object.entries(params||{}))if(v!==undefined&&v!==null&&String(v)!=='')u.searchParams.set(k,String(v));
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);
 try{
  const r=await fetch(u,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',signal:ctl.signal});
  const x=await r.json().catch(()=>({}));if(!r.ok)throw apiError10(x,r.status);return x;
 }catch(e){if(e?.name==='AbortError'){const x=new Error('서버 응답이 늦어 로그인에 실패했습니다. 다시 눌러주세요.');x.status=0;throw x}throw e}finally{clearTimeout(tm)}
}
function renderName10(message=''){
 style10();const box=loginBox10();if(!box)return;releaseScreen10(box);
 pendingLoginName='';pendingLoginPin='';
 box.innerHTML=`<h1>🏸 콕매치</h1><div class="meta" style="font-size:14px;margin-bottom:18px">모임 회원 로그인</div><div class="field"><label>등록된 이름</label><input id="loginName" type="text" autocomplete="username" enterkeyhint="next" placeholder="이름"></div><button id="loginNext10" class="btn pri" type="button" style="width:100%">다음</button><div id="loginErr" class="error">${esc10(message)}</div><div class="note" style="margin-top:12px">일반회원은 <b>소속 모임 PIN</b>, 모임관리자·게임편성자는 <b>본인 역할 PIN</b>으로 로그인합니다.</div>`;
 releaseScreen10(box);const inp=document.getElementById('loginName');prepInput10(inp);document.getElementById('loginNext10')?.addEventListener('click',()=>start10());inp?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();start10()}});
 loginRoot10()?.classList.remove('hide');
}
function renderPin10(name,roleLabel='PIN',message=''){
 const box=loginBox10();if(!box)return;releaseScreen10(box);
 box.innerHTML=`<h2>${esc10(roleLabel||'PIN')} 인증</h2><div class="authName">${esc10(name)}</div><div class="field"><label>PIN</label><input id="loginPin" class="pinInput39" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="12" autocomplete="off" enterkeyhint="done" placeholder="PIN 입력"></div><button id="loginSubmit10" class="btn pri" type="button" style="width:100%">로그인</button><div id="loginErr" class="error">${esc10(message)}</div><button id="loginBack10" class="btn ghost" type="button" style="width:100%;margin-top:8px">← 이름 다시 입력</button>`;
 releaseScreen10(box);const pin=document.getElementById('loginPin');prepInput10(pin);pin?.addEventListener('input',()=>{const v=pin.value.replace(/\D/g,'').slice(0,12);if(pin.value!==v)pin.value=v});pin?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();submit10()}});document.getElementById('loginSubmit10')?.addEventListener('click',()=>submit10());document.getElementById('loginBack10')?.addEventListener('click',()=>renderName10());setTimeout(()=>pin?.focus(),40)
}
function renderChoices10(x){
 const box=loginBox10();if(!box)return;releaseScreen10(box);const choices=Array.isArray(x?.choices)?x.choices:[];
 box.innerHTML=`<h2>모임 선택</h2><div class="authName">${esc10(pendingLoginName)}</div><div class="note">접속할 모임을 선택해주세요.</div><div id="loginChoices10" class="choiceList"></div><div id="loginErr" class="error"></div><button id="loginBack10" class="btn ghost" type="button" style="width:100%;margin-top:9px">처음으로</button>`;
 releaseScreen10(box);const list=document.getElementById('loginChoices10');for(const c of choices){const b=document.createElement('button');b.type='button';b.className='choiceBtn';b.innerHTML=`<b>${esc10(c.groupName||'모임')}</b><span class="meta">${esc10(c.roleLabel||'')}</span>`;b.addEventListener('click',()=>submit10(String(c.groupId||'')));list?.appendChild(b)}document.getElementById('loginBack10')?.addEventListener('click',()=>renderName10())
}
async function start10(){
 if(probeBusy10)return;const raw=String(document.getElementById('loginName')?.value||'').trim();const name=typeof raw.normalize==='function'?raw.normalize('NFC'):raw;err10('');if(!name){err10('이름을 입력해주세요.');return}
 probeBusy10=true;busy10(true);blur10();try{const x=await req10('login_probe','POST',{name});pendingLoginName=name;busy10(false);renderPin10(name,x?.roleLabel||'PIN')}catch(e){busy10(false);err10(e?.message||'로그인 정보를 확인하지 못했습니다.')}finally{probeBusy10=false}
}
async function state10(token,gid){
 let last=null;for(let i=0;i<3;i++){try{return await req10('state','GET',null,token,{groupId:gid})}catch(e){last=e;if(e?.status===401)throw e;if(i<2)await new Promise(r=>setTimeout(r,250+i*350))}}throw last||new Error('모임 정보를 불러오지 못했습니다.')
}
function applyState10(x){
 if(!x?.data||!x?.user||!x?.group)throw new Error('로그인 응답 형식이 올바르지 않습니다.');S=x.data;me=x.user;group=x.group;groups=x.groups||groups||[];currentGroupId=String(group.groupId||currentGroupId||'');if(currentGroupId)storageSet10(GROUP10,currentGroupId);if(typeof normalizeClient==='function')normalizeClient();if(typeof renderAll==='function')renderAll();loginRoot10()?.classList.add('hide');pendingLoginPin='';try{const mine=me?.memberId&&typeof M==='function'?M(me.memberId):null;if(mine?.state==='out'&&typeof openEntry==='function')openEntry()}catch{}
 const hide=()=>loginRoot10()?.classList.add('hide');requestAnimationFrame(hide);setTimeout(hide,80);setTimeout(hide,350)
}
async function submit10(groupId=''){
 if(loginBusy10)return;const pin=String(document.getElementById('loginPin')?.value||pendingLoginPin||'').replace(/\D/g,'').trim();if(!pin){err10('PIN을 입력해주세요.');return}if(!pendingLoginName){renderName10('이름부터 다시 입력해주세요.');return}
 pendingLoginPin=pin;loginBusy10=true;busy10(true);blur10();let token='';try{
  const x=await req10('login','POST',{name:pendingLoginName,pin,groupId:String(groupId||'')});if(x?.groupChoiceRequired){busy10(false);renderChoices10(x);return}token=String(x?.token||'');if(!token)throw new Error('로그인 토큰을 받지 못했습니다.');T=token;storageSet10(TOKEN10,token);if(x?.groupId){currentGroupId=String(x.groupId);storageSet10(GROUP10,currentGroupId)}const st=await state10(token,currentGroupId);applyState10(st)
 }catch(e){if(e?.status===401&&token){T='';storageRemove10(TOKEN10)}if(loginBox10()?.querySelector('#loginPin')){busy10(false);err10(e?.message||'로그인에 실패했습니다.')}else renderPin10(pendingLoginName,'PIN',e?.message||'로그인에 실패했습니다.')}finally{loginBusy10=false;busy10(false)}
}
async function recover10(){
 if(recoverBusy10||me||!T)return;recoverBusy10=true;try{const st=await state10(T,String(currentGroupId||''));applyState10(st)}catch(e){T='';storageRemove10(TOKEN10);renderName10(e?.status===401?'로그인 정보가 만료되었습니다. 다시 로그인해주세요.':'기존 로그인 정보를 확인하지 못했습니다. 다시 로그인해주세요.')}finally{recoverBusy10=false}
}
window.renderLoginName=renderName10;window.startLogin=start10;window.submitLogin=submit10;try{renderLoginName=renderName10;startLogin=start10;submitLogin=submit10}catch{}

function member10(id){try{return id&&typeof M==='function'?M(String(id)):null}catch{return null}}
function avatarVisual10(el){
 if(!(el instanceof Element))return;const m=member10(el.dataset.memberId);if(!m)return;const female=String(m.gender||'')==='여',gender=female?'여':'남',photo=el.dataset.photo==='1'&&!!el.querySelector('img');el.dataset.gender=gender;el.classList.add('genderVisual10');el.classList.toggle('male',!female);el.classList.toggle('female',female);
 const sig=`${gender}|${photo?'1':'0'}|${photo?String(el.querySelector('img')?.getAttribute('src')||''):''}`;const intact=photo?!!el.querySelector('img'):!!el.querySelector('svg');if(el.dataset.visual10===sig&&intact)return;el.dataset.visual10=sig;
 el.querySelectorAll(':scope>.genderBadge10,:scope>.profileGender80').forEach(x=>x.remove());
 if(photo){el.classList.remove('genderFallback80','genderAvatar39');return}
 el.classList.add('genderFallback80','genderAvatar39');el.classList.remove('profileTap80','profileAvatar53');el.removeAttribute('role');el.removeAttribute('tabindex');el.setAttribute('aria-label',female?'여성':'남성');el.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M4.5 21c.5-5 3.2-8 7.5-8s7 3 7.5 8z"></path></svg>`
}
function decorate10(){style10();document.querySelectorAll('#members .profileIdentity80,#queue .profileIdentity80').forEach(avatarVisual10)}
let raf10=0;function schedule10(){if(raf10)return;raf10=requestAnimationFrame(()=>{raf10=0;decorate10()})}
try{const rm=renderMembers;renderMembers=function(){const r=rm();schedule10();return r};const rq=renderQueue;renderQueue=function(){const r=rq();schedule10();return r};const ra=renderAll;renderAll=function(){const r=ra();schedule10();return r}}catch{}
const mo10=new MutationObserver(schedule10);function startVisual10(){style10();const a=document.getElementById('members'),b=document.getElementById('queue');if(a)mo10.observe(a,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-gender','data-photo']});if(b)mo10.observe(b,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-gender','data-photo']});schedule10()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startVisual10,{once:true});else startVisual10();

function boot10(){style10();if(T){if(me)loginRoot10()?.classList.add('hide');else setTimeout(recover10,120)}else renderName10()}
window.addEventListener('pageshow',()=>{if(T&&me)loginRoot10()?.classList.add('hide');else if(!T&&!loginBusy10)renderName10()});
setTimeout(boot10,0);
})();