import fs from 'node:fs';

const js=fs.readFileSync('app-v6.70.js','utf8');
const fail=m=>{throw new Error(m)};
const must=(ok,m)=>{if(!ok)fail(m)};

must(js.includes("window.__kokmatchStandalone='6.70'"),'v6.70 runtime marker missing');
must(js.includes("const SESSION_DAY_BASE_V670='kokmatch_session_business_day_v71'"),'05:00 session-day key missing');
must(js.includes('discardStaleStartupSessionV670();'),'startup stale-session preflight missing');
must(js.includes("saved&&saved!==authBusinessDayV670()"),'business-day mismatch guard missing');
must(js.includes("localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(SESSION_DAY_BASE_V670);T=''"),'stale startup token is not cleared atomically');
must(js.includes("if(failedToken&&!currentToken)return false"),'duplicate old 401 suppression missing');
must(js.includes("String(failedToken)!==currentToken)return false"),'stale 401 must not clear a newly-issued token');
must(js.includes('await reloginLatest(requestToken)'),'401 transition must finish before caller handles expiry');
must(!js.includes("location.replace('/?relogin='"),'ordinary auth expiry must not hard-reload the PWA');
must(js.includes('freshLoginProtected640'),'existing fresh-login race guard must remain');
must(js.includes('Date.now()<loginGrace53'),'existing post-login grace guard must remain');
must(js.includes("SESSION_DAY71='kokmatch_session_business_day_v71'"),'05:00 daily-reset mechanism must remain');

const writes=(js.match(/T=x\.token;localStorage\.setItem\(TOKEN_KEY,T\);/g)||[]).length;
const stamped=(js.match(/localStorage\.setItem\(SESSION_DAY_BASE_V670,authBusinessDayV670\(\)\);/g)||[]).length;
must(writes>=3,'expected multiple token issuance paths');
must(stamped===writes,`every issued token must be stamped before state load: writes=${writes}, stamped=${stamped}`);

function businessDayAt(iso){
 const now=new Date(iso).getTime();
 const shifted=new Date(now-5*60*60*1000);
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(shifted);
}
must(businessDayAt('2026-09-10T19:59:59Z')==='2026-09-10','04:59:59 KST must belong to previous business day');
must(businessDayAt('2026-09-10T20:00:00Z')==='2026-09-11','05:00:00 KST must begin the new business day');

function startupDecision({token,saved,day}){
 if(token&&saved&&saved!==day)return 'clear-before-api';
 return token?'keep':'login';
}
must(startupDecision({token:'old',saved:'2026-09-10',day:'2026-09-11'})==='clear-before-api','yesterday token must be discarded before the first API request');
must(startupDecision({token:'same',saved:'2026-09-11',day:'2026-09-11'})==='keep','same-day session must remain logged in');
must(startupDecision({token:'legacy',saved:'',day:'2026-09-11'})==='keep','legacy unmarked token may reach server validation without accidental client logout');

function expiredResponseDecision({failed,current}){
 if(failed&&!current)return 'already-cleared';
 if(failed&&current&&failed!==current)return 'ignore-stale-401';
 return 'show-login-in-place';
}
must(expiredResponseDecision({failed:'old',current:'new'})==='ignore-stale-401','old 401 must never kill a fresh login token');
must(expiredResponseDecision({failed:'old',current:'old'})==='show-login-in-place','current expired token must move to login without page reload');
must(expiredResponseDecision({failed:'old',current:''})==='already-cleared','duplicate old responses must not reset the login form');

console.log(`v6.70 session boundary QA passed; stamped token paths=${stamped}`);
