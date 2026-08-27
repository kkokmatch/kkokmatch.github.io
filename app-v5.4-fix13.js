(()=>{
if(window.__kokmatchV54Fix13)return;
window.__kokmatchV54Fix13=true;
window.__kokmatchMemberProfileTapPatch='13.0';

function style13(){
 if(document.getElementById('v54fix13style'))return;
 const s=document.createElement('style');s.id='v54fix13style';s.textContent=`
#members .profileIdentity80.profileTap80{cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;-webkit-touch-callout:none!important;-webkit-user-select:none!important;user-select:none!important}
#members .profileIdentity80.profileTap80 img{pointer-events:none!important;-webkit-touch-callout:none!important;-webkit-user-select:none!important;user-select:none!important;-webkit-user-drag:none!important;user-drag:none!important}
`;
 document.head.appendChild(s)
}
style13();

function memberProfile13(target){
 const t=target instanceof Element?target:null;if(!t)return null;
 const id=t.closest('#members .memberCard .profileIdentity80.profileTap80');
 if(!id||id.dataset.photo!=='1')return null;
 return id
}
let lastId13='',lastAt13=0;
function open13(id){
 if(!id||typeof window.openProfilePhoto80!=='function')return false;
 const now=Date.now(),mid=String(id.dataset.memberId||'');
 if(mid&&mid===lastId13&&now-lastAt13<450)return true;
 lastId13=mid;lastAt13=now;
 window.openProfilePhoto80(id);return true
}
function swallow13(e){try{e.preventDefault()}catch{}try{e.stopPropagation()}catch{}try{e.stopImmediatePropagation()}catch{}}

// iOS 이미지 저장/공유 컨텍스트 메뉴가 뜨지 않도록 앱 내부 뷰어가 우선한다.
window.addEventListener('contextmenu',e=>{const id=memberProfile13(e.target);if(!id)return;swallow13(e);open13(id)},true);
window.addEventListener('dragstart',e=>{const id=memberProfile13(e.target);if(!id)return;swallow13(e)},true);

// 터치에서는 click 생성 이전에 프로필 영역을 앱 뷰어로 처리한다.
window.addEventListener('pointerup',e=>{
 const id=memberProfile13(e.target);if(!id)return;
 if(e.pointerType&&e.pointerType!=='touch'&&e.pointerType!=='pen')return;
 swallow13(e);open13(id)
},true);

// 구형 iOS WebKit 보완.
window.addEventListener('touchend',e=>{const id=memberProfile13(e.target);if(!id)return;swallow13(e);open13(id)},{capture:true,passive:false});

window.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const id=memberProfile13(e.target);if(!id)return;swallow13(e);open13(id)},true);

const mo13=new MutationObserver(()=>style13());
function boot13(){style13();const box=document.getElementById('members');if(box)mo13.observe(box,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot13,{once:true});else boot13();

// 이전 hotfix loader가 캐시되어 있어도 최신 개인별 통계 디자인을 이어서 불러온다.
setTimeout(()=>{
 if(window.__kokmatchV54Fix14)return;
 const s=document.createElement('script');s.src='/app-v5.4-fix14.js?v=14.0&t='+Date.now();s.async=false;document.body.appendChild(s)
},0);
})();