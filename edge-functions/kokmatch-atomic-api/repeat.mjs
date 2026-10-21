// Shared by browser and edge handlers. Count each game once, within the 05:00 KST business day.
export function repeatPairs687(s, players, excludeId='', now=Date.now()) {
 const ids=[...new Set((players||[]).filter(Boolean).map(String))], rows=[];
 const day=t=>new Date(t+4*3600000).toISOString().slice(0,10), today=day(now);
 const games=[],seen=new Set();
 for(const g of [...(s.history||[]),...(s.games||[]),...(s.pendingGames||[])]){
  if(excludeId&&String(g.id||g.gameId)===String(excludeId))continue;
  const t=Number(g.endedAt||g.startedAt||g.createdAt||g.matchedAt)||0;
  if(t&&day(t)!==today)continue;
  const key=String(g.id||g.gameId||JSON.stringify([g.players,t]));
  if(seen.has(key))continue;seen.add(key);games.push(g);
 }
 const name=id=>(s.members||[]).find(m=>String(m.id)===id)?.name||'-';
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const a=ids[i],b=ids[j],count=1+games.filter(g=>{const p=(g.players||[]).map(String);return p.includes(a)&&p.includes(b)}).length;
  if(count>=3)rows.push({a,b,aName:name(a),bName:name(b),count});
 }
 return rows.sort((a,b)=>b.count-a.count);
}
