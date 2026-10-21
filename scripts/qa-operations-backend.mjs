import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
import {repeatPairs687} from '../edge-functions/_shared/repeat.mjs';
import {bestFour,soonestRunningFinish} from '../edge-functions/kokmatch-auto-v656/scoring.mjs';
const now=Date.now(),day=new Date(now+4*3600000).toISOString().slice(0,10),month=day.slice(0,7);
const fresh=()=>({members:['a','b','c','d'].map((id,i)=>({id,name:id,role:i?'member':'manager',state:'waiting',joinedAt:now-3600000,cls:'C',gender:'남'})),queue:['a','b','c','d'],pendingGames:[],games:[],history:[],autoGame:{enabled:true},courtCount:2});
let state=fresh(),revision=1,role='manager',club='qa',valid=true,writes=0,fail=false;
const sql=async(strings,...values)=>{
 const q=strings.join('?');if(fail)throw Error('simulated unavailable');
 if(q.includes('kokmatch_sessions'))return valid?[{club_id:club,member_id:'a',role,display_name:'a'}]:[];
 if(q.includes('update public.kokmatch_state')){if(revision!==values[2])return [];state=structuredClone(values[0]);revision++;writes++;return [{data:structuredClone(state),revision}]}
 if(q.includes('kokmatch_atomic_game_action')){const body=values.at(-1);if(body.players){state.pendingGames.push({id:'new'+revision,players:body.players,createdAt:now});state.queue=state.queue.filter(id=>!body.players.includes(id));state.members.forEach(m=>{if(body.players.includes(m.id))m.state='matched'})}writes++;revision++;return [{data:structuredClone(state)}]}
 if(q.includes('kokmatch_state'))return [{data:structuredClone(state),revision}];
 if(q.includes('kokmatch_game_archive'))return [{game_id:'g1',business_day:day,players:['a','b'],started_at:now-60000,ended_at:now,duration_min:1}];
 if(q.includes('kokmatch_month_baseline'))return [{member_id:'a',game_count:4,attendance_count:2,captured_at:new Date(now-86400000)}];
 throw Error('Unhandled SQL: '+q);
};sql.json=x=>x;sql.begin=f=>f(sql);
async function handler(slug){let h;let source=fs.readFileSync(`edge-functions/${slug}/index.ts`,'utf8').replace(/^import .*;\n/gm,'');source=stripTypeScriptTypes(source);const context={Deno:{env:{get:()=>''},serve:f=>h=f},postgres:()=>sql,repeatPairs687,bestFour,soonestRunningFinish,TextEncoder,Response,URL,crypto:webcrypto,console:{error:()=>{}},Date,Map,Set};vm.runInNewContext(source,context);return async(body={},method='POST')=>{const r=await h(new Request(`https://qa/?groupId=qa&from=${day}&to=${day}&month=${month}`,{method,headers:{authorization:'Bearer test','content-type':'application/json'},...method==='POST'?{body:JSON.stringify({groupId:'qa',...body})}:{}}));return {status:r.status,...await r.json()}}}
const auto=await handler('kokmatch-auto-v656'),stats=await handler('kokmatch-stats-v54'),create=await handler('kokmatch-create-v641'),atomic=await handler('kokmatch-atomic-api');
assert.equal((await auto({action:'set',enabled:false})).config.enabled,false);
assert.equal((await auto({action:'get'})).config.enabled,false);
assert.equal((await auto({action:'tick'})).reason,'disabled');
role='member';assert.equal((await auto({action:'set',enabled:true})).status,500);role='manager';
club='other';assert.equal((await auto({action:'get'})).status,403);club='qa';
valid=false;for(const h of [auto,create,atomic])assert.equal((await h()).status,401);assert.equal((await stats({},'GET')).status,401);valid=true;
fail=true;assert.equal((await auto()).status,500);assert.equal((await stats({},'GET')).status,500);fail=false;
const st=await stats({},'GET');assert.equal(st.status,200);assert.equal(st.rangeGames[0].businessDay,day);assert.equal(st.monthGames.length,1);assert.equal(st.baselines[0].gameCount,4);
state=fresh();state.history=[1,2].map(i=>({id:'h'+i,players:['a','b','c','d'],endedAt:now-i*60000}));
let before=writes;const warning=await auto({action:'tick'});assert.equal(warning.reason,'repeat_confirmation');assert.equal(writes,before);assert.equal(warning.repeatPairs[0].count,3);
assert.equal((await auto({action:'tick',confirmed:{revision:0,players:warning.players}})).reason,'repeat_confirmation');assert.equal(writes,before);
const created=await auto({action:'tick',confirmed:{revision:warning.revision,players:warning.players}});assert.equal(created.created,true);assert.equal(writes,before+1);
state=fresh();state.autoGame.enabled=false;state.history=[1,2].map(i=>({id:'h'+i,players:['a','b'],endedAt:now-i*60000}));before=writes;
assert.equal((await create({players:['a','b','c','d']})).warning,'repeat_pair');assert.equal(writes,before);
assert.equal((await create({players:['a','b','c','d'],forceRepeat:true})).status,200);
assert.equal(repeatPairs687(state,['a','b'],'new'+(revision-1))[0].count,3);
const old={...fresh(),history:[{id:'old',players:['a','b'],endedAt:now-86400000}]};assert.equal(repeatPairs687(old,['a','b']).length,0);
for(const slug of ['kokmatch-auto-v656','kokmatch-atomic-api','kokmatch-create-v641'])assert.equal(fs.readFileSync(`edge-functions/${slug}/repeat.mjs`,'utf8'),fs.readFileSync('edge-functions/_shared/repeat.mjs','utf8'));
console.log('PASS backend handlers: ON/OFF persistence, role/group/auth checks, outages, daily/monthly stats, repeat confirmation, stale confirmation, one write, date boundary, shared source');
