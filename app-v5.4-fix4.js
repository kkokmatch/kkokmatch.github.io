(()=>{
if(window.__kokmatchV54Fix4)return;window.__kokmatchV54Fix4=true;
function alignQueue54(){
 const box=typeof $==='function'?$('queue'):document.getElementById('queue');if(!box)return;
 const slots=[...box.querySelectorAll('.composer54 .pendingSlot')];
 slots.forEach(s=>{
  s.classList.add('pendingSlot53','pendingSlot54');
  if(s.classList.contains('filled'))s.classList.add('clickable','hasX53');
  const name=s.querySelector('.slotName');if(name)name.classList.add('slotName53');
  const meta=s.querySelector('.meta');if(meta)meta.classList.add('compactMeta53');
  const x=s.querySelector('.pendingX');if(x)x.classList.add('pendingX53');
 });
 const grid=box.querySelector('.composer54 .slots');if(grid)grid.classList.add('pendingGrid');
}
function alignMembers54(){
 const box=typeof $==='function'?$('members'):document.getElementById('members');if(!box||!Array.isArray(S?.members))return;
 const cards=[...box.querySelectorAll('.memberCard')];
 cards.forEach((card,i)=>{
  const m=S.members[i];if(!m||typeof avatar!=='function')return;
  [...card.children].filter(el=>el?.classList?.contains('avatar')).forEach(el=>el.remove());
  const h=String(avatar(m)||'');if(h)card.insertAdjacentHTML('afterbegin',h);
 });
}
function alignAll54(){alignQueue54();alignMembers54()}
const rq=renderQueue;renderQueue=function(){const r=rq();alignQueue54();return r};
const rm=renderMembers;renderMembers=function(){const r=rm();alignMembers54();return r};
const ra=renderAll;renderAll=function(){const r=ra();alignAll54();return r};
alignAll54();setTimeout(alignAll54,0);
})();