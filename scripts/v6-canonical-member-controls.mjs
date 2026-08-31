import fs from 'node:fs';

const file='app-v6.0.js';
let src=fs.readFileSync(file,'utf8');
if(!src.includes("window.__kokmatchInteractionCore='6.0'"))throw new Error('v6 canonical interaction core must be installed first');
if(src.includes('function repairMemberControlsV6(')){console.log('v6 member controls already canonical');process.exit(0)}

const anchor='function syncUiV6(){';
const pos=src.indexOf(anchor);
if(pos<0)throw new Error('syncUiV6 anchor not found');

const helper=String.raw`
function memberControlHtmlV6(m){
 if(!m)return '';
 let manage=false;try{manage=typeof canManageMembers==='function'&&canManageMembers()}catch{}
 const state=String(m.state||'out');
 const stateText=typeof stateLabel==='function'?stateLabel(state):(state==='waiting'?'게임대기':state==='matched'?'편성대기':state==='playing'?'게임중':state==='spectator'?'관람':'미입장');
 if(!manage)return '<div class="status">'+escV6(stateText)+'</div>';
 let r='member';try{r=typeof roleOf==='function'?roleOf(m):String(m.role||'member')}catch{r=String(m.role||'member')}
 let editable=false;
 try{editable=!!mineV6()?.globalAdmin||(mineV6()?.role==='manager'?(r!=='manager'||String(m.id)===String(mineV6()?.memberId||'')):r==='member')}catch{}
 let buttons='';
 if(state!=='playing'&&state!=='matched'){
  if(state!=='waiting')buttons+='<button class="btn enter" type="button">운동</button>';
  if(state!=='spectator')buttons+='<button class="btn watch" type="button">관람</button>';
  if(state!=='out')buttons+='<button class="btn danger" type="button">퇴장</button>';
 }
 if(editable)buttons+='<button class="btn ghost" type="button">수정</button>';
 return '<div class="memberActions48 v6MemberActions"><div class="status">'+escV6(stateText)+'</div><div class="memberBtns">'+buttons+'</div></div>';
}
function repairMemberControlsV6(){
 const box=document.getElementById('members');if(!box)return;
 box.querySelectorAll('.memberCard').forEach(card=>{
  const id=cardIdV6(card),m=memberV6(id);if(!m)return;
  const expected=memberControlHtmlV6(m);if(!expected)return;
  const current=card.querySelector(':scope > .v6MemberActions,:scope > .memberActions48')||[...card.children].find((el,i)=>i>=2&&!el.classList?.contains('avatar')&&!el.classList?.contains('memberInfo48'));
  const signature=[String(m.state||'out'),String(m.role||'member'),String(m.type||'member'),String(m.id||''),String(mineV6()?.role||''),String(!!mineV6()?.globalAdmin),String(mineV6()?.memberId||'')].join('|');
  if(current?.dataset?.v6ControlSig===signature)return;
  const temp=document.createElement('div');temp.innerHTML=expected;const next=temp.firstElementChild;if(!next)return;next.dataset.v6ControlSig=signature;
  if(current&&current!==card.querySelector('.memberInfo48')&&!current.classList?.contains('avatar'))current.replaceWith(next);else card.appendChild(next);
 });
}
`;

src=src.slice(0,pos)+helper+'\n'+src.slice(pos);
const old="function syncUiV6(){if(syncBusyV6)return;syncBusyV6=true;try{const b=document.getElementById('groupBtn');";
const next="function syncUiV6(){if(syncBusyV6)return;syncBusyV6=true;try{repairMemberControlsV6();const b=document.getElementById('groupBtn');";
if(!src.includes(old))throw new Error('syncUiV6 body signature not found');
src=src.replace(old,next);
fs.writeFileSync(file,src);
console.log('Moved member action control rendering into v6 canonical interaction core.');
