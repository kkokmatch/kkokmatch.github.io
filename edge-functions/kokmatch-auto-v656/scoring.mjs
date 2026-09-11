const GRADE={S:6,A:5,B:4,C:3,D:2,E:1};
const HOUR=3600000;

export function calendarDay(now=Date.now()){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
}

export function businessDay(now=Date.now()){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now-5*HOUR));
}

export function startBusinessMs(now=Date.now()){
  const [y,m,d]=businessDay(now).split('-').map(Number);
  return Date.UTC(y,m-1,d)-4*HOUR;
}

export function currentWaitMin(m,now=Date.now()){
  if(!m||!['waiting','matched'].includes(String(m.state||'')))return 0;
  const joined=Number(m.joinedAt)||0;if(!joined)return 0;
  return Math.max(0,Math.floor((now-Math.max(joined,startBusinessMs(now)))/60000));
}

export function totalWaitMin(m,now=Date.now()){
  if(!m)return 0;
  let ms=String(m.waitDay||'')===businessDay(now)?Math.max(0,Number(m.waitTotalMs)||0):0;
  const joined=Number(m.joinedAt)||0;
  if(joined&&['waiting','matched'].includes(String(m.state||'')))ms+=Math.max(0,now-Math.max(joined,startBusinessMs(now)));
  return Math.max(0,Math.floor(ms/60000));
}

function gameIsToday(g,now){
  const t=Number(g?.endedAt||g?.startedAt||g?.matchedAt)||0;
  return !t||t>=startBusinessMs(now);
}

export function gameCountToday(id,s,now=Date.now()){
  id=String(id||'');let n=0;
  for(const h of Array.isArray(s?.history)?s.history:[]){
    if(!gameIsToday(h,now))continue;
    if(Array.isArray(h?.players)&&h.players.map(String).includes(id))n++;
  }
  return n;
}

export function pairCountToday(a,b,s,now=Date.now()){
  a=String(a||'');b=String(b||'');let n=0;
  for(const h of Array.isArray(s?.history)?s.history:[]){
    if(!gameIsToday(h,now)||!Array.isArray(h?.players))continue;
    const p=h.players.map(String);if(p.includes(a)&&p.includes(b))n++;
  }
  return n;
}

export function adjustedSkill(m){
  const cls=String(m?.cls||'').toUpperCase();
  if(String(m?.gender||'')==='여'&&cls==='C')return GRADE.D;
  return GRADE[cls]||1;
}

function partnerDayValid(day,now){
  const d=String(day||''),cal=calendarDay(now),biz=businessDay(now);
  return !!d&&(d===cal||d===biz);
}

export function isPartnerPair(a,b,byId,now=Date.now()){
  a=String(a||'');b=String(b||'');
  const ma=byId.get(a),mb=byId.get(b);if(!ma||!mb)return false;
  return (partnerDayValid(ma.partnerDay,now)&&String(ma.partnerId||'')===b)||
         (partnerDayValid(mb.partnerDay,now)&&String(mb.partnerId||'')===a);
}

function partnerPairs(ids,byId,now){
  const out=[];
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)if(isPartnerPair(ids[i],ids[j],byId,now))out.push([i,j]);
  return out;
}

function pairingMetrics(ids,ms,byId,now){
  const pairings=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
  const activePartners=partnerPairs(ids,byId,now);
  const totalFemale=ms.filter(m=>String(m?.gender||'')==='여').length;
  let best=null;
  for(const teams of pairings){
    const [t1,t2]=teams;
    let splitPartners=0;
    for(const [i,j] of activePartners){
      const together=(t1.includes(i)&&t1.includes(j))||(t2.includes(i)&&t2.includes(j));
      if(!together)splitPartners++;
    }
    const power1=adjustedSkill(ms[t1[0]])+adjustedSkill(ms[t1[1]]),power2=adjustedSkill(ms[t2[0]])+adjustedSkill(ms[t2[1]]);
    const f1=t1.filter(i=>String(ms[i]?.gender||'')==='여').length,f2=t2.filter(i=>String(ms[i]?.gender||'')==='여').length;
    const balance=Math.abs(power1-power2)*10+Math.abs(f1-f2)*4+Math.abs(totalFemale-2)*2;
    const row={teams,splitPartners,balance,power:[power1,power2],female:[f1,f2]};
    if(!best||row.splitPartners<best.splitPartners||
      (row.splitPartners===best.splitPartners&&row.balance<best.balance))best=row;
  }
  return best;
}

