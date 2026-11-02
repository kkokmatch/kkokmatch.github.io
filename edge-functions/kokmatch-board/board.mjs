import {repeatPairs687} from '../_shared/repeat.mjs';

const four = () => [null,null,null,null];
const groupZone = z => /^(wait|court)-[1-9]\d*$/.test(z);
const freeZone = z => /^free-[1-9]\d*$/.test(z);
export function project(s) {
  const zones = {}, groups = {}, games = {}, players = {}, names = {};
  const add = z => zones[z] ||= four();
  for(let n=1;n<=s.courtCount;n++) {
    add('court-'+n); names['court-'+n]=s.courtNames?.[n-1] || n+'코트';
  }
  for(let n=1;n<=4;n++) add('wait-'+n);
  for(let n=1;n<=6;n++) add('free-'+n);
  zones.rest=[];
  const placed=new Set(), members=new Map((s.members||[]).map(m=>[m.id,m]));
  function place(z,i,id) {
    const m=members.get(id);
    if(!m || placed.has(id)) return;
    placed.add(id);zones[z][i]=id;
    players[id]={name:m.name,grade:m.cls||'',since:Number(m.joinedAt)>0?Number(m.joinedAt):null};
  }
  for(const g of s.games||[]) {
    const z='court-'+g.court;add(z);games[z]=g.id;
    g.players.forEach((id,i)=>place(z,i,id));
  }
  const pending=s.pendingGames||[];
  // Assign saved group positions first. Legacy and automatic groups fill open rows.
  for(const p of [...pending].sort((a,b)=>Number(!!b.boardZone)-Number(!!a.boardZone))) {
    let z=p.boardZone;
    if(!groupZone(z)||groups[z]||games[z]||(z.startsWith('court-')&&!zones[z])) {
      let n=1;while(groups['wait-'+n]) n++;z='wait-'+n;
    }
    add(z);groups[z]=p.id;
    const slots=four();
    for(const id of p.players) {
      const i=p.boardSlots?.indexOf(id)??-1;if(i>=0&&i<4) slots[i]=id;
    }
    for(const id of p.players) if(!slots.includes(id)) slots[slots.indexOf(null)]=id;
    slots.forEach((id,i)=>place(z,i,id));
  }
  const active=(s.queue||[]).map(id=>members.get(id)).filter(m=>m?.state==='waiting');
  for(const m of active) {
    const slot=m.boardSlot;
    if(slot && freeZone(slot.z) && Number(slot.z.slice(5))<=Math.max(6,active.length+6) && Number.isInteger(slot.i)&&slot.i>=0&&slot.i<4 && !add(slot.z)[slot.i]) place(slot.z,slot.i,m.id);
  }
  let n=1;
  for(const m of active) if(!placed.has(m.id)) {
    while(!add('free-'+n).includes(null)) n++;
    place('free-'+n,zones['free-'+n].indexOf(null),m.id);
  }
  for(const m of s.members||[]) if(m.state==='spectator'&&m.boardRest&&m.joinedAt==null) place('rest',zones.rest.length,m.id);
  for(const z of Object.keys(zones)) if(z.startsWith('wait-')) names[z]=s.boardLabels?.[z]||'대기 '+z.slice(5);
  return {zones,groups,games,players,names,auto:s.autoGame?.enabled===true};
}

