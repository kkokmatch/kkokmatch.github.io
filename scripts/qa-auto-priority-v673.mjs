import assert from 'node:assert/strict';
import {adjustedSkill,bestFour,businessDay} from '../edge-functions/kokmatch-auto-v656/scoring.mjs';

const NOW=Date.UTC(2026,8,11,3,0,0); // 2026-09-11 12:00 KST
const DAY=businessDay(NOW);
const min=n=>NOW-n*60000;
function m(id,{wait=20,total=20,games=0,cls='C',gender='남',partnerId='',partnerDay=''}={}){
 return {id,name:id,state:'waiting',joinedAt:min(wait),waitDay:DAY,waitTotalMs:Math.max(0,total-wait)*60000,cls,gender,partnerId,partnerDay,_games:games};
}
function state(members,extraHistory=[]){
 const history=[...extraHistory];
 for(const x of members)for(let i=0;i<(x._games||0);i++)history.push({id:`${x.id}-g${i}`,players:[x.id,`z${i}a`,`z${i}b`,`z${i}c`],endedAt:min(60+i)});
 return {members:members.map(({_games,...x})=>x),queue:members.map(x=>x.id),history,pendingGames:[],games:[],pairCounts:{},courtCount:4};
}
function ids(x){return new Set(x.players)}

// 1. Waiting burden (current wait after the last game + today's total wait) is strongest, ahead of game count.
{
 const ms=[m('long',{wait:55,total:95,games:4}),m('a',{wait:25,total:35}),m('b',{wait:25,total:35}),m('c',{wait:25,total:35}),m('short',{wait:5,total:5,games:0})];
 const r=bestFour(state(ms),NOW);assert(r);assert(ids(r).has('long'),'long waiter must be selected');assert(!ids(r).has('short'),'short waiter must yield despite fewer games');
}

// 1b. Accumulated total wait also counts as a primary waiting criterion, not only the current segment.
{
 const ms=[m('totalHeavy',{wait:5,total:80,games:5}),m('currentHeavy',{wait:35,total:35,games:3}),m('a',{wait:25,total:30}),m('b',{wait:25,total:30}),m('low',{wait:10,total:10,games:0})];
 const r=bestFour(state(ms),NOW);assert(r);assert(ids(r).has('totalHeavy'),'high daily total wait must remain a primary priority');assert(!ids(r).has('low'),'low wait must not jump ahead only because it has fewer games');
}

// 2. Within the same waiting band, fewer games wins.
{
 const ms=[m('g0',{wait:20,total:30,games:0}),m('g1',{wait:20,total:30,games:1}),m('g2',{wait:20,total:30,games:2}),m('g3',{wait:20,total:30,games:3}),m('g4',{wait:20,total:30,games:4})];
 const r=bestFour(state(ms),NOW);assert(r);assert(!ids(r).has('g4'),'highest game count should be excluded when waits are equal');
}

// 3. Today's partner pair is preferred when wait/game conditions tie.
{
 const day='2026-09-11';
 const ms=[m('pa',{partnerId:'pb',partnerDay:day}),m('pb',{partnerId:'pa',partnerDay:day}),m('x'),m('y'),m('z')];
 const r=bestFour(state(ms),NOW);assert(r);assert(ids(r).has('pa')&&ids(r).has('pb'),'active partners should be selected together when higher priorities tie');
 const p=r.players;assert((p[0]==='pa'&&p[1]==='pb')||(p[0]==='pb'&&p[1]==='pa')||(p[2]==='pa'&&p[3]==='pb')||(p[2]==='pb'&&p[3]==='pa'),'active partners must be placed on the same team');
}

// 4. Apply exactly the requested grade equivalence: female C equals male D. Do not infer other one-grade shifts.
assert.equal(adjustedSkill({cls:'C',gender:'여'}),adjustedSkill({cls:'D',gender:'남'}),'female C must equal male D for balance');
assert.equal(adjustedSkill({cls:'B',gender:'여'}),adjustedSkill({cls:'B',gender:'남'}),'female B must remain B because only C-to-D equivalence was specified');

// 5. Non-partner combinations seen 3+ times today are avoided when wait and game priorities tie.
{
 const ms=[m('ra'),m('rb'),m('c',{games:3}),m('d',{games:3}),m('e',{games:3})];
 const repeats=Array.from({length:3},(_,i)=>({id:`r${i}`,players:['ra','rb','q1','q2'],endedAt:min(90+i)}));
 const r=bestFour(state(ms,repeats),NOW);assert(r);assert(!(ids(r).has('ra')&&ids(r).has('rb')),'3+ repeat non-partner pair should be avoided when an equal alternative exists');
}

// 5b. A today's partner pair is exempt from the 3+ repeat avoidance rule after higher priorities tie.
{
 const day='2026-09-11';
 const ms=[m('pa',{partnerId:'pb',partnerDay:day}),m('pb',{partnerId:'pa',partnerDay:day}),m('c',{games:4}),m('d',{games:4}),m('e',{games:4})];
 const repeats=Array.from({length:4},(_,i)=>({id:`p${i}`,players:['pa','pb','q1','q2'],endedAt:min(90+i)}));
 const r=bestFour(state(ms,repeats),NOW);assert(r);assert(ids(r).has('pa')&&ids(r).has('pb'),'partner exception must allow repeated partner pair once higher priorities tie');
}

console.log('PASS v6.73 auto priority: wait(current+total) -> games -> partner -> exact female C=male D balance -> repeat avoidance');
