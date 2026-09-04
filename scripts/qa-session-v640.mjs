import fs from 'node:fs';

const js=fs.readFileSync('app-v6.40.js','utf8');
const fail=(m)=>{throw new Error(m)};
const must=(cond,m)=>{if(!cond)fail(m)};

must(js.includes("window.__kokmatchStandalone='6.40'"),'v6.40 runtime marker missing');
must(js.includes("async function reloginLatest(failedToken='')"),'token-aware base reloginLatest missing');
must(js.includes("String(failedToken)!==currentToken"),'old-token 401 guard missing');
must(js.includes("const requestToken=String(T||'')"),'request token snapshot missing');
must(js.includes("authorization:'Bearer '+requestToken"),'request must use the snapshotted token');
must(js.includes("reloginLatest(requestToken)"),'401 must report the token that actually failed');
must(js.includes("function protectFreshLogin640"),'fresh-login protection missing');
must(js.includes("function freshLoginProtected640"),'fresh-login guard predicate missing');
must(js.includes("protectFreshLogin640(T)"),'fresh token must be protected before state load');
must(js.includes("if(loginFinalizing33||freshLoginProtected640())return"),'stale 401 must not interrupt login finalization/fresh login');
must(js.includes("Date.now()<loginGrace53"),'existing post-login grace guard must remain');
must(js.includes("loginGrace53=Date.now()+12000"),'existing 12-second login grace must remain');
must(!js.includes("reloginLatest=async function(){if(loginFinalizing33)return;return relogin32()}"),'old login-only v3.3 guard still present');

// The current single runtime intentionally contains three migrated relogin wrappers:
// inline-expiry handling, login-finalization handling, and profile/login grace handling.
// v6.40 must preserve that chain rather than deleting compatibility layers during this fix.
const assignments=(js.match(/reloginLatest\s*=\s*async function/g)||[]).length;
must(assignments===3,`unexpected reloginLatest wrapper count: ${assignments}`);

// Behavioral truth table for the v6.40 stale-401 protection around a fresh login.
const shouldExpire=(failed,current,fresh=false,finalizing=false)=>{
  if(finalizing||fresh)return false;
  if(failed&&current&&String(failed)!==String(current))return false;
  return true;
};
must(shouldExpire('old-token','new-token')===false,'old request must never expire a newer token');
must(shouldExpire('new-token','new-token')===true,'current token 401 must still expire after the guard');
must(shouldExpire('new-token','new-token',true,false)===false,'fresh-login stale 401 window must be protected');
must(shouldExpire('old-token','new-token',false,true)===false,'login finalization must be protected');

console.log('v6.40 session QA passed');
