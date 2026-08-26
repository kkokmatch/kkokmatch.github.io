(()=>{
if(window.__kokmatchV54Fix7)return;
window.__kokmatchV54Fix7=true;
window.__kokmatchProfileUiPatch='7.0';

function style7(){
 if(document.getElementById('profileUi70Style'))return;
 const s=document.createElement('style');
 s.id='profileUi70Style';
 s.textContent=`
.profileAvatar53.profileTap70{position:relative!important;overflow:visible!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent}
.profileAvatar53.profileTap70 img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important;display:block!important}
.profileGender70{position:absolute!important;right:-3px!important;bottom:-3px!important;width:18px!important;height:18px!important;border-radius:50%!important;display:grid!important;place-items:center!important;z-index:2!important;border:2px solid #fff!important;font-size:8px!important;font-weight:950!important;line-height:1!important;box-shadow:0 1px 5px #1720332b!important;pointer-events:none!important}
.profileGender70.male{background:#edf4ff!important;color:#2768e8!important}
.profileGender70.female{background:#fff0f3!important;color:#e34e67!important}
.memberCard.memberPhoto70{grid-template-columns:50px minmax(0,1fr) auto!important;column-gap:10px!important}
.memberCard.memberPhoto70 .profileAvatar53{width:50px!important;height:50px!important;min-width:50px!important;font-size:24px!important;justify-self:center!important}
.queueCard.queuePhoto70{grid-template-columns:29px 44px minmax(0,1fr) 18px!important;column-gap:7px!important;align-items:center!important}
.queueCard.queuePhoto70 .queueProfile53{width:44px!important;height:44px!important;min-width:44px!important;margin-left:0!important;justify-self:center!important;font-size:20px!important}
.queueCard.queuePhoto70>.v54genderText{display:none!important}
#profilePhotoModal70{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;background:#0b1020d9;padding:22px;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
#profilePhotoModal70.on{display:flex}
.profilePhotoSheet70{position:relative;width:min(680px,96vw);max-height:92vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.profilePhotoImg70{display:block;max-width:92vw;max-height:82vh;width:auto;height:auto;object-fit:contain;border-radius:18px;background:#fff;box-shadow:0 18px 52px #0007}
.profilePhotoName70{color:#fff;font-size:14px;font-weight:900;text-align:center;text-shadow:0 1px 3px #0008}
.profilePhotoClose70{position:absolute;right:0;top:-8px;width:38px;height:38px;border:0;border-radius:50%;background:#ffffffea;color:#172033;font-size:24px;font-weight:900;display:grid;place-items:center;box-shadow:0 3px 14px #0004;cursor:pointer}
@media(max-width:599px){
 .memberCard57.memberPhoto70{grid-template-columns:46px minmax(0,1fr)!important;column-gap:10px!important}
 .memberCard57.memberPhoto70 .profileAvatar53{width:46px!important;height:46px!important;min-width:46px!important;font-size:22px!important}
 .queueCard.queuePhoto70{grid-template-columns:27px 42px minmax(0,1fr) 16px!important;column-gap:6px!important}
 .queueCard.queuePhoto70 .queueProfile53{width:42px!important;height:42px!important;min-width:42px!important}
 .profileGender70{width:17px!important;height:17px!important;font-size:7.5px!important;right:-2px!important;bottom:-2px!important}
 .profilePhotoImg70{max-width:94vw;max-height:78vh;border-radius:15px}
 .profilePhotoClose70{right:2px;top:-4px;width:36px;height:36px}
}
@media(max-width:374px){
 .memberCard57.memberPhoto70{grid-template-columns:43px minmax(0,1fr)!important;column-gap:8px!important}
 .memberCard57.memberPhoto70 .profileAvatar53{width:43px!important;height:43px!important;min-width:43px!important}
 .queueCard.queuePhoto70{grid-template-columns:24px 39px minmax(0,1fr) 14px!important;column-gap:5px!important}
 .queueCard.queuePhoto70 .queueProfile53{width:39px!important;height:39px!important;min-width:39px!important}
}
@media(min-width:768px){
 .queueCard.queuePhoto70{grid-template-columns:34px 46px minmax(0,1fr) 22px!important;column-gap:8px!important}
 .queueCard.queuePhoto70 .queueProfile53{width:46px!important;height:46px!important;min-width:46px!important}
}
 `;
 document.head.appendChild(s);
}

function popup7(src,name){
 if(!src)return;
 let modal=document.getElementById('profilePhotoModal70');
 if(!modal){
  modal=document.createElement('div');
  modal.id='profilePhotoModal70';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.innerHTML='<div class="profilePhotoSheet70"><button class="profilePhotoClose70" type="button" aria-label="닫기">×</button><img class="profilePhotoImg70" alt="프로필 사진 크게 보기"><div class="profilePhotoName70"></div></div>';
  modal.addEventListener('click',e=>{if(e.target===modal)close7()});
  modal.querySelector('.profilePhotoClose70')?.addEventListener('click',close7);
  document.body.appendChild(modal);
 }
 const img=modal.querySelector('.profilePhotoImg70'),title=modal.querySelector('.profilePhotoName70');
 if(img){img.src=src;img.alt=(name||'프로필')+' 프로필 사진 크게 보기'}
 if(title)title.textContent=name||'';
 modal.classList.add('on');
 try{modal.dataset.prevOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden'}catch{}
 setTimeout(()=>modal.querySelector('.profilePhotoClose70')?.focus(),0);
}
function close7(){
 const modal=document.getElementById('profilePhotoModal70');if(!modal)return;
 modal.classList.remove('on');
 try{document.body.style.overflow=modal.dataset.prevOverflow||''}catch{}
}
window.openProfilePhoto70=popup7;
window.closeProfilePhoto70=close7;
if(!window.__kokmatchProfileEsc70){window.__kokmatchProfileEsc70=true;document.addEventListener('keydown',e=>{if(e.key==='Escape')close7()})}

function bind7(avatar,m,kind){
 if(!avatar||!m)return false;
 const img=avatar.querySelector('img');
 if(!img)return false;
 avatar.classList.add('profileTap70');
 avatar.setAttribute('role','button');
 avatar.setAttribute('tabindex','0');
 avatar.setAttribute('aria-label',`${String(m.name||'회원')} 프로필 사진 크게 보기`);
 let badge=avatar.querySelector('.profileGender70');
 if(!badge){badge=document.createElement('span');badge.className='profileGender70';avatar.appendChild(badge)}
 const female=String(m.gender||'')==='여';
 badge.className='profileGender70 '+(female?'female':'male');
 badge.textContent=female?'여':'남';
 const open=e=>{e?.stopPropagation?.();e?.preventDefault?.();popup7(img.currentSrc||img.src,String(m.name||''))};
 avatar.onclick=open;
 avatar.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){open(e)}};
 if(kind==='queue')avatar.classList.add('queueProfile53');
 return true;
}

function decorateMembers7(){
 style7();
 const box=typeof $==='function'?$('members'):document.getElementById('members');
 if(!box||!Array.isArray(S?.members))return;
 const cards=[...box.querySelectorAll('.memberCard')];
 cards.forEach((card,i)=>{
  const m=S.members[i];if(!m)return;
  const avatar=card.querySelector('.profileAvatar53');
  const has=bind7(avatar,m,'member');
  card.classList.toggle('memberPhoto70',has);
 });
}
function decorateQueue7(){
 style7();
 const box=typeof $==='function'?$('queue'):document.getElementById('queue');
 if(!box||typeof sortedQueue!=='function')return;
 const ids=sortedQueue(),cards=[...box.querySelectorAll('.queueCard')];
 cards.forEach((card,i)=>{
  const m=ids[i]&&typeof M==='function'?M(ids[i]):null;if(!m)return;
  const avatar=card.querySelector('.profileAvatar53');
  const has=bind7(avatar,m,'queue');
  card.classList.toggle('queuePhoto70',has);
  if(has)card.querySelectorAll('.v54genderText').forEach(x=>x.remove());
 });
}
function decorate7(){decorateMembers7();decorateQueue7()}
let raf7=0;
function schedule7(){if(raf7)return;raf7=requestAnimationFrame(()=>{raf7=0;try{decorate7()}catch(e){console.warn('profile ui70',e)}})}

const rm7=renderMembers;
renderMembers=function(){const r=rm7();schedule7();return r};
const rq7=renderQueue;
renderQueue=function(){const r=rq7();schedule7();return r};
const ra7=renderAll;
renderAll=function(){const r=ra7();schedule7();return r};

const observer7=new MutationObserver(schedule7);
const startObserver7=()=>{
 const members=typeof $==='function'?$('members'):document.getElementById('members');
 const queue=typeof $==='function'?$('queue'):document.getElementById('queue');
 if(members)observer7.observe(members,{childList:true,subtree:true});
 if(queue)observer7.observe(queue,{childList:true,subtree:true});
 schedule7();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver7,{once:true});else startObserver7();
})();