const keys=['state','joinedAt','boardSlot','boardRest'];
function snapshot(s) {
  return {queue:s.queue,pendingGames:s.pendingGames, members:s.members.map(m=>[m.id,Object.fromEntries(keys.filter(k=>k in m).map(k=>[k,m[k]]))])};
}
export function change(s,b,v,now,actor) {
  const fail = msg=>{throw new Error(msg)};
  if(b.action==='undo') {
    const saved=s.boardUndo?.before;
    if(!saved) fail('취소할 이동이 없습니다.');
    const states=new Map(saved.members);
    for(const m of s.members||[]) if(states.has(m.id)) {for(const k of keys) delete m[k];Object.assign(m,states.get(m.id));}
    s.queue=saved.queue;s.pendingGames=saved.pendingGames;delete s.boardUndo;return;
  }
  if(b.action==='rename') {
    if(!Object.hasOwn(v.names,b.zone)||typeof b.name!=='string'||Array.from(b.name.trim()).length>20) fail('이름은 20자 이하로 입력해주세요.');
    const name=b.name.trim();
    if(b.zone.startsWith('court-')) (s.courtNames||=[])[Number(b.zone.slice(6))-1]=name||b.zone.slice(6)+'코트';
    else (s.boardLabels||={})[b.zone]=name;
    delete s.boardUndo;return;
  }
  if(b.action==='stage'){
    const source=b.source, target=b.zone;
    const pg=s.pendingGames.find(p=>p.id===v.groups[source]);
    if(!source?.startsWith('wait-')||!target?.startsWith('court-')||!Object.hasOwn(v.zones,target)||!pg||pg.players.length!==4||v.groups[target]||v.games[target])fail('4명 대기조와 빈 코트를 선택해주세요.');
    const before=structuredClone(snapshot(s));before.members=[];
    for(const [z,pid] of Object.entries(v.groups)){
      const p=s.pendingGames.find(g=>g.id===pid);if(p&&!p.boardZone)p.boardZone=z;
    }
    pg.boardZone=target;pg.boardSlots=[...v.zones[source]];s.boardUndo={before,owner:actor.createdByMemberId};return;
  }
  if(!['move','leave'].includes(b.action)) fail('지원하지 않는 동작입니다.');
  if(s.autoGame?.enabled && b.action==='move') fail('자동편성을 끈 뒤 이동해주세요.');
  const member=s.members.find(m=>m.id===b.id), from=Object.keys(v.zones).find(z=>v.zones[z].includes(b.id));
  if(!member||!from||v.games[from]) fail('선수의 현재 위치를 확인해주세요.');
  const to=b.zone, slots=v.zones[to], i=b.index, src=v.zones[from].indexOf(b.id);
  const before=structuredClone(snapshot(s));
  if(b.action==='leave') {
    if(from!=='rest') fail('휴식 중인 선수만 퇴장할 수 있습니다.');
    member.state='out';member.joinedAt=null;delete member.boardRest;
  } else {
    if(!Object.hasOwn(v.zones,to)||v.games[to]||!Number.isInteger(i)||i<0||(to==='rest'?i>slots.length:i>=4)) fail('이동할 수 없는 자리입니다.');
    if(from===to&&src===i) fail('이미 같은 자리에 있습니다.');
    const other=slots[i]||null;
    v.zones[from][src]=other;slots[i]=b.id;
    const members=new Map((s.members||[]).map(m=>[m.id,m]));
    // Persist all visible free positions so moving into a hole never shifts another magnet.
    for(const [z,ids] of Object.entries(v.zones)) if(freeZone(z)) ids.forEach((id,j)=>{if(id)members.get(id).boardSlot={z,i:j}});
    for(const [id,z,old] of [[b.id,to,from],[other,from,to]]) if(id) {
      const m=members.get(id);
      if(!freeZone(z)) delete m.boardSlot;
      if(z==='rest') {m.state='spectator';m.joinedAt=null;m.boardRest=true;}
      else {if(old==='rest')m.joinedAt=now;delete m.boardRest;m.state=groupZone(z)?'matched':'waiting';}
      if(m.state==='waiting'){if(!s.queue.includes(id))s.queue.push(id);}
      else s.queue=s.queue.filter(q=>q!==id);
    }
    for(const z of new Set([from,to])) if(groupZone(z)) {
      const ids=v.zones[z].filter(Boolean),pid=v.groups[z];
      let pg=s.pendingGames.find(p=>p.id===pid);
      if(!ids.length){s.pendingGames=s.pendingGames.filter(p=>p.id!==pid);continue;}
      if(!b.forceRepeat && repeatPairs687(s,ids,pid).length) {const error=new Error('반복 편성되는 선수가 있습니다. 계속할까요?');error.code='repeat';throw error;}
      if(!pg){pg={id:'p'+crypto.randomUUID(),createdAt:now,createdByMode:'manual',...actor};s.pendingGames.push(pg);}
      Object.assign(pg,{players:ids,boardZone:z,boardSlots:[...v.zones[z]]});
    }
    // Pin other legacy group IDs before an earlier empty queue becomes available.
    for(const [z,pid] of Object.entries(v.groups)) {
      const p=s.pendingGames.find(g=>g.id===pid);if(p&&!p.boardZone)p.boardZone=z;
    }
  }
  const current=new Map(snapshot(s).members);
  before.members=before.members.filter(([id,previous])=>JSON.stringify(previous)!==JSON.stringify(current.get(id)));
  s.boardUndo={before,owner:actor.createdByMemberId};
}