function lexGreater(a,b){
  const n=Math.max(a.length,b.length);
  for(let i=0;i<n;i++){const av=Number(a[i]??0),bv=Number(b[i]??0);if(av!==bv)return av>bv}
  return false;
}

function selectionMetrics(ids,s,byId,now){
  const ms=ids.map(id=>byId.get(id));
  const waits=ms.map(m=>({current:currentWaitMin(m,now),total:totalWaitMin(m,now)}));
  // Current wait after the last game + today's total wait are both primary. 5-minute bands
  // let the next requested priorities decide only among members whose waiting burden is effectively similar.
  const waitVector=waits.map(w=>Math.floor((w.current+w.total)/5)).sort((a,b)=>b-a);
  const waitExactVector=waits.map(w=>w.current+w.total).sort((a,b)=>b-a);
  const games=ids.map(id=>gameCountToday(id,s,now));
  const gameTotal=games.reduce((a,b)=>a+b,0),gameSpread=Math.max(...games)-Math.min(...games);
  const partners=partnerPairs(ids,byId,now).length;
  const pairing=pairingMetrics(ids,ms,byId,now);
  let hardRepeat=0,repeatTotal=0;
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
    if(isPartnerPair(ids[i],ids[j],byId,now))continue;
    const c=pairCountToday(ids[i],ids[j],s,now);repeatTotal+=c;if(c>=3)hardRepeat++;
  }
  return {waitVector,waitExactVector,gameTotal,gameSpread,partners,balance:pairing?.balance??999,splitPartners:pairing?.splitPartners??99,hardRepeat,repeatTotal,pairing,waits,games};
}

function better(a,b){
  if(!b)return true;
  const A=a.metrics,B=b.metrics;
  if(A.waitVector.join('|')!==B.waitVector.join('|'))return lexGreater(A.waitVector,B.waitVector);
  if(A.gameTotal!==B.gameTotal)return A.gameTotal<B.gameTotal;
  if(A.gameSpread!==B.gameSpread)return A.gameSpread<B.gameSpread;
  if(A.partners!==B.partners)return A.partners>B.partners;
  if(A.splitPartners!==B.splitPartners)return A.splitPartners<B.splitPartners;
  if(A.balance!==B.balance)return A.balance<B.balance;
  if(A.hardRepeat!==B.hardRepeat)return A.hardRepeat<B.hardRepeat;
  if(A.repeatTotal!==B.repeatTotal)return A.repeatTotal<B.repeatTotal;
  if(A.waitExactVector.join('|')!==B.waitExactVector.join('|'))return lexGreater(A.waitExactVector,B.waitExactVector);
  return a.ids.join('|')<b.ids.join('|');
}

export function bestFour(s,now=Date.now()){
  const members=Array.isArray(s?.members)?s.members:[],byId=new Map(members.map(m=>[String(m.id),m]));
  let queue=(Array.isArray(s?.queue)?s.queue:[]).map(String).filter(id=>byId.has(id)&&String(byId.get(id)?.state||'')==='waiting');
  queue.sort((a,b)=>{
    const ma=byId.get(a),mb=byId.get(b);
    const wa=Math.floor((currentWaitMin(ma,now)+totalWaitMin(ma,now))/5),wb=Math.floor((currentWaitMin(mb,now)+totalWaitMin(mb,now))/5);
    if(wa!==wb)return wb-wa;
    const ga=gameCountToday(a,s,now),gb=gameCountToday(b,s,now);if(ga!==gb)return ga-gb;
    const ea=currentWaitMin(ma,now)+totalWaitMin(ma,now),eb=currentWaitMin(mb,now)+totalWaitMin(mb,now);if(ea!==eb)return eb-ea;
    return String(ma?.name||a).localeCompare(String(mb?.name||b),'ko');
  });
  const pool=queue.slice(0,Math.min(24,queue.length));if(pool.length<4)return null;
  let best=null;
  for(let a=0;a<pool.length-3;a++)for(let b=a+1;b<pool.length-2;b++)for(let c=b+1;c<pool.length-1;c++)for(let d=c+1;d<pool.length;d++){
    const ids=[pool[a],pool[b],pool[c],pool[d]],metrics=selectionMetrics(ids,s,byId,now),row={ids,metrics};
    if(better(row,best))best=row;
  }
  if(!best)return null;
  const p=best.metrics.pairing.teams;
  const players=[best.ids[p[0][0]],best.ids[p[0][1]],best.ids[p[1][0]],best.ids[p[1][1]]];
  return {players,metrics:{...best.metrics,pairing:undefined}};
}
