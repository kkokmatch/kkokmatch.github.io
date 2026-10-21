const GRADE={S:6,A:5,B:4,C:3,D:2,E:1};
const HOUR=3600000;const DAY_FMT=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});
export function calendarDay(now=Date.now()){return DAY_FMT.format(new Date(now))}
export function businessDay(now=Date.now()){return DAY_FMT.format(new Date(now-5*HOUR))}
function startBusinessFromDay(day){const [y,m,d]=String(day).split('-').map(Number);return Date.UTC(y,m-1,d)-4*HOUR}
export function startBusinessMs(now=Date.now()){return startBusinessFromDay(businessDay(now))}
export function currentWaitMin(m,now=Date.now()){if(!m||!['waiting','matched'].includes(String(m.state||'')))return 0;const joined=Number(m.joinedAt)||0;if(!joined)return 0;const start=startBusinessMs(now);return Math.max(0,Math.floor((now-Math.max(joined,start))/60000))}
export function totalWaitMin(m,now=Date.now()){if(!m)return 0;const biz=businessDay(now),start=startBusinessFromDay(biz);let ms=String(m.waitDay||'')===biz?Math.max(0,Number(m.waitTotalMs)||0):0;const joined=Number(m.joinedAt)||0;if(joined&&['waiting','matched'].includes(String(m.state||'')))ms+=Math.max(0,now-Math.max(joined,start));return Math.max(0,Math.floor(ms/60000))}
function gameIsTodayWithStart(g,start){const t=Number(g?.endedAt||g?.startedAt||g?.matchedAt)||0;return !t||t>=start}
export function gameCountToday(id,s,now=Date.now()){id=String(id||'');let n=0;const start=startBusinessMs(now);for(const h of Array.isArray(s?.history)?s.history:[]){if(!gameIsTodayWithStart(h,start))continue;if(Array.isArray(h?.players)&&h.players.map(String).includes(id))n++}return n}
function keyOf(a,b){a=String(a||'');b=String(b||'');return a<b?a+'|'+b:b+'|'+a}
export function pairCountToday(a,b,s,now=Date.now()){a=String(a||'');b=String(b||'');let n=0;const start=startBusinessMs(now);for(const h of Array.isArray(s?.history)?s.history:[]){if(!gameIsTodayWithStart(h,start)||!Array.isArray(h?.players))continue;const p=h.players.map(String);if(p.includes(a)&&p.includes(b))n++}return n}
export function adjustedSkill(m){const cls=String(m?.cls||'').toUpperCase();if(String(m?.gender||'')==='여'&&cls==='C')return GRADE.D;return GRADE[cls]||1}
function partnerDayValidKnown(day,cal,biz){const d=String(day||'');return !!d&&(d===cal||d===biz)}
function partnerDayValid(day,now){return partnerDayValidKnown(day,calendarDay(now),businessDay(now))}
export function isPartnerPair(a,b,byId,now=Date.now()){a=String(a||'');b=String(b||'');const ma=byId.get(a),mb=byId.get(b);if(!ma||!mb)return false;return (partnerDayValid(ma.partnerDay,now)&&String(ma.partnerId||'')===b)||(partnerDayValid(mb.partnerDay,now)&&String(mb.partnerId||'')===a)}
function buildFastContext(s,queue,byId,now){
 const biz=businessDay(now),cal=calendarDay(now),start=startBusinessFromDay(biz);
 const gameCounts=new Map(queue.map(id=>[id,0])),pairCounts=new Map(),recentPairCounts=new Map();
 for(const h of Array.isArray(s?.history)?s.history:[]){
  if(!gameIsTodayWithStart(h,start)||!Array.isArray(h?.players))continue;
  const players=[...new Set(h.players.map(String))];
  for(const id of players)if(gameCounts.has(id))gameCounts.set(id,(gameCounts.get(id)||0)+1);
  const ended=Number(h?.endedAt||h?.startedAt||h?.matchedAt)||0;
  const recent=ended>0&&now-ended>=0&&now-ended<=60*60*1000;
  for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){
   const k=keyOf(players[i],players[j]);
   pairCounts.set(k,(pairCounts.get(k)||0)+1);
   if(recent)recentPairCounts.set(k,(recentPairCounts.get(k)||0)+1);
  }
 }
 const infos=new Map();
 for(const id of queue){
  const m=byId.get(id),live=['waiting','matched'].includes(String(m?.state||'')),joined=Number(m?.joinedAt)||0,liveMs=live&&joined?Math.max(0,now-Math.max(joined,start)):0,current=Math.max(0,Math.floor(liveMs/60000));
  let totalMs=String(m?.waitDay||'')===biz?Math.max(0,Number(m?.waitTotalMs)||0):0;
  totalMs+=liveMs;
  const total=Math.max(0,Math.floor(totalMs/60000)),burden=current+total;
  infos.set(id,{m,current,total,burden,band:Math.floor(burden/5),game:gameCounts.get(id)||0,skill:adjustedSkill(m),female:String(m?.gender||'')==='여'});
 }
 const partnerSet=new Set(),queueSet=new Set(queue);
 for(const id of queue){const m=byId.get(id),pid=String(m?.partnerId||'');if(pid&&queueSet.has(pid)&&partnerDayValidKnown(m?.partnerDay,cal,biz))partnerSet.add(keyOf(id,pid))}
 return {infos,pairCounts,recentPairCounts,partnerSet};
}
function pairingMetricsFast(ids,info,partnerIndexPairs){const pairings=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]],totalFemale=info.reduce((n,x)=>n+(x.female?1:0),0);let best=null;for(const teams of pairings){const [t1,t2]=teams;let splitPartners=0;for(const [i,j] of partnerIndexPairs){const together=(t1.includes(i)&&t1.includes(j))||(t2.includes(i)&&t2.includes(j));if(!together)splitPartners++}const power1=info[t1[0]].skill+info[t1[1]].skill,power2=info[t2[0]].skill+info[t2[1]].skill,f1=(info[t1[0]].female?1:0)+(info[t1[1]].female?1:0),f2=(info[t2[0]].female?1:0)+(info[t2[1]].female?1:0),balance=Math.abs(power1-power2)*10+Math.abs(f1-f2)*4+Math.abs(totalFemale-2)*2,row={teams,splitPartners,balance,power:[power1,power2],female:[f1,f2]};if(!best||row.splitPartners<best.splitPartners||(row.splitPartners===best.splitPartners&&row.balance<best.balance))best=row}return best}
function vecCompare(a,b){const n=Math.max(a.length,b.length);for(let i=0;i<n;i++){const av=Number(a[i]??0),bv=Number(b[i]??0);if(av!==bv)return av-bv}return 0}
function selectionMetricsFast(ids,ctx){
 const info=ids.map(id=>ctx.infos.get(id)),waits=info.map(x=>({current:x.current,total:x.total})),waitVector=info.map(x=>x.band).sort((a,b)=>b-a),waitExactVector=info.map(x=>x.burden).sort((a,b)=>b-a),games=info.map(x=>x.game),gameTotal=games.reduce((a,b)=>a+b,0),gameSpread=Math.max(...games)-Math.min(...games),partnerIndexPairs=[];
 let recentRepeat=0,hardRepeat=0,repeatTotal=0;
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const k=keyOf(ids[i],ids[j]);
  if(ctx.partnerSet.has(k)){partnerIndexPairs.push([i,j]);continue}
  const c=ctx.pairCounts.get(k)||0;
  const rc=ctx.recentPairCounts.get(k)||0;
  recentRepeat+=rc;repeatTotal+=c;if(c>=3)hardRepeat++;
 }
 const pairing=pairingMetricsFast(ids,info,partnerIndexPairs);
 return {waitVector,waitExactVector,gameTotal,gameSpread,partners:partnerIndexPairs.length,recentRepeat,balance:pairing?.balance??999,splitPartners:pairing?.splitPartners??99,hardRepeat,repeatTotal,pairing,waits,games};
}
function better(a,b){
 if(!b)return true;
 const A=a.metrics,B=b.metrics;
 let v=vecCompare(A.waitVector,B.waitVector);if(v!==0)return v>0;
 if(A.gameTotal!==B.gameTotal)return A.gameTotal<B.gameTotal;
 if(A.gameSpread!==B.gameSpread)return A.gameSpread<B.gameSpread;
 if(A.partners!==B.partners)return A.partners>B.partners;
 if(A.splitPartners!==B.splitPartners)return A.splitPartners<B.splitPartners;
 if(A.recentRepeat!==B.recentRepeat)return A.recentRepeat<B.recentRepeat;
 if(A.balance!==B.balance)return A.balance<B.balance;
 if(A.hardRepeat!==B.hardRepeat)return A.hardRepeat<B.hardRepeat;
 if(A.repeatTotal!==B.repeatTotal)return A.repeatTotal<B.repeatTotal;
 v=vecCompare(A.waitExactVector,B.waitExactVector);if(v!==0)return v>0;
 return a.ids.join('|')<b.ids.join('|');
}
function etaTime(value){if(value===null||value===undefined||value==='')return NaN;const n=Number(value);return Number.isFinite(n)?n:Date.parse(value)}
function etaDay(time){return new Date(time+4*HOUR).toISOString().slice(0,10)}
function etaComposition(players,byId){
 const grades=(players||[]).map(id=>byId.get(String(id))?.cls).map(g=>String(g||'').trim().toUpperCase());
 if(grades.length!==4||grades.some(g=>!Object.hasOwn(GRADE,g)))return {key:'unknown',prior:15};
 const same=grades.every(g=>g===grades[0]),high=grades.filter(g=>g==='A'||g==='B').length>=3;
 return same||high?{key:'balanced',prior:17.5}:{key:'mixed',prior:12.5};
}
function etaModel(s,now){
 const byId=new Map((Array.isArray(s?.members)?s.members:[]).map(m=>[String(m.id),m])),seen=new Set(),samples=[];
 for(const g of Array.isArray(s?.history)?s.history:[]){
  const end=etaTime(g?.endedAt),start=etaTime(g?.startedAt),duration=Number.isFinite(start)?(end-start)/60000:Number(g?.durationMin);
  if(g?.autoEnded===true||!Number.isFinite(end)||end>now||etaDay(end)!==etaDay(now)||!Number.isFinite(duration)||duration<3||duration>=30)continue;
  const id=g?.id||g?.gameId?String(g.id||g.gameId):JSON.stringify([end,start,g?.players]);
  if(seen.has(id))continue;seen.add(id);samples.push({end,duration,key:etaComposition(g?.players,byId).key});
 }
 samples.sort((a,b)=>a.end-b.end);
 function estimate(players){
  const composition=etaComposition(players,byId);
  if(!samples.length)return {minutes:composition.prior,samples:0,observed:[]};
  const sorted=samples.map(s=>s.duration).sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)];
  const deviations=sorted.map(v=>Math.abs(v-median)).sort((a,b)=>a-b),spread=Math.max(3,3*deviations[Math.floor(deviations.length/2)]);
  const clipped=samples.map(s=>({...s,duration:samples.length>=5?Math.max(median-spread,Math.min(median+spread,s.duration)):s.duration}));
  const average=rows=>rows.reduce((sum,s)=>sum+s.duration,0)/rows.length;
  const recent=clipped.slice(-8),daily=average(clipped),trend=average(recent),comparable=clipped.filter(s=>composition.key!=='unknown'&&s.key===composition.key).slice(-12),comparableWeight=Math.min(.65,comparable.length/12*.65);
  const measured=(daily*.4+trend*.6)*(1-comparableWeight)+(comparable.length?average(comparable):0)*comparableWeight,weight=Math.min(1,samples.length/8);
  return {minutes:composition.prior*(1-weight)+measured*weight,samples:samples.length,observed:comparable.length>=4?comparable:clipped};
 }
 return {estimate};
}
export function soonestRunningFinish(s,now=Date.now()){
 const games=Array.isArray(s?.games)?s.games:[];if(!games.length)return null;
 const model=etaModel(s,now);let best=null;
 for(const game of games){
  const estimate=model.estimate(game?.players),start=etaTime(game?.startedAt);
  if(!Number.isFinite(start)||start>now)continue;
  const elapsed=Math.max(0,(now-start)/60000),survivors=estimate.observed.filter(row=>row.duration>elapsed),base=Math.max(1,estimate.minutes-elapsed),weight=Math.min(1,estimate.samples/8);
  const residual=survivors.length>=3?base*(1-weight)+survivors.reduce((n,row)=>n+row.duration-elapsed,0)/survivors.length*weight:base;
  const row={gameId:String(game?.id||''),court:Number(game?.court)||0,players:Array.isArray(game?.players)?game.players.map(String):[],remainingMin:Math.max(1,residual),estimateMin:estimate.minutes,elapsedMin:elapsed,samples:estimate.samples};
  if(!best||row.remainingMin<best.remainingMin)best=row;
 }
 return best;
}
export function bestFour(s,now=Date.now()){const members=Array.isArray(s?.members)?s.members:[],byId=new Map(members.map(m=>[String(m.id),m]));let queue=(Array.isArray(s?.queue)?s.queue:[]).map(String).filter(id=>byId.has(id)&&String(byId.get(id)?.state||'')==='waiting');if(queue.length<4)return null;const ctx=buildFastContext(s,queue,byId,now);queue.sort((a,b)=>{const A=ctx.infos.get(a),B=ctx.infos.get(b);if(A.band!==B.band)return B.band-A.band;if(A.game!==B.game)return A.game-B.game;if(A.burden!==B.burden)return B.burden-A.burden;return String(A.m?.name||a).localeCompare(String(B.m?.name||b),'ko')});const pool=queue.slice(0,Math.min(24,queue.length));let best=null;for(let a=0;a<pool.length-3;a++)for(let b=a+1;b<pool.length-2;b++)for(let c=b+1;c<pool.length-1;c++)for(let d=c+1;d<pool.length;d++){const ids=[pool[a],pool[b],pool[c],pool[d]],metrics=selectionMetricsFast(ids,ctx),row={ids,metrics};if(better(row,best))best=row}if(!best)return null;const p=best.metrics.pairing.teams,players=[best.ids[p[0][0]],best.ids[p[0][1]],best.ids[p[1][0]],best.ids[p[1][1]]];return {players,metrics:{...best.metrics,pairing:undefined}}}


