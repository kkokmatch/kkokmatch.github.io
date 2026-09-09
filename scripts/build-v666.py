from pathlib import Path
import json, shutil, re

OLD='6.65'
NEW='6.66'

# Archive exact v6.65 production runtime before switching.
archive=Path('versions/v6.65')
archive.mkdir(parents=True,exist_ok=True)
for name in ['app-v6.65.js','app-v6.65.css','index.html','latest-version.json','manifest.webmanifest','kokmatch-sw.js','sw.js']:
    p=Path(name)
    if p.exists(): shutil.copy2(p,archive/p.name)

js=Path('app-v6.65.js').read_text(encoding='utf-8').replace(OLD,NEW)

# Remove the old v6.58 behavior that moved the game-count badge into the wait-time row.
new_move=r'''function moveQueueCount658(){
 try{
  const box=document.getElementById('queue');if(!box)return;
  const q=typeof sortedQueue==='function'?sortedQueue():[];
  [...box.querySelectorAll('.queueCard54,.queueCard53,.queueCard')].forEach((card,i)=>{
   const name=card.querySelector('.name');
   const meta=card.querySelector('.queueInfo53 .compactMeta53')||card.querySelector('.queueInfo53 .meta')||[...card.querySelectorAll('.meta')].find(x=>/대기/.test(String(x.textContent||'')));
   if(!name||!meta)return;
   meta.classList.remove('queueWaitMeta658');
   meta.querySelectorAll('.queueMetaSep658').forEach(x=>x.remove());
   const counts=[...card.querySelectorAll('.gamecnt')];
   let badge=counts.find(x=>x.parentElement===name)||counts.find(x=>!meta.contains(x))||counts[0]||null;
   if(!badge){
    const id=String(q[i]||'');
    const n=id&&typeof dailyCount==='function'?Math.max(0,Number(dailyCount(id))||0):0;
    badge=document.createElement('span');badge.className='gamecnt';badge.textContent=`게임 ${n}회`;
   }
   counts.filter(x=>x!==badge).forEach(x=>x.remove());
   if(badge.parentElement!==name){
    badge.remove();
    const role=name.querySelector('.roleBadge');
    if(role)name.insertBefore(badge,role);else name.appendChild(badge);
   }
   badge.classList.remove('queueGameCount658');
   meta.querySelectorAll('.gamecnt,.queueGameCount658').forEach(x=>{if(x!==badge)x.remove()});
  });
 }catch{}
}'''
js,n=re.subn(r"function moveQueueCount658\(\)\{.*?\n\}\n\nfunction autoQueueHtml658",new_move+'\n\nfunction autoQueueHtml658',js,count=1,flags=re.S)
if n!=1: raise SystemExit('moveQueueCount658 patch failed')

new_meta=r'''function queueMeta658(){
 try{moveQueueCount658()}catch{}
}'''
js,n=re.subn(r"function queueMeta658\(\)\{.*?\n\}\nfunction frame658",new_meta+'\nfunction frame658',js,count=1,flags=re.S)
if n!=1: raise SystemExit('queueMeta658 patch failed')

Path('app-v6.66.js').write_text(js,encoding='utf-8')

css=Path('app-v6.65.css').read_text(encoding='utf-8').replace(OLD,NEW)
css += r'''

/* v6.66: manager/organizer badges match their profile-aura material families. */
.roleBadge.role-manager,.roleBadge.role-organizer{
 display:inline-block!important;position:relative!important;box-sizing:border-box!important;
 border-radius:999px!important;padding:3px 7px!important;margin-left:4px!important;
 vertical-align:middle!important;font-family:inherit!important;font-size:11px!important;
 font-weight:900!important;line-height:normal!important;white-space:nowrap!important;overflow:hidden!important;
}
.roleBadge.role-manager{
 --km-manager-badge-v666:1;
 color:#fffdf7!important;
 border:1px solid rgba(239,201,113,.92)!important;
 background-color:#bc862c!important;
 background-image:
  linear-gradient(116deg,rgba(255,255,255,.66) 0 9%,transparent 10% 35%,rgba(255,255,255,.18) 36% 52%,transparent 53%),
  linear-gradient(135deg,#8d5d16 0%,#f2c663 25%,#fff0af 44%,#d89b36 67%,#9b681c 100%)!important;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.78),inset 0 -1px 0 rgba(114,70,8,.18),0 0 4px rgba(224,174,69,.17),0 1px 2px rgba(123,79,17,.11)!important;
 text-shadow:0 1px 1px rgba(101,62,5,.24)!important;
}
.roleBadge.role-organizer{
 --km-organizer-badge-v666:1;
 color:#59667b!important;
 border:1px solid rgba(181,195,218,.96)!important;
 background-color:#dce4f0!important;
 background-image:
  linear-gradient(116deg,rgba(255,255,255,.86) 0 10%,transparent 11% 36%,rgba(255,255,255,.30) 37% 54%,transparent 55%),
  linear-gradient(135deg,#a9b6ca 0%,#eef4fb 27%,#ffffff 43%,#c9d4e5 66%,#9eacc2 100%)!important;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(111,126,151,.16),0 0 5px rgba(152,171,204,.19),0 1px 2px rgba(102,118,145,.10)!important;
 text-shadow:0 1px 0 rgba(255,255,255,.80)!important;
}
.roleBadge.role-manager::after,.roleBadge.role-organizer::after{
 content:''!important;display:block!important;position:absolute!important;left:-23%!important;top:-70%!important;
 width:34%!important;height:240%!important;background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent)!important;
 transform:rotate(18deg)!important;opacity:.32!important;pointer-events:none!important;
}

/* v6.66: personal queue shows one game-count badge only; wait row is wait information only. */
#queue .queueCard .queueWaitMeta658{display:block!important}
#queue .queueCard .meta .gamecnt,#queue .queueCard .meta .queueGameCount658,#queue .queueCard .meta .queueMetaSep658{display:none!important}
#queue .queueCard .name>.gamecnt{display:inline-block!important;margin-left:4px!important;vertical-align:middle!important;white-space:nowrap!important}
'''
Path('app-v6.66.css').write_text(css,encoding='utf-8')

idx=Path('index.html').read_text(encoding='utf-8').replace(OLD,NEW).replace('single-v665','single-v666').replace('session-coordinator-v665','session-coordinator-v666')
Path('index.html').write_text(idx,encoding='utf-8')
Path('latest-version.json').write_text(json.dumps({
 'version':106,'label':'v6.66','semanticVersion':'6.66','build':'v6.66',
 'updatedAt':'2026-09-09T18:16:00+09:00',
 'note':'v6.66 모임장 골드 오라 배지 · 운영진 실버 오라 배지 · 개인게임대기 게임횟수 중복 제거'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for name in ['manifest.webmanifest','kokmatch-sw.js','sw.js']:
 p=Path(name);p.write_text(p.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
print('prepared v6.66')
